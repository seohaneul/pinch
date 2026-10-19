import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Sparkles,
  MapPin,
  Clock,
  Compass,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Zap,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import type { Trip } from '../../types';
import { useTripStore } from '../../store/useTripStore';
import { usePlaceStore } from '../../store/usePlaceStore';
import {
  TRAVEL_STYLES,
  TRAVEL_PACES,
  TravelStyle,
  TravelPace,
  generatePStyleItinerary,
} from '../../services/itineraryGeneratorService';

interface PStyleCourseModalProps {
  visible: boolean;
  trip: Trip | null;
  onClose: () => void;
  onCompleted?: () => void;
}

export const PStyleCourseModal: React.FC<PStyleCourseModalProps> = ({
  visible,
  trip,
  onClose,
  onCompleted,
}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const applyRecommendedItinerary = useTripStore((state) => state.applyRecommendedItinerary);
  const setActiveTrip = useTripStore((state) => state.setActiveTrip);
  const addPlacesBulk = usePlaceStore((state) => state.addPlacesBulk);

  const [selectedStyle, setSelectedStyle] = useState<TravelStyle>('LANDMARK');
  const [selectedPace, setSelectedPace] = useState<TravelPace>('BALANCED');
  const [isGenerating, setIsGenerating] = useState(false);

  // 여행 기간 일수 계산
  const totalDays = useMemo(() => {
    if (!trip) return 3;
    if (trip.schedules && trip.schedules.length > 0) {
      return trip.schedules.length;
    }
    if (trip.startDate && trip.endDate) {
      try {
        const s = new Date(trip.startDate);
        const e = new Date(trip.endDate);
        const diffDays = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(1, diffDays + 1);
      } catch {
        return 3;
      }
    }
    return 3;
  }, [trip]);

  // 기간 요약 텍스트 (예: 2박 3일)
  const durationText = useMemo(() => {
    if (totalDays <= 1) return '당일치기';
    return `${totalDays - 1}박 ${totalDays}일`;
  }, [totalDays]);

  // 현재 선택된 스타일에 맞는 가상 미리보기 일정 생성
  const previewData = useMemo(() => {
    if (!trip) return null;
    return generatePStyleItinerary({
      destination: trip.destination || trip.title,
      dayCount: totalDays,
      style: selectedStyle,
      pace: selectedPace,
      tripId: trip.id,
    });
  }, [trip, totalDays, selectedStyle, selectedPace]);

  // 대표 미리보기 스팟 (첫 3~4곳)
  const previewSpots = useMemo(() => {
    if (!previewData || previewData.scheduleItems.length === 0) return [];
    return previewData.scheduleItems.slice(0, 4);
  }, [previewData]);

  // 맞춤 코스 적용 핸들러
  const handleApply = async () => {
    if (!trip || !previewData) return;

    setIsGenerating(true);

    // 사용자가 '생성 중...' 느낌을 받도록 아주 약간의 연출 딜레이
    setTimeout(() => {
      try {
        // 1. 활성 여행 설정
        setActiveTrip(trip.id);

        // 2. 일정 스케줄 및 일차별 시작 시간 주입
        applyRecommendedItinerary(
          trip.id,
          previewData.scheduleItems,
          previewData.dayStartTimes
        );

        // 3. 보관함(Pocket)에도 추천 장소 일괄 등록
        addPlacesBulk(previewData.pocketPlaces);

        setIsGenerating(false);
        onClose();
        if (onCompleted) {
          onCompleted();
        } else {
          router.push('/(tabs)/planner');
        }
      } catch (err) {
        setIsGenerating(false);
        onClose();
      }
    }, 400);
  };

  const currentStyleObj = TRAVEL_STYLES.find((s) => s.key === selectedStyle) || TRAVEL_STYLES[0];
  const currentPaceObj = TRAVEL_PACES.find((p) => p.key === selectedPace) || TRAVEL_PACES[1];

  if (!trip) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={[styles.overlay, { paddingTop: Math.max(insets.top, 20) }]}>
        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerBadge}>
              <Zap size={13} color="#FF6B6B" />
              <Text style={styles.headerBadgeText}>P형 맞춤 코스 추천</Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.closeBtn}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Title & Trip Context */}
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>여행 계획, 스트레스 받지 마세요! ✨</Text>
            <Text style={styles.subTitle}>
              스타일만 고르면 추천 스팟과 최적 동선으로 전체 일정을 3초 만에 채워드려요.
            </Text>

            <View style={styles.tripInfoCard}>
              <MapPin size={15} color="#FF6B6B" style={{ marginRight: 6 }} />
              <Text style={styles.tripInfoDest} numberOfLines={1}>
                {trip.destination || trip.title}
              </Text>
              <View style={styles.dotSeparator} />
              <Clock size={13} color="#64748B" style={{ marginRight: 4 }} />
              <Text style={styles.tripInfoDuration}>{durationText}</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollBody}>
            {/* Step 1: 여행 스타일 선택 */}
            <View style={styles.stepSection}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepTitle}>어떤 스타일의 여행을 원하시나요?</Text>
              </View>

              <View style={styles.styleGrid}>
                {TRAVEL_STYLES.map((style) => {
                  const isSelected = selectedStyle === style.key;
                  return (
                    <TouchableOpacity
                      key={style.key}
                      activeOpacity={0.8}
                      onPress={() => setSelectedStyle(style.key)}
                      style={[
                        styles.styleCard,
                        isSelected && {
                          borderColor: style.accentColor,
                          backgroundColor: `${style.accentColor}12`,
                        },
                      ]}
                    >
                      <View style={styles.styleCardHeader}>
                        <Text style={styles.styleEmoji}>{style.emoji}</Text>
                        {isSelected && (
                          <View
                            style={[
                              styles.styleSelectedBadge,
                              { backgroundColor: style.accentColor },
                            ]}
                          >
                            <CheckCircle2 size={12} color="#FFFFFF" />
                          </View>
                        )}
                      </View>
                      <Text
                        style={[
                          styles.styleLabel,
                          isSelected && { color: style.accentColor, fontWeight: '800' },
                        ]}
                      >
                        {style.label}
                      </Text>
                      <Text style={styles.styleDesc} numberOfLines={2}>
                        {style.desc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Step 2: 일정 페이스 선택 */}
            <View style={styles.stepSection}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepTitle}>하루 일정은 어느 정도가 좋으세요?</Text>
              </View>

              <View style={styles.paceContainer}>
                {TRAVEL_PACES.map((pace) => {
                  const isSelected = selectedPace === pace.key;
                  return (
                    <TouchableOpacity
                      key={pace.key}
                      activeOpacity={0.8}
                      onPress={() => setSelectedPace(pace.key)}
                      style={[
                        styles.paceCard,
                        isSelected && styles.paceCardSelected,
                      ]}
                    >
                      <View style={styles.paceLeft}>
                        <Text
                          style={[
                            styles.paceLabel,
                            isSelected && styles.paceLabelSelected,
                          ]}
                        >
                          {pace.label}
                        </Text>
                        <Text style={styles.paceDesc}>{pace.desc}</Text>
                      </View>
                      <View
                        style={[
                          styles.paceRadio,
                          isSelected && styles.paceRadioSelected,
                        ]}
                      >
                        {isSelected && <View style={styles.paceRadioInner} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Step 3: 실시간 추천 스팟 미리보기 배너 */}
            <View style={styles.previewSection}>
              <View style={styles.previewHeaderRow}>
                <Sparkles size={14} color="#FF6B6B" style={{ marginRight: 6 }} />
                <Text style={styles.previewTitle}>
                  '{currentStyleObj.label}' 코스 미리보기 ({previewData?.scheduleItems.length || 0}개 스팟)
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.spotScrollList}
              >
                {previewSpots.map((item, idx) => (
                  <View key={item.id} style={styles.spotPreviewCard}>
                    <Image
                      source={{
                        uri:
                          item.imageUrl ||
                          'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop',
                      }}
                      style={styles.spotImage}
                    />
                    <View style={styles.spotOverlay}>
                      <View style={styles.spotDayBadge}>
                        <Text style={styles.spotDayBadgeText}>DAY {item.day_number}</Text>
                      </View>
                    </View>
                    <View style={styles.spotInfo}>
                      <Text style={styles.spotName} numberOfLines={1}>
                        {item.place_name}
                      </Text>
                      <Text style={styles.spotTime}>
                        {item.arrival_time} · {item.stay_duration_minutes}분 머무름
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>

              <View style={styles.previewFooterNotice}>
                <Compass size={13} color="#64748B" style={{ marginRight: 6 }} />
                <Text style={styles.previewNoticeText}>
                  모든 스팟은 지리적 최단 동선과 이동 시간(도보/차량)이 계산되어 정렬됩니다.
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleApply}
              disabled={isGenerating}
              style={styles.applyBtn}
            >
              {isGenerating ? (
                <View style={styles.btnRow}>
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.applyBtnText}>최적 코스로 일정 채우는 중...</Text>
                </View>
              ) : (
                <View style={styles.btnRow}>
                  <Sparkles size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.applyBtnText}>✨ 3초 만에 맞춤 코스로 일정 채우기</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              disabled={isGenerating}
              style={styles.skipBtn}
            >
              <Text style={styles.skipBtnText}>직접 하나씩 짤게요 (빈 일정으로 시작)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6B6B',
    marginLeft: 5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subTitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 10,
  },
  tripInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tripInfoDest: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    maxWidth: '55%',
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#94A3B8',
    marginHorizontal: 8,
  },
  tripInfoDuration: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  scrollBody: {
    paddingHorizontal: 20,
  },
  stepSection: {
    marginBottom: 20,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepNumberBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  styleCard: {
    width: '48.5%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  styleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  styleEmoji: {
    fontSize: 22,
  },
  styleSelectedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  styleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 3,
  },
  styleDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 14,
  },
  paceContainer: {
    gap: 8,
  },
  paceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  paceCardSelected: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  paceLeft: {
    flex: 1,
    marginRight: 10,
  },
  paceLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  paceLabelSelected: {
    color: '#FF6B6B',
    fontWeight: '800',
  },
  paceDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  paceRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paceRadioSelected: {
    borderColor: '#FF6B6B',
  },
  paceRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6B6B',
  },
  previewSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  spotScrollList: {
    gap: 10,
    paddingBottom: 6,
  },
  spotPreviewCard: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  spotImage: {
    width: '100%',
    height: 80,
    backgroundColor: '#E2E8F0',
  },
  spotOverlay: {
    position: 'absolute',
    top: 6,
    left: 6,
  },
  spotDayBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  spotDayBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  spotInfo: {
    padding: 8,
  },
  spotName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  spotTime: {
    fontSize: 10,
    color: '#64748B',
  },
  previewFooterNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  previewNoticeText: {
    flex: 1,
    fontSize: 11,
    color: '#64748B',
    lineHeight: 14,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  applyBtn: {
    backgroundColor: '#FF6B6B',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 8,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  skipBtn: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
