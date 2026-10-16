import React, { useState, useMemo } from 'react';
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
} from 'lucide-react-native';
import { useTripStore } from '../../store/useTripStore';
import { CalendarRangePicker } from '../common/CalendarRangePicker';

interface CreateTripModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated?: (tripId: string) => void;
}

export interface DestinationItem {
  id: string;
  name: string;
  country: string;
  flag: string;
  defaultTitle: string;
  coverImage: string;
  keywords: string[];
}

export const POPULAR_DESTINATIONS: DestinationItem[] = [
  // 일본
  {
    id: 'osaka',
    name: '오사카 / 교토',
    country: '일본',
    flag: '🇯🇵',
    defaultTitle: '오사카 먹방 & 교토 힐링 여행 🏯',
    coverImage: 'https://images.unsplash.com/photo-1590559899731-a3f376dd4558?w=800&auto=format&fit=crop',
    keywords: ['오사카', '교토', '간사이', '일본', 'osaka', 'kyoto', 'japan'],
  },
  {
    id: 'tokyo',
    name: '도쿄 / 시부야',
    country: '일본',
    flag: '🇯🇵',
    defaultTitle: '도쿄 쇼핑 & 감성 카페 투어 🗼',
    coverImage: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop',
    keywords: ['도쿄', '신주쿠', '시부야', '긴자', '일본', 'tokyo', 'japan'],
  },
  {
    id: 'fukuoka',
    name: '후쿠오카 / 유후인',
    country: '일본',
    flag: '🇯🇵',
    defaultTitle: '후쿠오카 온천 & 라멘 투어 🍜',
    coverImage: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&auto=format&fit=crop',
    keywords: ['후쿠오카', '유후인', '벳푸', '하카타', '일본', 'fukuoka', 'japan'],
  },
  {
    id: 'sapporo',
    name: '삿포로 / 홋카이도',
    country: '일본',
    flag: '🇯🇵',
    defaultTitle: '하얀 눈의 삿포로 설경 여행 ❄️',
    coverImage: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&auto=format&fit=crop',
    keywords: ['삿포로', '홋카이도', '오타루', '비에이', '일본', 'sapporo', 'hokkaido'],
  },
  {
    id: 'okinawa',
    name: '오키나와',
    country: '일본',
    flag: '🇯🇵',
    defaultTitle: '에메랄드빛 오키나와 드라이브 🚗',
    coverImage: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800&auto=format&fit=crop',
    keywords: ['오키나와', '나하', '휴양', '일본', 'okinawa'],
  },

  // 국내
  {
    id: 'jeju',
    name: '제주도',
    country: '대한민국',
    flag: '🇰🇷',
    defaultTitle: '푸른 바다 제주 드라이브 🍊',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
    keywords: ['제주', '제주도', '서귀포', '애월', '한국', 'jeju'],
  },
  {
    id: 'busan',
    name: '부산 / 해운대',
    country: '대한민국',
    flag: '🇰🇷',
    defaultTitle: '바다와 함께하는 부산 힐링 여행 🌊',
    coverImage: 'https://images.unsplash.com/photo-1627916607164-7b20241db935?w=800&auto=format&fit=crop',
    keywords: ['부산', '해운대', '광안리', '영도', '한국', 'busan'],
  },
  {
    id: 'gangneung',
    name: '강릉 / 속초',
    country: '대한민국',
    flag: '🇰🇷',
    defaultTitle: '동해 바다 & 카페 거리 강릉 여행 ☕',
    coverImage: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop',
    keywords: ['강릉', '속초', '양양', '동해', '강원도', '한국'],
  },
  {
    id: 'gyeongju',
    name: '경주',
    country: '대한민국',
    flag: '🇰🇷',
    defaultTitle: '천년고도 경주 야경 & 감성 투어 🌙',
    coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop',
    keywords: ['경주', '황리단길', '첨성대', '한국', 'gyeongju'],
  },

  // 동남아
  {
    id: 'danang',
    name: '다낭 / 호이안',
    country: '베트남',
    flag: '🇻🇳',
    defaultTitle: '가성비 최고 다낭 & 호이안 힐링 🏮',
    coverImage: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&auto=format&fit=crop',
    keywords: ['다낭', '호이안', '바나힐', '베트남', 'danang', 'vietnam'],
  },
  {
    id: 'nhatrang',
    name: '나트랑',
    country: '베트남',
    flag: '🇻🇳',
    defaultTitle: '푸른 해변 나트랑 리조트 바캉스 🍹',
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop',
    keywords: ['나트랑', '냐짱', '베트남', 'nhatrang'],
  },
  {
    id: 'bangkok',
    name: '방콕',
    country: '태국',
    flag: '🇹🇭',
    defaultTitle: '방콕 야시장 & 루프탑 바 🌴',
    coverImage: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&auto=format&fit=crop',
    keywords: ['방콕', '카오산', '태국', 'bangkok', 'thailand'],
  },
  {
    id: 'bali',
    name: '발리 / 우붓',
    country: '인도네시아',
    flag: '🇮🇩',
    defaultTitle: '신들의 섬 발리 자연 & 요가 여행 🧘',
    coverImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&auto=format&fit=crop',
    keywords: ['발리', '우붓', '스미냑', '인도네시아', 'bali', 'indonesia'],
  },
  {
    id: 'singapore',
    name: '싱가포르',
    country: '싱가포르',
    flag: '🇸🇬',
    defaultTitle: '마리나베이 싱가포르 시티 투어 ✨',
    coverImage: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&auto=format&fit=crop',
    keywords: ['싱가포르', '마리나베이', '센토사', 'singapore'],
  },
  {
    id: 'taipei',
    name: '타이베이',
    country: '대만',
    flag: '🇹🇼',
    defaultTitle: '지우펀 & 타이베이 미식 기행 🥟',
    coverImage: 'https://images.unsplash.com/photo-1508248467877-aec1b08de376?w=800&auto=format&fit=crop',
    keywords: ['타이베이', '대만', '타이완', '지우펀', 'taipei', 'taiwan'],
  },

  // 유럽 & 미주
  {
    id: 'paris',
    name: '파리',
    country: '프랑스',
    flag: '🇫🇷',
    defaultTitle: '로맨틱 파리 예술 기행 🥐',
    coverImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop',
    keywords: ['파리', '프랑스', '에펠탑', '루브르', 'paris', 'france'],
  },
  {
    id: 'london',
    name: '런던',
    country: '영국',
    flag: '🇬🇧',
    defaultTitle: '클래식 런던 뮤지컬 & 펍 투어 💂',
    coverImage: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&auto=format&fit=crop',
    keywords: ['런던', '영국', '빅벤', 'london', 'uk'],
  },
  {
    id: 'rome',
    name: '로마 / 피렌체',
    country: '이탈리아',
    flag: '🇮🇹',
    defaultTitle: '이탈리아 역사 & 파스타 투어 🍝',
    coverImage: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&auto=format&fit=crop',
    keywords: ['로마', '피렌체', '이탈리아', '바티칸', 'rome', 'italy'],
  },
  {
    id: 'barcelona',
    name: '바르셀로나',
    country: '스페인',
    flag: '🇪🇸',
    defaultTitle: '가우디 건축 & 타파스 바르셀로나 🍷',
    coverImage: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&auto=format&fit=crop',
    keywords: ['바르셀로나', '스페인', '가우디', 'barcelona', 'spain'],
  },
  {
    id: 'hawaii',
    name: '하와이 / 오아후',
    country: '미국',
    flag: '🇺🇸',
    defaultTitle: '알로하! 와이키키 하와이 휴양 🌺',
    coverImage: 'https://images.unsplash.com/photo-1507876466758-bc54f38483c8?w=800&auto=format&fit=crop',
    keywords: ['하와이', '호놀룰루', '와이키키', '미국', 'hawaii'],
  },
  {
    id: 'newyork',
    name: '뉴욕 / 맨해튼',
    country: '미국',
    flag: '🇺🇸',
    defaultTitle: '뉴욕 맨해튼 브로드웨이 & 야경 🗽',
    coverImage: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&auto=format&fit=crop',
    keywords: ['뉴욕', '맨해튼', '타임스퀘어', '미국', 'newyork', 'nyc'],
  },
];

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
  const { createTrip } = useTripStore();

  const [selectedPreset, setSelectedPreset] = useState<DestinationItem>(POPULAR_DESTINATIONS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [destination, setDestination] = useState(POPULAR_DESTINATIONS[0].name);
  const [title, setTitle] = useState(POPULAR_DESTINATIONS[0].defaultTitle);

  // 날짜 선택 상태 및 캘린더 모달
  const [startDate, setStartDate] = useState('2026-12-01');
  const [endDate, setEndDate] = useState('2026-12-04');
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);

  const [memberInput, setMemberInput] = useState('나, 지은, 민혁');

  // 실시간 여행지 검색 필터링
  const filteredDestinations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return POPULAR_DESTINATIONS;
    return POPULAR_DESTINATIONS.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.country.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // 여행지 선택 핸들러
  const handleSelectDestination = (dest: DestinationItem) => {
    setSelectedPreset(dest);
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
      coverImage: selectedPreset.coverImage,
      memberNames: members.length > 0 ? members : ['나 (민지)', '수현'],
    });

    Alert.alert('새 여행 생성 완료! ✈️', `"${newTrip.title}" 일정이 추가되었습니다.`);
    onClose();
    if (onCreated) onCreated(newTrip.id);
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
      <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
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

              {/* 검색창 */}
              <View style={styles.searchBar}>
                <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="여행지 검색 (예: 도쿄, 제주도, 다낭, 파리...)"
                  placeholderTextColor="#94A3B8"
                  style={styles.searchInput}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <X size={16} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>

              {/* 검색어 직접 등록 버튼 (필터 결과가 없거나 커스텀 입력 시) */}
              {searchQuery.trim().length > 0 && (
                <TouchableOpacity
                  onPress={handleUseCustomDestination}
                  activeOpacity={0.8}
                  style={styles.customDestBanner}
                >
                  <Plus size={15} color="#FF6B6B" style={{ marginRight: 6 }} />
                  <Text style={styles.customDestText}>
                    '<Text style={{ fontWeight: '800' }}>{searchQuery.trim()}</Text>'(으)로 여행지 지정하기
                  </Text>
                </TouchableOpacity>
              )}

              {/* 여행지 가로 스크롤 카드 목록 */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.presetScroll}
                contentContainerStyle={{ paddingRight: 16 }}
              >
                {filteredDestinations.map((dest) => {
                  const isSelected = selectedPreset.id === dest.id || destination === dest.name;
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
                        {dest.flag} {dest.name.split('/')[0]}
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
