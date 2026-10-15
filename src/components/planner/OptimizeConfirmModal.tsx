import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ScheduleItem } from '../../types';
import {
  calculateTotalRouteDistance,
  calculateTotalRouteTravelTime,
  solveTSPNearestNeighbor,
} from '../../utils/geoUtils';
import { Sparkles, ArrowRight, X, Clock, CheckCircle, Navigation } from 'lucide-react-native';

interface OptimizeConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  dayStops: ScheduleItem[];
  dayNumber: number;
}

export const OptimizeConfirmModal: React.FC<OptimizeConfirmModalProps> = ({
  visible,
  onClose,
  onConfirm,
  dayStops,
  dayNumber,
}) => {
  const insets = useSafeAreaInsets();
  if (dayStops.length < 2) return null;

  const optimizedStops = solveTSPNearestNeighbor(dayStops);

  const beforeDist = calculateTotalRouteDistance(dayStops);
  const afterDist = calculateTotalRouteDistance(optimizedStops);

  const beforeTime = calculateTotalRouteTravelTime(dayStops);
  const afterTime = calculateTotalRouteTravelTime(optimizedStops);

  const savedTime = Math.max(0, beforeTime - afterTime);
  const savedDist = Math.max(0, Math.round((beforeDist - afterDist) * 10) / 10);

  const formatHoursMins = (totalMins: number) => {
    if (totalMins < 60) return `${totalMins}분`;
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return mins > 0 ? `${hrs}시간 ${mins}분` : `${hrs}시간`;
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.4)' }]}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Sparkles size={18} color="#FF6B6B" />
              </View>
              <View>
                <Text style={styles.title}>DAY {dayNumber} 동선 최적화 확인</Text>
                <Text style={styles.subtitle}>수학적 최단 경로(TSP) 알고리즘 분석 결과</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Comparison Cards */}
          <View style={styles.comparisonRow}>
            {/* Before */}
            <View style={[styles.compareCard, styles.beforeCard]}>
              <Text style={styles.compareLabel}>현재 계획 동선</Text>
              <Text style={styles.compareDist}>{beforeDist} km</Text>
              <Text style={styles.compareTime}>이동 약 {formatHoursMins(beforeTime)}</Text>
            </View>

            <View style={styles.compareArrow}>
              <ArrowRight size={18} color="#FF6B6B" />
            </View>

            {/* After */}
            <View style={[styles.compareCard, styles.afterCard]}>
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedBadgeText}>Pinch 추천</Text>
              </View>
              <Text style={[styles.compareDist, { color: '#059669' }]}>{afterDist} km</Text>
              <Text style={styles.compareTime}>이동 약 {formatHoursMins(afterTime)}</Text>
            </View>
          </View>

          {/* Savings Banner */}
          <View style={styles.savingsBanner}>
            <Sparkles size={16} color="#FF6B6B" />
            <Text style={styles.savingsText}>
              {savedTime > 0
                ? `약 ${savedTime}분 (${savedDist > 0 ? savedDist + 'km' : '이동'}) 절약돼요! 🤏`
                : '현재 동선이 이미 가장 효율적인 최적 경로예요! ✨'}
            </Text>
          </View>

          {/* Sequence Preview */}
          <Text style={styles.sequenceTitle}>추천 방문 순서 미리보기</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sequenceScroll}
          >
            {optimizedStops.map((stop, idx) => (
              <React.Fragment key={stop.id}>
                <View style={styles.stopPill}>
                  <View style={styles.stopIndexBadge}>
                    <Text style={styles.stopIndexText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.stopName} numberOfLines={1}>
                    {stop.place_name}
                  </Text>
                </View>

                {idx < optimizedStops.length - 1 && (
                  <View style={styles.seqArrow}>
                    <ArrowRight size={14} color="#94A3B8" />
                  </View>
                )}
              </React.Fragment>
            ))}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onClose}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelBtnText}>취소</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onConfirm}
              style={styles.confirmBtn}
            >
              <CheckCircle size={16} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.confirmBtnText}>최적 동선 적용하기</Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  compareCard: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    position: 'relative',
  },
  beforeCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  afterCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  compareArrow: {
    paddingHorizontal: 8,
  },
  compareLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  recommendedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  recommendedBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  compareDist: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 2,
  },
  compareTime: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.25)',
  },
  savingsText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E11D48',
    marginLeft: 8,
  },
  sequenceTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  sequenceScroll: {
    alignItems: 'center',
    paddingBottom: 6,
    marginBottom: 20,
  },
  stopPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 7,
    maxWidth: 150,
  },
  stopIndexBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  stopIndexText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  stopName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  seqArrow: {
    paddingHorizontal: 6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  confirmBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
