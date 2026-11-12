import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Calendar,
  MapPin,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plane,
  Hotel,
  Check,
  Sparkles,
  Plus,
  Trash2,
  Bookmark,
  Coins,
} from '@/components/common/CustomIcons';
import { useTripStore } from '../../store/useTripStore';
import { useWalletStore } from '../../store/useWalletStore';
import { CalendarRangePicker } from '../common/CalendarRangePicker';
import {
  searchDestination,
  type DestinationCandidate,
} from '../../services/destinationSearchService';
import {
  searchAirports,
  KOREAN_DEPARTURE_AIRPORTS,
  getRecommendedAirportsForDestination,
  type AirportItem,
} from '../../services/airportService';
import {
  getFlightsForRoute,
  findPairedReturnFlight,
  type RealFlightSchedule,
} from '../../services/flightSearchService';
import { PlaceSearchModal } from '../places/PlaceSearchModal';
import {
  formatTimeInput,
  resolveCurrencyByDestination,
  getCurrencyDisplayInfo,
} from '../../utils/formatUtils';
import type { Trip, FlightInfo, LodgingInfo } from '../../types';

interface CreateTripModalProps {
  visible: boolean;
  isOnboarding?: boolean;
  editTrip?: Trip | null;
  initialStep?: 1 | 2 | 3 | 4;
  onClose: () => void;
  onCreated?: (trip: Trip) => void;
}

interface DestinationTreeGroup {
  country: string;
  summary: string;
  cities: Array<{
    name: string;
    lat: number;
    lng: number;
  }>;
}

const POPULAR_DESTINATION_TREE: DestinationTreeGroup[] = [
  {
    country: '일본',
    summary: '후쿠오카, 도쿄, 오사카, 교토, 삿포로',
    cities: [
      { name: '후쿠오카', lat: 33.5902, lng: 130.4017 },
      { name: '도쿄', lat: 35.6762, lng: 139.6503 },
      { name: '오사카', lat: 34.6937, lng: 135.5023 },
      { name: '교토', lat: 35.0116, lng: 135.7681 },
      { name: '삿포로', lat: 43.0618, lng: 141.3545 },
      { name: '오키나와', lat: 26.2124, lng: 127.6809 },
      { name: '나고야', lat: 35.1815, lng: 136.9066 },
    ],
  },
  {
    country: '베트남',
    summary: '다낭, 하노이, 나트랑, 푸꾸옥, 호이안',
    cities: [
      { name: '다낭', lat: 16.0544, lng: 108.2022 },
      { name: '하노이', lat: 21.0285, lng: 105.8542 },
      { name: '나트랑', lat: 12.2388, lng: 109.1967 },
      { name: '푸꾸옥', lat: 10.2899, lng: 103.984 },
      { name: '호이안', lat: 15.8801, lng: 108.338 },
    ],
  },
  {
    country: '태국 · 동남아',
    summary: '방콕, 치앙마이, 푸켓, 싱가포르, 발리',
    cities: [
      { name: '방콕', lat: 13.7563, lng: 100.5018 },
      { name: '치앙마이', lat: 18.7883, lng: 98.9853 },
      { name: '푸켓', lat: 7.8804, lng: 98.3923 },
      { name: '싱가포르', lat: 1.3521, lng: 103.8198 },
      { name: '발리', lat: -8.4095, lng: 115.1889 },
      { name: '세부', lat: 10.3157, lng: 123.8854 },
    ],
  },
  {
    country: '대만 · 홍콩 · 마카오',
    summary: '타이베이, 가오슝, 홍콩, 마카오',
    cities: [
      { name: '타이베이', lat: 25.033, lng: 121.5654 },
      { name: '가오슝', lat: 22.6273, lng: 120.3014 },
      { name: '홍콩', lat: 22.3193, lng: 114.1694 },
      { name: '마카오', lat: 22.1987, lng: 113.5439 },
    ],
  },
  {
    country: '대한민국',
    summary: '제주도, 부산, 강릉, 경주, 여수, 서울',
    cities: [
      { name: '제주도', lat: 33.4996, lng: 126.5312 },
      { name: '부산', lat: 35.1796, lng: 129.0756 },
      { name: '강릉', lat: 37.7519, lng: 128.8761 },
      { name: '경주', lat: 35.8562, lng: 129.2247 },
      { name: '여수', lat: 34.7604, lng: 127.6622 },
      { name: '서울', lat: 37.5665, lng: 126.978 },
    ],
  },
  {
    country: '미주 · 남태평양',
    summary: '괌, 하와이, 시드니, 뉴욕, LA',
    cities: [
      { name: '괌', lat: 13.4443, lng: 144.7937 },
      { name: '하와이', lat: 21.3069, lng: -157.8583 },
      { name: '시드니', lat: -33.8688, lng: 151.2093 },
      { name: '뉴욕', lat: 40.7128, lng: -74.006 },
      { name: '로스앤젤레스', lat: 34.0522, lng: -118.2437 },
    ],
  },
  {
    country: '유럽',
    summary: '파리, 런던, 로마, 바르셀로나, 프라하',
    cities: [
      { name: '파리', lat: 48.8566, lng: 2.3522 },
      { name: '런던', lat: 51.5074, lng: -0.1278 },
      { name: '로마', lat: 41.9028, lng: 12.4964 },
      { name: '바르셀로나', lat: 41.3874, lng: 2.1686 },
      { name: '프라하', lat: 50.0755, lng: 14.4378 },
    ],
  },
];

const DATE_PRESETS = [
  { label: '당일치기', days: 0 },
  { label: '1박 2일', days: 1 },
  { label: '2박 3일', days: 2 },
  { label: '3박 4일', days: 3 },
  { label: '4박 5일', days: 4 },
];

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function addDaysStr(baseStr: string, daysToAdd: number): string {
  const parts = baseStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return baseStr;
  const d = new Date(parts[0], parts[1] - 1, parts[2] + daysToAdd);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildDaySchedulePreview(startStr: string, endStr: string) {
  const sParts = startStr.split('-').map(Number);
  const eParts = endStr.split('-').map(Number);
  if (sParts.length !== 3 || eParts.length !== 3) {
    return [{ dayNumber: 1, date: startStr, shortDate: startStr }];
  }
  const sDate = new Date(sParts[0], sParts[1] - 1, sParts[2]);
  const eDate = new Date(eParts[0], eParts[1] - 1, eParts[2]);
  const diffDays = Math.max(
    0,
    Math.min(30, Math.round((eDate.getTime() - sDate.getTime()) / 86400000))
  );
  const list: Array<{ dayNumber: number; date: string; shortDate: string }> = [];
  for (let i = 0; i <= diffDays; i++) {
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

export const CreateTripModal: React.FC<CreateTripModalProps> = ({
  visible,
  isOnboarding = false,
  editTrip = null,
  initialStep = 1,
  onClose,
  onCreated,
}) => {
  const insets = useSafeAreaInsets();
  const {
    createTrip,
    updateTrip,
    setTripFlight,
    setRangeLodging,
    clearTripLodgings,
    tripFlights,
    dayLodgings,
  } = useTripStore();
  const { setTripCurrency } = useWalletStore();

  const isEditMode = Boolean(editTrip);

  // step 0: 온보딩 앱 소개 화면 (isOnboarding && !isEditMode일 때 시작)
  // step 1: 여행지 (트리 + 다구간)
  // step 2: 일정 날짜 & 제목
  // step 3: 항공편 (출발/도착 공항 검색, +1일 설정)
  // step 4: 날짜별 숙소 설정
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(
    isOnboarding && !isEditMode ? 0 : 1
  );

  // Step 1: 여행지 & 다구간 상태
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [destinationInput, setDestinationInput] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<DestinationCandidate | null>(null);
  const [searchResults, setSearchResults] = useState<DestinationCandidate[]>([]);
  const [isSearchingDest, setIsSearchingDest] = useState(false);
  const [expandedCountries, setExpandedCountries] = useState<Record<string, boolean>>({
    일본: true,
    베트남: true,
    '태국 · 동남아': false,
    '대만 · 홍콩 · 마카오': false,
    대한민국: false,
    '미주 · 남태평양': false,
    유럽: false,
  });

  // Step 2: 날짜 & 제목 상태
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(getTodayStr());
  const [endDate, setEndDate] = useState(addDaysStr(getTodayStr(), 3));
  const [selectedPresetDays, setSelectedPresetDays] = useState<number | null>(3);
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);

  // Step 3: 항공편 (여행 날짜 확인 -> 출발 공항 선택 -> 도착 공항 선택 -> 노선별 전체 실제 운항편 리스트 -> 원터치 자동입력)
  const [flightTab, setFlightTab] = useState<'outbound' | 'inbound'>('outbound');
  const [outFlightSearchQuery, setOutFlightSearchQuery] = useState('');
  const [retFlightSearchQuery, setRetFlightSearchQuery] = useState('');
  const [outAirlineFilter, setOutAirlineFilter] = useState('전체');
  const [retAirlineFilter, setRetAirlineFilter] = useState('전체');
  const [outAirline, setOutAirline] = useState('');
  const [outDepAirport, setOutDepAirport] = useState('인천국제공항 (ICN)');
  const [outArrAirport, setOutArrAirport] = useState('');
  const [outDepTime, setOutDepTime] = useState('09:30');
  const [outArrTime, setOutArrTime] = useState('12:00');
  const [outArrivalNextDay, setOutArrivalNextDay] = useState(false);

  const [retAirline, setRetAirline] = useState('');
  const [retDepAirport, setRetDepAirport] = useState('');
  const [retArrAirport, setRetArrAirport] = useState('인천국제공항 (ICN)');
  const [retDepTime, setRetDepTime] = useState('15:00');
  const [retArrTime, setRetArrTime] = useState('17:40');
  const [retArrivalNextDay, setRetArrivalNextDay] = useState(false);

  // 공항 검색 활성 드롭다운 필드
  const [activeAirportField, setActiveAirportField] = useState<
    'outDep' | 'outArr' | 'retDep' | 'retArr' | null
  >(null);

  // Step 4: 숙소 날짜별 추가 상태
  const [lodgingList, setLodgingList] = useState<LodgingInfo[]>([]);
  const [lodgingStartDay, setLodgingStartDay] = useState<number>(1);
  const [lodgingEndDay, setLodgingEndDay] = useState<number>(2);
  const [lodgingName, setLodgingName] = useState('');
  const [lodgingAddress, setLodgingAddress] = useState('');
  const [lodgingCheckIn, setLodgingCheckIn] = useState('15:00');
  const [lodgingCheckOut, setLodgingCheckOut] = useState('11:00');
  const [lodgingCoords, setLodgingCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showLodgingSearchModal, setShowLodgingSearchModal] = useState(false);

  // 다구간 통합 여행지 문자열
  const combinedDestination = useMemo(() => {
    if (selectedCities.length > 0) {
      return selectedCities.join(' · ');
    }
    return destinationInput.trim();
  }, [selectedCities, destinationInput]);

  // 여행지에 따른 자동 현지 통화 계산
  const autoCurrency = useMemo(
    () => resolveCurrencyByDestination(combinedDestination || '도쿄'),
    [combinedDestination]
  );
  const currencyInfo = useMemo(() => getCurrencyDisplayInfo(autoCurrency), [autoCurrency]);

  // 일차별 날짜 배열
  const scheduleDaysPreview = useMemo(
    () => buildDaySchedulePreview(startDate, endDate),
    [startDate, endDate]
  );

  // 선택한 여행지에 맞는 추천 도착/출발 공항 칩
  const recommendedDestAirports = useMemo(
    () => getRecommendedAirportsForDestination(combinedDestination),
    [combinedDestination]
  );

  // Step 3: 출발 공항 + 도착 공항 선택 시 조회되는 전체 항공사 운항편 리스트
  const allOutboundRouteFlights = useMemo(
    () => getFlightsForRoute(outDepAirport, outArrAirport),
    [outDepAirport, outArrAirport]
  );

  const outboundAirlinesOnRoute = useMemo(() => {
    const set = new Set<string>();
    allOutboundRouteFlights.forEach((f) => set.add(f.airline));
    return ['전체', ...Array.from(set)];
  }, [allOutboundRouteFlights]);

  const outboundFlightCandidates = useMemo(
    () =>
      getFlightsForRoute(
        outDepAirport,
        outArrAirport,
        outFlightSearchQuery,
        outAirlineFilter
      ),
    [outDepAirport, outArrAirport, outFlightSearchQuery, outAirlineFilter]
  );

  const allReturnRouteFlights = useMemo(
    () => getFlightsForRoute(retDepAirport, retArrAirport),
    [retDepAirport, retArrAirport]
  );

  const returnAirlinesOnRoute = useMemo(() => {
    const set = new Set<string>();
    allReturnRouteFlights.forEach((f) => set.add(f.airline));
    return ['전체', ...Array.from(set)];
  }, [allReturnRouteFlights]);

  const returnFlightCandidates = useMemo(
    () =>
      getFlightsForRoute(
        retDepAirport,
        retArrAirport,
        retFlightSearchQuery,
        retAirlineFilter
      ),
    [retDepAirport, retArrAirport, retFlightSearchQuery, retAirlineFilter]
  );

  const handleSelectRealFlightInWizard = (
    leg: 'outbound' | 'inbound',
    flight: RealFlightSchedule
  ) => {
    setActiveAirportField(null);
    if (leg === 'outbound') {
      setOutAirline(`${flight.airline} ${flight.flightNumber}`);
      setOutDepAirport(flight.departureAirport);
      setOutArrAirport(flight.arrivalAirport);
      setOutDepTime(flight.departureTime);
      setOutArrTime(flight.arrivalTime);
      setOutArrivalNextDay(flight.arrivalNextDay);

      // 귀국편이 아직 비어있는 경우 왕복 짝꿍 귀국편도 자동으로 세팅
      const pairedReturn = findPairedReturnFlight(flight);
      if (pairedReturn && !retAirline.trim()) {
        setRetAirline(`${pairedReturn.airline} ${pairedReturn.flightNumber}`);
        setRetDepAirport(pairedReturn.departureAirport);
        setRetArrAirport(pairedReturn.arrivalAirport);
        setRetDepTime(pairedReturn.departureTime);
        setRetArrTime(pairedReturn.arrivalTime);
        setRetArrivalNextDay(pairedReturn.arrivalNextDay);
      } else if (!retDepAirport.trim()) {
        setRetDepAirport(flight.arrivalAirport);
        setRetArrAirport(flight.departureAirport);
      }
    } else {
      setRetAirline(`${flight.airline} ${flight.flightNumber}`);
      setRetDepAirport(flight.departureAirport);
      setRetArrAirport(flight.arrivalAirport);
      setRetDepTime(flight.departureTime);
      setRetArrTime(flight.arrivalTime);
      setRetArrivalNextDay(flight.arrivalNextDay);
    }
  };

  useEffect(() => {
    if (!visible) return;

    if (editTrip) {
      setStep(initialStep || 1);
      const cities =
        editTrip.destinations && editTrip.destinations.length > 0
          ? editTrip.destinations
          : editTrip.destination
            ? editTrip.destination
                .split(/[·,]/)
                .map((s) => s.trim())
                .filter(Boolean)
            : [];
      setSelectedCities(cities);
      setDestinationInput('');
      setTitle(editTrip.title || '');
      setStartDate(editTrip.startDate || getTodayStr());
      setEndDate(editTrip.endDate || addDaysStr(getTodayStr(), 3));
      setSelectedPresetDays(null);

      const existingFlight = tripFlights[editTrip.id];
      if (existingFlight) {
        setOutAirline(existingFlight.airline || '');
        setOutDepAirport(existingFlight.departureAirport || '인천국제공항 (ICN)');
        setOutArrAirport(existingFlight.arrivalAirport || '');
        setOutDepTime(existingFlight.departureTime || '09:30');
        setOutArrTime(existingFlight.arrivalTime || '12:00');
        setOutArrivalNextDay(Boolean(existingFlight.arrivalNextDay));

        if (existingFlight.returnFlight) {
          setRetAirline(existingFlight.returnFlight.airline || '');
          setRetDepAirport(existingFlight.returnFlight.departureAirport || '');
          setRetArrAirport(existingFlight.returnFlight.arrivalAirport || '인천국제공항 (ICN)');
          setRetDepTime(existingFlight.returnFlight.departureTime || '15:00');
          setRetArrTime(existingFlight.returnFlight.arrivalTime || '17:40');
          setRetArrivalNextDay(Boolean(existingFlight.returnFlight.arrivalNextDay));
        }
      }

      // 기존 날짜별 숙소 목록 복원
      const savedLodgingsMap = new Map<string, LodgingInfo>();
      const totalDays = editTrip.schedules?.length || 1;
      for (let d = 1; d <= totalDays; d++) {
        const l = dayLodgings[`${editTrip.id}_day_${d}`];
        if (l && l.name) {
          const key = `${l.name}_${l.startDay || d}_${l.endDay || d}`;
          if (!savedLodgingsMap.has(key)) {
            savedLodgingsMap.set(key, {
              ...l,
              startDay: l.startDay || d,
              endDay: l.endDay || d,
            });
          }
        }
      }
      setLodgingList(Array.from(savedLodgingsMap.values()));
    } else {
      setStep(isOnboarding ? 0 : initialStep || 1);
      setSelectedCities([]);
      setDestinationInput('');
      setSelectedCandidate(null);
      setTitle('');
      const today = getTodayStr();
      setStartDate(today);
      setEndDate(addDaysStr(today, 3));
      setSelectedPresetDays(3);
      setOutAirline('');
      setOutDepAirport('인천국제공항 (ICN)');
      setOutArrAirport('');
      setOutDepTime('09:30');
      setOutArrTime('12:00');
      setOutArrivalNextDay(false);
      setRetAirline('');
      setRetDepAirport('');
      setRetArrAirport('인천국제공항 (ICN)');
      setRetDepTime('15:00');
      setRetArrTime('17:40');
      setRetArrivalNextDay(false);
      setLodgingList([]);
      setLodgingStartDay(1);
      setLodgingEndDay(2);
      setLodgingName('');
      setLodgingAddress('');
    }
  }, [visible, editTrip?.id, isOnboarding]);

  // 여행지 검색 디바운스
  useEffect(() => {
    if (!visible) return;
    const trimmed = destinationInput.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearchingDest(false);
      return;
    }

    let isCancelled = false;
    setIsSearchingDest(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchDestination(trimmed);
        if (!isCancelled) {
          setSearchResults(res);
        }
      } finally {
        if (!isCancelled) setIsSearchingDest(false);
      }
    }, 220);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [destinationInput, visible]);

  // 도시 선택/해제 토글 (다구간 지원)
  const handleToggleCity = (cityName: string, lat?: number, lng?: number) => {
    setSelectedCities((prev) => {
      const exists = prev.includes(cityName);
      const next = exists ? prev.filter((c) => c !== cityName) : [...prev, cityName];
      return next;
    });
    if (lat && lng && !selectedCandidate) {
      setSelectedCandidate({
        id: `city_${cityName}`,
        name: cityName,
        country: '',
        countryCode: '',
        flag: '✈️',
        latitude: lat,
        longitude: lng,
        defaultTitle: `${cityName} 여행`,
        coverImage: '',
      });
    }
  };

  // 직접 입력한 도시 추가
  const handleAddCustomCity = () => {
    const clean = destinationInput.trim();
    if (!clean) return;
    if (!selectedCities.includes(clean)) {
      setSelectedCities((prev) => [...prev, clean]);
    }
    setDestinationInput('');
  };

  const handleSelectPreset = (days: number) => {
    setSelectedPresetDays(days);
    setEndDate(addDaysStr(startDate, days));
  };

  const handleGoNextFromStep1 = () => {
    const finalCities =
      selectedCities.length > 0
        ? selectedCities
        : destinationInput.trim()
          ? [destinationInput.trim()]
          : [];

    if (finalCities.length === 0) {
      Alert.alert('여행지 선택', '어디로 떠나시는지 최소 1곳 이상의 여행지를 선택해 주세요.');
      return;
    }

    if (selectedCities.length === 0 && destinationInput.trim()) {
      setSelectedCities([destinationInput.trim()]);
      setDestinationInput('');
    }

    const primaryCity = finalCities[0];
    if (!outArrAirport) {
      const matchedAirports = searchAirports(primaryCity);
      const matchedStr =
        matchedAirports.length > 0
          ? `${matchedAirports[0].nameKo} (${matchedAirports[0].code})`
          : `${primaryCity} 국제공항`;
      setOutArrAirport(matchedStr);
      if (!retDepAirport) setRetDepAirport(matchedStr);
    }
    setStep(2);
  };

  const handleGoNextFromStep2 = () => {
    if (!startDate) {
      Alert.alert('날짜 확인', '여행 시작일을 선택해 주세요.');
      return;
    }
    const maxDay = Math.max(1, scheduleDaysPreview.length);
    setLodgingStartDay(1);
    setLodgingEndDay(maxDay);
    setStep(3);
  };

  // 날짜별 숙소 항목 추가 핸들러
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
      address: lodgingAddress.trim() || `${combinedDestination} 숙소`,
      checkInTime: lodgingCheckIn.trim() || '15:00',
      checkOutTime: lodgingCheckOut.trim() || '11:00',
      latitude: lodgingCoords?.lat || selectedCandidate?.latitude || 35.6762,
      longitude: lodgingCoords?.lng || selectedCandidate?.longitude || 139.6503,
      startDay: sDay,
      endDay: eDay,
    };

    setLodgingList((prev) => [...prev, newItem]);
    setLodgingName('');
    setLodgingAddress('');
    setLodgingCoords(null);
  };

  const handleRemoveLodgingItem = (index: number) => {
    setLodgingList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleFinishWizard = (options?: { skipFlight?: boolean; skipLodging?: boolean }) => {
    const finalCities =
      selectedCities.length > 0
        ? selectedCities
        : destinationInput.trim()
          ? [destinationInput.trim()]
          : ['여행지'];
    const cleanDest = finalCities.join(' · ');
    const finalTitle = title.trim() || `${cleanDest} 여행`;

    let targetTrip: Trip;

    if (isEditMode && editTrip) {
      updateTrip(editTrip.id, {
        title: finalTitle,
        destination: cleanDest,
        destinations: finalCities,
        startDate,
        endDate: endDate || startDate,
        coverImage: '',
        centerLat: selectedCandidate?.latitude || editTrip.centerLat || 35.6762,
        centerLng: selectedCandidate?.longitude || editTrip.centerLng || 139.6503,
        currency: autoCurrency,
      });
      targetTrip = {
        ...editTrip,
        title: finalTitle,
        destination: cleanDest,
        destinations: finalCities,
        startDate,
        endDate: endDate || startDate,
        coverImage: '',
        currency: autoCurrency,
      };
    } else {
      targetTrip = createTrip({
        title: finalTitle,
        destination: cleanDest,
        destinations: finalCities,
        startDate,
        endDate: endDate || startDate,
        coverImage: '',
        centerLat: selectedCandidate?.latitude,
        centerLng: selectedCandidate?.longitude,
        currency: autoCurrency,
      });
    }

    // 1. 여행지 기준 현지 통화 자동 설정
    setTripCurrency(targetTrip.id, autoCurrency);

    // 2. 항공편 저장 (항공편은 일정 경로에 추가하지 않고 전용 항공권 정보로만 관리)
    if (!options?.skipFlight && (outDepAirport.trim() || outArrAirport.trim() || outAirline.trim())) {
      const outLeg = {
        airline: outAirline.trim() || '출발 항공편',
        flightNumber: outAirline.trim() || '출발편',
        departureAirport: outDepAirport.trim() || '인천 (ICN)',
        arrivalAirport: outArrAirport.trim() || `${finalCities[0]} 공항`,
        departureDate: startDate,
        departureTime: outDepTime.trim() || '09:30',
        arrivalDate: outArrivalNextDay ? addDaysStr(startDate, 1) : startDate,
        arrivalTime: outArrTime.trim() || '12:00',
        arrivalNextDay: outArrivalNextDay,
      };
      const retLeg = {
        airline: retAirline.trim() || outAirline.trim() || '귀국 항공편',
        flightNumber: retAirline.trim() || outAirline.trim() || '귀국편',
        departureAirport: retDepAirport.trim() || outArrAirport.trim() || `${finalCities[0]} 공항`,
        arrivalAirport: retArrAirport.trim() || '인천 (ICN)',
        departureDate: endDate || startDate,
        departureTime: retDepTime.trim() || '15:00',
        arrivalDate: retArrivalNextDay
          ? addDaysStr(endDate || startDate, 1)
          : endDate || startDate,
        arrivalTime: retArrTime.trim() || '17:40',
        arrivalNextDay: retArrivalNextDay,
      };
      const flightPayload: FlightInfo = {
        ...outLeg,
        outbound: outLeg,
        returnFlight: retLeg,
      };
      setTripFlight(targetTrip.id, flightPayload);
    }

    // 3. 날짜별 숙소 저장
    if (!options?.skipLodging) {
      const finalLodgings = [...lodgingList];
      if (lodgingName.trim()) {
        finalLodgings.push({
          name: lodgingName.trim(),
          address: lodgingAddress.trim() || `${cleanDest} 숙소`,
          checkInTime: lodgingCheckIn.trim() || '15:00',
          checkOutTime: lodgingCheckOut.trim() || '11:00',
          latitude: lodgingCoords?.lat || selectedCandidate?.latitude || 35.6762,
          longitude: lodgingCoords?.lng || selectedCandidate?.longitude || 139.6503,
          startDay: Math.min(lodgingStartDay, lodgingEndDay),
          endDay: Math.max(lodgingStartDay, lodgingEndDay),
        });
      }

      if (finalLodgings.length > 0) {
        clearTripLodgings(targetTrip.id);
        finalLodgings.forEach((item) => {
          const sDay = item.startDay || 1;
          const eDay = item.endDay || scheduleDaysPreview.length || 1;
          setRangeLodging(
            targetTrip.id,
            { ...item, startDay: sDay, endDay: eDay },
            sDay,
            eDay
          );
        });
      }
    }

    if (onCreated) onCreated(targetTrip);
    onClose();
  };

  const progressPercent =
    step === 0 ? '15%' : step === 1 ? '25%' : step === 2 ? '50%' : step === 3 ? '75%' : '100%';

  // 공항 검색 입력 + 빠른 공항 칩 + 드롭다운 렌더 헬퍼
  const renderAirportSearchField = (
    fieldKey: 'outDep' | 'outArr' | 'retDep' | 'retArr',
    label: string,
    value: string,
    onChange: (val: string) => void,
    placeholder: string,
    quickAirports: AirportItem[] = []
  ) => {
    const isFocused = activeAirportField === fieldKey;
    const airportCandidates: AirportItem[] = isFocused ? searchAirports(value) : [];

    return (
      <View style={styles.airportSearchContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={[styles.searchBox, isFocused && styles.searchBoxFocused]}>
          <Search size={15} color="#6B7280" style={{ marginRight: 8 }} />
          <TextInput
            value={value}
            onChangeText={(text) => {
              onChange(text);
              setActiveAirportField(fieldKey);
            }}
            onFocus={() => setActiveAirportField(fieldKey)}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
          />
          {value.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                onChange('');
                setActiveAirportField(fieldKey);
              }}
              style={{ padding: 4 }}
            >
              <X size={14} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* 빠른 공항 선택 칩 */}
        {quickAirports.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.quickAirportChipRow}
          >
            {quickAirports.map((ap) => {
              const formatted = `${ap.nameKo} (${ap.code})`;
              const isSelected = value.toUpperCase().includes(`(${ap.code})`);
              return (
                <TouchableOpacity
                  key={`${fieldKey}_${ap.code}`}
                  activeOpacity={0.8}
                  onPress={() => {
                    onChange(formatted);
                    setActiveAirportField(null);
                    if (fieldKey === 'outArr' && !retDepAirport.trim()) {
                      setRetDepAirport(formatted);
                    }
                    if (fieldKey === 'outDep' && !retArrAirport.trim()) {
                      setRetArrAirport(formatted);
                    }
                  }}
                  style={[
                    styles.quickAirportChip,
                    isSelected && styles.quickAirportChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.quickAirportChipText,
                      isSelected && styles.quickAirportChipTextActive,
                    ]}
                  >
                    {ap.city} ({ap.code})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {isFocused && airportCandidates.length > 0 && (
          <View style={styles.airportDropdownBox}>
            <ScrollView
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 165 }}
            >
              {airportCandidates.slice(0, 8).map((airport) => {
                const formatted = `${airport.nameKo} (${airport.code})`;
                return (
                  <TouchableOpacity
                    key={airport.code}
                    activeOpacity={0.75}
                    onPress={() => {
                      onChange(formatted);
                      setActiveAirportField(null);
                      if (fieldKey === 'outArr' && !retDepAirport.trim()) {
                        setRetDepAirport(formatted);
                      }
                      if (fieldKey === 'outDep' && !retArrAirport.trim()) {
                        setRetArrAirport(formatted);
                      }
                    }}
                    style={styles.airportOptionRow}
                  >
                    <View style={styles.airportCodeBadge}>
                      <Text style={styles.airportCodeBadgeText}>{airport.code}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.airportOptionTitle}>{airport.nameKo}</Text>
                      <Text style={styles.airportOptionSub}>
                        {airport.country} · {airport.city}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>
    );
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
        {/* Top Navigation Bar */}
        <View style={styles.topNavRow}>
          {step > (isOnboarding && !isEditMode ? 0 : 1) ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setStep((s) => (s > 0 ? ((s - 1) as 0 | 1 | 2 | 3 | 4) : s))}
              style={styles.backBtn}
            >
              <ChevronLeft size={22} color="#111827" />
            </TouchableOpacity>
          ) : !isOnboarding ? (
            <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.backBtn}>
              <X size={22} color="#111827" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}

          <Text style={styles.stepIndicatorText}>
            {step === 0
              ? 'WELCOME TO PINCHI'
              : isEditMode
                ? `여행 수정 (${step}/4)`
                : `STEP ${step} OF 4`}
          </Text>

          {step === 0 ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setStep(1)}
              style={styles.topNextPill}
            >
              <Text style={styles.topNextPillText}>시작</Text>
            </TouchableOpacity>
          ) : step === 1 ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleGoNextFromStep1}
              style={styles.topNextPill}
            >
              <Text style={styles.topNextPillText}>다음</Text>
            </TouchableOpacity>
          ) : step === 2 ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleGoNextFromStep2}
              style={styles.topNextPill}
            >
              <Text style={styles.topNextPillText}>다음</Text>
            </TouchableOpacity>
          ) : step === 3 ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setStep(4)}
              style={styles.topNextPill}
            >
              <Text style={styles.topNextPillText}>다음</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleFinishWizard()}
              style={styles.topNextPill}
            >
              <Text style={styles.topNextPillText}>완료</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Horizontal Progress Bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: progressPercent }]} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollBody}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ==================== STEP 0: 앱 처음 실행 시 앱 설명 & 첫 여행 설정 안내 ==================== */}
          {step === 0 && (
            <View style={styles.stepSection}>
              <View style={styles.onboardingBadge}>
                <Sparkles size={14} color="#1B2A4A" />
                <Text style={styles.onboardingBadgeText}>SMART TRAVEL PLANNER</Text>
              </View>

              <Text style={styles.heroQuestionTitle}>
                흩어진 여행 스팟을 한곳에,{'\n'}핀치(Pinchi)와 함께 시작해요
              </Text>
              <Text style={styles.heroQuestionSub}>
                복잡한 여행 준비를 가장 심플하게 정리해 드리는{'\n'}3가지 핵심 기능을 소개합니다.
              </Text>

              <View style={styles.introFeatureList}>
                <View style={styles.introFeatureCard}>
                  <View style={styles.introIconBox}>
                    <Bookmark size={20} color="#1B2A4A" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.introFeatureTitle}>
                      01. SNS 릴스 · 블로그 장소 핀치 & 지도 검색
                    </Text>
                    <Text style={styles.introFeatureDesc}>
                      인스타그램, 유튜브, 블로그 링크만 붙여넣거나 지도를 검색해 가고 싶은 장소를 여행별 보관함에 모아보세요.
                    </Text>
                  </View>
                </View>

                <View style={styles.introFeatureCard}>
                  <View style={styles.introIconBox}>
                    <MapPin size={20} color="#1B2A4A" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.introFeatureTitle}>
                      02. 다구간 동선 플래너 & 날짜별 숙소 관리
                    </Text>
                    <Text style={styles.introFeatureDesc}>
                      여러 도시를 묶은 다구간 여행부터 일차별 숙소, 출발/귀국 항공편, 스팟 간 이동 시간까지 자동으로 계산합니다.
                    </Text>
                  </View>
                </View>

                <View style={styles.introFeatureCard}>
                  <View style={styles.introIconBox}>
                    <Coins size={20} color="#1B2A4A" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.introFeatureTitle}>
                      03. 여행지 맞춤 현지 통화 자동 설정 가계부
                    </Text>
                    <Text style={styles.introFeatureDesc}>
                      선택한 여행지에 맞춰 현지 통화(엔화, 달러, 유로 등)가 자동으로 설정되고 원화(KRW) 환산 금액을 실시간으로 보여줍니다.
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => setStep(1)}
                style={[styles.bottomPrimaryBtn, { marginTop: 28 }]}
              >
                <Text style={styles.bottomPrimaryBtnText}>첫 번째 여행 설정 시작하기</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ==================== STEP 1: 여행지 (트리 형식 + 다구간 여행 설정 + 통화 자동 설정) ==================== */}
          {step === 1 && (
            <View style={styles.stepSection}>
              <Text style={styles.heroQuestionTitle}>
                {isOnboarding ? '첫 번째 여행지 입력' : '어디로 떠나시나요?'}
              </Text>
              <Text style={styles.heroQuestionSub}>
                여러 도시를 함께 선택해 다구간 여행(예: 후쿠오카 · 도쿄)으로 설정할 수 있어요.
              </Text>

              {/* 선택된 다구간 여행지 칩 표시 */}
              {selectedCities.length > 0 && (
                <View style={styles.multiCityBanner}>
                  <View style={styles.multiCityHeaderRow}>
                    <Text style={styles.multiCityBannerLabel}>
                      선택된 여행 구간 ({selectedCities.length}곳)
                    </Text>
                    <View style={styles.autoCurrencyPill}>
                      <Text style={styles.autoCurrencyPillText}>
                        현지 통화 자동: {currencyInfo.label}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.selectedCitiesWrap}>
                    {selectedCities.map((city, idx) => (
                      <React.Fragment key={city}>
                        {idx > 0 && <Text style={styles.routeArrowText}>➔</Text>}
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => handleToggleCity(city)}
                          style={styles.selectedCityChip}
                        >
                          <Text style={styles.selectedCityChipText}>{city}</Text>
                          <X size={12} color="#FFFFFF" />
                        </TouchableOpacity>
                      </React.Fragment>
                    ))}
                  </View>
                </View>
              )}

              {/* 직접 검색 및 추가 입력창 */}
              <View style={styles.searchBox}>
                <Search size={18} color="#9CA3AF" style={{ marginRight: 10 }} />
                <TextInput
                  value={destinationInput}
                  onChangeText={setDestinationInput}
                  onSubmitEditing={handleAddCustomCity}
                  placeholder="도시 또는 국가 직접 검색 (예: 삿포로, 파리)"
                  placeholderTextColor="#9CA3AF"
                  style={styles.searchInput}
                />
                {isSearchingDest && <ActivityIndicator size="small" color="#1B2A4A" />}
                {destinationInput.trim().length > 0 && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleAddCustomCity}
                    style={styles.inlineAddCityBtn}
                  >
                    <Text style={styles.inlineAddCityBtnText}>+ 구간 추가</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* 검색 결과 리스트 (이미지 없음) */}
              {searchResults.length > 0 && destinationInput.trim().length > 0 && (
                <View style={styles.dropdownBox}>
                  {searchResults.map((cand) => {
                    const isSelected = selectedCities.includes(cand.name);
                    return (
                      <TouchableOpacity
                        key={`${cand.name}-${cand.country}`}
                        activeOpacity={0.75}
                        onPress={() => {
                          handleToggleCity(cand.name, cand.latitude, cand.longitude);
                          setDestinationInput('');
                          setSearchResults([]);
                        }}
                        style={styles.dropdownItem}
                      >
                        <MapPin size={15} color="#1B2A4A" style={{ marginRight: 8 }} />
                        <Text style={styles.dropdownTitle}>{cand.name}</Text>
                        <Text style={styles.dropdownCountry}>{cand.country}</Text>
                        {isSelected && <Check size={14} color="#1B2A4A" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* 트리 형식 인기 여행지 ([일본 - 후쿠오카, 도쿄] [베트남 - 다낭, 하노이]) */}
              <Text style={styles.sectionSmallLabel}>국가별 인기 여행지 트리 (다중 선택 가능)</Text>
              <View style={styles.treeContainer}>
                {POPULAR_DESTINATION_TREE.map((group) => {
                  const isExpanded = Boolean(expandedCountries[group.country]);
                  const selectedInGroup = group.cities.filter((c) =>
                    selectedCities.includes(c.name)
                  );
                  return (
                    <View key={group.country} style={styles.treeCountryCard}>
                      <TouchableOpacity
                        activeOpacity={0.75}
                        onPress={() =>
                          setExpandedCountries((prev) => ({
                            ...prev,
                            [group.country]: !prev[group.country],
                          }))
                        }
                        style={styles.treeCountryHeader}
                      >
                        <View style={styles.treeCountryTitleWrap}>
                          <Text style={styles.treeCountryBracket}>
                            [{group.country} - {group.cities.map((c) => c.name).join(', ')}]
                          </Text>
                          {selectedInGroup.length > 0 && (
                            <View style={styles.treeSelectedCountBadge}>
                              <Text style={styles.treeSelectedCountText}>
                                {selectedInGroup.length}곳 선택됨
                              </Text>
                            </View>
                          )}
                        </View>
                        {isExpanded ? (
                          <ChevronUp size={18} color="#1B2A4A" />
                        ) : (
                          <ChevronDown size={18} color="#6B7280" />
                        )}
                      </TouchableOpacity>

                      {isExpanded && (
                        <View style={styles.treeBranchBody}>
                          {group.cities.map((city, idx) => {
                            const active = selectedCities.includes(city.name);
                            const isLast = idx === group.cities.length - 1;
                            return (
                              <TouchableOpacity
                                key={city.name}
                                activeOpacity={0.8}
                                onPress={() => handleToggleCity(city.name, city.lat, city.lng)}
                                style={[
                                  styles.treeCityNode,
                                  active && styles.treeCityNodeActive,
                                ]}
                              >
                                <Text style={styles.treeBranchConnector}>
                                  {isLast ? '└' : '├'}
                                </Text>
                                <Text
                                  style={[
                                    styles.treeCityText,
                                    active && styles.treeCityTextActive,
                                  ]}
                                >
                                  {city.name}
                                </Text>
                                {active ? (
                                  <Check size={14} color="#FFFFFF" style={{ marginLeft: 6 }} />
                                ) : (
                                  <Plus size={13} color="#9CA3AF" style={{ marginLeft: 6 }} />
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>

              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleGoNextFromStep1}
                style={[styles.bottomPrimaryBtn, { marginTop: 22 }]}
              >
                <Text style={styles.bottomPrimaryBtnText}>다음 단계로 (날짜 선택)</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ==================== STEP 2: 날짜 및 여행 제목 ==================== */}
          {step === 2 && (
            <View style={styles.stepSection}>
              <Text style={styles.heroQuestionTitle}>여행 날짜 선택</Text>
              <Text style={styles.heroQuestionSub}>
                {combinedDestination} 여행의 출발일과 도착일을 설정해 주세요.
              </Text>

              {/* 빠른 기간 프리셋 */}
              <View style={styles.presetRow}>
                {DATE_PRESETS.map((preset) => {
                  const active = selectedPresetDays === preset.days;
                  return (
                    <TouchableOpacity
                      key={preset.label}
                      activeOpacity={0.8}
                      onPress={() => handleSelectPreset(preset.days)}
                      style={[styles.presetChip, active && styles.presetChipActive]}
                    >
                      <Text style={[styles.presetChipText, active && styles.presetChipTextActive]}>
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 달력 호출 박스 */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setShowCalendarPicker(true)}
                style={styles.dateSelectorCard}
              >
                <View style={styles.dateCol}>
                  <Text style={styles.dateColLabel}>출발일</Text>
                  <Text style={styles.dateColValue}>{startDate}</Text>
                </View>
                <ChevronRight size={18} color="#9CA3AF" />
                <View style={styles.dateCol}>
                  <Text style={styles.dateColLabel}>도착일</Text>
                  <Text style={styles.dateColValue}>{endDate}</Text>
                </View>
                <View style={styles.calendarIconCircle}>
                  <Calendar size={18} color="#1B2A4A" />
                </View>
              </TouchableOpacity>

              {/* 여행 제목 커스텀 */}
              <Text style={[styles.sectionSmallLabel, { marginTop: 24 }]}>
                여행 제목 (비워두면 자동 생성)
              </Text>
              <View style={styles.searchBox}>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder={`예: ${combinedDestination || '후쿠오카'} 감성 여행`}
                  placeholderTextColor="#9CA3AF"
                  style={styles.searchInput}
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleGoNextFromStep2}
                style={[styles.bottomPrimaryBtn, { marginTop: 28 }]}
              >
                <Text style={styles.bottomPrimaryBtnText}>다음 단계로 (항공권 설정)</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ==================== STEP 3: 비행기 (여행날짜 -> 출발 공항 -> 도착 공항 -> 전체 항공사 운항편 리스트 -> 원터치 자동입력) ==================== */}
          {step === 3 && (
            <View style={styles.stepSection}>
              <View style={styles.optionalTag}>
                <Plane size={13} color="#1B2A4A" />
                <Text style={styles.optionalTagText}>나중에 설정 가능</Text>
              </View>
              <Text style={styles.heroQuestionTitle}>항공권 정보 입력</Text>
              <Text style={styles.heroQuestionSub}>
                여행 날짜 확인 → 출발 공항 선택 → 도착 공항을 선택하면 해당 노선의 전체 항공사 실제 운항편이 아래에 펼쳐집니다.
              </Text>

              {/* 가는 편 / 오는 편 탭 */}
              <View style={styles.flightLegTabRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setFlightTab('outbound');
                    setActiveAirportField(null);
                  }}
                  style={[
                    styles.flightLegTab,
                    flightTab === 'outbound' && styles.flightLegTabActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.flightLegTabText,
                      flightTab === 'outbound' && styles.flightLegTabTextActive,
                    ]}
                  >
                    가는 편 (출발편)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setFlightTab('inbound');
                    setActiveAirportField(null);
                  }}
                  style={[
                    styles.flightLegTab,
                    flightTab === 'inbound' && styles.flightLegTabActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.flightLegTabText,
                      flightTab === 'inbound' && styles.flightLegTabTextActive,
                    ]}
                  >
                    오는 편 (귀국편)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* STEP 1: 여행 날짜 확인 및 변경 배너 */}
              <View style={styles.flightDateBanner}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Calendar size={16} color="#1B2A4A" style={{ marginRight: 8 }} />
                  <View>
                    <Text style={styles.flightDateBannerLabel}>
                      {flightTab === 'outbound'
                        ? '1. 가는 편 탑승 날짜 (여행 시작일)'
                        : '1. 오는 편 탑승 날짜 (여행 종료일)'}
                    </Text>
                    <Text style={styles.flightDateBannerValue}>
                      {flightTab === 'outbound' ? startDate : endDate}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowCalendarPicker(true)}
                  style={styles.flightDateChangeBtn}
                >
                  <Text style={styles.flightDateChangeBtnText}>날짜 변경</Text>
                </TouchableOpacity>
              </View>

              {/* STEP 2 & 3: 출발 공항 선택 -> 도착 공항 선택 */}
              <View style={styles.cardFormBox}>
                {flightTab === 'outbound' ? (
                  <>
                    {renderAirportSearchField(
                      'outDep',
                      '2. 출발 공항 선택 (가는 편)',
                      outDepAirport,
                      (val) => {
                        setOutDepAirport(val);
                        setOutAirlineFilter('전체');
                      },
                      '출발 공항 검색 (예: 인천, 김포, 김해/부산, 청주, 대구)',
                      KOREAN_DEPARTURE_AIRPORTS
                    )}

                    {renderAirportSearchField(
                      'outArr',
                      '3. 도착 공항 선택 (가는 편)',
                      outArrAirport,
                      (val) => {
                        setOutArrAirport(val);
                        setOutAirlineFilter('전체');
                      },
                      '도착 공항 검색 또는 아래 추천 공항 칩 선택',
                      recommendedDestAirports
                    )}
                  </>
                ) : (
                  <>
                    {renderAirportSearchField(
                      'retDep',
                      '2. 출발 공항 선택 (오는 편)',
                      retDepAirport,
                      (val) => {
                        setRetDepAirport(val);
                        setRetAirlineFilter('전체');
                      },
                      '현지 출발 공항 검색 또는 아래 추천 공항 칩 선택',
                      recommendedDestAirports
                    )}

                    {renderAirportSearchField(
                      'retArr',
                      '3. 도착 공항 선택 (오는 편)',
                      retArrAirport,
                      (val) => {
                        setRetArrAirport(val);
                        setRetAirlineFilter('전체');
                      },
                      '귀국 도착 공항 검색 (예: 인천, 김포, 김해/부산)',
                      KOREAN_DEPARTURE_AIRPORTS
                    )}
                  </>
                )}
              </View>

              {/* STEP 4: 출발 공항 + 도착 공항 선택 시 펼쳐지는 전체 항공사 실제 운항편 리스트 */}
              <View style={styles.realFlightLookupBox}>
                <View style={styles.realFlightHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Sparkles size={14} color="#1B2A4A" style={{ marginRight: 6 }} />
                    <Text style={styles.realFlightBoxTitle}>
                      4. 조회된 실제 운항편 (
                      {(flightTab === 'outbound'
                        ? outboundFlightCandidates
                        : returnFlightCandidates
                      ).length}
                      편)
                    </Text>
                  </View>
                  <Text style={styles.realFlightBoxSubBadge}>탭하면 자동 입력</Text>
                </View>

                {/* 항공사 필터 칩 (대한항공, 아시아나, 제주항공, 진에어, 티웨이, 이스타, 에어서울, 에어부산 등) */}
                {(flightTab === 'outbound' ? outboundAirlinesOnRoute : returnAirlinesOnRoute)
                  .length > 1 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.airlineFilterRow}
                  >
                    {(flightTab === 'outbound'
                      ? outboundAirlinesOnRoute
                      : returnAirlinesOnRoute
                    ).map((airlineName) => {
                      const currentFilter =
                        flightTab === 'outbound' ? outAirlineFilter : retAirlineFilter;
                      const active = currentFilter === airlineName;
                      return (
                        <TouchableOpacity
                          key={`${flightTab}_airline_${airlineName}`}
                          activeOpacity={0.8}
                          onPress={() =>
                            flightTab === 'outbound'
                              ? setOutAirlineFilter(airlineName)
                              : setRetAirlineFilter(airlineName)
                          }
                          style={[
                            styles.airlineFilterChip,
                            active && styles.airlineFilterChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.airlineFilterChipText,
                              active && styles.airlineFilterChipTextActive,
                            ]}
                          >
                            {airlineName}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}

                {/* 편명 / 시간대 빠른 필터 */}
                <View style={styles.realFlightSearchBar}>
                  <Search size={15} color="#1B2A4A" style={{ marginRight: 8 }} />
                  <TextInput
                    value={flightTab === 'outbound' ? outFlightSearchQuery : retFlightSearchQuery}
                    onChangeText={
                      flightTab === 'outbound' ? setOutFlightSearchQuery : setRetFlightSearchQuery
                    }
                    placeholder="편명(예: 7C1402, LJ221, TW291, KE787) 또는 시간(09:00) 검색"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="characters"
                    style={styles.searchInput}
                  />
                  {(flightTab === 'outbound' ? outFlightSearchQuery : retFlightSearchQuery).length >
                    0 && (
                    <TouchableOpacity
                      onPress={() =>
                        flightTab === 'outbound'
                          ? setOutFlightSearchQuery('')
                          : setRetFlightSearchQuery('')
                      }
                      style={{ padding: 4 }}
                    >
                      <X size={14} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* 세로로 쫙 펼쳐지는 노선 운항편 리스트 */}
                {(flightTab === 'outbound'
                  ? outboundFlightCandidates
                  : returnFlightCandidates
                ).length === 0 ? (
                  <View style={styles.emptyFlightPromptBox}>
                    <Plane size={22} color="#94A3B8" />
                    <Text style={styles.emptyFlightPromptTitle}>
                      {(flightTab === 'outbound'
                        ? outDepAirport.trim() && outArrAirport.trim()
                        : retDepAirport.trim() && retArrAirport.trim())
                        ? '검색 조건과 일치하는 항공편이 없습니다.'
                        : '위에서 출발 공항과 도착 공항을 선택해 주세요!'}
                    </Text>
                    <Text style={styles.emptyFlightPromptSub}>
                      출발 공항과 도착 공항을 선택하면 제주항공, 진에어, 티웨이항공, 이스타항공, 에어서울, 에어부산, 대한항공, 아시아나항공 등 전 항공사 운항편이 시간순으로 쫙 표시됩니다.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.verticalFlightListWrap}>
                    {(flightTab === 'outbound'
                      ? outboundFlightCandidates
                      : returnFlightCandidates
                    ).map((item) => {
                      const currentAirlineVal = flightTab === 'outbound' ? outAirline : retAirline;
                      const isSelected = currentAirlineVal
                        .toUpperCase()
                        .includes(item.flightNumber.toUpperCase());

                      return (
                        <TouchableOpacity
                          key={`${flightTab}_${item.id}`}
                          activeOpacity={0.82}
                          onPress={() => handleSelectRealFlightInWizard(flightTab, item)}
                          style={[
                            styles.verticalFlightRow,
                            isSelected && styles.verticalFlightRowActive,
                          ]}
                        >
                          <View style={styles.verticalFlightLeft}>
                            <View style={styles.verticalAirlineBadgeRow}>
                              <View
                                style={[
                                  styles.airlineColorDot,
                                  {
                                    backgroundColor: isSelected
                                      ? '#93C5FD'
                                      : item.airlineColor,
                                  },
                                ]}
                              />
                              <Text
                                style={[
                                  styles.verticalAirlineName,
                                  isSelected && { color: '#FFFFFF' },
                                ]}
                              >
                                {item.airline}
                              </Text>
                              <View
                                style={[
                                  styles.verticalFlightNumBadge,
                                  isSelected && styles.verticalFlightNumBadgeActive,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.verticalFlightNumText,
                                    isSelected && { color: '#FFFFFF' },
                                  ]}
                                >
                                  {item.flightNumber}
                                </Text>
                              </View>
                            </View>
                            {item.terminal && (
                              <Text
                                style={[
                                  styles.verticalTerminalSub,
                                  isSelected && { color: '#CBD5E1' },
                                ]}
                              >
                                출발 {item.terminal} · 매일 운항
                              </Text>
                            )}
                          </View>

                          <View style={styles.verticalFlightCenter}>
                            <View style={styles.verticalTimeBlock}>
                              <Text
                                style={[
                                  styles.verticalTimeText,
                                  isSelected && { color: '#FFFFFF' },
                                ]}
                              >
                                {item.departureTime}
                              </Text>
                              <Text
                                style={[
                                  styles.verticalIataSub,
                                  isSelected && { color: '#CBD5E1' },
                                ]}
                              >
                                {item.departureCode}
                              </Text>
                            </View>

                            <View style={styles.verticalArrowBlock}>
                              <Text
                                style={[
                                  styles.verticalDurationText,
                                  isSelected && { color: '#93C5FD' },
                                ]}
                              >
                                {item.durationText}
                              </Text>
                              <View
                                style={[
                                  styles.verticalRouteLine,
                                  isSelected && { backgroundColor: '#93C5FD' },
                                ]}
                              />
                            </View>

                            <View style={styles.verticalTimeBlock}>
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text
                                  style={[
                                    styles.verticalTimeText,
                                    isSelected && { color: '#FFFFFF' },
                                  ]}
                                >
                                  {item.arrivalTime}
                                </Text>
                                {item.arrivalNextDay && (
                                  <Text style={styles.flightCandNextDayBadge}>+1일</Text>
                                )}
                              </View>
                              <Text
                                style={[
                                  styles.verticalIataSub,
                                  isSelected && { color: '#CBD5E1' },
                                ]}
                              >
                                {item.arrivalCode}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.verticalSelectBadgeWrap}>
                            {isSelected ? (
                              <View style={styles.selectedCheckPill}>
                                <Check size={13} color="#1B2A4A" />
                              </View>
                            ) : (
                              <Text style={styles.tapToSelectLabel}>선택</Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* STEP 5: 자동 입력된 항공편 상세 (수동 보정 가능) */}
              {flightTab === 'outbound' ? (
                <View style={styles.cardFormBox}>
                  <Text style={styles.fieldLabel}>
                    5. 선택된 가는 편 상세 정보 (직접 수정 가능)
                  </Text>
                  <View style={styles.searchBox}>
                    <TextInput
                      value={outAirline}
                      onChangeText={setOutAirline}
                      placeholder="위 리스트에서 항공편을 선택하면 자동 입력됩니다"
                      placeholderTextColor="#9CA3AF"
                      style={styles.searchInput}
                    />
                  </View>

                  <View style={styles.twoColRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>출발 시간</Text>
                      <View style={styles.searchBox}>
                        <TextInput
                          value={outDepTime}
                          onChangeText={(v) => setOutDepTime(formatTimeInput(v))}
                          placeholder="09:30"
                          keyboardType="number-pad"
                          maxLength={5}
                          placeholderTextColor="#9CA3AF"
                          style={styles.searchInput}
                        />
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.timeLabelWithToggleRow}>
                        <Text style={[styles.fieldLabel, { marginBottom: 0 }]}>도착 시간</Text>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => setOutArrivalNextDay((p) => !p)}
                          style={[
                            styles.nextDayToggleChip,
                            outArrivalNextDay && styles.nextDayToggleChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.nextDayToggleText,
                              outArrivalNextDay && styles.nextDayToggleTextActive,
                            ]}
                          >
                            +1일
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.searchBox}>
                        <TextInput
                          value={outArrTime}
                          onChangeText={(v) => setOutArrTime(formatTimeInput(v))}
                          placeholder="12:00"
                          keyboardType="number-pad"
                          maxLength={5}
                          placeholderTextColor="#9CA3AF"
                          style={styles.searchInput}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.cardFormBox}>
                  <Text style={styles.fieldLabel}>
                    5. 선택된 오는 편 상세 정보 (직접 수정 가능)
                  </Text>
                  <View style={styles.searchBox}>
                    <TextInput
                      value={retAirline}
                      onChangeText={setRetAirline}
                      placeholder="위 리스트에서 항공편을 선택하면 자동 입력됩니다"
                      placeholderTextColor="#9CA3AF"
                      style={styles.searchInput}
                    />
                  </View>

                  <View style={styles.twoColRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>출발 시간</Text>
                      <View style={styles.searchBox}>
                        <TextInput
                          value={retDepTime}
                          onChangeText={(v) => setRetDepTime(formatTimeInput(v))}
                          placeholder="15:00"
                          keyboardType="number-pad"
                          maxLength={5}
                          placeholderTextColor="#9CA3AF"
                          style={styles.searchInput}
                        />
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.timeLabelWithToggleRow}>
                        <Text style={[styles.fieldLabel, { marginBottom: 0 }]}>도착 시간</Text>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => setRetArrivalNextDay((p) => !p)}
                          style={[
                            styles.nextDayToggleChip,
                            retArrivalNextDay && styles.nextDayToggleChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.nextDayToggleText,
                              retArrivalNextDay && styles.nextDayToggleTextActive,
                            ]}
                          >
                            +1일
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.searchBox}>
                        <TextInput
                          value={retArrTime}
                          onChangeText={(v) => setRetArrTime(formatTimeInput(v))}
                          placeholder="17:40"
                          keyboardType="number-pad"
                          maxLength={5}
                          placeholderTextColor="#9CA3AF"
                          style={styles.searchInput}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              )}

              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => setStep(4)}
                style={styles.bottomPrimaryBtn}
              >
                <Text style={styles.bottomPrimaryBtnText}>다음 단계로 (날짜별 숙소)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setStep(4)}
                style={styles.skipTextBtn}
              >
                <Text style={styles.skipTextBtnLabel}>항공권은 나중에 설정할게요</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ==================== STEP 4: 숙소 날짜별 선택 및 추가 ==================== */}
          {step === 4 && (
            <View style={styles.stepSection}>
              <View style={styles.optionalTag}>
                <Hotel size={13} color="#1B2A4A" />
                <Text style={styles.optionalTagText}>날짜별 숙소 설정</Text>
              </View>
              <Text style={styles.heroQuestionTitle}>날짜별 숙소 추가</Text>
              <Text style={styles.heroQuestionSub}>
                일자별로 머무는 숙소가 달라도 날짜 구간을 선택해 여러 곳을 등록할 수 있어요.
              </Text>

              {/* 현지 통화 자동 설정 안내 배너 */}
              <View style={styles.autoCurrencyNoticeBox}>
                <Coins size={16} color="#1B2A4A" />
                <Text style={styles.autoCurrencyNoticeText}>
                  여행지({combinedDestination}) 기준 현지 통화가{' '}
                  <Text style={{ fontWeight: '800', color: '#1B2A4A' }}>
                    {currencyInfo.label}
                  </Text>
                  로 자동 설정되었습니다.
                </Text>
              </View>

              {/* 등록된 날짜별 숙소 리스트 */}
              {lodgingList.length > 0 && (
                <View style={styles.registeredLodgingList}>
                  <Text style={styles.fieldLabel}>
                    등록된 숙소 ({lodgingList.length}곳)
                  </Text>
                  {lodgingList.map((item, idx) => (
                    <View key={`${item.name}_${idx}`} style={styles.registeredLodgingCard}>
                      <View style={styles.registeredLodgingDayBadge}>
                        <Text style={styles.registeredLodgingDayText}>
                          DAY {item.startDay || 1}
                          {item.endDay && item.endDay !== item.startDay
                            ? ` ~ DAY ${item.endDay}`
                            : ''}
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

              {/* 날짜별 숙소 입력 카드 */}
              <View style={styles.cardFormBox}>
                <Text style={styles.fieldLabel}>1. 숙박 시작 날짜(체크인 일차) 선택</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
                >
                  {scheduleDaysPreview.map((d) => {
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
                  {scheduleDaysPreview.map((d) => {
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

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 14,
                    marginBottom: 8,
                  }}
                >
                  <Text style={[styles.fieldLabel, { marginBottom: 0 }]}>
                    3. 숙소 / 호텔 이름 (DAY {Math.min(lodgingStartDay, lodgingEndDay)}~
                    {Math.max(lodgingStartDay, lodgingEndDay)})
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setShowLodgingSearchModal(true)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#1B2A4A',
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 8,
                      gap: 4,
                    }}
                  >
                    <Search size={12} color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontSize: 11.5, fontWeight: '700' }}>
                      지도에서 숙소 검색
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.searchBox}>
                  <Hotel size={17} color="#9CA3AF" style={{ marginRight: 8 }} />
                  <TextInput
                    value={lodgingName}
                    onChangeText={setLodgingName}
                    placeholder="예: 하카타 엑셀 호텔 도큐"
                    placeholderTextColor="#9CA3AF"
                    style={styles.searchInput}
                  />
                </View>

                <View style={[styles.twoColRow, { marginTop: 12 }]}>
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
                  style={styles.addLodgingOutlineBtn}
                >
                  <Plus size={15} color="#1B2A4A" />
                  <Text style={styles.addLodgingOutlineBtnText}>
                    DAY {Math.min(lodgingStartDay, lodgingEndDay)} ~ DAY{' '}
                    {Math.max(lodgingStartDay, lodgingEndDay)} 숙소 목록에 추가
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => handleFinishWizard()}
                style={styles.bottomPrimaryBtn}
              >
                <Check size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.bottomPrimaryBtnText}>
                  {isEditMode ? '여행 정보 수정 완료' : '첫 여행 일정 시작하기'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => handleFinishWizard({ skipLodging: true })}
                style={styles.skipTextBtn}
              >
                <Text style={styles.skipTextBtnLabel}>숙소는 나중에 등록하고 바로 시작하기</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        <CalendarRangePicker
          visible={showCalendarPicker}
          initialStartDate={startDate}
          initialEndDate={endDate}
          onClose={() => setShowCalendarPicker(false)}
          onConfirm={(s, e) => {
            setStartDate(s);
            setEndDate(e);
            setSelectedPresetDays(null);
          }}
        />

        {/* 지도 기반 숙소 검색 모달 */}
        <PlaceSearchModal
          visible={showLodgingSearchModal}
          onClose={() => setShowLodgingSearchModal(false)}
          initialQuery={lodgingName || `${combinedDestination.split(' · ')[0] || ''} 호텔`}
          defaultCategory="LODGING"
          ctaLabel="이 위치를 숙소로 선택하기"
          onSelectResult={(item) => {
            setLodgingName(item.name);
            setLodgingAddress(item.address);
            setLodgingCoords({ lat: item.latitude, lng: item.longitude });
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
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndicatorText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.8,
  },
  topNextPill: {
    backgroundColor: '#1B2A4A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  topNextPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
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
  scrollBody: {
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 48,
  },
  stepSection: {
    flex: 1,
  },
  onboardingBadge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EEF2F8',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 14,
  },
  onboardingBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1B2A4A',
    letterSpacing: 0.6,
  },
  heroQuestionTitle: {
    fontSize: 23,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  heroQuestionSub: {
    fontSize: 13.5,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 22,
  },
  introFeatureList: {
    gap: 12,
  },
  introFeatureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  introIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EEF2F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  introFeatureTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  introFeatureDesc: {
    fontSize: 12.5,
    color: '#4B5563',
    lineHeight: 18,
  },
  multiCityBanner: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  multiCityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  multiCityBannerLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1B2A4A',
  },
  autoCurrencyPill: {
    backgroundColor: '#EEF2F8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  autoCurrencyPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1B2A4A',
  },
  selectedCitiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  routeArrowText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  selectedCityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1B2A4A',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
  },
  selectedCityChipText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  searchBoxFocused: {
    borderColor: '#1B2A4A',
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '600',
    color: '#111827',
  },
  inlineAddCityBtn: {
    backgroundColor: '#1B2A4A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 6,
  },
  inlineAddCityBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  dropdownBox: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginRight: 8,
  },
  dropdownCountry: {
    fontSize: 12,
    color: '#9CA3AF',
    flex: 1,
  },
  sectionSmallLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#4B5563',
    marginTop: 20,
    marginBottom: 10,
  },
  treeContainer: {
    gap: 10,
  },
  treeCountryCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  treeCountryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: '#F8FAFC',
  },
  treeCountryTitleWrap: {
    flex: 1,
    paddingRight: 8,
  },
  treeCountryBracket: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1B2A4A',
    lineHeight: 19,
  },
  treeSelectedCountBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: '#1B2A4A',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  treeSelectedCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  treeBranchBody: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  treeCityNode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  treeCityNodeActive: {
    backgroundColor: '#1B2A4A',
    borderColor: '#1B2A4A',
  },
  treeBranchConnector: {
    fontSize: 11,
    color: '#94A3B8',
    marginRight: 4,
    fontWeight: '700',
  },
  treeCityText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  treeCityTextActive: {
    color: '#FFFFFF',
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 18,
  },
  presetChip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  presetChipActive: {
    borderColor: '#1B2A4A',
    backgroundColor: '#1B2A4A',
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },
  dateSelectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 16,
  },
  dateCol: {
    flex: 1,
  },
  dateColLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  dateColValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  calendarIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EEF2F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionalTag: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EEF2F8',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },
  optionalTagText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1B2A4A',
  },
  flightLegTabRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  flightLegTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9,
  },
  flightLegTabActive: {
    backgroundColor: '#FFFFFF',
  },
  flightLegTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  flightLegTabTextActive: {
    color: '#1B2A4A',
  },
  cardFormBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 8,
  },
  airportSearchContainer: {
    marginTop: 14,
  },
  airportDropdownBox: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  airportOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  airportCodeBadge: {
    backgroundColor: '#EEF2F8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 44,
    alignItems: 'center',
  },
  airportCodeBadgeText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#1B2A4A',
  },
  airportOptionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111827',
  },
  airportOptionSub: {
    fontSize: 11.5,
    color: '#6B7280',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  timeLabelWithToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  nextDayToggleChip: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  nextDayToggleChipActive: {
    borderColor: '#1B2A4A',
    backgroundColor: '#1B2A4A',
  },
  nextDayToggleText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
  },
  nextDayToggleTextActive: {
    color: '#FFFFFF',
  },
  autoCurrencyNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EEF2F8',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    marginBottom: 16,
  },
  autoCurrencyNoticeText: {
    flex: 1,
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
  },
  registeredLodgingList: {
    marginBottom: 16,
    gap: 8,
  },
  registeredLodgingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  registeredLodgingDayBadge: {
    backgroundColor: '#1B2A4A',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  registeredLodgingDayText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  registeredLodgingName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  registeredLodgingSub: {
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 2,
  },
  daySelectChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    minWidth: 68,
  },
  daySelectChipActive: {
    borderColor: '#1B2A4A',
    backgroundColor: '#1B2A4A',
  },
  daySelectChipTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1F2937',
  },
  daySelectChipTitleActive: {
    color: '#FFFFFF',
  },
  daySelectChipSub: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  daySelectChipSubActive: {
    color: '#E2E8F0',
  },
  addLodgingOutlineBtn: {
    marginTop: 14,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#1B2A4A',
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addLodgingOutlineBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1B2A4A',
  },
  bottomPrimaryBtn: {
    backgroundColor: '#1B2A4A',
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  bottomPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
  },
  skipTextBtn: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  skipTextBtnLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#9CA3AF',
    textDecorationLine: 'underline',
  },
  realFlightLookupBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  realFlightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  realFlightBoxTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1B2A4A',
  },
  realFlightBoxSubBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2B50AA',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  realFlightSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 11,
    paddingHorizontal: 10,
    height: 42,
    marginBottom: 10,
  },
  flightCandidateScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  flightCandidateCard: {
    width: 176,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    padding: 10,
    justifyContent: 'space-between',
  },
  flightCandidateCardActive: {
    backgroundColor: '#1B2A4A',
    borderColor: '#1B2A4A',
  },
  flightCandTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  flightCandCodePill: {
    backgroundColor: '#EEF2F8',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  flightCandCodePillActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  flightCandCodeText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#1B2A4A',
  },
  flightCandCodeTextActive: {
    color: '#FFFFFF',
  },
  flightCandAirlineText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    maxWidth: 92,
  },
  flightCandTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  flightCandTimeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  flightCandIataText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 1,
  },
  flightCandArrowWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  flightCandDuration: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
  },
  flightCandNextDayBadge: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#EF4444',
    marginLeft: 3,
  },
  flightCandFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
    paddingTop: 5,
    alignItems: 'center',
  },
  flightCandApplyText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#2B50AA',
  },
  // 빠른 공항 선택 칩
  quickAirportChipRow: {
    gap: 6,
    paddingTop: 8,
    paddingBottom: 2,
  },
  quickAirportChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  quickAirportChipActive: {
    backgroundColor: '#1B2A4A',
    borderColor: '#1B2A4A',
  },
  quickAirportChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  quickAirportChipTextActive: {
    color: '#FFFFFF',
  },
  // 여행 날짜 배너
  flightDateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF2F8',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  flightDateBannerLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  flightDateBannerValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1B2A4A',
    marginTop: 2,
  },
  flightDateChangeBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  flightDateChangeBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1B2A4A',
  },
  // 항공사 필터 칩
  airlineFilterRow: {
    gap: 6,
    paddingBottom: 10,
  },
  airlineFilterChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  airlineFilterChipActive: {
    backgroundColor: '#1B2A4A',
    borderColor: '#1B2A4A',
  },
  airlineFilterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  airlineFilterChipTextActive: {
    color: '#FFFFFF',
  },
  // 빈 상태
  emptyFlightPromptBox: {
    alignItems: 'center',
    paddingVertical: 22,
    paddingHorizontal: 12,
  },
  emptyFlightPromptTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#334155',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyFlightPromptSub: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 17,
  },
  // 세로 운항편 리스트
  verticalFlightListWrap: {
    gap: 8,
  },
  verticalFlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  verticalFlightRowActive: {
    backgroundColor: '#1B2A4A',
    borderColor: '#1B2A4A',
  },
  verticalFlightLeft: {
    width: 104,
    marginRight: 8,
  },
  verticalAirlineBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  airlineColorDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  verticalAirlineName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  verticalFlightNumBadge: {
    backgroundColor: '#EEF2F8',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  verticalFlightNumBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  verticalFlightNumText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#1B2A4A',
  },
  verticalTerminalSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 4,
  },
  verticalFlightCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verticalTimeBlock: {
    alignItems: 'center',
  },
  verticalTimeText: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#0F172A',
  },
  verticalIataSub: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 1,
  },
  verticalArrowBlock: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  verticalDurationText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 3,
  },
  verticalRouteLine: {
    height: 1.5,
    alignSelf: 'stretch',
    backgroundColor: '#CBD5E1',
  },
  verticalSelectBadgeWrap: {
    width: 34,
    alignItems: 'flex-end',
  },
  selectedCheckPill: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#93C5FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapToSelectLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#2B50AA',
  },
});
