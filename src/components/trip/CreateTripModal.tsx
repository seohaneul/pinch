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
  Users,
  Check,
  Search,
  ChevronLeft,
  Plane,
  Hotel,
  Coins,
} from '@/components/common/CustomIcons';
import { useRouter } from 'expo-router';
import type { Trip, FlightInfo, LodgingInfo } from '../../types';
import { useTripStore } from '../../store/useTripStore';
import { useWalletStore } from '../../store/useWalletStore';
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
  editTrip?: Trip | null;
  isOnboarding?: boolean;
  initialStep?: 1 | 2 | 3 | 4;
}

export type DestinationItem = WorldwideDestination;
export const POPULAR_DESTINATIONS: DestinationItem[] = POPULAR_RECOMMENDED_DESTINATIONS;

const ORIGIN_AIRPORTS = ['인천 (ICN)', '김포 (GMP)', '김해/부산 (PUS)', '제주 (CJU)'];
const DEST_AIRPORTS = [
  '도쿄 나리타 (NRT)',
  '도쿄 하네다 (HND)',
  '오사카 간사이 (KIX)',
  '후쿠오카 (FUK)',
  '방콕 수완나품 (BKK)',
  '다낭 (DAD)',
  '괌 (GUM)',
  '파리 샤를드골 (CDG)',
];

const CURRENCY_OPTIONS: { code: 'JPY' | 'USD' | 'EUR' | 'KRW'; label: string; symbol: string }[] = [
  { code: 'JPY', label: '일본 엔화', symbol: '¥ JPY' },
  { code: 'USD', label: '미국 달러', symbol: '$ USD' },
  { code: 'EUR', label: '유럽 유로', symbol: '€ EUR' },
  { code: 'KRW', label: '대한민국 원', symbol: '₩ KRW' },
];

export const CreateTripModal: React.FC<CreateTripModalProps> = ({
  visible,
  onClose,
  onCreated,
  editTrip = null,
  isOnboarding = false,
  initialStep = 1,
}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    createTrip,
    updateTrip,
    getTripFlight,
    setTripFlight,
    deleteTripFlight,
    getDayLodging,
    setRangeLodging,
    setHasCompletedOnboarding,
  } = useTripStore();
  const { setTripCurrency, getTripCurrency } = useWalletStore();

  const isEditMode = !!editTrip;

  // Step state: 1 (나라/도시), 2 (날짜), 3 (항공편 - 선택), 4 (숙소/동행자 - 선택)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(initialStep);

  // Step 1: 나라 / 도시 및 여행 제목
  const [selectedDestination, setSelectedDestination] = useState<WorldwideDestination>(
    POPULAR_RECOMMENDED_DESTINATIONS[0]
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WorldwideDestination[]>(
    POPULAR_RECOMMENDED_DESTINATIONS
  );
  const [isSearching, setIsSearching] = useState(false);
  const [destination, setDestination] = useState(POPULAR_RECOMMENDED_DESTINATIONS[0].name);
  const [title, setTitle] = useState(POPULAR_RECOMMENDED_DESTINATIONS[0].defaultTitle.replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣&·-]/g, '').trim());

  // Step 2: 날짜
  const [startDate, setStartDate] = useState('2026-12-01');
  const [endDate, setEndDate] = useState('2026-12-04');
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);

  // Step 3: 비행기 (나중에 설정 가능)
  const [skipFlight, setSkipFlight] = useState(false);
  const [depAirport, setDepAirport] = useState('인천 (ICN)');
  const [arrAirport, setArrAirport] = useState('도쿄 나리타 (NRT)');
  const [outFlightNumber, setOutFlightNumber] = useState('');
  const [outDepTime, setOutDepTime] = useState('10:00');
  const [outArrTime, setOutArrTime] = useState('12:30');
  const [retFlightNumber, setRetFlightNumber] = useState('');
  const [retDepTime, setRetDepTime] = useState('16:00');
  const [retArrTime, setRetArrTime] = useState('18:30');

  // Step 4: 숙소 & 동행자 & 통화 (나중에 설정 가능)
  const [lodgingName, setLodgingName] = useState('');
  const [lodgingAddress, setLodgingAddress] = useState('');
  const [memberInput, setMemberInput] = useState('나');
  const [currency, setCurrency] = useState<'JPY' | 'USD' | 'EUR' | 'KRW'>('JPY');

  // P형 맞춤 추천 코스 모달 상태
  const [createdTrip, setCreatedTrip] = useState<Trip | null>(null);
  const [showPStyleModal, setShowPStyleModal] = useState(false);

  // 모달 열릴 때 초기값 세팅 (생성 모드 vs 수정 모드)
  useEffect(() => {
    if (!visible) return;
    setStep(initialStep);

    if (editTrip) {
      setDestination(editTrip.destination || '');
      setTitle(editTrip.title || '');
      setStartDate(editTrip.startDate || '2026-12-01');
      setEndDate(editTrip.endDate || '2026-12-04');

      const matchedDest = POPULAR_RECOMMENDED_DESTINATIONS.find(
        (d) => d.name === editTrip.destination || editTrip.destination?.includes(d.name)
      );
      if (matchedDest) {
        setSelectedDestination(matchedDest);
      }

      const existingFlight = getTripFlight(editTrip.id);
      if (existingFlight?.outbound) {
        setSkipFlight(false);
        setDepAirport(existingFlight.outbound.departureAirport || '인천 (ICN)');
        setArrAirport(existingFlight.outbound.arrivalAirport || '도쿄 나리타 (NRT)');
        setOutFlightNumber(existingFlight.outbound.flightNumber || '');
        setOutDepTime(existingFlight.outbound.departureTime || '10:00');
        setOutArrTime(existingFlight.outbound.arrivalTime || '12:30');
        setRetFlightNumber(existingFlight.returnFlight?.flightNumber || '');
        setRetDepTime(existingFlight.returnFlight?.departureTime || '16:00');
        setRetArrTime(existingFlight.returnFlight?.arrivalTime || '18:30');
      } else {
        setSkipFlight(true);
        setOutFlightNumber('');
        setRetFlightNumber('');
      }

      const existingLodging = editTrip.lodging || getDayLodging(1);
      setLodgingName(existingLodging?.name || '');
      setLodgingAddress(existingLodging?.address || '');

      const memberNames =
        editTrip.members && editTrip.members.length > 0
          ? editTrip.members.map((m) => m.name).join(', ')
          : '나';
      setMemberInput(memberNames);

      const tripCur = editTrip.currency || getTripCurrency(editTrip.id) || 'JPY';
      setCurrency(tripCur);
    } else {
      const def = POPULAR_RECOMMENDED_DESTINATIONS[0];
      setSelectedDestination(def);
      setDestination(def.name);
      setTitle(`${def.name} 여행`);
      const today = new Date();
      const s = new Date(today.getTime() + 86400000 * 7);
      const e = new Date(today.getTime() + 86400000 * 10);
      setStartDate(s.toISOString().slice(0, 10));
      setEndDate(e.toISOString().slice(0, 10));
      setSkipFlight(false);
      setOutFlightNumber('');
      setRetFlightNumber('');
      setLodgingName('');
      setLodgingAddress('');
      setMemberInput('나');
      setCurrency('JPY');
    }
  }, [visible, editTrip?.id, initialStep]);

  // 실시간 전세계 도시 검색
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
      } catch {
        // ignore
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectDestination = (dest: WorldwideDestination) => {
    setSelectedDestination(dest);
    setDestination(dest.name);
    setTitle(`${dest.name} 여행`);
    if (dest.country.includes('일본')) {
      setCurrency('JPY');
      if (dest.name.includes('오사카') || dest.name.includes('교토')) {
        setArrAirport('오사카 간사이 (KIX)');
      } else if (dest.name.includes('후쿠오카')) {
        setArrAirport('후쿠오카 (FUK)');
      } else {
        setArrAirport('도쿄 나리타 (NRT)');
      }
    } else if (dest.country.includes('미국') || dest.name.includes('괌') || dest.name.includes('하와이')) {
      setCurrency('USD');
    } else if (dest.country.includes('프랑스') || dest.country.includes('유럽') || dest.country.includes('이탈리아')) {
      setCurrency('EUR');
    } else if (dest.country.includes('한국') || dest.name.includes('제주')) {
      setCurrency('KRW');
    }
  };

  const handleUseCustomDestination = () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    setDestination(trimmed);
    setTitle(`${trimmed} 여행`);
  };

  const applyQuickDuration = (nights: number) => {
    try {
      const s = new Date(startDate);
      const e = new Date(s.getTime() + nights * 86400000);
      setEndDate(e.toISOString().slice(0, 10));
    } catch {
      // ignore
    }
  };

  const durationSummary = useMemo(() => {
    try {
      const s = new Date(startDate);
      const e = new Date(endDate);
      const diffDays = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return '당일치기';
      if (diffDays > 0) return `${diffDays}박 ${diffDays + 1}일`;
      return '';
    } catch {
      return '';
    }
  }, [startDate, endDate]);

  const totalDaysCount = useMemo(() => {
    try {
      const s = new Date(startDate);
      const e = new Date(endDate);
      return Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
    } catch {
      return 1;
    }
  }, [startDate, endDate]);

  const handleNextStep = () => {
    if (step === 1) {
      if (!destination.trim()) {
        Alert.alert('알림', '여행할 나라 또는 도시를 선택해주세요.');
        return;
      }
      if (!title.trim()) {
        setTitle(`${destination.trim()} 여행`);
      }
      setStep(2);
    } else if (step === 2) {
      if (new Date(startDate) > new Date(endDate)) {
        Alert.alert('알림', '도착일은 출발일 이후여야 합니다.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else {
      handleFinalSubmit();
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
    } else if (!isOnboarding) {
      onClose();
    }
  };

  const saveFlightAndLodgingForTrip = (targetTripId: string, tStart: string, tEnd: string, daysCount: number) => {
    // 1. 항공편 저장 (입력된 경우)
    const hasFlightInput =
      !skipFlight && (outFlightNumber.trim().length > 0 || depAirport.trim().length > 0);
    if (hasFlightInput && outFlightNumber.trim().length > 0) {
      const flightObj: FlightInfo = {
        outbound: {
          flightNumber: outFlightNumber.trim() || '항공편',
          departureAirport: depAirport.trim() || '인천 (ICN)',
          departureDate: tStart,
          departureTime: outDepTime.trim() || '10:00',
          arrivalAirport: arrAirport.trim() || `${destination} 공항`,
          arrivalDate: tStart,
          arrivalTime: outArrTime.trim() || '12:30',
          bufferMinutes: 90,
        },
        returnFlight: retFlightNumber.trim()
          ? {
              flightNumber: retFlightNumber.trim(),
              departureAirport: arrAirport.trim() || `${destination} 공항`,
              departureDate: tEnd,
              departureTime: retDepTime.trim() || '16:00',
              arrivalAirport: depAirport.trim() || '인천 (ICN)',
              arrivalDate: tEnd,
              arrivalTime: retArrTime.trim() || '18:30',
            }
          : undefined,
        autoAddToSchedule: true,
      };
      setTripFlight(targetTripId, flightObj);
    } else if (isEditMode && skipFlight) {
      deleteTripFlight(targetTripId);
    }

    // 2. 숙소 저장 (입력된 경우)
    if (lodgingName.trim()) {
      const lodgingObj: LodgingInfo = {
        id: `lodging_${targetTripId}`,
        trip_id: targetTripId,
        name: lodgingName.trim(),
        address: lodgingAddress.trim() || destination.trim(),
        startDate: tStart,
        endDate: tEnd,
        stayNights: Math.max(1, daysCount - 1),
        startDay: 1,
        endDay: daysCount,
        checkInTime: '15:00',
        checkOutTime: '11:00',
        latitude: selectedDestination.latitude,
        longitude: selectedDestination.longitude,
      };
      setRangeLodging(targetTripId, lodgingObj, 1, daysCount);
      updateTrip(targetTripId, { lodging: lodgingObj });
    }

    // 3. 통화 저장
    setTripCurrency(targetTripId, currency);
  };

  const handleFinalSubmit = () => {
    const cleanDest = destination.trim() || '도쿄';
    const cleanTitle = title.trim() || `${cleanDest} 여행`;
    const members = memberInput
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);
    const finalMembers = members.length > 0 ? members : ['나'];

    if (isEditMode && editTrip) {
      const updatedMembers = finalMembers.map((name, idx) => ({
        id: editTrip.members?.[idx]?.id || `m_${Date.now()}_${idx}`,
        name,
        color: ['#1B2A4A', '#2B50AA', '#3B82F6', '#6366F1', '#0D9488'][idx % 5],
      }));

      updateTrip(editTrip.id, {
        title: cleanTitle,
        destination: cleanDest,
        startDate,
        endDate,
        coverImage:
          selectedDestination.name === cleanDest
            ? selectedDestination.coverImage
            : editTrip.coverImage,
        members: updatedMembers,
        currency,
        centerLat:
          selectedDestination.name === cleanDest
            ? selectedDestination.latitude
            : editTrip.centerLat,
        centerLng:
          selectedDestination.name === cleanDest
            ? selectedDestination.longitude
            : editTrip.centerLng,
      });

      saveFlightAndLodgingForTrip(editTrip.id, startDate, endDate, totalDaysCount);
      setHasCompletedOnboarding(true);
      onClose();
      if (onCreated) onCreated(editTrip.id);
      return;
    }

    // 신규 여행 생성
    const newTrip = createTrip({
      title: cleanTitle,
      destination: cleanDest,
      startDate,
      endDate,
      budget: 0,
      coverImage: selectedDestination.coverImage,
      memberNames: finalMembers,
      centerLat: selectedDestination.latitude,
      centerLng: selectedDestination.longitude,
      currency,
    });

    saveFlightAndLodgingForTrip(newTrip.id, startDate, endDate, totalDaysCount);
    setHasCompletedOnboarding(true);

    setCreatedTrip(newTrip);
    setShowPStyleModal(true);
  };

  const handlePStyleClose = () => {
    const tripId = createdTrip?.id;
    setShowPStyleModal(false);
    setCreatedTrip(null);
    onClose();
    if (tripId && onCreated) onCreated(tripId);
  };

  const handlePStyleCompleted = () => {
    const tripId = createdTrip?.id;
    setShowPStyleModal(false);
    setCreatedTrip(null);
    onClose();
    if (tripId && onCreated) onCreated(tripId);
    router.push('/(tabs)/planner');
  };

  return (
    <>
      <Modal
        visible={visible && !showPStyleModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          if (!isOnboarding) onClose();
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[
            styles.screenContainer,
            { paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          {/* Top Navigation Bar (Reference Image 3 Style) */}
          <View style={styles.topBar}>
            <View style={styles.topBarLeft}>
              {step > 1 ? (
                <TouchableOpacity onPress={handlePrevStep} style={styles.iconBtn} activeOpacity={0.7}>
                  <ChevronLeft size={24} color="#111827" />
                </TouchableOpacity>
              ) : !isOnboarding ? (
                <TouchableOpacity onPress={onClose} style={styles.iconBtn} activeOpacity={0.7}>
                  <X size={22} color="#111827" />
                </TouchableOpacity>
              ) : (
                <View style={styles.onboardingBadge}>
                  <Text style={styles.onboardingBadgeText}>첫 여행 시작하기</Text>
                </View>
              )}
            </View>

            <View style={styles.topBarRight}>
              {step === 3 && (
                <TouchableOpacity
                  onPress={() => {
                    setSkipFlight(true);
                    setStep(4);
                  }}
                  style={styles.skipTextBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.skipTextBtnLabel}>나중에 설정</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleNextStep}
                activeOpacity={0.85}
                style={styles.nextPillBtn}
              >
                <Text style={styles.nextPillBtnText}>
                  {step < 4 ? '다음' : isEditMode ? '저장' : '완료'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Thin Step Progress Bar (Reference Image 3 Style) */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(step / 4) * 100}%` }]} />
          </View>

          {/* Step Quick Tabs (Always clickable in Edit Mode, or step indicator in Create Mode) */}
          <View style={styles.stepTabsRow}>
            {[
              { num: 1, label: '1. 여행지' },
              { num: 2, label: '2. 날짜' },
              { num: 3, label: '3. 항공편' },
              { num: 4, label: '4. 숙소·멤버' },
            ].map((item) => {
              const active = step === item.num;
              const passed = step > item.num;
              return (
                <TouchableOpacity
                  key={item.num}
                  activeOpacity={0.75}
                  onPress={() => setStep(item.num as 1 | 2 | 3 | 4)}
                  style={[
                    styles.stepTabChip,
                    active && styles.stepTabChipActive,
                    passed && !active && styles.stepTabChipPassed,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepTabChipText,
                      active && styles.stepTabChipTextActive,
                      passed && !active && styles.stepTabChipTextPassed,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={styles.bodyScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ==================== STEP 1: 나라 / 도시 선택 ==================== */}
            {step === 1 && (
              <View style={styles.stepSection}>
                <Text style={styles.stepTitle}>
                  {isEditMode ? '여행지와 제목 수정' : '어디로 떠나시나요?'}
                </Text>
                <Text style={styles.stepSubtitle}>
                  여행할 국가나 도시를 선택하고{'\n'}나만의 여행 이름을 입력해보세요.
                </Text>

                {/* 중심 입력 영역: 선택된 여행지 및 여행 제목 */}
                <View style={styles.centerFocusBox}>
                  <Text style={styles.fieldMiniLabel}>선택한 여행지</Text>
                  <Text style={styles.bigDestinationDisplay}>
                    {destination || '도시를 선택해주세요'}
                  </Text>

                  <Text style={[styles.fieldMiniLabel, { marginTop: 20 }]}>여행 이름</Text>
                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="예: 도쿄 3박 4일 미식 여행"
                    placeholderTextColor="#CBD5E1"
                    style={styles.underlineCenterInput}
                  />
                </View>

                {/* 도시 검색창 */}
                <View style={styles.searchBox}>
                  <Search size={18} color="#64748B" />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="국가 또는 도시 검색 (예: 도쿄, 오사카, 방콕, 파리, 제주)"
                    placeholderTextColor="#94A3B8"
                    style={styles.searchBoxInput}
                    returnKeyType="search"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <X size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>

                {searchQuery.trim().length > 0 && (
                  <TouchableOpacity
                    onPress={handleUseCustomDestination}
                    style={styles.customCityBanner}
                    activeOpacity={0.8}
                  >
                    <MapPin size={15} color="#1B2A4A" />
                    <Text style={styles.customCityBannerText}>
                      "{searchQuery.trim()}" 직접 여행지로 설정하기
                    </Text>
                  </TouchableOpacity>
                )}

                <Text style={styles.subSectionLabel}>
                  {searchQuery.trim() ? '검색 결과' : '인기 여행지'}
                </Text>

                {isSearching ? (
                  <View style={styles.loadingWrap}>
                    <ActivityIndicator size="small" color="#1B2A4A" />
                  </View>
                ) : (
                  <View style={styles.cityGrid}>
                    {searchResults.slice(0, 12).map((dest) => {
                      const isSelected = destination === dest.name;
                      return (
                        <TouchableOpacity
                          key={dest.id}
                          activeOpacity={0.85}
                          onPress={() => handleSelectDestination(dest)}
                          style={[styles.cityChipCard, isSelected && styles.cityChipCardActive]}
                        >
                          <Image
                            source={{ uri: dest.coverImage }}
                            style={styles.cityChipThumb}
                          />
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.cityChipName,
                                isSelected && styles.cityChipNameActive,
                              ]}
                              numberOfLines={1}
                            >
                              {dest.name}
                            </Text>
                            <Text style={styles.cityChipCountry} numberOfLines={1}>
                              {dest.country}
                            </Text>
                          </View>
                          {isSelected && (
                            <View style={styles.cityCheckCircle}>
                              <Check size={12} color="#FFFFFF" strokeWidth={2.5} />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* ==================== STEP 2: 날짜 선택 ==================== */}
            {step === 2 && (
              <View style={styles.stepSection}>
                <Text style={styles.stepTitle}>언제 떠나시나요?</Text>
                <Text style={styles.stepSubtitle}>
                  출발일과 도착일을 선택하면{'\n'}일자별 동선 플래너가 자동으로 만들어집니다.
                </Text>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setIsCalendarVisible(true)}
                  style={styles.dateHeroCard}
                >
                  <View style={styles.dateDurationBadge}>
                    <Text style={styles.dateDurationBadgeText}>
                      {durationSummary || '일정 선택'}
                    </Text>
                  </View>

                  <View style={styles.dateRangeRow}>
                    <View style={styles.dateCol}>
                      <Text style={styles.dateColLabel}>출발일</Text>
                      <Text style={styles.dateColValue}>{startDate.replace(/-/g, '.')}</Text>
                    </View>
                    <View style={styles.dateDividerLine} />
                    <View style={styles.dateCol}>
                      <Text style={styles.dateColLabel}>도착일</Text>
                      <Text style={styles.dateColValue}>{endDate.replace(/-/g, '.')}</Text>
                    </View>
                  </View>

                  <View style={styles.openCalendarBtn}>
                    <CalendarIcon size={16} color="#1B2A4A" />
                    <Text style={styles.openCalendarBtnText}>달력에서 날짜 변경하기</Text>
                  </View>
                </TouchableOpacity>

                <Text style={styles.subSectionLabel}>빠른 기간 설정</Text>
                <View style={styles.quickDurationRow}>
                  {[
                    { label: '당일치기', nights: 0 },
                    { label: '1박 2일', nights: 1 },
                    { label: '2박 3일', nights: 2 },
                    { label: '3박 4일', nights: 3 },
                    { label: '4박 5일', nights: 4 },
                    { label: '6박 7일', nights: 6 },
                  ].map((item) => {
                    const currentNights = Math.max(0, totalDaysCount - 1);
                    const active = currentNights === item.nights;
                    return (
                      <TouchableOpacity
                        key={item.label}
                        onPress={() => applyQuickDuration(item.nights)}
                        style={[
                          styles.quickDurationChip,
                          active && styles.quickDurationChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.quickDurationChipText,
                            active && styles.quickDurationChipTextActive,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.helperFootnote}>
                  여행 중에도 언제든 날짜를 늘리거나 수정할 수 있습니다.
                </Text>
              </View>
            )}

            {/* ==================== STEP 3: 비행기 설정 (나중에 가능) ==================== */}
            {step === 3 && (
              <View style={styles.stepSection}>
                <Text style={styles.stepTitle}>항공편이 정해지셨나요?</Text>
                <Text style={styles.stepSubtitle}>
                  항공편을 입력하면 첫날과 마지막 날 동선에 자동 반영됩니다.{'\n'}아직 예약 전이라면 건너뛰고 나중에 설정할 수 있어요.
                </Text>

                {/* 나중에 설정하기 / 지금 입력하기 선택 스위치 */}
                <View style={styles.choiceToggleRow}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setSkipFlight(false)}
                    style={[styles.choiceCard, !skipFlight && styles.choiceCardActive]}
                  >
                    <Plane size={18} color={!skipFlight ? '#1B2A4A' : '#94A3B8'} />
                    <Text
                      style={[styles.choiceCardText, !skipFlight && styles.choiceCardTextActive]}
                    >
                      지금 입력할게요
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setSkipFlight(true)}
                    style={[styles.choiceCard, skipFlight && styles.choiceCardActive]}
                  >
                    <Check size={18} color={skipFlight ? '#1B2A4A' : '#94A3B8'} />
                    <Text
                      style={[styles.choiceCardText, skipFlight && styles.choiceCardTextActive]}
                    >
                      나중에 설정할게요
                    </Text>
                  </TouchableOpacity>
                </View>

                {skipFlight ? (
                  <View style={styles.deferredInfoCard}>
                    <Plane size={28} color="#1B2A4A" />
                    <Text style={styles.deferredInfoTitle}>항공편은 나중에 등록해도 괜찮아요</Text>
                    <Text style={styles.deferredInfoDesc}>
                      홈 화면의 [항공편 등록] 카드나 일정 플래너에서 언제든지 항공편을 추가하고 동선에 연결할 수 있습니다.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.flightFormBox}>
                    <Text style={styles.formGroupTitle}>출발 공항</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ marginBottom: 14 }}
                    >
                      {ORIGIN_AIRPORTS.map((ap) => {
                        const active = depAirport === ap;
                        return (
                          <TouchableOpacity
                            key={ap}
                            onPress={() => setDepAirport(ap)}
                            style={[styles.airportChip, active && styles.airportChipActive]}
                          >
                            <Text
                              style={[
                                styles.airportChipText,
                                active && styles.airportChipTextActive,
                              ]}
                            >
                              {ap}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    <Text style={styles.formGroupTitle}>도착 공항</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ marginBottom: 14 }}
                    >
                      {DEST_AIRPORTS.map((ap) => {
                        const active = arrAirport === ap;
                        return (
                          <TouchableOpacity
                            key={ap}
                            onPress={() => setArrAirport(ap)}
                            style={[styles.airportChip, active && styles.airportChipActive]}
                          >
                            <Text
                              style={[
                                styles.airportChipText,
                                active && styles.airportChipTextActive,
                              ]}
                            >
                              {ap}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    <View style={styles.formRow}>
                      <View style={{ flex: 1.2 }}>
                        <Text style={styles.inputLabel}>출국 편명 (선택)</Text>
                        <TextInput
                          value={outFlightNumber}
                          onChangeText={setOutFlightNumber}
                          placeholder="예: KE703"
                          placeholderTextColor="#94A3B8"
                          style={styles.cleanInput}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>출발 시간</Text>
                        <TextInput
                          value={outDepTime}
                          onChangeText={setOutDepTime}
                          placeholder="10:00"
                          placeholderTextColor="#94A3B8"
                          style={styles.cleanInput}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>도착 시간</Text>
                        <TextInput
                          value={outArrTime}
                          onChangeText={setOutArrTime}
                          placeholder="12:30"
                          placeholderTextColor="#94A3B8"
                          style={styles.cleanInput}
                        />
                      </View>
                    </View>

                    <View style={[styles.formRow, { marginTop: 12 }]}>
                      <View style={{ flex: 1.2 }}>
                        <Text style={styles.inputLabel}>귀국 편명 (선택)</Text>
                        <TextInput
                          value={retFlightNumber}
                          onChangeText={setRetFlightNumber}
                          placeholder="예: KE704"
                          placeholderTextColor="#94A3B8"
                          style={styles.cleanInput}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>출발 시간</Text>
                        <TextInput
                          value={retDepTime}
                          onChangeText={setRetDepTime}
                          placeholder="16:00"
                          placeholderTextColor="#94A3B8"
                          style={styles.cleanInput}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>도착 시간</Text>
                        <TextInput
                          value={retArrTime}
                          onChangeText={setRetArrTime}
                          placeholder="18:30"
                          placeholderTextColor="#94A3B8"
                          style={styles.cleanInput}
                        />
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* ==================== STEP 4: 숙소 & 동행자 설정 ==================== */}
            {step === 4 && (
              <View style={styles.stepSection}>
                <Text style={styles.stepTitle}>숙소와 동행자를 설정할까요?</Text>
                <Text style={styles.stepSubtitle}>
                  머무는 숙소와 함께 가는 멤버, 기준 통화를 설정해주세요.{'\n'}비워두면 나중에 홈에서 언제든 등록할 수 있습니다.
                </Text>

                <View style={styles.formCard}>
                  <View style={styles.formCardHeader}>
                    <Hotel size={18} color="#1B2A4A" />
                    <Text style={styles.formCardHeaderTitle}>숙소 정보 (나중에 설정 가능)</Text>
                  </View>
                  <TextInput
                    value={lodgingName}
                    onChangeText={setLodgingName}
                    placeholder="숙소 이름 (예: 신주쿠 그레이서리 호텔)"
                    placeholderTextColor="#94A3B8"
                    style={styles.cleanInput}
                  />
                  <TextInput
                    value={lodgingAddress}
                    onChangeText={setLodgingAddress}
                    placeholder="숙소 지역 또는 주소 (선택)"
                    placeholderTextColor="#94A3B8"
                    style={[styles.cleanInput, { marginTop: 8 }]}
                  />
                </View>

                <View style={styles.formCard}>
                  <View style={styles.formCardHeader}>
                    <Users size={18} color="#1B2A4A" />
                    <Text style={styles.formCardHeaderTitle}>함께 가는 멤버 (정산 연동)</Text>
                  </View>
                  <TextInput
                    value={memberInput}
                    onChangeText={setMemberInput}
                    placeholder="쉼표(,)로 구분해 입력 (예: 나, 지은, 민혁)"
                    placeholderTextColor="#94A3B8"
                    style={styles.cleanInput}
                  />
                </View>

                <View style={styles.formCard}>
                  <View style={styles.formCardHeader}>
                    <Coins size={18} color="#1B2A4A" />
                    <Text style={styles.formCardHeaderTitle}>현지 기준 통화</Text>
                  </View>
                  <View style={styles.currencyRow}>
                    {CURRENCY_OPTIONS.map((c) => {
                      const active = currency === c.code;
                      return (
                        <TouchableOpacity
                          key={c.code}
                          onPress={() => setCurrency(c.code)}
                          style={[styles.currencyChip, active && styles.currencyChipActive]}
                        >
                          <Text
                            style={[
                              styles.currencyChipCode,
                              active && styles.currencyChipCodeActive,
                            ]}
                          >
                            {c.symbol}
                          </Text>
                          <Text
                            style={[
                              styles.currencyChipLabel,
                              active && styles.currencyChipLabelActive,
                            ]}
                          >
                            {c.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Bottom Full-Width CTA */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleNextStep}
              style={styles.bottomPrimaryBtn}
            >
              <Text style={styles.bottomPrimaryBtnText}>
                {step < 4
                  ? `다음 단계로 (${step}/4)`
                  : isEditMode
                    ? '여행 정보 수정 완료'
                    : '여행 시작하기'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 날짜 선택 달력 모달 */}
      <CalendarRangePicker
        visible={isCalendarVisible}
        onClose={() => setIsCalendarVisible(false)}
        initialStartDate={startDate}
        initialEndDate={endDate}
        onConfirm={(start, end) => {
          setStartDate(start);
          setEndDate(end);
        }}
      />

      {/* P형 맞춤 코스 모달 (신규 여행 생성 직후) */}
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
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  onboardingBadge: {
    backgroundColor: '#EEF2F8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  onboardingBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1B2A4A',
  },
  skipTextBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  skipTextBtnLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  nextPillBtn: {
    backgroundColor: '#1B2A4A',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  nextPillBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1B2A4A',
  },
  stepTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 6,
  },
  stepTabChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  stepTabChipActive: {
    backgroundColor: '#EEF2F8',
    borderColor: '#1B2A4A',
  },
  stepTabChipPassed: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  stepTabChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  stepTabChipTextActive: {
    color: '#1B2A4A',
    fontWeight: '800',
  },
  stepTabChipTextPassed: {
    color: '#475569',
  },
  bodyScroll: {
    flex: 1,
  },
  bodyScrollContent: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 32,
  },
  stepSection: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  stepSubtitle: {
    fontSize: 13.5,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 26,
  },
  centerFocusBox: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  fieldMiniLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  bigDestinationDisplay: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1B2A4A',
  },
  underlineCenterInput: {
    width: '90%',
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: '#1B2A4A',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 12,
  },
  searchBoxInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    marginLeft: 8,
  },
  customCityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2F8',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    marginBottom: 14,
    gap: 8,
  },
  customCityBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B2A4A',
  },
  subSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 10,
    marginTop: 6,
  },
  loadingWrap: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  cityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  cityChipCard: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginBottom: 4,
  },
  cityChipCardActive: {
    borderColor: '#1B2A4A',
    backgroundColor: '#EEF2F8',
  },
  cityChipThumb: {
    width: 40,
    height: 40,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: '#E2E8F0',
  },
  cityChipName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111827',
  },
  cityChipNameActive: {
    color: '#1B2A4A',
    fontWeight: '800',
  },
  cityChipCountry: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  cityCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1B2A4A',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  dateHeroCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1.5,
    borderColor: '#1B2A4A',
    alignItems: 'center',
    marginBottom: 22,
  },
  dateDurationBadge: {
    backgroundColor: '#1B2A4A',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    marginBottom: 16,
  },
  dateDurationBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  dateRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 18,
  },
  dateCol: {
    flex: 1,
    alignItems: 'center',
  },
  dateColLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '600',
  },
  dateColValue: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
  },
  dateDividerLine: {
    width: 1,
    height: 36,
    backgroundColor: '#CBD5E1',
  },
  openCalendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  openCalendarBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B2A4A',
  },
  quickDurationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  quickDurationChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickDurationChipActive: {
    backgroundColor: '#1B2A4A',
    borderColor: '#1B2A4A',
  },
  quickDurationChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  quickDurationChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  helperFootnote: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 12,
  },
  choiceToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  choiceCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  choiceCardActive: {
    borderColor: '#1B2A4A',
    backgroundColor: '#EEF2F8',
  },
  choiceCardText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#64748B',
  },
  choiceCardTextActive: {
    color: '#1B2A4A',
  },
  deferredInfoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  deferredInfoTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginTop: 12,
    marginBottom: 6,
  },
  deferredInfoDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
  },
  flightFormBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formGroupTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  airportChip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginRight: 8,
  },
  airportChipActive: {
    backgroundColor: '#1B2A4A',
    borderColor: '#1B2A4A',
  },
  airportChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  airportChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  formRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 5,
  },
  cleanInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13.5,
    color: '#111827',
  },
  formCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  formCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  formCardHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  currencyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  currencyChip: {
    width: '48%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  currencyChipActive: {
    backgroundColor: '#1B2A4A',
    borderColor: '#1B2A4A',
  },
  currencyChipCode: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  currencyChipCodeActive: {
    color: '#FFFFFF',
  },
  currencyChipLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  currencyChipLabelActive: {
    color: '#CBD5E1',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  bottomPrimaryBtn: {
    backgroundColor: '#1B2A4A',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
