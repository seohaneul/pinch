import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Hotel,
  Clock,
  MapPin,
  FileText,
  Phone,
  Check,
  Building,
  Calendar,
  Sparkles,
  Search,
  Star,
  Edit3,
} from 'lucide-react-native';
import type { LodgingInfo, DaySchedule } from '../../types';
import { CalendarRangePicker } from '../common/CalendarRangePicker';
import { searchAccommodations, SearchPlaceResult } from '../../services/placeSearchService';

interface LodgingModalProps {
  visible: boolean;
  onClose: () => void;
  dayNumber: number;
  tripStartDate?: string;
  tripEndDate?: string;
  schedules?: DaySchedule[];
  initialLodging: LodgingInfo | null;
  onSave: (lodging: LodgingInfo) => void;
  onSaveRange?: (lodging: LodgingInfo, startDay: number, endDay: number) => void;
}

export const LodgingModal: React.FC<LodgingModalProps> = ({
  visible,
  onClose,
  dayNumber,
  tripStartDate = '2026-11-10',
  tripEndDate = '2026-11-13',
  schedules = [],
  initialLodging,
  onSave,
  onSaveRange,
}) => {
  const insets = useSafeAreaInsets();

  // Mode: 'search' vs 'manual'
  const [inputMode, setInputMode] = useState<'search' | 'manual'>('search');

  // 숙소 정보 필드
  const [name, setName] = useState(initialLodging?.name || '');
  const [address, setAddress] = useState(initialLodging?.address || '');
  const [latitude, setLatitude] = useState<number | undefined>(initialLodging?.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(initialLodging?.longitude);
  const [checkInTime, setCheckInTime] = useState(initialLodging?.checkInTime || '15:00');
  const [checkOutTime, setCheckOutTime] = useState(initialLodging?.checkOutTime || '11:00');
  const [memo, setMemo] = useState(initialLodging?.memo || '');
  const [phoneNumber, setPhoneNumber] = useState(initialLodging?.phoneNumber || '');
  const [imageUrl, setImageUrl] = useState(initialLodging?.imageUrl || '');

  // 숙소 검색 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchPlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 날짜 범위 및 캘린더 피커 상태
  const [startDate, setStartDate] = useState(initialLodging?.startDate || tripStartDate);
  const [endDate, setEndDate] = useState(initialLodging?.endDate || tripEndDate);
  const [isCalendarPickerVisible, setIsCalendarPickerVisible] = useState(false);

  // Helper to calculate days and nights between dates
  const calculateStayInfo = (s: string, e: string) => {
    try {
      const sDate = new Date(s);
      const eDate = new Date(e);
      const diffTime = Math.max(0, eDate.getTime() - sDate.getTime());
      const nights = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));

      let startDayNum = dayNumber;
      let endDayNum = dayNumber + nights;

      if (schedules && schedules.length > 0) {
        const foundStart = schedules.find((sched) => sched.date === s);
        if (foundStart) startDayNum = foundStart.dayNumber;
        const foundEnd = schedules.find((sched) => sched.date === e);
        if (foundEnd) endDayNum = foundEnd.dayNumber;
      } else if (tripStartDate) {
        const tStart = new Date(tripStartDate).getTime();
        startDayNum = Math.max(1, Math.round((sDate.getTime() - tStart) / (1000 * 60 * 60 * 24)) + 1);
        endDayNum = Math.max(startDayNum, Math.round((eDate.getTime() - tStart) / (1000 * 60 * 60 * 24)) + 1);
      }

      return {
        nights,
        startDay: startDayNum,
        endDay: endDayNum,
      };
    } catch {
      return { nights: 1, startDay: dayNumber, endDay: dayNumber };
    }
  };

  const stayInfo = calculateStayInfo(startDate, endDate);

  // 숙소 검색 로직
  useEffect(() => {
    let isCancelled = false;
    const fetchAccommodations = async () => {
      setIsSearching(true);
      try {
        const results = await searchAccommodations(searchQuery);
        if (!isCancelled) {
          setSearchResults(results);
        }
      } catch {
        if (!isCancelled) setSearchResults([]);
      } finally {
        if (!isCancelled) setIsSearching(false);
      }
    };

    const timer = setTimeout(fetchAccommodations, 250);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  useEffect(() => {
    if (visible) {
      if (initialLodging) {
        setName(initialLodging.name || '');
        setAddress(initialLodging.address || '');
        setLatitude(initialLodging.latitude);
        setLongitude(initialLodging.longitude);
        setCheckInTime(initialLodging.checkInTime || '15:00');
        setCheckOutTime(initialLodging.checkOutTime || '11:00');
        setMemo(initialLodging.memo || '');
        setPhoneNumber(initialLodging.phoneNumber || '');
        setImageUrl(initialLodging.imageUrl || '');
        setStartDate(initialLodging.startDate || tripStartDate);
        setEndDate(initialLodging.endDate || tripEndDate);
        setInputMode('manual');
      } else {
        setName('');
        setAddress('');
        setLatitude(undefined);
        setLongitude(undefined);
        setCheckInTime('15:00');
        setCheckOutTime('11:00');
        setMemo('');
        setPhoneNumber('');
        setImageUrl('');
        setStartDate(tripStartDate);
        setEndDate(tripEndDate);
        setInputMode('search');
        setSearchQuery('');
      }
    }
  }, [initialLodging, visible, tripStartDate, tripEndDate]);

  const handleSelectAccommodation = (hotel: SearchPlaceResult) => {
    setName(hotel.name);
    setAddress(hotel.address);
    setLatitude(hotel.latitude);
    setLongitude(hotel.longitude);
    if (hotel.imageUrl) setImageUrl(hotel.imageUrl);
    if (hotel.memo) setMemo(hotel.memo);
    setInputMode('manual');
    Alert.alert('숙소 선택 완료 ✨', `"${hotel.name}"의 위치 정보 및 주소가 자동 입력되었습니다.`);
  };

  const handleConfirmCalendarRange = (newStart: string, newEnd: string) => {
    setStartDate(newStart);
    setEndDate(newEnd);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('알림', '숙소 이름을 검색하거나 직접 입력해주세요.');
      return;
    }

    const lodgingData: LodgingInfo = {
      ...initialLodging,
      name: name.trim(),
      address: address.trim() || undefined,
      latitude,
      longitude,
      imageUrl: imageUrl || undefined,
      checkInTime: checkInTime.trim() || '15:00',
      checkOutTime: checkOutTime.trim() || '11:00',
      memo: memo.trim() || undefined,
      phoneNumber: phoneNumber.trim() || undefined,
      day_number: dayNumber,
      startDate,
      endDate,
      stayNights: stayInfo.nights,
      startDay: stayInfo.startDay,
      endDay: stayInfo.endDay,
    };

    if (onSaveRange) {
      onSaveRange(lodgingData, stayInfo.startDay, stayInfo.endDay);
    } else {
      onSave(lodgingData);
    }

    Alert.alert(
      '숙소 등록 완료 🏨',
      `DAY ${stayInfo.startDay}부터 DAY ${stayInfo.endDay}까지 (${stayInfo.nights}박 ${stayInfo.nights + 1}일) 숙소로 "${name.trim()}"이 등록되었습니다.`
    );
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.sheet, { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Hotel size={18} color="#FF6B6B" />
              </View>
              <View>
                <Text style={styles.title}>숙소 검색 & 등록 🏨</Text>
                <Text style={styles.subtitle}>숙소를 검색하여 위치를 자동 선택하거나 직접 입력하세요</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Mode Switcher: Search vs Manual */}
          <View style={styles.modeTabRow}>
            <TouchableOpacity
              onPress={() => setInputMode('search')}
              style={[styles.modeTabBtn, inputMode === 'search' && styles.modeTabBtnActive]}
              activeOpacity={0.8}
            >
              <Search size={14} color={inputMode === 'search' ? '#FF6B6B' : '#64748B'} style={{ marginRight: 6 }} />
              <Text style={[styles.modeTabText, inputMode === 'search' && styles.modeTabTextActive]}>
                숙소 검색하여 선택 🔍
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setInputMode('manual')}
              style={[styles.modeTabBtn, inputMode === 'manual' && styles.modeTabBtnActive]}
              activeOpacity={0.8}
            >
              <Edit3 size={14} color={inputMode === 'manual' ? '#FF6B6B' : '#64748B'} style={{ marginRight: 6 }} />
              <Text style={[styles.modeTabText, inputMode === 'manual' && styles.modeTabTextActive]}>
                직접 입력 ✏️
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollBody}>
            {/* 1. 숙박 기간 캘린더 선택 카드 */}
            <View style={styles.datePickerCard}>
              <View style={styles.datePickerHeader}>
                <View style={styles.datePickerHeaderLeft}>
                  <Calendar size={15} color="#FF6B6B" style={{ marginRight: 6 }} />
                  <Text style={styles.datePickerTitle}>숙박 기간 (체크인 ~ 체크아웃)</Text>
                </View>
                <View style={styles.nightsBadge}>
                  <Text style={styles.nightsBadgeText}>
                    {stayInfo.nights}박 {stayInfo.nights + 1}일
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setIsCalendarPickerVisible(true)}
                activeOpacity={0.8}
                style={styles.calendarTriggerBox}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.calendarRangeText}>
                    {startDate} ~ {endDate}
                  </Text>
                  <Text style={styles.calendarSubText}>
                    DAY {stayInfo.startDay}부터 DAY {stayInfo.endDay}까지 모든 일차에 자동 등록됩니다
                  </Text>
                </View>
                <View style={styles.calendarBtnPill}>
                  <Text style={styles.calendarBtnPillText}>캘린더 변경 📅</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* MODE 1: SEARCH MODE */}
            {inputMode === 'search' && (
              <View style={styles.searchSection}>
                <Text style={styles.sectionLabel}>숙소명 또는 도시명 검색</Text>
                <View style={styles.searchBar}>
                  <Search size={16} color="#64748B" style={{ marginRight: 8 }} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="예: 호텔 그레이서리, 힐튼 괌, 료칸, 하얏트"
                    placeholderTextColor="#94A3B8"
                    style={styles.searchInput}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                      <X size={14} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>

                {isSearching ? (
                  <View style={styles.loadingBox}>
                    <ActivityIndicator size="small" color="#FF6B6B" />
                    <Text style={styles.loadingText}>숙소 정보를 검색하고 있습니다...</Text>
                  </View>
                ) : searchResults.length > 0 ? (
                  <View style={styles.resultsList}>
                    <Text style={styles.resultsCountText}>추천 및 검색 결과 ({searchResults.length}건)</Text>
                    {searchResults.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => handleSelectAccommodation(item)}
                        style={styles.hotelResultCard}
                        activeOpacity={0.7}
                      >
                        <View style={{ flex: 1, marginRight: 10 }}>
                          <View style={styles.hotelCardHeader}>
                            <Text style={styles.hotelName} numberOfLines={1}>
                              {item.name}
                            </Text>
                            {item.rating && (
                              <View style={styles.ratingBadge}>
                                <Star size={11} color="#F59E0B" fill="#F59E0B" style={{ marginRight: 2 }} />
                                <Text style={styles.ratingText}>{item.rating}</Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.hotelAddressRow}>
                            <MapPin size={12} color="#64748B" style={{ marginRight: 4 }} />
                            <Text style={styles.hotelAddress} numberOfLines={1}>
                              {item.address}
                            </Text>
                          </View>
                          {item.memo && (
                            <Text style={styles.hotelMemo} numberOfLines={1}>
                              💡 {item.memo}
                            </Text>
                          )}
                        </View>
                        <View style={styles.selectPill}>
                          <Text style={styles.selectPillText}>선택</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
                    <TouchableOpacity
                      onPress={() => setInputMode('manual')}
                      style={styles.switchManualBtn}
                    >
                      <Text style={styles.switchManualBtnText}>직접 숙소 정보 입력하기 ✏️</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* MODE 2: MANUAL INPUT & DETAIL CONFIRMATION */}
            {inputMode === 'manual' && (
              <View>
                {/* Selected Accommodation Badge */}
                {latitude && longitude ? (
                  <View style={styles.geoConfirmedBanner}>
                    <Sparkles size={14} color="#059669" style={{ marginRight: 6 }} />
                    <Text style={styles.geoConfirmedText}>
                      지도 좌표가 확인되어 일정 동선에 정확하게 핀치됩니다! 📍
                    </Text>
                  </View>
                ) : null}

                {/* Lodging Name */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>숙소 이름 *</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="예: 호텔 그레이서리 신주쿠, 교토 료칸"
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                  />
                </View>

                {/* Address */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>주소 / 위치</Text>
                  <TextInput
                    value={address}
                    onChangeText={setAddress}
                    placeholder="예: 도쿄도 신주쿠구 카부키초 1-19-1"
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                  />
                </View>

                {/* Check-in & Check-out Times */}
                <View style={styles.timeRow}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>체크인 시간</Text>
                    <View style={styles.timeInputWrap}>
                      <Clock size={14} color="#64748B" style={{ marginRight: 6 }} />
                      <TextInput
                        value={checkInTime}
                        onChangeText={setCheckInTime}
                        placeholder="15:00"
                        placeholderTextColor="#94A3B8"
                        style={styles.innerInput}
                      />
                    </View>
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>체크아웃 시간</Text>
                    <View style={styles.timeInputWrap}>
                      <Clock size={14} color="#64748B" style={{ marginRight: 6 }} />
                      <TextInput
                        value={checkOutTime}
                        onChangeText={setCheckOutTime}
                        placeholder="11:00"
                        placeholderTextColor="#94A3B8"
                        style={styles.innerInput}
                      />
                    </View>
                  </View>
                </View>

                {/* Phone Number */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>연락처</Text>
                  <View style={styles.timeInputWrap}>
                    <Phone size={14} color="#64748B" style={{ marginRight: 6 }} />
                    <TextInput
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      placeholder="예: +81 3-6833-1111"
                      placeholderTextColor="#94A3B8"
                      keyboardType="phone-pad"
                      style={styles.innerInput}
                    />
                  </View>
                </View>

                {/* Memo */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>예약 번호 및 메모</Text>
                  <TextInput
                    value={memo}
                    onChangeText={setMemo}
                    placeholder="예: 아고다 예약 완료 (예약번호 #GRC-9281), 조식 포함"
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={3}
                    style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]}
                  />
                </View>

                {/* Back to Search Button */}
                <TouchableOpacity
                  onPress={() => setInputMode('search')}
                  style={styles.backSearchBtn}
                  activeOpacity={0.7}
                >
                  <Search size={14} color="#64748B" style={{ marginRight: 4 }} />
                  <Text style={styles.backSearchBtnText}>다른 숙소 다시 검색하기</Text>
                </TouchableOpacity>

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={handleSave}
                  style={styles.submitBtn}
                  activeOpacity={0.8}
                >
                  <Check size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.submitBtnText}>
                    {stayInfo.nights}박 숙소 등록 및 일정 반영 🏨
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* 캘린더 날짜 범위 피커 모달 */}
      <CalendarRangePicker
        visible={isCalendarPickerVisible}
        initialStartDate={startDate}
        initialEndDate={endDate}
        onClose={() => setIsCalendarPickerVisible(false)}
        onConfirm={handleConfirmCalendarRange}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
  },
  modeTabRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginTop: 12,
    marginBottom: 12,
  },
  modeTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
  },
  modeTabBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  modeTabTextActive: {
    color: '#FF6B6B',
  },
  scrollBody: {
    marginTop: 2,
  },
  datePickerCard: {
    backgroundColor: '#FFF8F8',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  datePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  datePickerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  datePickerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9F1239',
  },
  nightsBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  nightsBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  calendarTriggerBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FDA4AF',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarRangeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  calendarSubText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#E11D48',
    marginTop: 2,
  },
  calendarBtnPill: {
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  calendarBtnPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF6B6B',
  },
  searchSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
    padding: 0,
  },
  loadingBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
    fontWeight: '600',
  },
  resultsList: {
    gap: 8,
  },
  resultsCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  hotelResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 12,
  },
  hotelCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  hotelName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    flexShrink: 1,
    marginRight: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  hotelAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  hotelAddress: {
    fontSize: 11,
    color: '#64748B',
    flexShrink: 1,
  },
  hotelMemo: {
    fontSize: 10,
    color: '#FF6B6B',
    fontWeight: '600',
    marginTop: 3,
  },
  selectPill: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  selectPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 10,
  },
  switchManualBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  switchManualBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  geoConfirmedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
  },
  geoConfirmedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
    flex: 1,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
  },
  timeInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  innerInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
    padding: 0,
  },
  backSearchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginBottom: 8,
  },
  backSearchBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  submitBtn: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 20,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
