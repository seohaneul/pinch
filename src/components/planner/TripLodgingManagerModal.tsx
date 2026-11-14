import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Hotel,
  Search,
  Plus,
  Trash2,
  Check,
} from '@/components/common/CustomIcons';
import type { LodgingInfo, DaySchedule } from '../../types';
import { PlaceSearchModal } from '../places/PlaceSearchModal';
import { formatTimeInput } from '../../utils/formatUtils';
import { useTripStore } from '../../store/useTripStore';

interface TripLodgingManagerModalProps {
  visible: boolean;
  onClose: () => void;
  tripId: string;
  destination?: string;
  tripStartDate?: string;
  tripEndDate?: string;
  schedules?: DaySchedule[];
}

function buildDaysPreview(
  startDate: string,
  endDate: string,
  schedules?: DaySchedule[]
) {
  if (schedules && schedules.length > 0) {
    return schedules.map((s) => ({
      dayNumber: s.dayNumber,
      date: s.date,
      shortDate: s.date ? s.date.slice(5).replace('-', '.') : `${s.dayNumber}일차`,
    }));
  }
  const sDate = new Date(startDate);
  const eDate = new Date(endDate || startDate);
  if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) {
    return [{ dayNumber: 1, date: startDate, shortDate: '1일차' }];
  }
  const diffDays = Math.max(
    0,
    Math.round((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24))
  );
  const total = Math.min(30, diffDays + 1);
  const list: { dayNumber: number; date: string; shortDate: string }[] = [];
  for (let i = 0; i < total; i++) {
    const cur = new Date(sDate);
    cur.setDate(sDate.getDate() + i);
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    list.push({
      dayNumber: i + 1,
      date: `${cur.getFullYear()}-${m}-${d}`,
      shortDate: `${m}.${d}`,
    });
  }
  return list;
}

export const TripLodgingManagerModal: React.FC<TripLodgingManagerModalProps> = ({
  visible,
  onClose,
  tripId,
  destination = '',
  tripStartDate = '2026-11-10',
  tripEndDate = '2026-11-13',
  schedules = [],
}) => {
  const insets = useSafeAreaInsets();
  const { tripLodgings, dayLodgings, setTripLodgings } = useTripStore();

  const daysPreview = useMemo(
    () => buildDaysPreview(tripStartDate, tripEndDate, schedules),
    [tripStartDate, tripEndDate, schedules]
  );

  const [lodgingList, setLodgingList] = useState<LodgingInfo[]>([]);
  const [lodgingStartDay, setLodgingStartDay] = useState<number>(1);
  const [lodgingEndDay, setLodgingEndDay] = useState<number>(2);
  const [lodgingName, setLodgingName] = useState('');
  const [lodgingAddress, setLodgingAddress] = useState('');
  const [lodgingCheckIn, setLodgingCheckIn] = useState('15:00');
  const [lodgingCheckOut, setLodgingCheckOut] = useState('11:00');
  const [lodgingCoords, setLodgingCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showLodgingSearchModal, setShowLodgingSearchModal] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const savedList = tripLodgings?.[tripId];
    if (savedList && savedList.length > 0) {
      setLodgingList(savedList);
    } else {
      const map = new Map<string, LodgingInfo>();
      const totalDays = Math.max(1, daysPreview.length);
      for (let d = 1; d <= totalDays; d++) {
        const l = dayLodgings?.[`${tripId}_day_${d}`];
        if (l && l.name) {
          const key = `${l.name}_${l.startDay || d}_${l.endDay || d}`;
          if (!map.has(key)) {
            map.set(key, {
              ...l,
              startDay: l.startDay || d,
              endDay: l.endDay || d,
            });
          }
        }
      }
      setLodgingList(Array.from(map.values()));
    }
    setLodgingStartDay(1);
    setLodgingEndDay(Math.max(1, daysPreview.length));
    setLodgingName('');
    setLodgingAddress('');
    setLodgingCheckIn('15:00');
    setLodgingCheckOut('11:00');
    setLodgingCoords(null);
  }, [visible, tripId]);

  const handleAddLodgingItem = () => {
    const cleanName = lodgingName.trim();
    if (!cleanName) {
      Alert.alert('숙소 이름 확인', '숙소 이름을 입력하거나 지도에서 검색해 주세요.');
      return;
    }
    const sDay = Math.min(lodgingStartDay, lodgingEndDay);
    const eDay = Math.max(lodgingStartDay, lodgingEndDay);

    const newItem: LodgingInfo = {
      name: cleanName,
      address: lodgingAddress.trim() || `${destination || '여행지'} 숙소`,
      checkInTime: lodgingCheckIn.trim() || '15:00',
      checkOutTime: lodgingCheckOut.trim() || '11:00',
      latitude: lodgingCoords?.lat || 35.6762,
      longitude: lodgingCoords?.lng || 139.6503,
      startDay: sDay,
      endDay: eDay,
      stayNights: Math.max(1, eDay - sDay),
    };

    setLodgingList((prev) => [...prev, newItem]);
    setLodgingName('');
    setLodgingAddress('');
    setLodgingCoords(null);
  };

  const handleRemoveLodgingItem = (index: number) => {
    setLodgingList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveAll = () => {
    const finalList = [...lodgingList];
    if (lodgingName.trim()) {
      const sDay = Math.min(lodgingStartDay, lodgingEndDay);
      const eDay = Math.max(lodgingStartDay, lodgingEndDay);
      finalList.push({
        name: lodgingName.trim(),
        address: lodgingAddress.trim() || `${destination || '여행지'} 숙소`,
        checkInTime: lodgingCheckIn.trim() || '15:00',
        checkOutTime: lodgingCheckOut.trim() || '11:00',
        latitude: lodgingCoords?.lat || 35.6762,
        longitude: lodgingCoords?.lng || 139.6503,
        startDay: sDay,
        endDay: eDay,
        stayNights: Math.max(1, eDay - sDay),
      });
    }
    setTripLodgings(tripId, finalList);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[
          styles.fullScreen,
          { paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <View style={styles.topNavRow}>
          <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.backBtn}>
            <X size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>숙소 관리</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.optionalTag}>
            <Hotel size={13} color="#1B2A4A" />
            <Text style={styles.optionalTagText}>날짜별 숙소 설정</Text>
          </View>
          <Text style={styles.heroQuestionTitle}>날짜별 숙소 추가 및 수정</Text>
          <Text style={styles.heroQuestionSub}>
            일자별로 머무는 숙소가 달라도 날짜 구간을 선택해 여러 곳을 등록할 수 있어요. (같은 날 겹쳐도 모두 표시됩니다)
          </Text>

          {lodgingList.length > 0 && (
            <View style={styles.registeredLodgingList}>
              <Text style={styles.fieldLabel}>등록된 숙소 ({lodgingList.length}곳)</Text>
              {lodgingList.map((item, idx) => (
                <View key={`${item.name}_${idx}`} style={styles.registeredLodgingCard}>
                  <View style={styles.registeredLodgingDayBadge}>
                    <Text style={styles.registeredLodgingDayText}>
                      DAY {item.startDay || 1}
                      {item.endDay && item.endDay !== item.startDay ? ` ~ DAY ${item.endDay}` : ''}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.registeredLodgingName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.registeredLodgingSub} numberOfLines={1}>
                      {item.address} · 체크인 {item.checkInTime}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveLodgingItem(idx)}
                    style={{ padding: 6 }}
                  >
                    <Trash2 size={15} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={styles.cardFormBox}>
            <Text style={styles.fieldLabel}>1. 숙박 시작 날짜(체크인 일차) 선택</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
            >
              {daysPreview.map((d) => {
                const active = lodgingStartDay === d.dayNumber;
                return (
                  <TouchableOpacity
                    key={`start_${d.dayNumber}`}
                    activeOpacity={0.8}
                    onPress={() => {
                      setLodgingStartDay(d.dayNumber);
                      if (lodgingEndDay < d.dayNumber) {
                        setLodgingEndDay(d.dayNumber);
                      }
                    }}
                    style={[styles.daySelectChip, active && styles.daySelectChipActive]}
                  >
                    <Text
                      style={[
                        styles.daySelectChipTitle,
                        active && styles.daySelectChipTitleActive,
                      ]}
                    >
                      DAY {d.dayNumber}
                    </Text>
                    <Text
                      style={[
                        styles.daySelectChipSub,
                        active && styles.daySelectChipSubActive,
                      ]}
                    >
                      {d.shortDate}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>
              2. 숙박 종료 날짜(체크아웃 일차) 선택
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
            >
              {daysPreview.map((d) => {
                const active = lodgingEndDay === d.dayNumber;
                return (
                  <TouchableOpacity
                    key={`end_${d.dayNumber}`}
                    activeOpacity={0.8}
                    onPress={() => setLodgingEndDay(d.dayNumber)}
                    style={[styles.daySelectChip, active && styles.daySelectChipActive]}
                  >
                    <Text
                      style={[
                        styles.daySelectChipTitle,
                        active && styles.daySelectChipTitleActive,
                      ]}
                    >
                      DAY {d.dayNumber}
                    </Text>
                    <Text
                      style={[
                        styles.daySelectChipSub,
                        active && styles.daySelectChipSubActive,
                      ]}
                    >
                      {d.shortDate}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowLodgingSearchModal(true)}
              style={styles.mapSearchTriggerBtn}
            >
              <Search size={16} color="#1B2A4A" />
              <Text style={styles.mapSearchTriggerBtnText}>
                지도에서 숙소 검색하기 (자동 위치 등록)
              </Text>
            </TouchableOpacity>

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>숙소 이름</Text>
            <View style={styles.searchBox}>
              <TextInput
                value={lodgingName}
                onChangeText={setLodgingName}
                placeholder="예: 그랜드 하얏트 / 시부야 엑셀 호텔"
                placeholderTextColor="#9CA3AF"
                style={styles.searchInput}
              />
            </View>

            <Text style={styles.fieldLabel}>숙소 위치 / 주소 (선택)</Text>
            <View style={styles.searchBox}>
              <TextInput
                value={lodgingAddress}
                onChangeText={setLodgingAddress}
                placeholder="예: 하카타역 도보 3분"
                placeholderTextColor="#9CA3AF"
                style={styles.searchInput}
              />
            </View>

            <View style={styles.twoColRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>체크인 시간</Text>
                <View style={styles.searchBox}>
                  <TextInput
                    value={lodgingCheckIn}
                    onChangeText={(v) => setLodgingCheckIn(formatTimeInput(v))}
                    placeholder="15:00"
                    keyboardType="number-pad"
                    maxLength={5}
                    placeholderTextColor="#9CA3AF"
                    style={styles.searchInput}
                  />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>체크아웃 시간</Text>
                <View style={styles.searchBox}>
                  <TextInput
                    value={lodgingCheckOut}
                    onChangeText={(v) => setLodgingCheckOut(formatTimeInput(v))}
                    placeholder="11:00"
                    keyboardType="number-pad"
                    maxLength={5}
                    placeholderTextColor="#9CA3AF"
                    style={styles.searchInput}
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleAddLodgingItem}
              style={styles.addLodgingSecondaryBtn}
            >
              <Plus size={15} color="#1B2A4A" />
              <Text style={styles.addLodgingSecondaryBtnText}>
                + 이 기간 숙소 목록에 추가
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleSaveAll}
            style={styles.bottomPrimaryBtn}
          >
            <Check size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.bottomPrimaryBtnText}>숙소 정보 저장하기</Text>
          </TouchableOpacity>
        </ScrollView>

        <PlaceSearchModal
          visible={showLodgingSearchModal}
          onClose={() => setShowLodgingSearchModal(false)}
          initialQuery={lodgingName || `${(destination || '').split(' · ')[0] || ''} 호텔`}
          defaultCategory="LODGING"
          ctaLabel="이 위치를 숙소로 선택하기"
          onSelectResult={(place) => {
            setLodgingName(place.name);
            setLodgingAddress(place.address);
            setLodgingCoords({ lat: place.latitude, lng: place.longitude });
            setShowLodgingSearchModal(false);
          }}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  optionalTag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EEF2F8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 10,
  },
  optionalTagText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1B2A4A',
  },
  heroQuestionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.4,
  },
  heroQuestionSub: {
    fontSize: 13.5,
    color: '#64748B',
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 20,
  },
  registeredLodgingList: {
    marginBottom: 16,
  },
  registeredLodgingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  registeredLodgingDayBadge: {
    backgroundColor: '#1B2A4A',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  registeredLodgingDayText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  registeredLodgingName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  registeredLodgingSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  cardFormBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 6,
  },
  daySelectChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  daySelectChipActive: {
    backgroundColor: '#1B2A4A',
    borderColor: '#1B2A4A',
  },
  daySelectChipTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1E293B',
  },
  daySelectChipTitleActive: {
    color: '#FFFFFF',
  },
  daySelectChipSub: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  daySelectChipSubActive: {
    color: '#CBD5E1',
  },
  mapSearchTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EEF2F8',
    borderRadius: 12,
    paddingVertical: 11,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  mapSearchTriggerBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1B2A4A',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
  },
  addLodgingSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#1B2A4A',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 4,
  },
  addLodgingSecondaryBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1B2A4A',
  },
  bottomPrimaryBtn: {
    backgroundColor: '#1B2A4A',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
  },
});
