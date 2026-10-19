import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Linking,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import {
  X,
  MapPin,
  Star,
  ExternalLink,
  Navigation,
  Sparkles,
  Calendar,
  Clock,
  Bookmark,
  Share2,
  Trash2,
  Copy,
  Check,
  Compass,
  Camera,
  Coffee,
  Utensils,
  Hotel,
  ShoppingBag,
  Info,
  RotateCw,
} from 'lucide-react-native';
import type { Place, ExtractedPlaceItem } from '../../types';
import { openInGoogleMaps } from '../../utils/mapUtils';
import { fetchPlaceDetailedBriefing, type PlaceAiBriefing } from '../../services/geminiService';
import { fetchRealPlaceImage } from '../../services/imageSearchService';
import { useTripStore } from '../../store/useTripStore';
import { usePlaceStore } from '../../store/usePlaceStore';

interface PlaceDetailModalProps {
  visible: boolean;
  place: Place | ExtractedPlaceItem | null;
  onClose: () => void;
  onAddToPlanner?: (place: Place, dayNumber: number) => void;
  onTogglePin?: (placeId: string) => void;
  onRemove?: (placeId: string) => void;
  onSaveToPocket?: (item: ExtractedPlaceItem) => void;
  isSavedInPocket?: boolean;
}

export const PlaceDetailModal: React.FC<PlaceDetailModalProps> = ({
  visible,
  place,
  onClose,
  onAddToPlanner,
  onTogglePin,
  onRemove,
  onSaveToPocket,
  isSavedInPocket = false,
}) => {
  const insets = useSafeAreaInsets();
  const { currentTrip, addPlaceToSchedule } = useTripStore();
  const { updatePlaceImage } = usePlaceStore();

  const [aiBriefing, setAiBriefing] = useState<PlaceAiBriefing | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [isAddingToSchedule, setIsAddingToSchedule] = useState(false);
  const [realImageUrl, setRealImageUrl] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);

  // Reset & fetch real photo when place changes
  useEffect(() => {
    setAiBriefing(null);
    setIsLoadingAi(false);
    setIsCopied(false);
    setIsAddingToSchedule(false);
    setSelectedDay(1);
    setImageError(false);

    if (!place) {
      setRealImageUrl(null);
      setIsLoadingImage(false);
      return;
    }

    let isMounted = true;
    const currentImg = place.imageUrl;
    const isUnsplashGeneric =
      !currentImg ||
      currentImg.includes('photo-1503899036084') ||
      currentImg.includes('photo-1501339847302') ||
      currentImg.includes('photo-1493976040374') ||
      currentImg.includes('photo-1569718212165') ||
      currentImg.includes('photo-1441986300917');

    if (currentImg && !isUnsplashGeneric) {
      setRealImageUrl(currentImg);
    } else {
      setIsLoadingImage(true);
      fetchRealPlaceImage(
        place.name,
        place.address,
        place.category,
        place.latitude,
        place.longitude
      )
        .then((foundUrl) => {
          if (!isMounted) return;
          if (foundUrl) {
            setRealImageUrl(foundUrl);
            if (place.id && 'isPinned' in place) {
              updatePlaceImage(place.id, foundUrl);
            }
          }
        })
        .finally(() => {
          if (isMounted) setIsLoadingImage(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [place?.name, place?.id]);

  const handleRefreshRealImage = async () => {
    if (isLoadingImage || !place) return;
    setIsLoadingImage(true);
    try {
      const foundUrl = await fetchRealPlaceImage(
        place.name,
        place.address,
        place.category,
        place.latitude,
        place.longitude
      );
      if (foundUrl) {
        setRealImageUrl(foundUrl);
        if (place.id && 'isPinned' in place) {
          updatePlaceImage(place.id, foundUrl);
        }
      }
    } finally {
      setIsLoadingImage(false);
    }
  };

  if (!place) return null;

  const isFullPlace = 'isPinned' in place;
  const placeRecord = place as Place;

  // 카테고리 정보 매핑
  const getCategoryMeta = (cat: string) => {
    const upper = cat ? cat.toUpperCase() : 'ATTRACTION';
    switch (upper) {
      case 'CAFE':
        return { label: '☕ 감성 카페', bg: '#FFF1F2', color: '#E11D48', icon: Coffee };
      case 'RESTAURANT':
        return { label: '🍴 현지 맛집', bg: '#FEF3C7', color: '#D97706', icon: Utensils };
      case 'ATTRACTION':
      case 'SPOT':
        return { label: '📸 추천 명소', bg: '#E0F2FE', color: '#0284C7', icon: Compass };
      case 'LODGING':
      case 'STAY':
        return { label: '🏨 숙소/호텔', bg: '#F3E8FF', color: '#7E22CE', icon: Hotel };
      case 'SHOPPING':
        return { label: '🛍️ 쇼핑/마켓', bg: '#ECFDF5', color: '#059669', icon: ShoppingBag };
      default:
        return { label: '📍 여행 스팟', bg: '#F1F5F9', color: '#475569', icon: MapPin };
    }
  };

  const catMeta = getCategoryMeta(place.category);

  // 기본 추천 체류 시간
  const getDefaultStayMinutes = (cat: string) => {
    const upper = cat ? cat.toUpperCase() : 'ATTRACTION';
    switch (upper) {
      case 'CAFE':
        return 50;
      case 'RESTAURANT':
        return 70;
      case 'ATTRACTION':
        return 90;
      case 'LODGING':
        return 60;
      case 'SHOPPING':
        return 80;
      default:
        return 60;
    }
  };

  // 주소 클립보드 복사
  const handleCopyAddress = async () => {
    if (!place.address) return;
    try {
      await Clipboard.setStringAsync(place.address);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      Alert.alert('알림', '주소가 복사되었습니다.');
    }
  };

  // 원본 SNS 링크 열기
  const handleOpenSourceUrl = async () => {
    const url = ('snsUrl' in place && place.snsUrl) ? place.snsUrl : '';
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('알림', '링크를 열 수 없습니다.');
    }
  };

  // 구글 지도 열기
  const handleOpenMap = () => {
    openInGoogleMaps(place.name, place.latitude, place.longitude);
  };

  // AI 심층 가이드 요청
  const handleFetchAiGuide = async () => {
    if (isLoadingAi) return;
    setIsLoadingAi(true);
    try {
      const result = await fetchPlaceDetailedBriefing(place.name, place.category, place.address);
      if (result) {
        setAiBriefing(result);
      } else {
        Alert.alert('알림', '상세 가이드를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } catch {
      Alert.alert('오류', 'AI 상세 가이드 요청 중 문제가 발생했습니다.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  // 플래너 일정에 추가 확인
  const handleConfirmAddToPlanner = () => {
    const placeToSchedule: Place = {
      id: place.id || `place_${Date.now()}`,
      trip_id: currentTrip?.id || 't_tokyo',
      name: place.name,
      address: place.address,
      category: place.category as any,
      latitude: place.latitude,
      longitude: place.longitude,
      memo: place.memo,
      snsUrl: 'snsUrl' in place ? place.snsUrl : undefined,
      imageUrl: place.imageUrl,
      rating: place.rating || 4.8,
      isPinned: true,
      createdAt: new Date().toISOString(),
      tags: place.tags || ['핫플'],
      sourcePlatform: 'sourcePlatform' in place ? place.sourcePlatform : 'manual',
    };

    if (onAddToPlanner) {
      onAddToPlanner(placeToSchedule, selectedDay);
    } else {
      addPlaceToSchedule(selectedDay, placeToSchedule);
      Alert.alert(
        '일정에 핀치 완료! 🤏',
        `"${place.name}" 장소를 Day ${selectedDay} 일정에 핀치했어요!\n동선 플래너 탭에서 최적 경로를 확인해보세요.`
      );
    }
    setIsAddingToSchedule(false);
  };

  const schedules = currentTrip?.schedules || [
    { dayNumber: 1, date: '11.10' },
    { dayNumber: 2, date: '11.11' },
    { dayNumber: 3, date: '11.12' },
    { dayNumber: 4, date: '11.13' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop touchable to dismiss */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheet}>
          {/* Hero Image Section */}
          <View style={styles.imageWrap}>
            <Image
              source={{
                uri:
                  (!imageError && (realImageUrl || place.imageUrl))
                    ? (realImageUrl || place.imageUrl!)
                    : 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1000&auto=format&fit=crop',
              }}
              style={styles.heroImage}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
            <View style={styles.imageOverlay} />

            {/* Real Image Loading Shimmer */}
            {isLoadingImage && (
              <View style={styles.imageLoadingOverlay}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.imageLoadingText}>실제 장소 사진 찾는 중... 📸</Text>
              </View>
            )}

            {/* Top Bar Floating Controls */}
            <View style={[styles.topFloatingBar, { top: 14 }]}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onClose}
                style={styles.circleBtn}
                accessibilityLabel="닫기"
              >
                <X size={18} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.rightActionRow}>
                {isFullPlace && onTogglePin && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => onTogglePin(placeRecord.id)}
                    style={[styles.circleBtn, { marginRight: 8 }]}
                    accessibilityLabel="핀 고정 토글"
                  >
                    <Bookmark
                      size={18}
                      color={placeRecord.isPinned ? '#FF6B6B' : '#FFFFFF'}
                      fill={placeRecord.isPinned ? '#FF6B6B' : 'none'}
                    />
                  </TouchableOpacity>
                )}

                {'snsUrl' in place && place.snsUrl ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleOpenSourceUrl}
                    style={styles.circleBtn}
                    accessibilityLabel="원본 링크 보기"
                  >
                    <ExternalLink size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* Platform Tag Badge & Real Photo Pill on Hero */}
            <View style={styles.heroBadgeRow}>
              <View style={[styles.categoryBadge, { backgroundColor: catMeta.bg }]}>
                <Text style={[styles.categoryBadgeText, { color: catMeta.color }]}>
                  {catMeta.label}
                </Text>
              </View>

              {place.rating ? (
                <View style={styles.ratingBadge}>
                  <Star size={12} color="#F59E0B" fill="#F59E0B" style={{ marginRight: 3 }} />
                  <Text style={styles.ratingBadgeText}>{place.rating}</Text>
                  <Text style={styles.ratingSubText}>/ 5.0</Text>
                </View>
              ) : null}

              {/* Real Photo Pill with Refresh Action */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleRefreshRealImage}
                style={styles.realPhotoPill}
              >
                <Camera size={11} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.realPhotoPillText}>
                  {isLoadingImage ? '탐색 중' : '실제 사진'}
                </Text>
                <RotateCw size={9} color="#E2E8F0" style={{ marginLeft: 3 }} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Title & Address */}
            <View style={styles.headerSection}>
              <Text style={styles.placeTitle}>{place.name}</Text>

              {place.address ? (
                <View style={styles.addressRow}>
                  <MapPin size={14} color="#64748B" style={{ marginTop: 2, marginRight: 4 }} />
                  <Text style={styles.addressText} numberOfLines={2}>
                    {place.address}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleCopyAddress}
                    style={[styles.copyBtn, isCopied && styles.copyBtnSuccess]}
                  >
                    {isCopied ? (
                      <>
                        <Check size={11} color="#059669" />
                        <Text style={styles.copyBtnTextSuccess}>복사됨</Text>
                      </>
                    ) : (
                      <>
                        <Copy size={11} color="#64748B" />
                        <Text style={styles.copyBtnText}>복사</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            {/* Tags */}
            {place.tags && place.tags.length > 0 && (
              <View style={styles.tagWrap}>
                {place.tags.map((tag, idx) => (
                  <View key={idx} style={styles.tagPill}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* SNS 핀치 코멘트 & 메모 */}
            <View style={styles.memoCard}>
              <View style={styles.memoHeader}>
                <Sparkles size={14} color="#FF6B6B" style={{ marginRight: 6 }} />
                <Text style={styles.memoHeaderTitle}>SNS 핀치 메모 & 코멘트</Text>
              </View>
              <Text style={styles.memoContent}>
                {place.memo || 'SNS 릴스에서 추천된 인기 핫플레이스입니다.'}
              </Text>
            </View>

            {/* AI 스마트 플레이스 가이드 */}
            <View style={styles.aiGuideCard}>
              <View style={styles.aiGuideHeader}>
                <View style={styles.aiGuideBadge}>
                  <Sparkles size={13} color="#FF6B6B" />
                  <Text style={styles.aiGuideBadgeText}>AI 여행 가이드</Text>
                </View>

                {!aiBriefing && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleFetchAiGuide}
                    disabled={isLoadingAi}
                    style={styles.fetchAiBtn}
                  >
                    {isLoadingAi ? (
                      <ActivityIndicator size="small" color="#FF6B6B" />
                    ) : (
                      <>
                        <Sparkles size={11} color="#FF6B6B" />
                        <Text style={styles.fetchAiBtnText}>심층 꿀팁 조회</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {aiBriefing ? (
                <View style={styles.aiGuideBody}>
                  {/* AI 설명 */}
                  <Text style={styles.aiDescription}>{aiBriefing.description}</Text>

                  {/* 대표 시그니처 & 추천 메뉴 */}
                  {aiBriefing.recommendedHighlights?.length > 0 && (
                    <View style={styles.aiSectionBlock}>
                      <Text style={styles.aiSectionTitle}>✨ 필수 경험 & 대표 메뉴</Text>
                      <View style={styles.highlightsWrap}>
                        {aiBriefing.recommendedHighlights.map((hl, idx) => (
                          <View key={idx} style={styles.highlightPill}>
                            <Text style={styles.highlightPillText}>✓ {hl}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* 포토존 & 웨이팅 팁 */}
                  <View style={styles.aiInfoRow}>
                    <View style={styles.aiInfoItem}>
                      <View style={styles.aiInfoItemIcon}>
                        <Camera size={13} color="#FF6B6B" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.aiInfoLabel}>인생샷 포토존</Text>
                        <Text style={styles.aiInfoValue}>{aiBriefing.bestPhotoSpot}</Text>
                      </View>
                    </View>

                    <View style={styles.aiInfoItem}>
                      <View style={[styles.aiInfoItemIcon, { backgroundColor: '#FEF3C7' }]}>
                        <Clock size={13} color="#D97706" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.aiInfoLabel}>웨이팅 & 방문 팁</Text>
                        <Text style={styles.aiInfoValue}>{aiBriefing.waitingTips}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ) : (
                /* 기본 추천 팁 (AI 미조회 시 빠른 미리보기) */
                <View style={styles.defaultInsightsWrap}>
                  <View style={styles.quickStatRow}>
                    <View style={styles.quickStatItem}>
                      <Clock size={13} color="#64748B" style={{ marginRight: 5 }} />
                      <Text style={styles.quickStatLabel}>추천 체류 시간:</Text>
                      <Text style={styles.quickStatValue}>
                        약 {getDefaultStayMinutes(place.category)}분
                      </Text>
                    </View>
                    <View style={styles.quickStatItem}>
                      <Star size={13} color="#F59E0B" fill="#F59E0B" style={{ marginRight: 5 }} />
                      <Text style={styles.quickStatLabel}>만족도 평점:</Text>
                      <Text style={styles.quickStatValue}>{place.rating || 4.8} 점</Text>
                    </View>
                  </View>
                  <Text style={styles.defaultInsightHint}>
                    💡 상단 [심층 꿀팁 조회]를 누르면 대표 메뉴, 인생샷 명당, 웨이팅 팁을 AI가 즉시 알려드려요!
                  </Text>
                </View>
              )}
            </View>

            {/* 일정 추가 선택 뷰 (펼쳐졌을 때) */}
            {isAddingToSchedule && (
              <View style={styles.schedulePickerCard}>
                <View style={styles.schedulePickerHeader}>
                  <Calendar size={15} color="#FF6B6B" style={{ marginRight: 6 }} />
                  <Text style={styles.schedulePickerTitle}>
                    담을 일차 선택 ({currentTrip?.title || '여행'})
                  </Text>
                </View>

                <View style={styles.dayTabsRow}>
                  {schedules.map((sch) => {
                    const isSelected = selectedDay === sch.dayNumber;
                    return (
                      <TouchableOpacity
                        key={sch.dayNumber}
                        onPress={() => setSelectedDay(sch.dayNumber)}
                        style={[styles.dayTabBtn, isSelected && styles.dayTabBtnActive]}
                      >
                        <Text
                          style={[
                            styles.dayTabNumber,
                            isSelected && styles.dayTabNumberActive,
                          ]}
                        >
                          DAY {sch.dayNumber}
                        </Text>
                        <Text
                          style={[
                            styles.dayTabDate,
                            isSelected && styles.dayTabDateActive,
                          ]}
                        >
                          {sch.date ? sch.date.split('-').slice(1).join('.') : ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleConfirmAddToPlanner}
                  style={styles.confirmScheduleBtn}
                >
                  <Text style={styles.confirmScheduleBtnText}>
                    Day {selectedDay} 일정에 핀치하기 🤏
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Bottom Fixed Action Bar */}
          <View style={[styles.bottomBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 14 }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleOpenMap}
              style={styles.mapActionBtn}
            >
              <Navigation size={15} color="#059669" />
              <Text style={styles.mapActionBtnText}>지도 길찾기</Text>
            </TouchableOpacity>

            {!isFullPlace && onSaveToPocket ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => onSaveToPocket(place as ExtractedPlaceItem)}
                style={[
                  styles.saveActionBtn,
                  isSavedInPocket && styles.savedActionBtn,
                ]}
              >
                {isSavedInPocket ? (
                  <>
                    <Check size={15} color="#FFFFFF" />
                    <Text style={styles.saveActionBtnText}>보관함 담김</Text>
                  </>
                ) : (
                  <>
                    <Bookmark size={15} color="#FFFFFF" fill="#FFFFFF" />
                    <Text style={styles.saveActionBtnText}>보관함에 담기</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setIsAddingToSchedule(!isAddingToSchedule)}
                style={styles.primaryActionBtn}
              >
                <Calendar size={15} color="#FFFFFF" />
                <Text style={styles.primaryActionBtnText}>
                  {isAddingToSchedule ? '선택 닫기' : '동선 플래너에 담기 🤏'}
                </Text>
              </TouchableOpacity>
            )}

            {isFullPlace && onRemove && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  Alert.alert(
                    '장소 삭제',
                    `"${place.name}" 장소를 보관함에서 삭제하시겠습니까?`,
                    [
                      { text: '취소', style: 'cancel' },
                      {
                        text: '삭제',
                        style: 'destructive',
                        onPress: () => {
                          onRemove(placeRecord.id);
                          onClose();
                        },
                      },
                    ]
                  );
                }}
                style={styles.deleteBtn}
              >
                <Trash2 size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '92%',
    overflow: 'hidden',
  },
  imageWrap: {
    position: 'relative',
    width: '100%',
    height: 220,
    backgroundColor: '#0F172A',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  topFloatingBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  rightActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgeRow: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F59E0B',
  },
  ratingSubText: {
    fontSize: 10,
    color: '#CBD5E1',
    marginLeft: 2,
    fontWeight: '600',
  },
  scrollBody: {
    flexGrow: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 24,
  },
  headerSection: {
    marginBottom: 12,
  },
  placeTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 28,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  addressText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  copyBtnSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginLeft: 3,
  },
  copyBtnTextSuccess: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    marginLeft: 3,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  tagPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  memoCard: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1.5,
    borderColor: '#FFE4E6',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
  },
  memoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  memoHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FF6B6B',
  },
  memoContent: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
    fontWeight: '500',
  },
  aiGuideCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  aiGuideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  aiGuideBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFE4E6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  aiGuideBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
    marginLeft: 4,
  },
  fetchAiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FFE4E6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  fetchAiBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF6B6B',
    marginLeft: 3,
  },
  aiGuideBody: {
    gap: 12,
  },
  aiDescription: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
    fontWeight: '500',
  },
  aiSectionBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  aiSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  highlightsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  highlightPill: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  highlightPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  aiInfoRow: {
    gap: 8,
  },
  aiInfoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  aiInfoItemIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  aiInfoLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 2,
  },
  aiInfoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 16,
  },
  defaultInsightsWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  quickStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quickStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickStatLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginRight: 3,
  },
  quickStatValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  defaultInsightHint: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    fontWeight: '500',
  },
  schedulePickerCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FF6B6B',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  schedulePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  schedulePickerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  dayTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  dayTabBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  dayTabBtnActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  dayTabNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  dayTabNumberActive: {
    color: '#FFFFFF',
  },
  dayTabDate: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  dayTabDateActive: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  confirmScheduleBtn: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  confirmScheduleBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  mapActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  mapActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
    marginLeft: 4,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  saveActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  savedActionBtn: {
    backgroundColor: '#059669',
  },
  saveActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  deleteBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  realPhotoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  realPhotoPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageLoadingText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
  },
});
