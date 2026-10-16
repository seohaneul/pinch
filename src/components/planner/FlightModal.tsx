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
} from 'lucide-react-native';
import type { FlightInfo, SingleFlightLeg, DaySchedule } from '../../types';

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
          departureAirport: initialFlight.departureAirport || '인천 (ICN)',
          departureDate: initialFlight.departureDate || tripStartDate || '2026-11-10',
          departureTime: initialFlight.departureTime || '23:00',
          arrivalAirport: initialFlight.arrivalAirport || '괌 (GUM)',
          arrivalDate: initialFlight.arrivalDate || initialFlight.departureDate || tripStartDate || '2026-11-11',
          arrivalTime: initialFlight.arrivalTime || '04:00',
          terminal: initialFlight.terminal || '제2터미널',
          bufferMinutes: initialFlight.bufferMinutes || 90,
          memo: initialFlight.memo || '',
        };

        setOutFlightNumber(out.flightNumber || '');
        setOutAirline(out.airline || '');
        setOutDepAirport(out.departureAirport || '');
        setOutDepDate(out.departureDate || tripStartDate || '2026-11-10');
        setOutDepTime(out.departureTime || '23:00');
        setOutArrAirport(out.arrivalAirport || '');
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
          setRetDepAirport(ret.departureAirport || '');
          setRetDepDate(ret.departureDate || tripEndDate || '2026-11-13');
          setRetDepTime(ret.departureTime || '15:30');
          setRetArrAirport(ret.arrivalAirport || '');
          setRetArrDate(ret.arrivalDate || tripEndDate || '2026-11-13');
          setRetArrTime(ret.arrivalTime || '20:00');
          setRetTerminal(ret.terminal || '');
          setRetMemo(ret.memo || '');
        } else {
          setHasReturnFlight(false);
          setRetFlightNumber('KE114');
          setRetAirline('대한항공');
          setRetDepAirport(out.arrivalAirport || '괌 (GUM)');
          setRetDepDate(tripEndDate || '2026-11-13');
          setRetDepTime('15:30');
          setRetArrAirport(out.departureAirport || '인천 (ICN)');
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
        setOutDepAirport('인천 (ICN)');
        setOutDepDate(tripStartDate || '2026-11-10');
        setOutDepTime('23:00');
        setOutArrAirport('괌 (GUM)');
        setOutArrDate(addDaysToDate(tripStartDate || '2026-11-10', 1));
        setOutArrTime('04:00');
        setOutTerminal('제2터미널');
        setOutBufferMinutes(90);
        setOutMemo('모바일 체크인 완료');

        setHasReturnFlight(true);
        setRetFlightNumber('KE114');
        setRetAirline('대한항공');
        setRetDepAirport('괌 (GUM)');
        setRetDepDate(tripEndDate || '2026-11-13');
        setRetDepTime('15:30');
        setRetArrAirport('인천 (ICN)');
        setRetArrDate(tripEndDate || '2026-11-13');
        setRetArrTime('20:00');
        setRetTerminal('제1터미널');
        setRetMemo('');

        setAutoAddToSchedule(true);
      }
    }
  }, [visible, initialFlight, tripStartDate, tripEndDate]);

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
      departureAirport: outDepAirport.trim() || '인천 (ICN)',
      departureDate: outDepDate.trim() || tripStartDate,
      departureTime: outDepTime.trim() || '23:00',
      arrivalAirport: outArrAirport.trim() || '도착 공항',
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
      // Legacy backwards-compatible fields
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
      ? `왕복 항공권(${outFlightNumber.trim()}${hasReturnFlight ? ` / ${retFlightNumber.trim()}` : ''})이 등록되었습니다.\n출발/도착 일차 타임라인에 항공 스팟이 생성되고 도착 후 시작 시간이 자동 계산되었습니다.`
      : `항공권 정보가 성공적으로 저장되었습니다.`;

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

  const BUFFER_PRESETS = [
    { mins: 60, label: '1시간 (빠른 이동)' },
    { mins: 90, label: '1시간 30분 (추천 ⭐)' },
    { mins: 120, label: '2시간 (여유 입국)' },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Plane size={18} color="#FF6B6B" />
              </View>
              <View>
                <Text style={styles.title}>왕복 항공권 등록 및 일정 연동 ✈️</Text>
                <Text style={styles.subtitle}>가는 편 & 오는 편 시간을 일정에 맞춰 자동 추가</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Navigation Tab Bar: Outbound vs Inbound */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              onPress={() => setActiveTab('outbound')}
              style={[styles.tabButton, activeTab === 'outbound' && styles.activeTabButton]}
              activeOpacity={0.8}
            >
              <Plane size={14} color={activeTab === 'outbound' ? '#FF6B6B' : '#64748B'} style={{ marginRight: 6 }} />
              <Text style={[styles.tabButtonText, activeTab === 'outbound' && styles.activeTabButtonText]}>
                가는 편 (출발)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('return')}
              style={[styles.tabButton, activeTab === 'return' && styles.activeTabButton]}
              activeOpacity={0.8}
            >
              <Plane
                size={14}
                color={activeTab === 'return' ? '#FF6B6B' : '#64748B'}
                style={{ marginRight: 6, transform: [{ rotate: '180deg' }] }}
              />
              <Text style={[styles.tabButtonText, activeTab === 'return' && styles.activeTabButtonText]}>
                오는 편 (귀국) {hasReturnFlight ? '✅' : '(미선택)'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollBody}>
            {/* TAB 1: OUTBOUND (가는 편) */}
            {activeTab === 'outbound' && (
              <View>
                {/* Boarding Pass Preview Ticket */}
                <View style={styles.ticketCard}>
                  <View style={styles.ticketHeader}>
                    <Text style={styles.ticketAirlineText}>{outAirline || '대한항공'}</Text>
                    <Text style={styles.ticketFlightNo}>{outFlightNumber || 'KE113'}</Text>
                  </View>

                  <View style={styles.ticketRouteRow}>
                    <View style={styles.ticketAirportBlock}>
                      <Text style={styles.ticketAirportCode}>
                        {outDepAirport.includes('(')
                          ? outDepAirport.split('(')[1].replace(')', '').trim()
                          : outDepAirport.slice(0, 3).toUpperCase() || 'ICN'}
                      </Text>
                      <Text style={styles.ticketAirportName}>{outDepAirport || '인천공항'}</Text>
                      <Text style={styles.ticketTimeText}>{outDepTime || '23:00'}</Text>
                      <Text style={styles.ticketDateText}>{outDepDate}</Text>
                    </View>

                    <View style={styles.ticketCenterArrow}>
                      <Text style={styles.ticketLegTag}>가는 편 직항</Text>
                      <View style={styles.arrowLine} />
                      <Plane size={16} color="#FF6B6B" style={{ marginVertical: 2 }} />
                      {outDepDate !== outArrDate && (
                        <View style={styles.nextDayBadge}>
                          <Text style={styles.nextDayBadgeText}>+1일 익일도착</Text>
                        </View>
                      )}
                    </View>

                    <View style={[styles.ticketAirportBlock, { alignItems: 'flex-end' }]}>
                      <Text style={styles.ticketAirportCode}>
                        {outArrAirport.includes('(')
                          ? outArrAirport.split('(')[1].replace(')', '').trim()
                          : outArrAirport.slice(0, 3).toUpperCase() || 'GUM'}
                      </Text>
                      <Text style={styles.ticketAirportName}>{outArrAirport || '도착공항'}</Text>
                      <Text style={styles.ticketTimeText}>{outArrTime || '04:00'}</Text>
                      <Text style={styles.ticketDateText}>{outArrDate}</Text>
                    </View>
                  </View>
                </View>

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
                  <Text style={styles.label}>출발 공항 및 출발 일시 *</Text>
                  <TextInput
                    value={outDepAirport}
                    onChangeText={setOutDepAirport}
                    placeholder="예: 인천 (ICN) 제2터미널"
                    placeholderTextColor="#94A3B8"
                    style={[styles.input, { marginBottom: 8 }]}
                  />
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

                {/* 3. 도착지 공항 & 도착 날짜 & 시간 (익일 도착 지원!) */}
                <View style={styles.formGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>도착 공항 및 도착 일시 *</Text>
                    <View style={styles.dateHelperButtons}>
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
                  </View>

                  <TextInput
                    value={outArrAirport}
                    onChangeText={setOutArrAirport}
                    placeholder="예: 괌 국제공항 (GUM), 도쿄 나리타 (NRT)"
                    placeholderTextColor="#94A3B8"
                    style={[styles.input, { marginBottom: 8 }]}
                  />

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

                {/* 4. 입국 수속 버퍼 & 도착일 시작 시간 자동 계산 */}
                <View style={styles.bufferCard}>
                  <View style={styles.bufferHeader}>
                    <Sparkles size={15} color="#FF6B6B" style={{ marginRight: 6 }} />
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

            {/* TAB 2: RETURN (오는 편 / 귀국편) */}
            {activeTab === 'return' && (
              <View>
                {/* 귀국편 등록 스위치 */}
                <View style={styles.toggleRowCard}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={styles.toggleTitle}>귀국 항공편(오는 편) 등록하기</Text>
                    <Text style={styles.toggleSubtitle}>여행 마지막 날 귀국 공항 스팟 및 귀국 일정을 자동 생성합니다</Text>
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
                    {/* Return Ticket Preview */}
                    <View style={[styles.ticketCard, { borderColor: '#38BDF8' }]}>
                      <View style={styles.ticketHeader}>
                        <Text style={[styles.ticketAirlineText, { color: '#0284C7' }]}>{retAirline || '대한항공'}</Text>
                        <Text style={[styles.ticketFlightNo, { color: '#0369A1' }]}>{retFlightNumber || 'KE114'}</Text>
                      </View>

                      <View style={styles.ticketRouteRow}>
                        <View style={styles.ticketAirportBlock}>
                          <Text style={[styles.ticketAirportCode, { color: '#0369A1' }]}>
                            {retDepAirport.includes('(')
                              ? retDepAirport.split('(')[1].replace(')', '').trim()
                              : retDepAirport.slice(0, 3).toUpperCase() || 'GUM'}
                          </Text>
                          <Text style={styles.ticketAirportName}>{retDepAirport || '현지공항'}</Text>
                          <Text style={styles.ticketTimeText}>{retDepTime || '15:30'}</Text>
                          <Text style={styles.ticketDateText}>{retDepDate}</Text>
                        </View>

                        <View style={styles.ticketCenterArrow}>
                          <Text style={[styles.ticketLegTag, { color: '#0284C7' }]}>귀국편 직항</Text>
                          <View style={[styles.arrowLine, { backgroundColor: '#BAE6FD' }]} />
                          <Plane
                            size={16}
                            color="#0284C7"
                            style={{ marginVertical: 2, transform: [{ rotate: '180deg' }] }}
                          />
                        </View>

                        <View style={[styles.ticketAirportBlock, { alignItems: 'flex-end' }]}>
                          <Text style={[styles.ticketAirportCode, { color: '#0369A1' }]}>
                            {retArrAirport.includes('(')
                              ? retArrAirport.split('(')[1].replace(')', '').trim()
                              : retArrAirport.slice(0, 3).toUpperCase() || 'ICN'}
                          </Text>
                          <Text style={styles.ticketAirportName}>{retArrAirport || '인천공항'}</Text>
                          <Text style={styles.ticketTimeText}>{retArrTime || '20:00'}</Text>
                          <Text style={styles.ticketDateText}>{retArrDate}</Text>
                        </View>
                      </View>
                    </View>

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

                    {/* 현지 출발 공항 & 일시 */}
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>현지 출발 공항 및 시간 *</Text>
                      <TextInput
                        value={retDepAirport}
                        onChangeText={setRetDepAirport}
                        placeholder="예: 괌 국제공항 (GUM), 도쿄 나리타 (NRT)"
                        placeholderTextColor="#94A3B8"
                        style={[styles.input, { marginBottom: 8 }]}
                      />
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

                    {/* 한국 도착 공항 & 일시 */}
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>한국 도착 공항 및 시간 *</Text>
                      <TextInput
                        value={retArrAirport}
                        onChangeText={setRetArrAirport}
                        placeholder="예: 인천 (ICN) 제1터미널"
                        placeholderTextColor="#94A3B8"
                        style={[styles.input, { marginBottom: 8 }]}
                      />
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
                          placeholder="예: 공항 면세점 픽업"
                          placeholderTextColor="#94A3B8"
                          style={styles.input}
                        />
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptyReturnBox}>
                    <Text style={styles.emptyReturnTitle}>오는 편은 등록하지 않습니다</Text>
                    <Text style={styles.emptyReturnDesc}>편도 여행이거나 귀국편이 미정인 경우 가는 편만 일정에 등록됩니다.</Text>
                  </View>
                )}
              </View>
            )}

            {/* 일정 자동 연동 토글 카드 */}
            <View style={styles.autoScheduleCard}>
              <View style={styles.autoScheduleLeft}>
                <View style={styles.sparkleCircle}>
                  <Sparkles size={16} color="#FF6B6B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.autoScheduleTitle}>내 여행 일정(타임라인)에 자동 추가 ✨</Text>
                  <Text style={styles.autoScheduleDesc}>
                    출발/도착 일시에 맞춰 각 일차의 타임라인에 공항 탑승 및 입국 스팟이 자동 추가됩니다.
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
              <TouchableOpacity
                onPress={handleSave}
                style={styles.primarySaveBtn}
                activeOpacity={0.8}
              >
                <Check size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.primarySaveBtnText}>
                  항공권 저장 및 일정 자동 연동 🚀
                </Text>
              </TouchableOpacity>

              {initialFlight && (
                <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} activeOpacity={0.7}>
                  <Trash2 size={16} color="#EF4444" style={{ marginRight: 6 }} />
                  <Text style={styles.deleteBtnText}>항공권 정보 삭제</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
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
    justifyContent: 'between',
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 4,
    marginTop: 12,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  activeTabButton: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  activeTabButtonText: {
    color: '#FF6B6B',
  },
  scrollBody: {
    marginTop: 2,
  },
  ticketCard: {
    backgroundColor: '#FFF8F8',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE4E6',
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  ticketAirlineText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E11D48',
  },
  ticketFlightNo: {
    fontSize: 13,
    fontWeight: '900',
    color: '#9F1239',
  },
  ticketRouteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ticketAirportBlock: {
    flex: 1,
  },
  ticketAirportCode: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  ticketAirportName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  ticketTimeText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FF6B6B',
    marginTop: 3,
  },
  ticketDateText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  ticketCenterArrow: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  ticketLegTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF6B6B',
    marginBottom: 2,
  },
  arrowLine: {
    width: 48,
    height: 1.5,
    backgroundColor: '#FDA4AF',
  },
  nextDayBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  nextDayBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D97706',
  },
  formGroup: {
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dateHelperButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  smallChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  smallChipActive: {
    backgroundColor: '#FF6B6B',
  },
  smallChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  smallChipTextActive: {
    color: '#FFFFFF',
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
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  innerInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    padding: 0,
  },
  bufferCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 18,
    padding: 14,
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
    color: '#166534',
  },
  bufferDesc: {
    fontSize: 11,
    lineHeight: 16,
    color: '#15803D',
    fontWeight: '500',
    marginBottom: 10,
  },
  bufferPresetsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  bufferPresetBtn: {
    flex: 1,
    backgroundColor: '#DCFCE7',
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  bufferPresetBtnActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  bufferPresetText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  bufferPresetTextActive: {
    color: '#FFFFFF',
  },
  computedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  computedLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  computedTime: {
    fontSize: 14,
    fontWeight: '900',
    color: '#16A34A',
  },
  toggleRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  toggleSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  emptyReturnBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
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
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
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
    fontWeight: '500',
    marginTop: 2,
  },
  actionButtonsCol: {
    gap: 8,
    marginBottom: 16,
  },
  primarySaveBtn: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  primarySaveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  deleteBtn: {
    paddingVertical: 12,
    borderRadius: 14,
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
});
