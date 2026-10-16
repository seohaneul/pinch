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
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Plane,
  Clock,
  Sparkles,
  Check,
  Calendar,
  MapPin,
  Trash2,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Info,
  Search,
  Globe,
  Navigation,
} from 'lucide-react-native';
import type { FlightInfo, SingleFlightLeg, DaySchedule } from '../../types';
import {
  POPULAR_AIRPORTS,
  searchAirports,
  resolveAirportLocation,
  AirportItem,
} from '../../services/airportService';

interface FlightModalProps {
  visible: boolean;
  onClose: () => void;
  tripTitle?: string;
  tripId: string;
  tripStartDate?: string;
  tripEndDate?: string;
  schedules?: DaySchedule[];
  initialFlight: FlightInfo | null;
  onSaveFlight: (flight: FlightInfo) => void;
  onDeleteFlight?: () => void;
}

const ORIGIN_PRESET_AIRPORTS = [
  { label: '인천 (ICN)', value: '인천국제공항 (ICN)' },
  { label: '김포 (GMP)', value: '김포국제공항 (GMP)' },
  { label: '김해/부산 (PUS)', value: '김해국제공항 (PUS)' },
  { label: '제주 (CJU)', value: '제주국제공항 (CJU)' },
  { label: '대구 (TAE)', value: '대구국제공항 (TAE)' },
  { label: '청주 (CJJ)', value: '청주국제공항 (CJJ)' },
];

const DEST_PRESET_AIRPORTS = [
  { label: '괌 (GUM)', value: '앤토니오 B. 원 팻 국제공항 (GUM)' },
  { label: '도쿄 나리타 (NRT)', value: '도쿄 나리타 국제공항 (NRT)' },
  { label: '도쿄 하네다 (HND)', value: '도쿄 하네다 공항 (HND)' },
  { label: '오사카 간사이 (KIX)', value: '오사카 간사이 국제공항 (KIX)' },
  { label: '후쿠오카 (FUK)', value: '후쿠오카 공항 (FUK)' },
  { label: '다낭 (DAD)', value: '다낭 국제공항 (DAD)' },
  { label: '방콕 (BKK)', value: '수완나품 국제공항 (BKK)' },
  { label: '하와이 호놀룰루 (HNL)', value: '호놀룰루 다니엘 K. 이노우에 국제공항 (HNL)' },
  { label: '싱가포르 (SIN)', value: '싱가포르 창이 공항 (SIN)' },
];

const BUFFER_PRESETS = [
  { label: '1시간 (빠른 수속)', mins: 60 },
  { label: '1시간 30분 (추천)', mins: 90 },
  { label: '2시간 (시내 이동)', mins: 120 },
  { label: '2시간 30분 (여유)', mins: 150 },
];

export const FlightModal: React.FC<FlightModalProps> = ({
  visible,
  onClose,
  tripTitle,
  tripId,
  tripStartDate = '2026-11-10',
  tripEndDate = '2026-11-13',
  schedules = [],
  initialFlight,
  onSaveFlight,
  onDeleteFlight,
}) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'outbound' | 'return'>('outbound');

  // 가는 편 (출발편) 상태
  const [outFlightNumber, setOutFlightNumber] = useState('');
  const [outAirline, setOutAirline] = useState('');
  const [outDepAirport, setOutDepAirport] = useState('');
  const [outDepDate, setOutDepDate] = useState('');
  const [outDepTime, setOutDepTime] = useState('');
  const [outArrAirport, setOutArrAirport] = useState('');
  const [outArrDate, setOutArrDate] = useState('');
  const [outArrTime, setOutArrTime] = useState('');
  const [outTerminal, setOutTerminal] = useState('');
  const [outBufferMinutes, setOutBufferMinutes] = useState<number>(90);
  const [outMemo, setOutMemo] = useState('');

  // 오는 편 (귀국편) 상태
  const [hasReturnFlight, setHasReturnFlight] = useState(true);
  const [retFlightNumber, setRetFlightNumber] = useState('');
  const [retAirline, setRetAirline] = useState('');
  const [retDepAirport, setRetDepAirport] = useState('');
  const [retDepDate, setRetDepDate] = useState('');
  const [retDepTime, setRetDepTime] = useState('');
  const [retArrAirport, setRetArrAirport] = useState('');
  const [retArrDate, setRetArrDate] = useState('');
  const [retArrTime, setRetArrTime] = useState('');
  const [retTerminal, setRetTerminal] = useState('');
  const [retMemo, setRetMemo] = useState('');

  // 일정 자동 연동 토글
  const [autoAddToSchedule, setAutoAddToSchedule] = useState(true);

  // Resolved Location Cache for live feedback
  const [outDepLoc, setOutDepLoc] = useState<any>(null);
  const [outArrLoc, setOutArrLoc] = useState<any>(null);
  const [retDepLoc, setRetDepLoc] = useState<any>(null);
  const [retArrLoc, setRetArrLoc] = useState<any>(null);

  // Airport Picker Sub-modal State
  const [pickerTarget, setPickerTarget] = useState<'outDep' | 'outArr' | 'retDep' | 'retArr' | null>(null);
  const [pickerQuery, setPickerQuery] = useState('');
  const [pickerRegion, setPickerRegion] = useState<'ALL' | 'KR' | 'JP' | 'US' | 'SEA'>('ALL');

  // Helper to add 1 day to YYYY-MM-DD
  const addDaysToDate = (dateStr: string, days: number = 1): string => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      d.setDate(d.getDate() + days);
      return d.toISOString().slice(0, 10);
    } catch {
      return dateStr;
    }
  };

  useEffect(() => {
    if (visible) {
      if (initialFlight) {
        const out = initialFlight.outbound || {
          flightNumber: initialFlight.flightNumber || 'KE113',
          airline: initialFlight.airline || '대한항공',
          departureAirport: initialFlight.departureAirport || '인천국제공항 (ICN)',
          departureDate: initialFlight.departureDate || tripStartDate || '2026-11-10',
          departureTime: initialFlight.departureTime || '23:00',
          arrivalAirport: initialFlight.arrivalAirport || '앤토니오 B. 원 팻 국제공항 (GUM)',
          arrivalDate: initialFlight.arrivalDate || initialFlight.departureDate || tripStartDate || '2026-11-11',
          arrivalTime: initialFlight.arrivalTime || '04:00',
          terminal: initialFlight.terminal || '제2터미널',
          bufferMinutes: initialFlight.bufferMinutes || 90,
          memo: initialFlight.memo || '',
        };

        setOutFlightNumber(out.flightNumber || '');
        setOutAirline(out.airline || '');
        setOutDepAirport(out.departureAirport || '인천국제공항 (ICN)');
        setOutDepDate(out.departureDate || tripStartDate || '2026-11-10');
        setOutDepTime(out.departureTime || '23:00');
        setOutArrAirport(out.arrivalAirport || '앤토니오 B. 원 팻 국제공항 (GUM)');
        setOutArrDate(out.arrivalDate || tripStartDate || '2026-11-11');
        setOutArrTime(out.arrivalTime || '04:00');
        setOutTerminal(out.terminal || '');
        setOutBufferMinutes(out.bufferMinutes || 90);
        setOutMemo(out.memo || '');

        if (initialFlight.returnFlight) {
          setHasReturnFlight(true);
          const ret = initialFlight.returnFlight;
          setRetFlightNumber(ret.flightNumber || '');
          setRetAirline(ret.airline || '');
          setRetDepAirport(ret.departureAirport || out.arrivalAirport || '앤토니오 B. 원 팻 국제공항 (GUM)');
          setRetDepDate(ret.departureDate || tripEndDate || '2026-11-13');
          setRetDepTime(ret.departureTime || '15:30');
          setRetArrAirport(ret.arrivalAirport || out.departureAirport || '인천국제공항 (ICN)');
          setRetArrDate(ret.arrivalDate || tripEndDate || '2026-11-13');
          setRetArrTime(ret.arrivalTime || '20:00');
          setRetTerminal(ret.terminal || '');
          setRetMemo(ret.memo || '');
        } else {
          setHasReturnFlight(false);
          setRetFlightNumber('KE114');
          setRetAirline('대한항공');
          setRetDepAirport(out.arrivalAirport || '앤토니오 B. 원 팻 국제공항 (GUM)');
          setRetDepDate(tripEndDate || '2026-11-13');
          setRetDepTime('15:30');
          setRetArrAirport(out.departureAirport || '인천국제공항 (ICN)');
          setRetArrDate(tripEndDate || '2026-11-13');
          setRetArrTime('20:00');
          setRetTerminal('제1터미널');
          setRetMemo('');
        }

        setAutoAddToSchedule(initialFlight.autoAddToSchedule !== false);
      } else {
        // Defaults: Outbound with overnight arrival example (Incheon 23:00 -> Guam 04:00)
        setOutFlightNumber('KE113');
        setOutAirline('대한항공');
        setOutDepAirport('인천국제공항 (ICN)');
        setOutDepDate(tripStartDate || '2026-11-10');
        setOutDepTime('23:00');
        setOutArrAirport('앤토니오 B. 원 팻 국제공항 (GUM)');
        setOutArrDate(addDaysToDate(tripStartDate || '2026-11-10', 1));
        setOutArrTime('04:00');
        setOutTerminal('제2터미널');
        setOutBufferMinutes(90);
        setOutMemo('모바일 체크인 완료');

        setHasReturnFlight(true);
        setRetFlightNumber('KE114');
        setRetAirline('대한항공');
        setRetDepAirport('앤토니오 B. 원 팻 국제공항 (GUM)');
        setRetDepDate(tripEndDate || '2026-11-13');
        setRetDepTime('15:30');
        setRetArrAirport('인천국제공항 (ICN)');
        setRetArrDate(tripEndDate || '2026-11-13');
        setRetArrTime('20:00');
        setRetTerminal('제1터미널');
        setRetMemo('');

        setAutoAddToSchedule(true);
      }
    }
  }, [visible, initialFlight, tripStartDate, tripEndDate]);

  // Live resolve airport location coordinates for immediate user feedback
  useEffect(() => {
    if (outDepAirport) resolveAirportLocation(outDepAirport).then(setOutDepLoc);
  }, [outDepAirport]);

  useEffect(() => {
    if (outArrAirport) resolveAirportLocation(outArrAirport).then(setOutArrLoc);
  }, [outArrAirport]);

  useEffect(() => {
    if (retDepAirport) resolveAirportLocation(retDepAirport).then(setRetDepLoc);
  }, [retDepAirport]);

  useEffect(() => {
    if (retArrAirport) resolveAirportLocation(retArrAirport).then(setRetArrLoc);
  }, [retArrAirport]);

  // Quick next-day arrival handler
  const handleSetNextDayArrival = () => {
    if (outDepDate) {
      setOutArrDate(addDaysToDate(outDepDate, 1));
    }
  };

  const handleSetSameDayArrival = () => {
    if (outDepDate) {
      setOutArrDate(outDepDate);
    }
  };

  const calculateStartTime = (arrTime: string, buffer: number) => {
    const parts = arrTime.split(':').map((v) => parseInt(v.trim(), 10));
    const h = isNaN(parts[0]) ? 12 : parts[0];
    const m = isNaN(parts[1]) ? 0 : parts[1];
    const totalMinutes = (h * 60 + m + buffer) % (24 * 60);
    const resH = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
    const resM = (totalMinutes % 60).toString().padStart(2, '0');
    return `${resH}:${resM}`;
  };

  const computedStartTime = calculateStartTime(outArrTime || '04:00', outBufferMinutes);

  // Airport selection handler
  const handleSelectAirportItem = (airport: AirportItem) => {
    const formatted = `${airport.nameKo} (${airport.code})`;
    if (pickerTarget === 'outDep') {
      setOutDepAirport(formatted);
      if (!retArrAirport || retArrAirport.includes('인천')) {
        setRetArrAirport(formatted);
      }
    } else if (pickerTarget === 'outArr') {
      setOutArrAirport(formatted);
      if (!retDepAirport || retDepAirport.includes('괌') || retDepAirport.includes('현지')) {
        setRetDepAirport(formatted);
      }
    } else if (pickerTarget === 'retDep') {
      setRetDepAirport(formatted);
    } else if (pickerTarget === 'retArr') {
      setRetArrAirport(formatted);
    }
    setPickerTarget(null);
    setPickerQuery('');
  };

  const handleSave = () => {
    if (!outFlightNumber.trim()) {
      Alert.alert('알림', '가는 편(출발) 항공편명을 입력해주세요 (예: KE113).');
      setActiveTab('outbound');
      return;
    }
    if (!outArrTime.trim()) {
      Alert.alert('알림', '가는 편(출발) 도착 예정 시간을 입력해주세요 (예: 04:00).');
      setActiveTab('outbound');
      return;
    }

    if (hasReturnFlight && !retFlightNumber.trim()) {
      Alert.alert('알림', '오는 편(귀국) 항공편명을 입력해주세요 (예: KE114).');
      setActiveTab('return');
      return;
    }

    const outboundData: SingleFlightLeg = {
      flightNumber: outFlightNumber.trim(),
      airline: outAirline.trim(),
      departureAirport: outDepAirport.trim() || '인천국제공항 (ICN)',
      departureDate: outDepDate.trim() || tripStartDate,
      departureTime: outDepTime.trim() || '23:00',
      arrivalAirport: outArrAirport.trim() || '앤토니오 B. 원 팻 국제공항 (GUM)',
      arrivalDate: outArrDate.trim() || outDepDate.trim() || tripStartDate,
      arrivalTime: outArrTime.trim() || '04:00',
      terminal: outTerminal.trim(),
      bufferMinutes: outBufferMinutes,
      memo: outMemo.trim(),
    };

    const returnData: SingleFlightLeg | undefined = hasReturnFlight
      ? {
          flightNumber: retFlightNumber.trim(),
          airline: retAirline.trim(),
          departureAirport: retDepAirport.trim() || outboundData.arrivalAirport,
          departureDate: retDepDate.trim() || tripEndDate,
          departureTime: retDepTime.trim() || '15:30',
          arrivalAirport: retArrAirport.trim() || outboundData.departureAirport,
          arrivalDate: retArrDate.trim() || retDepDate.trim() || tripEndDate,
          arrivalTime: retArrTime.trim() || '20:00',
          terminal: retTerminal.trim(),
          bufferMinutes: 60,
          memo: retMemo.trim(),
        }
      : undefined;

    const flightData: FlightInfo = {
      tripType: hasReturnFlight ? 'roundTrip' : 'oneWay',
      autoAddToSchedule,
      outbound: outboundData,
      returnFlight: returnData,
      flightNumber: outboundData.flightNumber,
      airline: outboundData.airline,
      departureAirport: outboundData.departureAirport,
      arrivalAirport: outboundData.arrivalAirport,
      departureDate: outboundData.departureDate,
      departureTime: outboundData.departureTime,
      arrivalDate: outboundData.arrivalDate,
      arrivalTime: outboundData.arrivalTime,
      bufferMinutes: outboundData.bufferMinutes,
      terminal: outboundData.terminal,
      memo: outboundData.memo,
    };

    onSaveFlight(flightData);

    const message = autoAddToSchedule
      ? `항공권 정보가 일정에 자동 반영되었습니다.\n출발 및 도착 공항의 실제 위치 좌표가 일정 지도에 정확히 매핑되었습니다!`
      : `항공권 정보가 저장되었습니다.`;

    Alert.alert('항공권 등록 완료 ✈️', message);
    onClose();
  };

  const handleDelete = () => {
    Alert.alert('항공권 삭제', '등록된 항공권 및 타임라인의 항공 일정을 모두 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          if (onDeleteFlight) onDeleteFlight();
          Alert.alert('삭제 완료', '항공권 및 관련 일정 항목이 삭제되었습니다.');
          onClose();
        },
      },
    ]);
  };

  // Filter airports for the picker
  const filteredAirports = POPULAR_AIRPORTS.filter((a) => {
    if (pickerRegion === 'KR' && a.country !== '대한민국') return false;
    if (pickerRegion === 'JP' && a.country !== '일본') return false;
    if (pickerRegion === 'US' && a.country !== '미국') return false;
    if (pickerRegion === 'SEA' && !['베트남', '태국', '인도네시아', '싱가포르', '필리핀', '대만'].includes(a.country)) {
      return false;
    }

    if (!pickerQuery.trim()) return true;
    const q = pickerQuery.toLowerCase().trim();
    return (
      a.code.toLowerCase().includes(q) ||
      a.nameKo.toLowerCase().includes(q) ||
      a.nameEn.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.country.toLowerCase().includes(q)
    );
  });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Plane size={18} color="#FF6B6B" />
              </View>
              <View>
                <Text style={styles.title}>왕복 항공권 등록 ✈️</Text>
                <Text style={styles.subtitle}>
                  공항 위치를 자동 매핑하고 타임라인에 비행 일정을 등록합니다
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Tab Navigation: Outbound vs Return */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              onPress={() => setActiveTab('outbound')}
              style={[styles.tabBtn, activeTab === 'outbound' && styles.tabBtnActive]}
              activeOpacity={0.8}
            >
              <Plane size={14} color={activeTab === 'outbound' ? '#FF6B6B' : '#64748B'} style={{ marginRight: 6 }} />
              <Text style={[styles.tabBtnText, activeTab === 'outbound' && styles.tabBtnTextActive]}>
                가는 편 (출발편)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('return')}
              style={[styles.tabBtn, activeTab === 'return' && styles.tabBtnActive]}
              activeOpacity={0.8}
            >
              <Plane
                size={14}
                color={activeTab === 'return' ? '#FF6B6B' : '#64748B'}
                style={{ marginRight: 6, transform: [{ rotate: '180deg' }] }}
              />
              <Text style={[styles.tabBtnText, activeTab === 'return' && styles.tabBtnTextActive]}>
                오는 편 (귀국편)
              </Text>
              {!hasReturnFlight && <View style={styles.tabOffBadge} />}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* TAB 1: OUTBOUND (가는 편) */}
            {activeTab === 'outbound' && (
              <View>
                {/* 1. 편명 & 항공사 */}
                <View style={styles.row}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>항공편명 *</Text>
                    <TextInput
                      value={outFlightNumber}
                      onChangeText={setOutFlightNumber}
                      placeholder="예: KE113, OZ102"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="characters"
                      style={styles.input}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>항공사</Text>
                    <TextInput
                      value={outAirline}
                      onChangeText={setOutAirline}
                      placeholder="예: 대한항공, 아시아나"
                      placeholderTextColor="#94A3B8"
                      style={styles.input}
                    />
                  </View>
                </View>

                {/* 2. 출발지 공항 & 출발 날짜 & 시간 */}
                <View style={styles.formGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>출발 공항 및 출발 일시 *</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setPickerTarget('outDep');
                        setPickerQuery('');
                      }}
                      style={styles.searchPickerLink}
                      activeOpacity={0.7}
                    >
                      <Search size={12} color="#FF6B6B" style={{ marginRight: 3 }} />
                      <Text style={styles.searchPickerLinkText}>공항 검색/선택</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Preset chips for Departure */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.presetChipRow}
                  >
                    {ORIGIN_PRESET_AIRPORTS.map((item) => (
                      <TouchableOpacity
                        key={item.value}
                        onPress={() => setOutDepAirport(item.value)}
                        style={[
                          styles.presetChip,
                          outDepAirport === item.value && styles.presetChipActive,
                        ]}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.presetChipText,
                            outDepAirport === item.value && styles.presetChipTextActive,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <TextInput
                    value={outDepAirport}
                    onChangeText={setOutDepAirport}
                    placeholder="예: 인천국제공항 (ICN)"
                    placeholderTextColor="#94A3B8"
                    style={[styles.input, { marginBottom: 6 }]}
                  />

                  {/* Resolved Location Badge */}
                  {outDepLoc && (
                    <View style={styles.locBadge}>
                      <MapPin size={12} color="#059669" style={{ marginRight: 4 }} />
                      <Text style={styles.locBadgeText} numberOfLines={1}>
                        위치 매핑: {outDepLoc.name} ({outDepLoc.code}) · {outDepLoc.address}
                      </Text>
                    </View>
                  )}

                  <View style={styles.row}>
                    <View style={[styles.inputWithIcon, { flex: 1.3, marginRight: 8 }]}>
                      <Calendar size={14} color="#64748B" style={{ marginRight: 6 }} />
                      <TextInput
                        value={outDepDate}
                        onChangeText={setOutDepDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#94A3B8"
                        style={styles.innerInput}
                      />
                    </View>
                    <View style={[styles.inputWithIcon, { flex: 1 }]}>
                      <Clock size={14} color="#64748B" style={{ marginRight: 6 }} />
                      <TextInput
                        value={outDepTime}
                        onChangeText={setOutDepTime}
                        placeholder="23:00"
                        placeholderTextColor="#94A3B8"
                        style={styles.innerInput}
                      />
                    </View>
                  </View>
                </View>

                {/* 3. 도착지 공항 & 도착 날짜 & 시간 */}
                <View style={styles.formGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>도착 공항 및 도착 일시 *</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setPickerTarget('outArr');
                        setPickerQuery('');
                      }}
                      style={styles.searchPickerLink}
                      activeOpacity={0.7}
                    >
                      <Search size={12} color="#FF6B6B" style={{ marginRight: 3 }} />
                      <Text style={styles.searchPickerLinkText}>공항 검색/선택</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Preset chips for Destination */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.presetChipRow}
                  >
                    {DEST_PRESET_AIRPORTS.map((item) => (
                      <TouchableOpacity
                        key={item.value}
                        onPress={() => {
                          setOutArrAirport(item.value);
                          if (!retDepAirport || retDepAirport.includes('괌') || retDepAirport.includes('현지')) {
                            setRetDepAirport(item.value);
                          }
                        }}
                        style={[
                          styles.presetChip,
                          outArrAirport === item.value && styles.presetChipActive,
                        ]}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.presetChipText,
                            outArrAirport === item.value && styles.presetChipTextActive,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <TextInput
                    value={outArrAirport}
                    onChangeText={setOutArrAirport}
                    placeholder="예: 앤토니오 B. 원 팻 국제공항 (GUM)"
                    placeholderTextColor="#94A3B8"
                    style={[styles.input, { marginBottom: 6 }]}
                  />

                  {/* Resolved Location Badge */}
                  {outArrLoc && (
                    <View style={styles.locBadge}>
                      <MapPin size={12} color="#059669" style={{ marginRight: 4 }} />
                      <Text style={styles.locBadgeText} numberOfLines={1}>
                        위치 매핑: {outArrLoc.name} ({outArrLoc.code}) · {outArrLoc.address}
                      </Text>
                    </View>
                  )}

                  {/* Date Helper Chips */}
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                    <TouchableOpacity
                      onPress={handleSetSameDayArrival}
                      style={[styles.smallChip, outDepDate === outArrDate && styles.smallChipActive]}
                    >
                      <Text style={[styles.smallChipText, outDepDate === outArrDate && styles.smallChipTextActive]}>
                        당일 도착
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSetNextDayArrival}
                      style={[styles.smallChip, outDepDate !== outArrDate && styles.smallChipActive]}
                    >
                      <Text style={[styles.smallChipText, outDepDate !== outArrDate && styles.smallChipTextActive]}>
                        +1일 익일 도착 🌙
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.inputWithIcon, { flex: 1.3, marginRight: 8 }]}>
                      <Calendar size={14} color="#64748B" style={{ marginRight: 6 }} />
                      <TextInput
                        value={outArrDate}
                        onChangeText={setOutArrDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#94A3B8"
                        style={styles.innerInput}
                      />
                    </View>
                    <View style={[styles.inputWithIcon, { flex: 1 }]}>
                      <Clock size={14} color="#64748B" style={{ marginRight: 6 }} />
                      <TextInput
                        value={outArrTime}
                        onChangeText={setOutArrTime}
                        placeholder="04:00"
                        placeholderTextColor="#94A3B8"
                        style={styles.innerInput}
                      />
                    </View>
                  </View>
                </View>

                {/* 4. 입국 수속 버퍼 */}
                <View style={styles.bufferCard}>
                  <View style={styles.bufferHeader}>
                    <Sparkles size={14} color="#FF6B6B" style={{ marginRight: 6 }} />
                    <Text style={styles.bufferTitle}>도착 후 입국 수속 & 추천 일정 시작 시간</Text>
                  </View>
                  <Text style={styles.bufferDesc}>
                    {outArrDate} {outArrTime} 도착 후 입국 심사, 수하물 수령, 시내 이동 시간을 고려하여 해당 일차의 시작 시간을 자동으로 맞춰드립니다.
                  </Text>

                  <View style={styles.bufferPresetsRow}>
                    {BUFFER_PRESETS.map((p) => {
                      const selected = outBufferMinutes === p.mins;
                      return (
                        <TouchableOpacity
                          key={p.mins}
                          onPress={() => setOutBufferMinutes(p.mins)}
                          style={[styles.bufferPresetBtn, selected && styles.bufferPresetBtnActive]}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.bufferPresetText, selected && styles.bufferPresetTextActive]}>
                            +{p.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.computedBox}>
                    <Text style={styles.computedLabel}>도착일 추천 일정 시작 시간:</Text>
                    <Text style={styles.computedTime}>{computedStartTime} AM/PM</Text>
                  </View>
                </View>

                {/* 5. 터미널 & 메모 */}
                <View style={styles.row}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>터미널</Text>
                    <TextInput
                      value={outTerminal}
                      onChangeText={setOutTerminal}
                      placeholder="예: 제2터미널 탑승구 242"
                      placeholderTextColor="#94A3B8"
                      style={styles.input}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>메모</Text>
                    <TextInput
                      value={outMemo}
                      onChangeText={setOutMemo}
                      placeholder="예: 위탁 수하물 23kg"
                      placeholderTextColor="#94A3B8"
                      style={styles.input}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* TAB 2: RETURN (오는 편) */}
            {activeTab === 'return' && (
              <View>
                {/* 귀국편 등록 스위치 */}
                <View style={styles.toggleRowCard}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={styles.toggleTitle}>귀국 항공편(오는 편) 등록하기</Text>
                    <Text style={styles.toggleSubtitle}>
                      여행 마지막 날 귀국 공항 스팟 및 귀국 일정을 자동 생성합니다
                    </Text>
                  </View>
                  <Switch
                    value={hasReturnFlight}
                    onValueChange={setHasReturnFlight}
                    trackColor={{ false: '#CBD5E1', true: '#FF6B6B' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {hasReturnFlight ? (
                  <View>
                    {/* 편명 & 항공사 */}
                    <View style={styles.row}>
                      <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.label}>귀국 항공편명 *</Text>
                        <TextInput
                          value={retFlightNumber}
                          onChangeText={setRetFlightNumber}
                          placeholder="예: KE114, OZ101"
                          placeholderTextColor="#94A3B8"
                          autoCapitalize="characters"
                          style={styles.input}
                        />
                      </View>
                      <View style={[styles.formGroup, { flex: 1 }]}>
                        <Text style={styles.label}>항공사</Text>
                        <TextInput
                          value={retAirline}
                          onChangeText={setRetAirline}
                          placeholder="예: 대한항공"
                          placeholderTextColor="#94A3B8"
                          style={styles.input}
                        />
                      </View>
                    </View>

                    {/* 현지 출발 공항 */}
                    <View style={styles.formGroup}>
                      <View style={styles.labelRow}>
                        <Text style={styles.label}>현지 출발 공항 및 시간 *</Text>
                        <TouchableOpacity
                          onPress={() => {
                            setPickerTarget('retDep');
                            setPickerQuery('');
                          }}
                          style={styles.searchPickerLink}
                          activeOpacity={0.7}
                        >
                          <Search size={12} color="#FF6B6B" style={{ marginRight: 3 }} />
                          <Text style={styles.searchPickerLinkText}>공항 검색/선택</Text>
                        </TouchableOpacity>
                      </View>

                      <TextInput
                        value={retDepAirport}
                        onChangeText={setRetDepAirport}
                        placeholder="예: 앤토니오 B. 원 팻 국제공항 (GUM)"
                        placeholderTextColor="#94A3B8"
                        style={[styles.input, { marginBottom: 6 }]}
                      />

                      {retDepLoc && (
                        <View style={styles.locBadge}>
                          <MapPin size={12} color="#059669" style={{ marginRight: 4 }} />
                          <Text style={styles.locBadgeText} numberOfLines={1}>
                            위치 매핑: {retDepLoc.name} ({retDepLoc.code}) · {retDepLoc.address}
                          </Text>
                        </View>
                      )}

                      <View style={styles.row}>
                        <View style={[styles.inputWithIcon, { flex: 1.3, marginRight: 8 }]}>
                          <Calendar size={14} color="#64748B" style={{ marginRight: 6 }} />
                          <TextInput
                            value={retDepDate}
                            onChangeText={setRetDepDate}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor="#94A3B8"
                            style={styles.innerInput}
                          />
                        </View>
                        <View style={[styles.inputWithIcon, { flex: 1 }]}>
                          <Clock size={14} color="#64748B" style={{ marginRight: 6 }} />
                          <TextInput
                            value={retDepTime}
                            onChangeText={setRetDepTime}
                            placeholder="15:30"
                            placeholderTextColor="#94A3B8"
                            style={styles.innerInput}
                          />
                        </View>
                      </View>
                    </View>

                    {/* 한국 도착 공항 */}
                    <View style={styles.formGroup}>
                      <View style={styles.labelRow}>
                        <Text style={styles.label}>한국 도착 공항 및 시간 *</Text>
                        <TouchableOpacity
                          onPress={() => {
                            setPickerTarget('retArr');
                            setPickerQuery('');
                          }}
                          style={styles.searchPickerLink}
                          activeOpacity={0.7}
                        >
                          <Search size={12} color="#FF6B6B" style={{ marginRight: 3 }} />
                          <Text style={styles.searchPickerLinkText}>공항 검색/선택</Text>
                        </TouchableOpacity>
                      </View>

                      <TextInput
                        value={retArrAirport}
                        onChangeText={setRetArrAirport}
                        placeholder="예: 인천국제공항 (ICN)"
                        placeholderTextColor="#94A3B8"
                        style={[styles.input, { marginBottom: 6 }]}
                      />

                      {retArrLoc && (
                        <View style={styles.locBadge}>
                          <MapPin size={12} color="#059669" style={{ marginRight: 4 }} />
                          <Text style={styles.locBadgeText} numberOfLines={1}>
                            위치 매핑: {retArrLoc.name} ({retArrLoc.code}) · {retArrLoc.address}
                          </Text>
                        </View>
                      )}

                      <View style={styles.row}>
                        <View style={[styles.inputWithIcon, { flex: 1.3, marginRight: 8 }]}>
                          <Calendar size={14} color="#64748B" style={{ marginRight: 6 }} />
                          <TextInput
                            value={retArrDate}
                            onChangeText={setRetArrDate}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor="#94A3B8"
                            style={styles.innerInput}
                          />
                        </View>
                        <View style={[styles.inputWithIcon, { flex: 1 }]}>
                          <Clock size={14} color="#64748B" style={{ marginRight: 6 }} />
                          <TextInput
                            value={retArrTime}
                            onChangeText={setRetArrTime}
                            placeholder="20:00"
                            placeholderTextColor="#94A3B8"
                            style={styles.innerInput}
                          />
                        </View>
                      </View>
                    </View>

                    {/* 터미널 & 메모 */}
                    <View style={styles.row}>
                      <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.label}>출국 터미널</Text>
                        <TextInput
                          value={retTerminal}
                          onChangeText={setRetTerminal}
                          placeholder="예: 제1터미널"
                          placeholderTextColor="#94A3B8"
                          style={styles.input}
                        />
                      </View>
                      <View style={[styles.formGroup, { flex: 1 }]}>
                        <Text style={styles.label}>메모</Text>
                        <TextInput
                          value={retMemo}
                          onChangeText={setRetMemo}
                          placeholder="예: 귀국편 면세품 픽업"
                          placeholderTextColor="#94A3B8"
                          style={styles.input}
                        />
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptyReturnBox}>
                    <Text style={styles.emptyReturnTitle}>편도 여행으로 설정됨</Text>
                    <Text style={styles.emptyReturnDesc}>
                      귀국 항공편을 등록하면 마지막 날 귀국 일정까지 자동으로 플래너에 연동됩니다.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Auto Schedule Switch */}
            <View style={styles.autoScheduleCard}>
              <View style={styles.autoScheduleLeft}>
                <View style={styles.sparkleCircle}>
                  <Sparkles size={16} color="#EA580C" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.autoScheduleTitle}>내 일정 및 지도에 자동 추가하기</Text>
                  <Text style={styles.autoScheduleDesc}>
                    비행기 탑승/도착 스팟을 일정에 추가하고 해당 공항 위치로 지도에 마커를 찍습니다.
                  </Text>
                </View>
              </View>
              <Switch
                value={autoAddToSchedule}
                onValueChange={setAutoAddToSchedule}
                trackColor={{ false: '#CBD5E1', true: '#FF6B6B' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsCol}>
              <TouchableOpacity onPress={handleSave} style={styles.primarySaveBtn} activeOpacity={0.85}>
                <Plane size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.primarySaveBtnText}>항공권 저장 & 일정 반영 ✈️</Text>
              </TouchableOpacity>

              {initialFlight && (
                <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} activeOpacity={0.75}>
                  <Trash2 size={16} color="#EF4444" style={{ marginRight: 6 }} />
                  <Text style={styles.deleteBtnText}>항공권 정보 삭제</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          {/* Sub-modal: Airport Picker */}
          {pickerTarget && (
            <View style={styles.pickerOverlay}>
              <View style={styles.pickerSheet}>
                <View style={styles.pickerHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Globe size={18} color="#FF6B6B" style={{ marginRight: 8 }} />
                    <Text style={styles.pickerTitle}>공항 선택 🛫</Text>
                  </View>
                  <TouchableOpacity onPress={() => setPickerTarget(null)} style={styles.pickerCloseBtn}>
                    <X size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Search in picker */}
                <View style={styles.pickerSearchBar}>
                  <Search size={15} color="#FF6B6B" style={{ marginRight: 8 }} />
                  <TextInput
                    value={pickerQuery}
                    onChangeText={setPickerQuery}
                    placeholder="공항명, 도시명, 또는 IATA 코드 (예: 괌, ICN)"
                    placeholderTextColor="#94A3B8"
                    style={styles.pickerSearchInput}
                    autoFocus={true}
                  />
                  {pickerQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setPickerQuery('')}>
                      <X size={14} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Region Filter Chips */}
                <View style={styles.pickerFilterRow}>
                  {[
                    { label: '전체', value: 'ALL' },
                    { label: '🇰🇷 한국', value: 'KR' },
                    { label: '🇯🇵 일본', value: 'JP' },
                    { label: '🇺🇸 미국/괌', value: 'US' },
                    { label: '🌴 동남아', value: 'SEA' },
                  ].map((f) => {
                    const active = pickerRegion === f.value;
                    return (
                      <TouchableOpacity
                        key={f.value}
                        onPress={() => setPickerRegion(f.value as any)}
                        style={[styles.pickerFilterChip, active && styles.pickerFilterChipActive]}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.pickerFilterChipText, active && styles.pickerFilterChipTextActive]}>
                          {f.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Airport List */}
                <ScrollView style={styles.pickerList} keyboardShouldPersistTaps="handled">
                  {filteredAirports.map((airport) => (
                    <TouchableOpacity
                      key={airport.code}
                      onPress={() => handleSelectAirportItem(airport)}
                      style={styles.airportItem}
                      activeOpacity={0.8}
                    >
                      <View style={styles.airportCodeBadge}>
                        <Text style={styles.airportCodeText}>{airport.code}</Text>
                      </View>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                          <Text style={styles.airportNameKo}>{airport.nameKo}</Text>
                          <Text style={styles.airportCity}> · {airport.city}</Text>
                        </View>
                        <Text style={styles.airportAddress} numberOfLines={1}>
                          {airport.address}
                        </Text>
                        <Text style={styles.airportCoords}>
                          좌표: {airport.latitude.toFixed(4)}, {airport.longitude.toFixed(4)}
                        </Text>
                      </View>
                      <ChevronRight size={16} color="#CBD5E1" />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}
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
    maxHeight: '92%',
    minHeight: '75%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
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
    borderRadius: 12,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 18,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 11,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#FF6B6B',
    fontWeight: '800',
  },
  tabOffBadge: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
    marginLeft: 4,
  },
  body: {
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  searchPickerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#FFF0F0',
    borderRadius: 8,
  },
  searchPickerLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  presetChipRow: {
    gap: 6,
    marginBottom: 8,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetChipActive: {
    backgroundColor: '#FFF0F0',
    borderColor: '#FF6B6B',
  },
  presetChipText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  presetChipTextActive: {
    color: '#FF6B6B',
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
  },
  locBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 8,
  },
  locBadgeText: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '600',
    flex: 1,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  innerInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    padding: 0,
  },
  smallChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  smallChipActive: {
    backgroundColor: '#FF6B6B',
  },
  smallChipText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  smallChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bufferCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  bufferHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bufferTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  bufferDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginBottom: 10,
  },
  bufferPresetsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  bufferPresetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  bufferPresetBtnActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  bufferPresetText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  bufferPresetTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  computedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF0F0',
    padding: 8,
    borderRadius: 8,
  },
  computedLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E11D48',
  },
  computedTime: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E11D48',
  },
  toggleRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  toggleSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  emptyReturnBox: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginBottom: 14,
  },
  emptyReturnTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  emptyReturnDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  autoScheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  autoScheduleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  sparkleCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  autoScheduleTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9A3412',
  },
  autoScheduleDesc: {
    fontSize: 10,
    lineHeight: 14,
    color: '#C2410C',
    marginTop: 2,
  },
  actionButtonsCol: {
    gap: 8,
    marginBottom: 16,
  },
  primarySaveBtn: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primarySaveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  deleteBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '65%',
    padding: 16,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  pickerCloseBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  pickerSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  pickerSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    padding: 0,
  },
  pickerFilterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  pickerFilterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  pickerFilterChipActive: {
    backgroundColor: '#FF6B6B',
  },
  pickerFilterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  pickerFilterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pickerList: {
    flex: 1,
  },
  airportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  airportCodeBadge: {
    width: 44,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  airportCodeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
  },
  airportNameKo: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  airportCity: {
    fontSize: 12,
    color: '#64748B',
  },
  airportAddress: {
    fontSize: 11,
    color: '#64748B',
  },
  airportCoords: {
    fontSize: 10,
    color: '#059669',
    marginTop: 2,
  },
});
