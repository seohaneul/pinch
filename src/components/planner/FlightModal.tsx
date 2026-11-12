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
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Plane,
  Clock,
  Check,
  Calendar,
  Trash2,
  Search,
  Sparkles,
  ArrowRight,
} from '@/components/common/CustomIcons';
import type { FlightInfo, SingleFlightLeg, DaySchedule } from '../../types';
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
import { useTripStore } from '../../store/useTripStore';
import { formatTimeInput } from '../../utils/formatUtils';

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
  tripStartDate = '2026-11-10',
  tripEndDate = '2026-11-13',
  initialFlight,
  onSaveFlight,
  onDeleteFlight,
}) => {
  const insets = useSafeAreaInsets();
  const { currentTrip } = useTripStore();
  const [activeTab, setActiveTab] = useState<'outbound' | 'return'>('outbound');

  // 노선 운항편 필터 상태 (항공사 필터 & 편명 검색)
  const [outAirlineFilter, setOutAirlineFilter] = useState<string>('ALL');
  const [outFlightSearchQuery, setOutFlightSearchQuery] = useState('');
  const [retAirlineFilter, setRetAirlineFilter] = useState<string>('ALL');
  const [retFlightSearchQuery, setRetFlightSearchQuery] = useState('');

  // 가는 편 (출발편) 상태
  const [outFlightNumber, setOutFlightNumber] = useState('');
  const [outAirline, setOutAirline] = useState('');
  const [outDepAirport, setOutDepAirport] = useState('');
  const [outDepDate, setOutDepDate] = useState('');
  const [outDepTime, setOutDepTime] = useState('');
  const [outArrAirport, setOutArrAirport] = useState('');
  const [outArrDate, setOutArrDate] = useState('');
  const [outArrTime, setOutArrTime] = useState('');
  const [outArrivalNextDay, setOutArrivalNextDay] = useState(false);
  const [outTerminal, setOutTerminal] = useState('');
  const [outMemo, setOutMemo] = useState('');

  // 오는 편 (귀국편) 상태 — 가는 편과 100% 동일한 구성
  const [hasReturnFlight, setHasReturnFlight] = useState(true);
  const [retFlightNumber, setRetFlightNumber] = useState('');
  const [retAirline, setRetAirline] = useState('');
  const [retDepAirport, setRetDepAirport] = useState('');
  const [retDepDate, setRetDepDate] = useState('');
  const [retDepTime, setRetDepTime] = useState('');
  const [retArrAirport, setRetArrAirport] = useState('');
  const [retArrDate, setRetArrDate] = useState('');
  const [retArrTime, setRetArrTime] = useState('');
  const [retArrivalNextDay, setRetArrivalNextDay] = useState(false);
  const [retTerminal, setRetTerminal] = useState('');
  const [retMemo, setRetMemo] = useState('');

  // 공항 직접 검색 드롭다운 포커스 상태
  const [activeAirportField, setActiveAirportField] = useState<
    'outDep' | 'outArr' | 'retDep' | 'retArr' | null
  >(null);

  const recommendedDestAirports = useMemo(
    () => getRecommendedAirportsForDestination(currentTrip?.destination),
    [currentTrip?.destination]
  );

  const addDaysToDate = (dateStr: string, days: number = 1): string => {
    try {
      const parts = dateStr.split('-').map(Number);
      if (parts.length !== 3 || parts.some(isNaN)) return dateStr;
      const d = new Date(parts[0], parts[1] - 1, parts[2] + days);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    } catch {
      return dateStr;
    }
  };

  useEffect(() => {
    if (!visible) return;
    setActiveAirportField(null);
    setOutAirlineFilter('ALL');
    setOutFlightSearchQuery('');
    setRetAirlineFilter('ALL');
    setRetFlightSearchQuery('');

    const defaultDestAirport =
      recommendedDestAirports.length > 0
        ? `${recommendedDestAirports[0].nameKo} (${recommendedDestAirports[0].code})`
        : '';

    if (initialFlight) {
      const out = initialFlight.outbound || {
        flightNumber: initialFlight.flightNumber || '',
        airline: initialFlight.airline || '',
        departureAirport: initialFlight.departureAirport || '인천국제공항 (ICN)',
        departureDate: initialFlight.departureDate || tripStartDate,
        departureTime: initialFlight.departureTime || '09:30',
        arrivalAirport: initialFlight.arrivalAirport || defaultDestAirport,
        arrivalDate: initialFlight.arrivalDate || initialFlight.departureDate || tripStartDate,
        arrivalTime: initialFlight.arrivalTime || '12:00',
        arrivalNextDay: initialFlight.arrivalNextDay || false,
        terminal: initialFlight.terminal || '',
        memo: initialFlight.memo || '',
      };

      const isOutNext =
        Boolean(out.arrivalNextDay) ||
        Boolean(out.departureDate && out.arrivalDate && out.departureDate !== out.arrivalDate);

      setOutFlightNumber(out.flightNumber || '');
      setOutAirline(out.airline || '');
      setOutDepAirport(out.departureAirport || '인천국제공항 (ICN)');
      setOutDepDate(out.departureDate || tripStartDate);
      setOutDepTime(out.departureTime || '09:30');
      setOutArrAirport(out.arrivalAirport || defaultDestAirport);
      setOutArrDate(out.arrivalDate || out.departureDate || tripStartDate);
      setOutArrTime(out.arrivalTime || '12:00');
      setOutArrivalNextDay(isOutNext);
      setOutTerminal(out.terminal || '');
      setOutMemo(out.memo || '');

      if (initialFlight.returnFlight) {
        setHasReturnFlight(true);
        const ret = initialFlight.returnFlight;
        const isRetNext =
          Boolean(ret.arrivalNextDay) ||
          Boolean(ret.departureDate && ret.arrivalDate && ret.departureDate !== ret.arrivalDate);

        setRetFlightNumber(ret.flightNumber || '');
        setRetAirline(ret.airline || '');
        setRetDepAirport(ret.departureAirport || out.arrivalAirport || defaultDestAirport);
        setRetDepDate(ret.departureDate || tripEndDate);
        setRetDepTime(ret.departureTime || '15:00');
        setRetArrAirport(ret.arrivalAirport || out.departureAirport || '인천국제공항 (ICN)');
        setRetArrDate(ret.arrivalDate || ret.departureDate || tripEndDate);
        setRetArrTime(ret.arrivalTime || '18:00');
        setRetArrivalNextDay(isRetNext);
        setRetTerminal(ret.terminal || '');
        setRetMemo(ret.memo || '');
      } else {
        setHasReturnFlight(false);
        setRetFlightNumber('');
        setRetAirline('');
        setRetDepAirport(out.arrivalAirport || defaultDestAirport);
        setRetDepDate(tripEndDate);
        setRetDepTime('15:00');
        setRetArrAirport(out.departureAirport || '인천국제공항 (ICN)');
        setRetArrDate(tripEndDate);
        setRetArrTime('18:00');
        setRetArrivalNextDay(false);
        setRetTerminal('');
        setRetMemo('');
      }
    } else {
      setOutFlightNumber('');
      setOutAirline('');
      setOutDepAirport('인천국제공항 (ICN)');
      setOutDepDate(tripStartDate);
      setOutDepTime('09:30');
      setOutArrAirport(defaultDestAirport);
      setOutArrDate(tripStartDate);
      setOutArrTime('12:00');
      setOutArrivalNextDay(false);
      setOutTerminal('');
      setOutMemo('');

      setHasReturnFlight(true);
      setRetFlightNumber('');
      setRetAirline('');
      setRetDepAirport(defaultDestAirport);
      setRetDepDate(tripEndDate);
      setRetDepTime('15:00');
      setRetArrAirport('인천국제공항 (ICN)');
      setRetArrDate(tripEndDate);
      setRetArrTime('18:00');
      setRetArrivalNextDay(false);
      setRetTerminal('');
      setRetMemo('');
    }
  }, [visible, initialFlight, tripStartDate, tripEndDate]);

  // 출발 공항 + 도착 공항 기준 전체 운항편 및 필터링된 운항편
  const allOutboundFlights = useMemo(
    () => getFlightsForRoute(outDepAirport, outArrAirport),
    [outDepAirport, outArrAirport]
  );
  const filteredOutboundFlights = useMemo(
    () => getFlightsForRoute(outDepAirport, outArrAirport, outFlightSearchQuery, outAirlineFilter),
    [outDepAirport, outArrAirport, outFlightSearchQuery, outAirlineFilter]
  );

  const allReturnFlights = useMemo(
    () => getFlightsForRoute(retDepAirport, retArrAirport),
    [retDepAirport, retArrAirport]
  );
  const filteredReturnFlights = useMemo(
    () => getFlightsForRoute(retDepAirport, retArrAirport, retFlightSearchQuery, retAirlineFilter),
    [retDepAirport, retArrAirport, retFlightSearchQuery, retAirlineFilter]
  );

  // 검색된 실제 항공편 클릭 시 자동 입력 핸들러
  const handleSelectRealFlight = (leg: 'outbound' | 'return', flight: RealFlightSchedule) => {
    setActiveAirportField(null);

    if (leg === 'outbound') {
      const baseDepDate = outDepDate.trim() || tripStartDate;
      setOutFlightNumber(flight.flightNumber);
      setOutAirline(flight.airline);
      setOutDepAirport(flight.departureAirport);
      setOutArrAirport(flight.arrivalAirport);
      setOutDepTime(flight.departureTime);
      setOutArrTime(flight.arrivalTime);
      setOutArrivalNextDay(flight.arrivalNextDay);
      setOutArrDate(flight.arrivalNextDay ? addDaysToDate(baseDepDate, 1) : baseDepDate);
      setOutTerminal(flight.terminal || '');

      // 귀국편이 아직 비어있는 경우 왕복 짝꿍 항공편까지 자동 세팅
      const pairedReturn = findPairedReturnFlight(flight);
      if (pairedReturn && !retFlightNumber.trim()) {
        const baseRetDate = retDepDate.trim() || tripEndDate;
        setRetFlightNumber(pairedReturn.flightNumber);
        setRetAirline(pairedReturn.airline);
        setRetDepAirport(pairedReturn.departureAirport);
        setRetArrAirport(pairedReturn.arrivalAirport);
        setRetDepTime(pairedReturn.departureTime);
        setRetArrTime(pairedReturn.arrivalTime);
        setRetArrivalNextDay(pairedReturn.arrivalNextDay);
        setRetArrDate(
          pairedReturn.arrivalNextDay ? addDaysToDate(baseRetDate, 1) : baseRetDate
        );
        setRetTerminal(pairedReturn.terminal || '');
      } else if (!retDepAirport.trim()) {
        setRetDepAirport(flight.arrivalAirport);
        setRetArrAirport(flight.departureAirport);
      }
    } else {
      const baseRetDate = retDepDate.trim() || tripEndDate;
      setRetFlightNumber(flight.flightNumber);
      setRetAirline(flight.airline);
      setRetDepAirport(flight.departureAirport);
      setRetArrAirport(flight.arrivalAirport);
      setRetDepTime(flight.departureTime);
      setRetArrTime(flight.arrivalTime);
      setRetArrivalNextDay(flight.arrivalNextDay);
      setRetArrDate(flight.arrivalNextDay ? addDaysToDate(baseRetDate, 1) : baseRetDate);
      setRetTerminal(flight.terminal || '');
    }
  };

  const handleToggleOutNextDay = (nextVal: boolean) => {
    setOutArrivalNextDay(nextVal);
    if (outDepDate) {
      setOutArrDate(nextVal ? addDaysToDate(outDepDate, 1) : outDepDate);
    }
  };

  const handleToggleRetNextDay = (nextVal: boolean) => {
    setRetArrivalNextDay(nextVal);
    if (retDepDate) {
      setRetArrDate(nextVal ? addDaysToDate(retDepDate, 1) : retDepDate);
    }
  };

  const handleSave = () => {
    if (!outDepAirport.trim() && !outArrAirport.trim()) {
      Alert.alert('알림', '가는 편 출발/도착 공항을 검색하여 선택해 주세요.');
      setActiveTab('outbound');
      return;
    }

    const computedOutArrDate = outArrivalNextDay
      ? addDaysToDate(outDepDate.trim() || tripStartDate, 1)
      : outArrDate.trim() || outDepDate.trim() || tripStartDate;

    const outboundData: SingleFlightLeg = {
      flightNumber: outFlightNumber.trim(),
      airline: outAirline.trim() || '출발 항공편',
      departureAirport: outDepAirport.trim() || '인천국제공항 (ICN)',
      departureDate: outDepDate.trim() || tripStartDate,
      departureTime: outDepTime.trim() || '09:30',
      arrivalAirport: outArrAirport.trim(),
      arrivalDate: computedOutArrDate,
      arrivalTime: outArrTime.trim() || '12:00',
      arrivalNextDay: outArrivalNextDay,
      terminal: outTerminal.trim(),
      memo: outMemo.trim(),
    };

    const computedRetArrDate = retArrivalNextDay
      ? addDaysToDate(retDepDate.trim() || tripEndDate, 1)
      : retArrDate.trim() || retDepDate.trim() || tripEndDate;

    const returnData: SingleFlightLeg | undefined = hasReturnFlight
      ? {
          flightNumber: retFlightNumber.trim(),
          airline: retAirline.trim() || outboundData.airline || '귀국 항공편',
          departureAirport: retDepAirport.trim() || outboundData.arrivalAirport,
          departureDate: retDepDate.trim() || tripEndDate,
          departureTime: retDepTime.trim() || '15:00',
          arrivalAirport: retArrAirport.trim() || outboundData.departureAirport,
          arrivalDate: computedRetArrDate,
          arrivalTime: retArrTime.trim() || '18:00',
          arrivalNextDay: retArrivalNextDay,
          terminal: retTerminal.trim(),
          memo: retMemo.trim(),
        }
      : undefined;

    const flightData: FlightInfo = {
      tripType: hasReturnFlight ? 'roundTrip' : 'oneWay',
      autoAddToSchedule: false,
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
      arrivalNextDay: outboundData.arrivalNextDay,
      terminal: outboundData.terminal,
      memo: outboundData.memo,
    };

    onSaveFlight(flightData);
    Alert.alert('항공권 저장 완료', '가는 편 및 오는 편 항공권 정보가 저장되었습니다.');
    onClose();
  };

  const handleDelete = () => {
    Alert.alert('항공권 삭제', '등록된 항공권 정보를 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          if (onDeleteFlight) onDeleteFlight();
          onClose();
        },
      },
    ]);
  };

  // 공항 검색 및 빠른 칩 선택 렌더러
  const renderAirportSearchInput = (
    fieldKey: 'outDep' | 'outArr' | 'retDep' | 'retArr',
    label: string,
    value: string,
    onChange: (val: string) => void,
    placeholder: string,
    quickAirports: AirportItem[]
  ) => {
    const isFocused = activeAirportField === fieldKey;
    const airportCandidates: AirportItem[] = isFocused ? searchAirports(value) : [];

    return (
      <View style={styles.formGroup}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.searchBox, isFocused && styles.searchBoxFocused]}>
          <Search size={15} color="#64748B" style={{ marginRight: 8 }} />
          <TextInput
            value={value}
            onChangeText={(text) => {
              onChange(text);
              setActiveAirportField(fieldKey);
            }}
            onFocus={() => setActiveAirportField(fieldKey)}
            placeholder={placeholder}
            placeholderTextColor="#94A3B8"
            style={styles.innerInput}
          />
          {value.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                onChange('');
                setActiveAirportField(fieldKey);
              }}
              style={{ padding: 4 }}
            >
              <X size={14} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* 빠른 공항 선택 칩 */}
        {quickAirports.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.quickAirportChipsRow}
          >
            {quickAirports.map((ap) => {
              const formatted = `${ap.nameKo} (${ap.code})`;
              const isSelected = value.includes(`(${ap.code})`) || value === formatted;
              return (
                <TouchableOpacity
                  key={`${fieldKey}_quick_${ap.code}`}
                  activeOpacity={0.8}
                  onPress={() => {
                    onChange(formatted);
                    if (fieldKey === 'outArr' && !retDepAirport) {
                      setRetDepAirport(formatted);
                    }
                    if (fieldKey === 'outDep' && !retArrAirport) {
                      setRetArrAirport(formatted);
                    }
                    setActiveAirportField(null);
                  }}
                  style={[styles.quickAirportChip, isSelected && styles.quickAirportChipActive]}
                >
                  <Text
                    style={[
                      styles.quickAirportChipText,
                      isSelected && styles.quickAirportChipTextActive,
                    ]}
                  >
                    {ap.city.split(' ')[0]} ({ap.code})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {isFocused && airportCandidates.length > 0 && (
          <View style={styles.airportDropdown}>
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
                      if (fieldKey === 'outArr' && !retDepAirport) {
                        setRetDepAirport(formatted);
                      }
                      if (fieldKey === 'outDep' && !retArrAirport) {
                        setRetArrAirport(formatted);
                      }
                      setActiveAirportField(null);
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

  // 가는 편 & 오는 편 동일 폼 렌더러 (STEP 1 날짜 -> STEP 2 출발공항 -> STEP 3 도착공항 -> STEP 4 노선 전체 운항편 쫙 뜨기 -> 자동입력)
  const renderFlightLegForm = (leg: 'outbound' | 'return') => {
    const isOutbound = leg === 'outbound';
    const allRouteFlights = isOutbound ? allOutboundFlights : allReturnFlights;
    const filteredRouteFlights = isOutbound ? filteredOutboundFlights : filteredReturnFlights;
    const airlineFilter = isOutbound ? outAirlineFilter : retAirlineFilter;
    const setAirlineFilter = isOutbound ? setOutAirlineFilter : setRetAirlineFilter;
    const searchQuery = isOutbound ? outFlightSearchQuery : retFlightSearchQuery;
    const setSearchQuery = isOutbound ? setOutFlightSearchQuery : setRetFlightSearchQuery;

    // 해당 노선에 취항 중인 항공사 목록 추출
    const availableAirlines = Array.from(new Set(allRouteFlights.map((f) => f.airline)));

    const flightNumber = isOutbound ? outFlightNumber : retFlightNumber;
    const setFlightNumber = isOutbound ? setOutFlightNumber : setRetFlightNumber;
    const airline = isOutbound ? outAirline : retAirline;
    const setAirline = isOutbound ? setOutAirline : setRetAirline;
    const depAirport = isOutbound ? outDepAirport : retDepAirport;
    const setDepAirport = isOutbound ? setOutDepAirport : setRetDepAirport;
    const depDate = isOutbound ? outDepDate : retDepDate;
    const setDepDate = isOutbound ? setOutDepDate : setRetDepDate;
    const depTime = isOutbound ? outDepTime : retDepTime;
    const setDepTime = isOutbound ? setOutDepTime : setRetDepTime;
    const arrAirport = isOutbound ? outArrAirport : retArrAirport;
    const setArrAirport = isOutbound ? setOutArrAirport : setRetArrAirport;
    const arrDate = isOutbound ? outArrDate : retArrDate;
    const setArrDate = isOutbound ? setOutArrDate : setRetArrDate;
    const arrTime = isOutbound ? outArrTime : retArrTime;
    const setArrTime = isOutbound ? setOutArrTime : setRetArrTime;
    const arrivalNextDay = isOutbound ? outArrivalNextDay : retArrivalNextDay;
    const onToggleNextDay = isOutbound ? handleToggleOutNextDay : handleToggleRetNextDay;
    const terminal = isOutbound ? outTerminal : retTerminal;
    const setTerminal = isOutbound ? setOutTerminal : setRetTerminal;
    const memo = isOutbound ? outMemo : retMemo;
    const setMemo = isOutbound ? setOutMemo : setRetMemo;

    return (
      <View>
        {/* STEP 1. 탑승 날짜 선택 */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            1. {isOutbound ? '가는 편 출발 날짜' : '오는 편 출발 날짜'}
          </Text>
          <View style={styles.inputWithIcon}>
            <Calendar size={15} color="#1B2A4A" style={{ marginRight: 8 }} />
            <TextInput
              value={depDate}
              onChangeText={(val) => {
                setDepDate(val);
                if (arrivalNextDay) {
                  setArrDate(addDaysToDate(val, 1));
                } else {
                  setArrDate(val);
                }
              }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94A3B8"
              style={styles.innerInput}
            />
          </View>
        </View>

        {/* STEP 2. 출발 공항 선택 */}
        {renderAirportSearchInput(
          isOutbound ? 'outDep' : 'retDep',
          '2. 출발 공항 선택 *',
          depAirport,
          (val) => {
            setDepAirport(val);
            setAirlineFilter('ALL');
          },
          isOutbound
            ? '출발 공항 검색 (예: 인천, 김포, 김해)'
            : '귀국 출발 공항 검색 (예: 후쿠오카, 나리타, 다낭)',
          isOutbound ? KOREAN_DEPARTURE_AIRPORTS : recommendedDestAirports
        )}

        {/* STEP 3. 도착 공항 선택 */}
        {renderAirportSearchInput(
          isOutbound ? 'outArr' : 'retArr',
          '3. 도착 공항 선택 *',
          arrAirport,
          (val) => {
            setArrAirport(val);
            setAirlineFilter('ALL');
          },
          isOutbound
            ? '도착 공항 검색 (예: 후쿠오카, 나리타, 다낭)'
            : '귀국 도착 공항 검색 (예: 인천, 김포, 김해)',
          isOutbound ? recommendedDestAirports : KOREAN_DEPARTURE_AIRPORTS
        )}

        {/* STEP 4. 출발 공항 + 도착 공항이 선택되면 해당 노선 운항 항공편 리스트 쫙 펼쳐짐 */}
        {allRouteFlights.length > 0 && (
          <View style={styles.routeFlightListContainer}>
            <View style={styles.routeFlightHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Sparkles size={14} color="#1B2A4A" style={{ marginRight: 6 }} />
                <Text style={styles.routeFlightTitle}>
                  조회된 실제 운항편 ({filteredRouteFlights.length}편)
                </Text>
              </View>
              <Text style={styles.routeFlightSubBadge}>터치 시 자동 입력</Text>
            </View>

            {/* 항공사별 필터 칩 (전체, 제주항공, 진에어, 티웨이, 대한항공, 아시아나 등) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.airlineFilterRow}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setAirlineFilter('ALL')}
                style={[
                  styles.airlineFilterChip,
                  airlineFilter === 'ALL' && styles.airlineFilterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.airlineFilterText,
                    airlineFilter === 'ALL' && styles.airlineFilterTextActive,
                  ]}
                >
                  전체 ({allRouteFlights.length})
                </Text>
              </TouchableOpacity>
              {availableAirlines.map((airName) => {
                const active = airlineFilter === airName;
                const count = allRouteFlights.filter((f) => f.airline === airName).length;
                return (
                  <TouchableOpacity
                    key={`${leg}_air_${airName}`}
                    activeOpacity={0.8}
                    onPress={() => setAirlineFilter(active ? 'ALL' : airName)}
                    style={[
                      styles.airlineFilterChip,
                      active && styles.airlineFilterChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.airlineFilterText,
                        active && styles.airlineFilterTextActive,
                      ]}
                    >
                      {airName} ({count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* 편명 / 시간대 빠른 필터 */}
            <View style={styles.inlineFlightFilterInputWrap}>
              <Search size={13} color="#64748B" style={{ marginRight: 6 }} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="편명(예: 7C1402, LJ261) 또는 출발시간(예: 08:) 필터"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                style={styles.inlineFlightFilterInput}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={13} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* 운항 항공편 세로 리스트 */}
            <View style={styles.flightVerticalList}>
              {filteredRouteFlights.map((item) => {
                const isSelected =
                  flightNumber.trim().toUpperCase() === item.flightNumber.toUpperCase();
                return (
                  <TouchableOpacity
                    key={`${leg}_row_${item.id}`}
                    activeOpacity={0.82}
                    onPress={() => handleSelectRealFlight(leg, item)}
                    style={[
                      styles.flightRowItem,
                      isSelected && styles.flightRowItemActive,
                    ]}
                  >
                    {/* 좌측: 항공사 컬러 배지 + 항공사명 & 편명 */}
                    <View style={styles.flightRowLeft}>
                      <View
                        style={[
                          styles.airlineBadgeDot,
                          { backgroundColor: item.airlineColor || '#1B2A4A' },
                        ]}
                      >
                        <Text style={styles.airlineBadgeCodeText}>{item.airlineCode}</Text>
                      </View>
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <Text
                            style={[
                              styles.flightRowAirlineName,
                              isSelected && { color: '#FFFFFF' },
                            ]}
                          >
                            {item.airline}
                          </Text>
                          <Text
                            style={[
                              styles.flightRowNumberText,
                              isSelected && { color: '#93C5FD' },
                            ]}
                          >
                            {item.flightNumber}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.flightRowTerminalText,
                            isSelected && { color: '#CBD5E1' },
                          ]}
                        >
                          {item.terminal} · {item.durationText}
                        </Text>
                      </View>
                    </View>

                    {/* 우측: 출발시간 -> 도착시간 (+1일) & 선택 표시 */}
                    <View style={styles.flightRowRight}>
                      <View style={styles.flightRowTimesBox}>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text
                            style={[
                              styles.flightRowTimeBig,
                              isSelected && { color: '#FFFFFF' },
                            ]}
                          >
                            {item.departureTime}
                          </Text>
                          <Text
                            style={[
                              styles.flightRowCodeSmall,
                              isSelected && { color: '#CBD5E1' },
                            ]}
                          >
                            {item.departureCode}
                          </Text>
                        </View>

                        <ArrowRight
                          size={12}
                          color={isSelected ? '#93C5FD' : '#94A3B8'}
                          style={{ marginHorizontal: 6 }}
                        />

                        <View style={{ alignItems: 'flex-start' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text
                              style={[
                                styles.flightRowTimeBig,
                                isSelected && { color: '#FFFFFF' },
                              ]}
                            >
                              {item.arrivalTime}
                            </Text>
                            {item.arrivalNextDay && (
                              <Text style={styles.flightRowNextDayTag}>+1일</Text>
                            )}
                          </View>
                          <Text
                            style={[
                              styles.flightRowCodeSmall,
                              isSelected && { color: '#CBD5E1' },
                            ]}
                          >
                            {item.arrivalCode}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.flightRowSelectPill,
                          isSelected && styles.flightRowSelectPillActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.flightRowSelectPillText,
                            isSelected && styles.flightRowSelectPillTextActive,
                          ]}
                        >
                          {isSelected ? '선택됨' : '선택'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* STEP 5. 자동 입력된 항공편 상세 확인 및 수정 */}
        <View style={styles.autoFilledSectionBox}>
          <Text style={styles.autoFilledSectionTitle}>
            선택된 항공편 상세 (직접 수정 가능)
          </Text>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>항공편명</Text>
              <TextInput
                value={flightNumber}
                onChangeText={setFlightNumber}
                placeholder={isOutbound ? '예: 7C1402' : '예: 7C1401'}
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                style={styles.input}
              />
            </View>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>항공사</Text>
              <TextInput
                value={airline}
                onChangeText={setAirline}
                placeholder="예: 제주항공, 진에어, 대한항공"
                placeholderTextColor="#94A3B8"
                style={styles.input}
              />
            </View>
          </View>

          <View style={[styles.row, { marginBottom: 10 }]}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>출발 시간</Text>
              <View style={styles.inputWithIcon}>
                <Clock size={14} color="#64748B" style={{ marginRight: 6 }} />
                <TextInput
                  value={depTime}
                  onChangeText={(val) => setDepTime(formatTimeInput(val))}
                  placeholder="09:30"
                  keyboardType="number-pad"
                  maxLength={5}
                  placeholderTextColor="#94A3B8"
                  style={styles.innerInput}
                />
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.label}>도착 시간</Text>
              <View style={styles.inputWithIcon}>
                <Clock size={14} color="#64748B" style={{ marginRight: 6 }} />
                <TextInput
                  value={arrTime}
                  onChangeText={(val) => setArrTime(formatTimeInput(val))}
                  placeholder="12:00"
                  keyboardType="number-pad"
                  maxLength={5}
                  placeholderTextColor="#94A3B8"
                  style={styles.innerInput}
                />
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onToggleNextDay(false)}
              style={[styles.smallChip, !arrivalNextDay && styles.smallChipActive]}
            >
              <Text style={[styles.smallChipText, !arrivalNextDay && styles.smallChipTextActive]}>
                당일 도착 ({depDate})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onToggleNextDay(true)}
              style={[styles.smallChip, arrivalNextDay && styles.smallChipActive]}
            >
              <Text style={[styles.smallChipText, arrivalNextDay && styles.smallChipTextActive]}>
                +1일 익일 도착 ({addDaysToDate(depDate, 1)})
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8, marginBottom: 0 }]}>
              <Text style={styles.label}>터미널 / 탑승구</Text>
              <TextInput
                value={terminal}
                onChangeText={setTerminal}
                placeholder="예: 제1터미널"
                placeholderTextColor="#94A3B8"
                style={styles.input}
              />
            </View>
            <View style={[styles.formGroup, { flex: 1, marginBottom: 0 }]}>
              <Text style={styles.label}>메모</Text>
              <TextInput
                value={memo}
                onChangeText={setMemo}
                placeholder="예: 수하물 15kg"
                placeholderTextColor="#94A3B8"
                style={styles.input}
              />
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Plane size={18} color="#1B2A4A" />
              </View>
              <View>
                <Text style={styles.title}>항공권 조회 및 설정</Text>
                <Text style={styles.subtitle}>
                  날짜 · 출발공항 · 도착공항을 선택하면 운항편이 자동으로 표시됩니다
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Tab Navigation: 가는 편 vs 오는 편 */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              onPress={() => {
                setActiveTab('outbound');
                setActiveAirportField(null);
              }}
              style={[styles.tabBtn, activeTab === 'outbound' && styles.tabBtnActive]}
              activeOpacity={0.8}
            >
              <Plane
                size={14}
                color={activeTab === 'outbound' ? '#1B2A4A' : '#64748B'}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.tabBtnText, activeTab === 'outbound' && styles.tabBtnTextActive]}>
                가는 편 (출발편)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setActiveTab('return');
                setActiveAirportField(null);
              }}
              style={[styles.tabBtn, activeTab === 'return' && styles.tabBtnActive]}
              activeOpacity={0.8}
            >
              <Plane
                size={14}
                color={activeTab === 'return' ? '#1B2A4A' : '#64748B'}
                style={{ marginRight: 6, transform: [{ rotate: '180deg' }] }}
              />
              <Text style={[styles.tabBtnText, activeTab === 'return' && styles.tabBtnTextActive]}>
                오는 편 (귀국편)
              </Text>
              {!hasReturnFlight && <View style={styles.tabOffBadge} />}
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {activeTab === 'outbound' ? (
              renderFlightLegForm('outbound')
            ) : (
              <View>
                <View style={styles.toggleRowCard}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={styles.toggleTitle}>오는 편 (귀국 항공편) 함께 등록</Text>
                    <Text style={styles.toggleSubtitle}>
                      왕복 항공권인 경우 귀국편 출도착 정보를 동일하게 선택합니다
                    </Text>
                  </View>
                  <Switch
                    value={hasReturnFlight}
                    onValueChange={setHasReturnFlight}
                    trackColor={{ false: '#CBD5E1', true: '#1B2A4A' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {hasReturnFlight ? (
                  renderFlightLegForm('return')
                ) : (
                  <View style={styles.oneWayNoticeBox}>
                    <Text style={styles.oneWayNoticeText}>
                      편도 항공권으로 설정되었습니다. 귀국편을 추가하려면 위 스위치를 켜주세요.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footerRow}>
            {initialFlight && onDeleteFlight && (
              <TouchableOpacity
                onPress={handleDelete}
                style={styles.deleteBtn}
                activeOpacity={0.8}
              >
                <Trash2 size={16} color="#EF4444" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleSave}
              style={styles.saveBtn}
              activeOpacity={0.85}
            >
              <Check size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.saveBtnText}>항공권 정보 저장하기</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
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
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EEF2F8',
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
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginTop: 12,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 9,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#1B2A4A',
  },
  tabOffBadge: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
    marginLeft: 6,
  },
  body: {
    marginBottom: 12,
  },
  quickAirportChipsRow: {
    gap: 6,
    paddingTop: 8,
    paddingBottom: 2,
  },
  quickAirportChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickAirportChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#1B2A4A',
  },
  quickAirportChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  quickAirportChipTextActive: {
    color: '#1B2A4A',
    fontWeight: '800',
  },
  routeFlightListContainer: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  routeFlightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  routeFlightTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1B2A4A',
  },
  routeFlightSubBadge: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#2B50AA',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  airlineFilterRow: {
    gap: 6,
    paddingBottom: 8,
  },
  airlineFilterChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  airlineFilterChipActive: {
    backgroundColor: '#1B2A4A',
    borderColor: '#1B2A4A',
  },
  airlineFilterText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  airlineFilterTextActive: {
    color: '#FFFFFF',
  },
  inlineFlightFilterInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 36,
    marginBottom: 8,
  },
  inlineFlightFilterInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    paddingVertical: 0,
  },
  flightVerticalList: {
    gap: 7,
  },
  flightRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  flightRowItemActive: {
    backgroundColor: '#1B2A4A',
    borderColor: '#1B2A4A',
  },
  flightRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  airlineBadgeDot: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  airlineBadgeCodeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  flightRowAirlineName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  flightRowNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2B50AA',
  },
  flightRowTerminalText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  flightRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flightRowTimesBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flightRowTimeBig: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  flightRowCodeSmall: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  flightRowNextDayTag: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#EF4444',
    marginLeft: 2,
  },
  flightRowSelectPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  flightRowSelectPillActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  flightRowSelectPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1B2A4A',
  },
  flightRowSelectPillTextActive: {
    color: '#FFFFFF',
  },
  autoFilledSectionBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
  },
  autoFilledSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1B2A4A',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchBoxFocused: {
    borderColor: '#1B2A4A',
    backgroundColor: '#FFFFFF',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  innerInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    paddingVertical: 0,
  },
  airportDropdown: {
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
    color: '#64748B',
  },
  smallChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  smallChipActive: {
    backgroundColor: '#1B2A4A',
    borderColor: '#1B2A4A',
  },
  smallChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  smallChipTextActive: {
    color: '#FFFFFF',
  },
  toggleRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  toggleSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  oneWayNoticeBox: {
    padding: 20,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  oneWayNoticeText: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  deleteBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#1B2A4A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
});
