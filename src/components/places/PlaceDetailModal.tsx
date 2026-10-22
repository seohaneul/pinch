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
  MessageSquareQuote,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
} from 'lucide-react-native';
import type { Place, ExtractedPlaceItem, GooglePlaceDetails } from '../../types';
import { openInGoogleMaps } from '../../utils/mapUtils';
import { fetchPlaceDetailedBriefing, type PlaceAiBriefing } from '../../services/geminiService';
import { fetchRealPlaceImage } from '../../services/imageSearchService';
import { fetchGooglePlaceDetails } from '../../services/googlePlacesService';
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

  // Google Maps Details State
  const [googleDetails, setGoogleDetails] = useState<GooglePlaceDetails | null>(null);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState<boolean>(false);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const [showOpeningHours, setShowOpeningHours] = useState<boolean>(false);

  // Reset & fetch real photo + Google Places details when place changes
  useEffect(() => {
    setAiBriefing(null);
    setIsLoadingAi(false);
    setIsCopied(false);
    setIsAddingToSchedule(false);
    setSelectedDay(1);
    setImageError(false);
    setGoogleDetails(null);
    setSelectedPhotoUrl(null);
    setShowOpeningHours(false);

    if (!place) {
      setRealImageUrl(null);
      setIsLoadingImage(false);
      setIsLoadingGoogle(false);
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

    // 구글맵(Google Places) 실시간 장소 설명, 별점, 실제 사진, 방문객 후기 가져오기
    setIsLoadingGoogle(true);
    fetchGooglePlaceDetails(
      place.name,
      place.address,
      place.latitude && place.longitude ? { lat: place.latitude, lng: place.longitude } : undefined
    )
      .then((details) => {
        if (!isMounted) return;
        if (details) {
          setGoogleDetails(details);
          if (details.photos && details.photos.length > 0) {
            setSelectedPhotoUrl(details.photos[0]);
            if (place.id && 'isPinned' in place) {
              updatePlaceImage(place.id, details.photos[0]);
            }
          }
        }
      })
      .catch((err) => {
        console.log('[PlaceDetailModal] Google details fetch failed:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingGoogle(false);
      });

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
    openInGoogleMaps(place.name, place.latitude, place.longitude, place.address);
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
                  (!imageError && (selectedPhotoUrl || realImageUrl || place.imageUrl))
                    ? (selectedPhotoUrl || realImageUrl || place.imageUrl!)
                    : 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1000&auto=format&fit=crop',
              }}
              style={styles.heroImage}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
            <View style={styles.imageOverlay} />

            {/* Real Image / Google Places Loading Shimmer */}
            {(isLoadingImage || isLoadingGoogle) && (
              <View style={styles.imageLoadingOverlay}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.imageLoadingText}>
                  {isLoadingGoogle ? '구글맵 최신 장소 데이터 연동 중... 🗺️' : '실제 장소 사진 찾는 중... 📸'}
                </Text>
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

            {/* Platform Tag Badge & Google Rating on Hero */}
            <View style={styles.heroBadgeRow}>
              <View style={[styles.categoryBadge, { backgroundColor: catMeta.bg }]}>
                <Text style={[styles.categoryBadgeText, { color: catMeta.color }]}>
                  {catMeta.label}
                </Text>
              </View>

              <View style={styles.ratingBadge}>
                <Star size={12} color="#F59E0B" fill="#F59E0B" style={{ marginRight: 3 }} />
                <Text style={styles.ratingBadgeText}>
                  {googleDetails?.rating || place.rating || 4.8}
                </Text>
                <Text style={styles.ratingSubText}>
                  ({googleDetails?.userRatingsTotal ? `${googleDetails.userRatingsTotal.toLocaleString()}개` : '구글맵'})
                </Text>
              </View>

              {/* Real Photo Pill with Refresh Action */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleRefreshRealImage}
                style={styles.realPhotoPill}
              >
                <Camera size={11} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.realPhotoPillText}>
                  {isLoadingImage ? '탐색 중' : '사진 새로고침'}
                </Text>
                <RotateCw size={9} color="#E2E8F0" style={{ marginLeft: 3 }} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Google Photos Gallery Thumbnail Strip (When photos available) */}
          {googleDetails?.photos && googleDetails.photos.length > 0 && (
            <View style={styles.photoStripWrap}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photoStripContent}
              >
                {googleDetails.photos.map((photoUri, idx) => {
                  const isSelected = (selectedPhotoUrl || googleDetails.photos[0]) === photoUri;
                  return (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.85}
                      onPress={() => setSelectedPhotoUrl(photoUri)}
                      style={[
                        styles.photoThumbnailBtn,
                        isSelected && styles.photoThumbnailBtnActive,
                      ]}
                    >
                      <Image
                        source={{ uri: photoUri }}
                        style={styles.photoThumbnail}
                        resizeMode="cover"
                      />
                      {isSelected && <View style={styles.photoThumbnailSelectedOverlay} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

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

              {/* Google Maps Real-time Rating & Stats Bar */}
              <View style={styles.googleRatingBar}>
                <View style={styles.googleRatingLeft}>
                  <View style={styles.googleStarRow}>
                    <Star size={15} color="#F59E0B" fill="#F59E0B" style={{ marginRight: 4 }} />
                    <Text style={styles.googleRatingNum}>
                      {googleDetails?.rating || place.rating || 4.8}
                    </Text>
                    <Text style={styles.googleRatingMax}>/ 5.0</Text>
                  </View>
                  <Text style={styles.googleReviewCountText}>
                    구글 리뷰 {(googleDetails?.userRatingsTotal || 500).toLocaleString()}개
                  </Text>
                </View>

                <View style={styles.googleVerifyBadge}>
                  <Navigation size={11} color="#0284C7" style={{ marginRight: 3 }} />
                  <Text style={styles.googleVerifyBadgeText}>구글맵 실시간 연동</Text>
                </View>
              </View>
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

            {/* 1. 구글맵 공식 장소 설명 (Google Maps Editorial Overview) */}
            <View style={styles.googleOverviewCard}>
              <View style={styles.googleCardHeader}>
                <View style={styles.googleHeaderTitleRow}>
                  <Compass size={15} color="#0284C7" style={{ marginRight: 6 }} />
                  <Text style={styles.googleCardTitle}>구글맵 공식 장소 소개</Text>
                </View>
                {isLoadingGoogle && (
                  <ActivityIndicator size="small" color="#0284C7" />
                )}
              </View>

              <Text style={styles.googleDescriptionText}>
                {googleDetails?.description ||
                  (isLoadingGoogle
                    ? '구글맵에서 최신 장소 설명과 정보를 불러오고 있습니다...'
                    : place.memo || '구글 지도에 등록된 인기 추천 장소입니다.')}
              </Text>

              {/* 영업시간 아코디언 */}
              {googleDetails?.regularOpeningHours && googleDetails.regularOpeningHours.length > 0 && (
                <View style={styles.openingHoursWrap}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setShowOpeningHours(!showOpeningHours)}
                    style={styles.openingHoursToggle}
                  >
                    <View style={styles.openingHoursLeft}>
                      <Clock size={13} color="#0284C7" style={{ marginRight: 5 }} />
                      <Text style={styles.openingHoursTitle}>구글맵 등록 영업시간</Text>
                    </View>
                    {showOpeningHours ? (
                      <ChevronUp size={15} color="#64748B" />
                    ) : (
                      <ChevronDown size={15} color="#64748B" />
                    )}
                  </TouchableOpacity>

                  {showOpeningHours && (
                    <View style={styles.openingHoursList}>
                      {googleDetails.regularOpeningHours.map((schedule, idx) => (
                        <Text key={idx} style={styles.openingHoursItemText}>
                          • {schedule}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* 2. 구글맵 방문객 생생 리뷰 (Google Maps Reviews) */}
            <View style={styles.reviewsCard}>
              <View style={styles.reviewsHeader}>
                <View style={styles.reviewsHeaderTitleRow}>
                  <MessageSquareQuote size={15} color="#D97706" style={{ marginRight: 6 }} />
                  <Text style={styles.reviewsCardTitle}>
                    구글맵 방문자 생생 후기 ({googleDetails?.reviews?.length || 0})
                  </Text>
                </View>
                {isLoadingGoogle && <ActivityIndicator size="small" color="#D97706" />}
              </View>

              {googleDetails?.reviews && googleDetails.reviews.length > 0 ? (
                <View style={styles.reviewsListWrap}>
                  {googleDetails.reviews.map((rev, idx) => (
                    <View key={idx} style={styles.reviewItemCard}>
                      <View style={styles.reviewItemHeader}>
                        <View style={styles.reviewerInfo}>
                          <View style={styles.reviewerAvatar}>
                            <Text style={styles.reviewerAvatarText}>
                              {rev.authorName ? rev.authorName.charAt(0) : 'G'}
                            </Text>
                          </View>
                          <View>
                            <Text style={styles.reviewerName}>{rev.authorName}</Text>
                            <Text style={styles.reviewTime}>{rev.relativeTime || '최근 방문'}</Text>
                          </View>
                        </View>
                        <View style={styles.reviewStarPill}>
                          <Star size={11} color="#F59E0B" fill="#F59E0B" style={{ marginRight: 2 }} />
                          <Text style={styles.reviewStarPillText}>{rev.rating}.0</Text>
                        </View>
                      </View>
                      <Text style={styles.reviewBodyText} numberOfLines={4}>
                        "{rev.text}"
                      </Text>
                    </View>
                  ))}

                  {/* 구글맵에서 리뷰 전체보기 링크 */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleOpenMap}
                    style={styles.moreReviewsBtn}
                  >
                    <Text style={styles.moreReviewsBtnText}>구글맵에서 리뷰 전체보기</Text>
                    <ExternalLink size={13} color="#0284C7" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.emptyReviewsBox}>
                  {isLoadingGoogle ? (
                    <Text style={styles.emptyReviewsText}>구글맵 후기를 실시간으로 불러오는 중...</Text>
                  ) : (
                    <>
                      <Text style={styles.emptyReviewsText}>
                        현지 방문자들의 생생한 리뷰를 구글맵에서 바로 확인해보세요.
                      </Text>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleOpenMap}
                        style={[styles.moreReviewsBtn, { marginTop: 10 }]}
                      >
                        <Text style={styles.moreReviewsBtnText}>구글맵에서 후기 확인하기</Text>
                        <ExternalLink size={13} color="#0284C7" style={{ marginLeft: 4 }} />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
            </View>

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
  // Google Photos Gallery Thumbnail Strip
  photoStripWrap: {
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  photoStripContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  photoThumbnailBtn: {
    width: 72,
    height: 52,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  photoThumbnailBtnActive: {
    borderColor: '#FF6B6B',
    transform: [{ scale: 1.04 }],
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
  },
  photoThumbnailSelectedOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
  },
  // Google Rating & Stats Bar
  googleRatingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  googleRatingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  googleStarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleRatingNum: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  googleRatingMax: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginLeft: 2,
  },
  googleReviewCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  googleVerifyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  googleVerifyBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
  },
  // Google Maps Overview Card
  googleOverviewCard: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  googleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  googleHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0369A1',
  },
  googleDescriptionText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
    fontWeight: '500',
  },
  // Opening Hours
  openingHoursWrap: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0F2FE',
  },
  openingHoursToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  openingHoursLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  openingHoursTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  openingHoursList: {
    marginTop: 8,
    paddingLeft: 4,
    gap: 4,
  },
  openingHoursItemText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
  // Reviews Card
  reviewsCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reviewsHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewsCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309',
  },
  reviewsListWrap: {
    gap: 10,
  },
  reviewItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  reviewItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerAvatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
  },
  reviewerName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  reviewTime: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  reviewStarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  reviewStarPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  reviewBodyText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    fontWeight: '500',
  },
  moreReviewsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F2FE',
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  moreReviewsBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
  },
  emptyReviewsBox: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  emptyReviewsText: {
    fontSize: 12,
    color: '#78350F',
    textAlign: 'center',
    lineHeight: 18,
  },
});

