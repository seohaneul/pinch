import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Calendar as CalendarIcon,
  MapPin,
  Sparkles,
  DollarSign,
  Users,
  Check,
  Search,
  Plus,
  Globe,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import type { Trip } from '../../types';
import { useTripStore } from '../../store/useTripStore';
import { CalendarRangePicker } from '../common/CalendarRangePicker';
import { PStyleCourseModal } from './PStyleCourseModal';
import {
  searchWorldwideDestinations,
  POPULAR_RECOMMENDED_DESTINATIONS,
  WorldwideDestination,
} from '../../services/destinationSearchService';

interface CreateTripModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated?: (tripId: string) => void;
}

export type DestinationItem = WorldwideDestination;

export const POPULAR_DESTINATIONS: DestinationItem[] = POPULAR_RECOMMENDED_DESTINATIONS;


// 콤마 포맷터
function formatNumberWithCommas(val: string | number): string {
  const digits = String(val).replace(/[^0-9]/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('ko-KR');
}

export const CreateTripModal: React.FC<CreateTripModalProps> = ({
  visible,
  onClose,
  onCreated,
}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { createTrip } = useTripStore();

  const [selectedDestination, setSelectedDestination] = useState<WorldwideDestination>(
    POPULAR_RECOMMENDED_DESTINATIONS[0]
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WorldwideDestination[]>(
    POPULAR_RECOMMENDED_DESTINATIONS
  );
  const [isSearching, setIsSearching] = useState(false);
  const [destination, setDestination] = useState(POPULAR_RECOMMENDED_DESTINATIONS[0].name);
  const [title, setTitle] = useState(POPULAR_RECOMMENDED_DESTINATIONS[0].defaultTitle);

  // 날짜 선택 상태 및 캘린더 모달
  const [startDate, setStartDate] = useState('2026-12-01');
  const [endDate, setEndDate] = useState('2026-12-04');
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);

  // P형 맞춤 추천 코스 모달 상태
  const [createdTrip, setCreatedTrip] = useState<Trip | null>(null);
  const [showPStyleModal, setShowPStyleModal] = useState(false);

  const [memberInput, setMemberInput] = useState('나, 지은, 민혁');

  // 실시간 전세계 도시 검색 (Open-Meteo Geocoding API + 디바운스 250ms)
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults(POPULAR_RECOMMENDED_DESTINATIONS);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchWorldwideDestinations(q);
        setSearchResults(results);
      } catch (e) {
        console.log('[CreateTripModal] Search error:', e);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 여행지 선택 핸들러
  const handleSelectDestination = (dest: WorldwideDestination) => {
    setSelectedDestination(dest);
    setDestination(dest.name);
    setTitle(dest.defaultTitle);
  };

  // 검색창에 직접 입력한 여행지로 설정
  const handleUseCustomDestination = () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    setDestination(trimmed);
    setTitle(`${trimmed} 힐링 여행 ✈️`);
  };

  // 날짜 범위 확정
  const handleConfirmDates = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  // P형 맞춤 코스 모달 닫기
  const handlePStyleClose = () => {
    const tripId = createdTrip?.id;
    setShowPStyleModal(false);
    setCreatedTrip(null);
    onClose();
    if (tripId && onCreated) onCreated(tripId);
  };

  // P형 맞춤 코스 모달 생성 완료
  const handlePStyleCompleted = () => {
    const tripId = createdTrip?.id;
    setShowPStyleModal(false);
    setCreatedTrip(null);
    onClose();
    if (tripId && onCreated) onCreated(tripId);
    router.push('/(tabs)/planner');
  };

  // 여행 생성 제출
  const handleCreate = () => {
    if (!title.trim()) {
      Alert.alert('알림', '여행 제목을 입력해 주세요.');
      return;
    }
    if (!destination.trim()) {
      Alert.alert('알림', '여행지를 선택하거나 입력해 주세요.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      Alert.alert('알림', '종료일은 시작일보다 빠를 수 없습니다.');
      return;
    }

    const members = memberInput
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);

    const newTrip = createTrip({
      title: title.trim(),
      destination: destination.trim(),
      startDate,
      endDate,
      budget: 0,
      coverImage: selectedDestination.coverImage,
      memberNames: members.length > 0 ? members : ['나 (민지)', '수현'],
      centerLat: selectedDestination.latitude,
      centerLng: selectedDestination.longitude,
    });

    // P형 맞춤 코스 온보딩 팝업 실행 (2번 UX 단독 적용)
    setCreatedTrip(newTrip);
    setShowPStyleModal(true);
  };

  // 여행 기간 계산 (N박 M일)
  const durationSummary = useMemo(() => {
    try {
      const s = new Date(startDate);
      const e = new Date(endDate);
      const diffTime = e.getTime() - s.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return '당일치기';
      if (diffDays > 0) return `${diffDays}박 ${diffDays + 1}일`;
      return '';
    } catch {
      return '';
    }
  }, [startDate, endDate]);

  return (
    <>
      <Modal visible={visible && !showPStyleModal} animationType="slide" transparent={true} onRequestClose={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.keyboardContainer, { backgroundColor: 'rgba(0, 0, 0, 0.4)' }]}
        >
          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>새로운 여행 만들기 ✈️</Text>
                <Text style={styles.headerSubtitle}>
                  새로운 일정과 가계부를 함께 시작해 보세요
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.closeBtn}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollBody}>
              {/* 1. 여행지 검색 & 선택 */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionLabel}>여행지 검색 및 선택</Text>
                {destination ? (
                  <View style={styles.selectedDestBadge}>
                    <MapPin size={12} color="#FF6B6B" style={{ marginRight: 4 }} />
                    <Text style={styles.selectedDestText} numberOfLines={1}>
                      {destination}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* 실시간 전세계 검색창 */}
              <View style={styles.searchBar}>
                <Globe size={16} color="#FF6B6B" style={{ marginRight: 8 }} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="전세계 모든 도시 검색 (예: 파리, 로마, 런던, 뉴욕, 속초...)"
                  placeholderTextColor="#94A3B8"
                  style={styles.searchInput}
                  returnKeyType="search"
                />
                {isSearching ? (
                  <ActivityIndicator size="small" color="#FF6B6B" />
                ) : searchQuery.length > 0 ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <X size={16} color="#94A3B8" />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* 검색 모드 (검색어 입력 시 전세계 실시간 검색 결과 리스트 노출) */}
              {searchQuery.trim().length > 0 ? (
                <View style={styles.searchResultsContainer}>
                  <View style={styles.searchResultHeaderRow}>
                    <Text style={styles.searchResultCountText}>
                      검색 결과 {searchResults.length}개
                    </Text>
                    <Text style={styles.searchResultHintText}>
                      전세계 실시간 API 연동
                    </Text>
                  </View>

                  {searchResults.slice(0, 6).map((item) => {
                    const isSelected = destination === item.name || selectedDestination.id === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.75}
                        onPress={() => handleSelectDestination(item)}
                        style={[
                          styles.searchResultRow,
                          isSelected && styles.searchResultRowSelected,
                        ]}
                      >
                        <Text style={styles.searchResultFlag}>{item.flag}</Text>
                        <View style={styles.searchResultInfo}>
                          <Text
                            style={[
                              styles.searchResultName,
                              isSelected && styles.searchResultNameSelected,
                            ]}
                            numberOfLines={1}
                          >
                            {item.name}
                          </Text>
                          <Text style={styles.searchResultSub} numberOfLines={1}>
                            {item.country} {item.admin1 ? `· ${item.admin1}` : ''}
                          </Text>
                        </View>
                        {isSelected ? (
                          <View style={styles.selectedCheckCircle}>
                            <Check size={12} color="#FFFFFF" />
                          </View>
                        ) : (
                          <Text style={styles.searchResultCoordBadge}>
                            {item.latitude.toFixed(1)}°, {item.longitude.toFixed(1)}°
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}

                  {/* 검색어 직접 등록 옵션 */}
                  <TouchableOpacity
                    onPress={handleUseCustomDestination}
                    activeOpacity={0.8}
                    style={styles.customDestBanner}
                  >
                    <Plus size={14} color="#E11D48" style={{ marginRight: 6 }} />
                    <Text style={styles.customDestText}>
                      '<Text style={{ fontWeight: '800' }}>{searchQuery.trim()}</Text>'(으)로 직접 등록하기
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* 기본 추천 모드 (검색어 없을 때 인기 추천 여행지 캐러셀) */
                <View>
                  <Text style={styles.presetSectionSubLabel}>🔥 추천 인기 여행지</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.presetScroll}
                    contentContainerStyle={{ paddingRight: 16 }}
                  >
                    {POPULAR_RECOMMENDED_DESTINATIONS.map((dest) => {
                      const isSelected = destination === dest.name || selectedDestination.id === dest.id;
                      return (
                        <TouchableOpacity
                          key={dest.id}
                          activeOpacity={0.8}
                          onPress={() => handleSelectDestination(dest)}
                          style={[styles.presetItem, isSelected && styles.presetItemSelected]}
                        >
                          <Image
                            source={{ uri: dest.coverImage }}
                            style={styles.presetImage}
                            resizeMode="cover"
                          />
                          <Text style={styles.presetText} numberOfLines={1}>
                            {dest.flag} {dest.name.split('(')[0].trim()}
                          </Text>
                          <Text style={styles.presetCountryText} numberOfLines={1}>
                            {dest.country}
                          </Text>
                          {isSelected && (
                            <View style={styles.checkBadge}>
                              <Check size={11} color="#FFF" />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* 2. 여행 제목 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>여행 제목</Text>
                <View style={styles.inputRow}>
                  <Sparkles size={16} color="#FF6B6B" style={{ marginRight: 8 }} />
                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="예: 도쿄 3박 4일 감성 여행"
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                  />
                </View>
              </View>

              {/* 3. 여행 날짜 (캘린더 터치 피커) */}
              <View style={styles.inputGroup}>
                <View style={styles.labelWithBadgeRow}>
                  <Text style={styles.inputLabel}>여행 일정 (캘린더로 선택)</Text>
                  {durationSummary ? (
                    <View style={styles.durationBadge}>
                      <Text style={styles.durationBadgeText}>{durationSummary}</Text>
                    </View>
                  ) : null}
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setIsCalendarVisible(true)}
                  style={styles.calendarTriggerBox}
                >
                  <View style={styles.calendarTriggerLeft}>
                    <CalendarIcon size={18} color="#FF6B6B" style={{ marginRight: 10 }} />
                    <View>
                      <Text style={styles.calendarDateRangeText}>
                        {startDate} ~ {endDate}
                      </Text>
                      <Text style={styles.calendarHelperText}>
                        탭하여 달력에서 출발일과 도착일을 선택하세요
                      </Text>
                    </View>
                  </View>
                  <View style={styles.calendarTriggerBadge}>
                    <Text style={styles.calendarTriggerBadgeText}>달력 열기</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* 4. 예산 설정 안내 카드 (가계부 탭에서 설정) */}
              <View style={styles.budgetGuideCard}>
                <View style={styles.budgetGuideHeader}>
                  <Sparkles size={16} color="#FF6B6B" style={{ marginRight: 6 }} />
                  <Text style={styles.budgetGuideTitle}>예산 계획은 가계부에서 🎯</Text>
                </View>
                <Text style={styles.budgetGuideDesc}>
                  여행 생성 후 가계부 탭에서 항공권, 숙소, 식비, 투어/패키지 등 세부 항목별로 정밀하게 예산을 계획하고 관리할 수 있습니다.
                </Text>
              </View>

              {/* 5. 동행 멤버 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>동행 멤버 (쉼표로 구분)</Text>
                <View style={styles.inputRow}>
                  <Users size={16} color="#64748B" style={{ marginRight: 8 }} />
                  <TextInput
                    value={memberInput}
                    onChangeText={setMemberInput}
                    placeholder="나, 민지, 수현"
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                  />
                </View>
              </View>

              {/* 완료 버튼 */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleCreate}
                style={styles.submitBtn}
              >
                <Text style={styles.submitBtnText}>이 여행으로 일정 시작하기 🚀</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 대화형 캘린더 날짜 범위 피커 */}
      <CalendarRangePicker
        visible={isCalendarVisible}
        initialStartDate={startDate}
        initialEndDate={endDate}
        onClose={() => setIsCalendarVisible(false)}
        onConfirm={handleConfirmDates}
      />

      {/* P형 맞춤 코스 추천 모달 (새 여행 생성 직후 온보딩) */}
      <PStyleCourseModal
        visible={showPStyleModal}
        trip={createdTrip}
        onClose={handlePStyleClose}
        onCompleted={handlePStyleCompleted}
      />
    </>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
    paddingBottom: 24,
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    marginTop: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  selectedDestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  selectedDestText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    padding: 0,
  },
  customDestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  customDestText: {
    fontSize: 12,
    color: '#E11D48',
  },
  searchResultsContainer: {
    marginBottom: 14,
  },
  searchResultHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  searchResultCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  searchResultHintText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 6,
  },
  searchResultRowSelected: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  searchResultFlag: {
    fontSize: 22,
    marginRight: 10,
  },
  searchResultInfo: {
    flex: 1,
    marginRight: 8,
  },
  searchResultName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  searchResultNameSelected: {
    color: '#FF6B6B',
    fontWeight: '800',
  },
  searchResultSub: {
    fontSize: 11,
    color: '#64748B',
  },
  selectedCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultCoordBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    backgroundColor: '#EEF2F6',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  presetSectionSubLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  presetScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  presetItem: {
    marginRight: 12,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    width: 108,
    position: 'relative',
  },
  presetItemSelected: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  presetImage: {
    width: 84,
    height: 56,
    borderRadius: 10,
    marginBottom: 6,
  },
  presetText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  presetCountryText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 1,
  },
  checkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputGroup: {
    marginBottom: 14,
  },
  labelWithBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  inputSubLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  durationBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  durationBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '600',
    padding: 0,
  },
  currencySuffix: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 4,
  },
  calendarTriggerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  calendarTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  calendarDateRangeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  calendarHelperText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  calendarTriggerBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  calendarTriggerBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  quickBudgetRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  budgetGuideCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  budgetGuideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  budgetGuideTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#9A3412',
  },
  budgetGuideDesc: {
    fontSize: 11,
    lineHeight: 16,
    color: '#C2410C',
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
