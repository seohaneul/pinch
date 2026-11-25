import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Header } from '../../src/components/common/Header';
import { Card, Badge, EmptyState } from '../../src/components/common/Card';
import { Button } from '../../src/components/common/Button';
import { useTripStore } from '../../src/store/useTripStore';
import { usePlaceStore } from '../../src/store/usePlaceStore';
import { useWalletStore } from '../../src/store/useWalletStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TripMapView } from '../../src/components/planner/PlannerMapView';
import { OptimizeConfirmModal } from '../../src/components/planner/OptimizeConfirmModal';
import { AddSpotModal } from '../../src/components/planner/AddSpotModal';
import { FlightModal } from '../../src/components/planner/FlightModal';
import { DayStartTimeModal } from '../../src/components/planner/DayStartTimeModal';

import { CustomDurationModal } from '../../src/components/planner/CustomDurationModal';
import { CustomTransportModal } from '../../src/components/planner/CustomTransportModal';
import { calculateDistance, formatTravelSummary } from '../../src/utils/geoUtils';
import {
  CurrencyCode,
  WalletCategory,
  CURRENCY_SYMBOLS,
  convertToKrw,
} from '../../src/utils/settlementUtils';
import type { ScheduleItem, Place } from '../../src/types';
import { openInGoogleMaps, openGoogleMapsDirections } from '../../src/utils/mapUtils';
import { formatAmountInput, resolveCurrencyByDestination } from '../../src/utils/formatUtils';
import { TripSwitcherModal } from '../../src/components/trip/TripSwitcherModal';
import { PlaceDetailModal } from '../../src/components/places/PlaceDetailModal';
import {
  MapPin,
  Clock,
  Footprints,
  Bus,
  Car,
  MoveUp,
  MoveDown,
  Trash2,
  Plus,
  Navigation,
  Coins,
  Receipt,
  X,
  Hotel,
  Plane,
  Edit3,
} from '@/components/common/CustomIcons';

export default function PlannerScreen() {
  const insets = useSafeAreaInsets();
  const {
    currentTrip,
    selectedDay,
    scheduleItems,
    setSelectedDay,
    reorderSchedule,
    updateTransportMode,
    updateStayDuration,
    optimizeDayRoute,
    recalculateTimes,
    removeScheduleItem,
    addPlaceToSchedule,
    setDayStartTime,
    getDayStartTime,
    getDayLodgings,
    getTripFlight,
    setTripFlight,
    deleteTripFlight,
    updateCustomTransport,
  } = useTripStore();

  const { places, togglePin, removePlace } = usePlaceStore();
  const { addExpense, members, exchangeRates } = useWalletStore();

  // Active trip members fallback (혼자 여행일 때도 '나'로 지출 기록 가능)
  const rawTripMembers = (currentTrip?.members && currentTrip.members.length > 0)
    ? currentTrip.members.map((m, idx) => ({
      id: m.id,
      name: m.name,
      avatarUrl: m.avatarUrl,
      color: m.color || ['#1B2A4A', '#4ECDC4', '#FFE66D', '#A06CD5', '#20BF55'][idx % 5],
    }))
    : members;
  const tripMembers = rawTripMembers.length > 0
    ? rawTripMembers
    : [{ id: 'self', name: '나', color: '#1B2A4A' }];

  // Expense modal for stop
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [selectedStopForExpense, setSelectedStopForExpense] = useState<ScheduleItem | null>(null);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmountStr, setExpenseAmountStr] = useState('');
  const [expenseCurrency, setExpenseCurrency] = useState<CurrencyCode>('JPY');
  const [expenseCategory, setExpenseCategory] = useState<WalletCategory>('FOOD');
  const [expensePaidBy, setExpensePaidBy] = useState<string>(tripMembers[0]?.id || 'm1');
  const [expenseSplitMembers, setExpenseSplitMembers] = useState<string[]>(tripMembers.map((m) => m.id));
  const [tripSwitcherVisible, setTripSwitcherVisible] = useState(false);

  // Map & Optimization & Spot Picker States
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [activeStopIndex, setActiveStopIndex] = useState(0);
  const [optimizeModalVisible, setOptimizeModalVisible] = useState(false);
  const [addSpotModalVisible, setAddSpotModalVisible] = useState(false);
  const [selectedPlaceForDetail, setSelectedPlaceForDetail] = useState<Place | null>(null);

  // Modals for day start time, flight ticket, custom duration & transport
  const [flightModalVisible, setFlightModalVisible] = useState(false);
  const [startTimeModalVisible, setStartTimeModalVisible] = useState(false);
  const [customDurationStop, setCustomDurationStop] = useState<ScheduleItem | null>(null);
  const [customTransportPair, setCustomTransportPair] = useState<{
    stop: ScheduleItem;
    nextStop: ScheduleItem;
  } | null>(null);

  const dayStartTime = getDayStartTime(selectedDay);
  const dayLodgingsList = getDayLodgings(selectedDay, currentTrip?.id);
  const tripFlight = getTripFlight(currentTrip?.id);

  // Get current day's sorted schedule items (filtered by active trip, including FLIGHT)
  const dayStops = useMemo(
    () =>
      scheduleItems
        .filter(
          (s) =>
            s.day_number === selectedDay &&
            (!s.trip_id || s.trip_id === currentTrip?.id)
        )
        .sort((a, b) => a.order_index - b.order_index),
    [scheduleItems, selectedDay, currentTrip?.id]
  );

  const getStopCategoryLabel = (cat?: string) => {
    const u = (cat || '').toUpperCase();
    if (u === 'FLIGHT') return '항공편';
    if (u === 'CAFE') return '카페';
    if (u === 'RESTAURANT') return '맛집';
    if (u === 'LODGING' || u === 'STAY') return '숙소';
    if (u === 'SHOPPING') return '쇼핑';
    return '명소';
  };

  // Safe schedules list — guards against currentTrip being null during hydration
  const tripSchedules = currentTrip?.schedules ?? [];

  useEffect(() => {
    recalculateTimes(selectedDay);
  }, [selectedDay, currentTrip?.id]);

  const handleOpenExpenseModal = (stop: ScheduleItem) => {
    setSelectedStopForExpense(stop);
    setExpenseTitle(stop.place_name ? `${stop.place_name} 지출` : '일정 지출');
    setExpenseAmountStr('');
    const autoCurr =
      (currentTrip?.currency as CurrencyCode) ||
      resolveCurrencyByDestination(currentTrip?.destination || '');
    setExpenseCurrency(autoCurr);
    const defaultCat: WalletCategory =
      stop.category === 'CAFE' || stop.category === 'RESTAURANT'
        ? 'FOOD'
        : stop.category === 'SHOPPING'
          ? 'SHOPPING'
          : stop.category === 'LODGING'
            ? 'LODGING'
            : 'ACTIVITY';
    setExpenseCategory(defaultCat);
    setExpensePaidBy(tripMembers[0]?.id || 'm1');
    setExpenseSplitMembers(tripMembers.map((m) => m.id));
    setExpenseModalVisible(true);
  };

  const handleSaveStopExpense = () => {
    if (!selectedStopForExpense) return;
    const numAmount = parseFloat(expenseAmountStr.replace(/,/g, ''));
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('알림', '올바른 금액을 입력해주세요.');
      return;
    }

    addExpense({
      trip_id: currentTrip?.id || 't_first',
      schedule_id: selectedStopForExpense.id,
      place_name: selectedStopForExpense.place_name,
      title: expenseTitle.trim() || `${selectedStopForExpense.place_name} 지출`,
      paid_by: expensePaidBy,
      currency: expenseCurrency,
      amount: numAmount,
      exchange_rate: exchangeRates[expenseCurrency] || 1,
      split_members: expenseSplitMembers,
      category: expenseCategory,
    });

    setExpenseModalVisible(false);
    Alert.alert(
      '가계부에 핀치 완료! 💳',
      `"${selectedStopForExpense.place_name}" 지출이 여행 가계부에 등록되었습니다.`
    );
    setSelectedStopForExpense(null);
  };

  const handleOptimizeRoute = () => {
    if (dayStops.length <= 1) {
      Alert.alert('알림', '최적화를 위해 최소 2개 이상의 장소가 필요합니다.');
      return;
    }
    setOptimizeModalVisible(true);
  };

  const handleConfirmOptimization = () => {
    optimizeDayRoute(selectedDay);
    setOptimizeModalVisible(false);
    Alert.alert('최적 동선 적용 완료!', '최단 이동 거리 순으로 동선이 자동 재배치되었습니다.');
  };

  const handleOpenPlaceDetail = (stop: ScheduleItem) => {
    const fullPlace = places.find(
      (p) =>
        p.trip_id === (stop.trip_id || currentTrip?.id) &&
        (p.name === stop.place_name || p.id === stop.place_id)
    );
    setSelectedPlaceForDetail(
      fullPlace || {
        id: stop.place_id || stop.id,
        trip_id: stop.trip_id,
        name: stop.place_name,
        address: stop.address || '',
        category: stop.category as any,
        latitude: stop.latitude,
        longitude: stop.longitude,
        memo: stop.memo || `${stop.place_name} (DAY ${stop.day_number} 일정)`,
        imageUrl: stop.imageUrl,
        rating: 4.8,
        isPinned: false,
        createdAt: new Date().toISOString(),
        tags: ['일정', getStopCategoryLabel(stop.category)],
      }
    );
  };

  // Show a clean empty placeholder when no trip exists
  if (!currentTrip) {
    return (
      <View className="flex-1 bg-background">
        <Header title="동선 플래너 🗺️" subtitle="나만의 여행 일정과 최단 동선" />
        <View className="flex-1 items-center justify-center p-6">
          <View className="w-16 h-16 rounded-3xl bg-primary/10 items-center justify-center mb-4">
            <Plane size={32} color="#1B2A4A" />
          </View>
          <Text className="text-base font-extrabold text-darkText mb-1.5">계획 중인 여행이 없습니다</Text>
          <Text className="text-xs text-mutedText text-center mb-5 leading-5">
            새로운 여행을 등록하고 핫플 장소들을 담아{'\n'}스마트한 동선 플래너를 시작해보세요!
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setTripSwitcherVisible(true)}
            className="bg-primary px-5 py-3 rounded-2xl flex-row items-center shadow-sm"
          >
            <Plus size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text className="text-xs font-bold text-white">새 여행 만들기</Text>
          </TouchableOpacity>
        </View>
        <TripSwitcherModal
          visible={tripSwitcherVisible}
          onClose={() => setTripSwitcherVisible(false)}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Header
        title="PLANNER"
        subtitle={currentTrip.title}
        rightAction={
          <TouchableOpacity
            onPress={handleOptimizeRoute}
            className="flex-row items-center bg-primary px-3.5 py-2 rounded-xl"
          >
            <Text className="text-xs font-bold text-white">동선 최적화</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }}>
        {/* Top Interactive Map Section */}
        <View className="p-4">
          <TripMapView
            stops={dayStops}
            selectedDay={selectedDay}
            isExpanded={isMapExpanded}
            onToggleExpand={() => setIsMapExpanded(!isMapExpanded)}
            activeStopIndex={activeStopIndex}
            onSelectStopIndex={setActiveStopIndex}
            onPressStop={handleOpenPlaceDetail}
          />
        </View>

        {/* Day Selector Tabs — using style props (not className) to avoid NativeWind + gesture handler conflict in nested ScrollViews */}
        <View style={dayTabStyles.container}>
          <FlatList
            data={tripSchedules}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => String(item.dayNumber)}
            renderItem={({ item: schedule }) => {
              const isSelected = selectedDay === schedule.dayNumber;
              const count = scheduleItems.filter(
                (s) =>
                  s.day_number === schedule.dayNumber &&
                  (!s.trip_id || s.trip_id === currentTrip?.id)
              ).length;
              return (
                <TouchableOpacity
                  onPress={() => setSelectedDay(schedule.dayNumber)}
                  activeOpacity={0.8}
                  style={[
                    dayTabStyles.tab,
                    isSelected ? dayTabStyles.tabActive : dayTabStyles.tabInactive,
                  ]}
                >
                  <View>
                    <Text style={[dayTabStyles.tabDayLabel, isSelected ? dayTabStyles.tabTextActive : dayTabStyles.tabTextInactive]}>
                      DAY {schedule.dayNumber}
                    </Text>
                    <Text style={[dayTabStyles.tabDateLabel, isSelected ? dayTabStyles.tabSubTextActive : dayTabStyles.tabSubTextInactive]}>
                      {schedule.date.slice(5)}
                    </Text>
                  </View>
                  <View style={[dayTabStyles.countBadge, isSelected ? dayTabStyles.countBadgeActive : dayTabStyles.countBadgeInactive]}>
                    <Text style={[dayTabStyles.countText, isSelected ? dayTabStyles.countTextActive : dayTabStyles.countTextInactive]}>
                      {count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={{ paddingHorizontal: 0 }}
          />
        </View>

        {/* 1. DAY START TIME EDIT BAR (일정 시작 시간 수정 바) */}
        <View className="px-4 mt-3">
          <View className="bg-white rounded-2xl border border-borderLine p-3 shadow-xs flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-2">
              <View className="w-8 h-8 rounded-xl bg-primary/10 items-center justify-center mr-2">
                <Clock size={16} color="#1B2A4A" />
              </View>
              <View>
                <View className="flex-row items-center">
                  <Text className="text-xs font-bold text-darkText mr-1.5">
                    DAY {selectedDay} 일정 시작:
                  </Text>
                  <View className="bg-primary/15 px-2 py-0.5 rounded-md">
                    <Text className="text-xs font-black text-primary">{dayStartTime}</Text>
                  </View>
                </View>
                <Text className="text-[10px] text-mutedText mt-0.5">
                  시작 시간에 맞춰 모든 스팟의 도착 시간이 자동 연동됩니다
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setStartTimeModalVisible(true)}
              className="bg-primary/10 px-2.5 py-1.5 rounded-xl flex-row items-center"
            >
              <Edit3 size={12} color="#1B2A4A" style={{ marginRight: 3 }} />
              <Text className="text-xs font-bold text-primary">시간 수정</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. DEDICATED DAY LODGING CARD (숙소 표시 카드 - 겹치는 숙소 다중 표시, 수정 버튼 없음) */}
        <View className="px-4 mt-3">
          <View className="bg-white rounded-2xl border border-borderLine p-3.5 shadow-xs">
            <View className="flex-row items-center justify-between pb-2 border-b border-gray-100">
              <View className="flex-row items-center">
                <Hotel size={16} color="#A29BFE" style={{ marginRight: 6 }} />
                <Text className="text-xs font-bold text-darkText">
                  DAY {selectedDay} 숙소 🏨
                </Text>
              </View>
              {dayLodgingsList.length > 1 && (
                <View className="bg-purple-50 px-2 py-0.5 rounded-md">
                  <Text className="text-[10px] font-bold text-purple-700">
                    {dayLodgingsList.length}곳
                  </Text>
                </View>
              )}
            </View>

            {dayLodgingsList.length > 0 ? (
              <View className="pt-2 gap-2.5">
                {dayLodgingsList.map((lodging, idx) => (
                  <View
                    key={lodging.id || `${lodging.name}-${idx}`}
                    className={idx > 0 ? 'pt-2.5 border-t border-gray-100' : ''}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm font-extrabold text-darkText flex-1 mr-2">{lodging.name}</Text>
                      {lodging.stayNights && (
                        <View className="bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          <Text className="text-[10px] font-bold text-rose-600">
                            {lodging.startDay && lodging.endDay ? `DAY ${lodging.startDay}~${lodging.endDay} (${lodging.stayNights}박)` : `${lodging.stayNights}박 연박`}
                          </Text>
                        </View>
                      )}
                    </View>
                    {lodging.address && (
                      <Text className="text-xs text-mutedText mt-0.5" numberOfLines={1}>
                        📍 {lodging.address}
                      </Text>
                    )}
                    <View className="flex-row items-center gap-3 mt-1.5">
                      <View className="flex-row items-center">
                        <Clock size={11} color="#64748B" style={{ marginRight: 3 }} />
                        <Text className="text-[11px] font-semibold text-gray-500">
                          체크인 {lodging.checkInTime || '15:00'} · 체크아웃 {lodging.checkOutTime || '11:00'}
                        </Text>
                      </View>
                      {lodging.startDate && lodging.endDate && (
                        <Text className="text-[10px] text-gray-400 font-medium">
                          ({lodging.startDate} ~ {lodging.endDate})
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className="py-2.5 items-center justify-center">
                <Text className="text-xs font-bold text-mutedText">
                  등록된 숙소가 없습니다. 홈의 숙소 카드에서 숙소를 등록해보세요.
                </Text>
              </View>
            )}
          </View>
        </View>


        {/* Day Itinerary Timeline List */}
        <View className="px-4 mt-5">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-lg font-bold text-darkText">
                DAY {selectedDay} 코스 타임라인 📍
              </Text>
              <Text className="text-xs text-mutedText mt-0.5">
                장소 순서를 변경하거나 이동 수단을 설정해 보세요
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setAddSpotModalVisible(true)}
              className="flex-row items-center bg-primary/10 px-3 py-2 rounded-2xl border border-primary/20"
            >
              <Plus size={14} color="#1B2A4A" />
              <Text className="text-xs font-bold color-primary ml-1">스팟 추가</Text>
            </TouchableOpacity>
          </View>

          {dayStops.length > 0 ? (
            <View className="pl-2">
              {dayStops.map((stop, index) => {
                const isFirst = index === 0;
                const isLast = index === dayStops.length - 1;

                // Calculate distance to next stop
                const nextStop = !isLast ? dayStops[index + 1] : null;
                const nextDist = nextStop
                  ? calculateDistance(
                    stop.latitude,
                    stop.longitude,
                    nextStop.latitude,
                    nextStop.longitude
                  )
                  : 0;

                return (
                  <React.Fragment key={stop.id}>
                    {/* Schedule Stop Card */}
                    <View className="relative pl-7 pb-2 border-l-2 border-primary/30">
                      {/* Numbered Pin Badge */}
                      <View className="absolute -left-[14px] top-0 w-7 h-7 rounded-full bg-primary items-center justify-center border-2 border-white shadow-sm z-10">
                        <Text className="text-xs font-extrabold text-white">
                          {stop.order_index}
                        </Text>
                      </View>

                      <Card className="p-3 bg-surface border border-borderLine">
                        <View className="flex-row items-center justify-between mb-1.5">
                          <View className="flex-row items-center">
                            <View className="bg-primary/10 px-2 py-0.5 rounded-md mr-2 flex-row items-center">
                              <Clock size={11} color="#1B2A4A" />
                              <Text className="text-[11px] font-bold color-primary ml-1">
                                {stop.arrival_time} {stop.category === 'FLIGHT' ? '출발' : '도착'}
                              </Text>
                            </View>
                            <Badge
                              label={getStopCategoryLabel(stop.category)}
                              variant="secondary"
                            />
                          </View>

                          {/* Reorder Up/Down buttons */}
                          <View className="flex-row items-center">
                            {!isFirst && (
                              <TouchableOpacity
                                onPress={() => reorderSchedule(selectedDay, index, index - 1)}
                                className="p-1 mr-1 bg-gray-100 rounded-lg"
                              >
                                <MoveUp size={12} color="#2B2D42" />
                              </TouchableOpacity>
                            )}
                            {!isLast && (
                              <TouchableOpacity
                                onPress={() => reorderSchedule(selectedDay, index, index + 1)}
                                className="p-1 mr-1 bg-gray-100 rounded-lg"
                              >
                                <MoveDown size={12} color="#2B2D42" />
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity
                              onPress={() =>
                                Alert.alert('일정 삭제', `'${stop.place_name}' 일정을 삭제할까요?`, [
                                  { text: '취소', style: 'cancel' },
                                  { text: '삭제', style: 'destructive', onPress: () => removeScheduleItem(stop.id) },
                                ])
                              }
                              className="p-1 bg-rose-50 rounded-lg"
                            >
                              <Trash2 size={12} color="#111C33" />
                            </TouchableOpacity>
                          </View>
                        </View>

                        <TouchableOpacity
                          activeOpacity={0.75}
                          onPress={() => handleOpenPlaceDetail(stop)}
                        >
                          <Text className="text-base font-bold text-darkText mb-1">
                            {stop.place_name}
                          </Text>
                          {stop.memo ? (
                            <Text className="text-xs text-sky-700 font-semibold mb-1" numberOfLines={1}>
                              ℹ️ {stop.memo}
                            </Text>
                          ) : null}
                          {stop.address && (
                            <Text className="text-xs text-mutedText mb-2" numberOfLines={1}>
                              {stop.address}
                            </Text>
                          )}
                        </TouchableOpacity>

                        {/* Stay Duration & Add Expense Quick Action */}
                        <View className="flex-row items-center justify-between pt-2 border-t border-gray-100 mt-1">
                          {stop.category === 'FLIGHT' ? (
                            <Text className="text-[11px] text-mutedText font-medium">항공 이동 일정</Text>
                          ) : (
                          <View className="flex-row items-center flex-wrap">
                            <Text className="text-[11px] text-mutedText mr-1.5 font-medium">체류:</Text>
                            {[30, 60, 90, 120].map((mins) => {
                              const isSelected = stop.stay_duration_minutes === mins;
                              return (
                                <TouchableOpacity
                                  key={mins}
                                  onPress={() => updateStayDuration(stop.id, mins)}
                                  className={`px-1.5 py-0.5 rounded-md mr-1 ${isSelected ? 'bg-darkText' : 'bg-gray-100'
                                    }`}
                                >
                                  <Text
                                    className={`text-[10px] font-bold ${isSelected ? 'text-white' : 'text-gray-600'
                                      }`}
                                  >
                                    {mins}분
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}

                            {/* Show custom stay duration if not one of presets */}
                            {![30, 60, 90, 120].includes(stop.stay_duration_minutes) && (
                              <View className="px-1.5 py-0.5 rounded-md mr-1 bg-darkText">
                                <Text className="text-[10px] font-bold text-white">
                                  {stop.stay_duration_minutes}분
                                </Text>
                              </View>
                            )}

                            {/* Direct stay duration edit button */}
                            <TouchableOpacity
                              onPress={() => setCustomDurationStop(stop)}
                              className="px-1.5 py-0.5 rounded-md bg-primary/10 flex-row items-center"
                            >
                              <Edit3 size={9} color="#1B2A4A" />
                              <Text className="text-[10px] font-bold text-primary ml-0.5">
                                직접
                              </Text>
                            </TouchableOpacity>
                          </View>
                          )}

                          <View className="flex-row items-center gap-1.5">
                            <TouchableOpacity
                              onPress={() => openInGoogleMaps(stop.place_name, stop.latitude, stop.longitude, stop.address)}
                              className="bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full flex-row items-center"
                              accessibilityLabel="구글 지도 열기"
                            >
                              <Navigation size={11} color="#059669" />
                              <Text className="text-[11px] font-bold text-emerald-700 ml-1">
                                지도
                              </Text>
                            </TouchableOpacity>

                            {/* Quick Add Expense button linking to Wallet */}
                            <TouchableOpacity
                              onPress={() => handleOpenExpenseModal(stop)}
                              className="bg-primary/10 px-2.5 py-1 rounded-full flex-row items-center"
                            >
                              <Coins size={12} color="#1B2A4A" />
                              <Text className="text-[11px] font-extrabold text-primary ml-1">
                                지출 추가
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </Card>
                    </View>

                    {/* Transport Connector Mode Selector between consecutive stops */}
                    {!isLast && nextStop && (
                      <View className="pl-7 my-2 relative">
                        <View className="bg-secondary/10 border border-secondary/30 rounded-2xl p-2.5 flex-row items-center justify-between">
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() =>
                              openGoogleMapsDirections(
                                nextStop.latitude,
                                nextStop.longitude,
                                nextStop.place_name,
                                stop.latitude,
                                stop.longitude,
                                stop.place_name,
                                nextStop.transport_mode,
                                nextStop.address,
                                stop.address
                              )
                            }
                            className="flex-row items-center flex-1 mr-2"
                          >
                            <Navigation size={13} color="#3BB3AA" className="mr-1.5" />
                            <Text className="text-xs font-bold color-secondary-dark flex-shrink" numberOfLines={1}>
                              {nextStop.custom_transport_name
                                ? `${nextStop.custom_transport_name} · 약 ${nextStop.custom_travel_minutes || nextStop.travel_duration_minutes}분`
                                : formatTravelSummary(nextDist, nextStop.transport_mode, nextStop.travel_duration_minutes)}
                            </Text>
                            <Text className="text-[10px] font-bold text-emerald-700 ml-1 bg-emerald-100/60 px-1.5 py-0.5 rounded">
                              길찾기 ↗
                            </Text>
                          </TouchableOpacity>

                          {/* Transport Mode Toggle Pills & Custom Entry */}
                          <View className="flex-row items-center bg-surface p-1 rounded-xl border border-secondary/20">
                            <TouchableOpacity
                              onPress={() => updateCustomTransport(nextStop.id, '', 0, 'WALK')}
                              className={`p-1.5 rounded-lg mr-1 ${nextStop.transport_mode === 'WALK' && !nextStop.custom_transport_name ? 'bg-secondary' : ''
                                }`}
                            >
                              <Footprints
                                size={13}
                                color={nextStop.transport_mode === 'WALK' && !nextStop.custom_transport_name ? '#FFF' : '#8D99AE'}
                              />
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => updateCustomTransport(nextStop.id, '', 0, 'TRANSIT')}
                              className={`p-1.5 rounded-lg mr-1 ${nextStop.transport_mode === 'TRANSIT' && !nextStop.custom_transport_name ? 'bg-secondary' : ''
                                }`}
                            >
                              <Bus
                                size={13}
                                color={nextStop.transport_mode === 'TRANSIT' && !nextStop.custom_transport_name ? '#FFF' : '#8D99AE'}
                              />
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => updateCustomTransport(nextStop.id, '', 0, 'DRIVE')}
                              className={`p-1.5 rounded-lg mr-1 ${nextStop.transport_mode === 'DRIVE' && !nextStop.custom_transport_name ? 'bg-secondary' : ''
                                }`}
                            >
                              <Car
                                size={13}
                                color={nextStop.transport_mode === 'DRIVE' && !nextStop.custom_transport_name ? '#FFF' : '#8D99AE'}
                              />
                            </TouchableOpacity>

                            {/* Custom Transport Direct Input */}
                            <TouchableOpacity
                              onPress={() => setCustomTransportPair({ stop, nextStop })}
                              className={`px-1.5 py-1 rounded-lg flex-row items-center ${nextStop.custom_transport_name ? 'bg-secondary' : 'bg-gray-50'
                                }`}
                            >
                              <Edit3
                                size={11}
                                color={nextStop.custom_transport_name ? '#FFF' : '#8D99AE'}
                              />
                              <Text
                                className={`text-[10px] font-bold ml-0.5 ${nextStop.custom_transport_name ? 'text-white' : 'text-gray-500'
                                  }`}
                              >
                                직접
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Direct Add Spot Button (Req [6]) */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setAddSpotModalVisible(true)}
                className="mt-3 flex-row items-center justify-center bg-primary/10 border border-primary/25 rounded-2xl py-3.5"
              >
                <Plus size={16} color="#1B2A4A" className="mr-1.5" />
                <Text className="text-sm font-extrabold text-primary">스팟 추가하기</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <EmptyState
              icon={<MapPin size={28} color="#1B2A4A" />}
              title={`DAY ${selectedDay} 동선이 비어있습니다`}
              description="보관함에서 핫플을 추가하거나 새 장소를 직접 등록해보세요."
              actionButton={
                <Button
                  title="스팟 추가하기"
                  onPress={() => setAddSpotModalVisible(true)}
                  size="sm"
                  icon={<Plus size={14} color="#FFF" />}
                />
              }
            />
          )}
        </View>
      </ScrollView>

      {/* Add Expense for Stop Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={expenseModalVisible}
        onRequestClose={() => setExpenseModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end bg-black/40"
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setExpenseModalVisible(false)}
          />
          <View
            className="w-full bg-surface rounded-t-3xl p-5"
            style={{ paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }}
          >
            <View className="flex-row items-center justify-between pb-3 border-b border-gray-100">
              <View className="flex-row items-center">
                <Receipt size={18} color="#1B2A4A" />
                <Text className="text-base font-extrabold text-darkText ml-1.5">
                  일정 연동 지출 기록 💳
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setExpenseModalVisible(false)}
                className="w-7 h-7 rounded-full bg-gray-100 items-center justify-center"
              >
                <X size={15} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedStopForExpense && (
              <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
                <View className="p-3 bg-gray-50 rounded-2xl mb-3 border border-borderLine">
                  <View className="flex-row items-center mb-0.5">
                    <MapPin size={12} color="#1B2A4A" />
                    <Text className="text-xs font-bold text-primary ml-1">
                      DAY {selectedStopForExpense.day_number} · #{selectedStopForExpense.order_index} 스팟
                    </Text>
                  </View>
                  <Text className="text-base font-extrabold text-darkText">
                    {selectedStopForExpense.place_name}
                  </Text>
                </View>

                {/* Currency selector */}
                <Text className="text-xs font-bold text-mutedText mb-1.5">통화 및 금액</Text>
                <View className="flex-row gap-2 mb-2">
                  {(['JPY', 'KRW', 'USD', 'EUR'] as CurrencyCode[]).map((cur) => (
                    <TouchableOpacity
                      key={cur}
                      onPress={() => setExpenseCurrency(cur)}
                      className={`flex-1 py-2 rounded-xl items-center border ${expenseCurrency === cur
                        ? 'bg-primary border-primary'
                        : 'bg-white border-borderLine'
                        }`}
                    >
                      <Text
                        className={`text-xs font-extrabold ${expenseCurrency === cur ? 'text-white' : 'text-darkText'
                          }`}
                      >
                        {CURRENCY_SYMBOLS[cur]} {cur}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Amount input */}
                <View className="bg-gray-50 border border-borderLine rounded-2xl px-4 py-2.5 flex-row items-center mb-1">
                  <Text className="text-xl font-bold text-primary mr-2">
                    {CURRENCY_SYMBOLS[expenseCurrency]}
                  </Text>
                  <TextInput
                    value={expenseAmountStr}
                    onChangeText={(val) => setExpenseAmountStr(formatAmountInput(val))}
                    placeholder="0"
                    keyboardType="numeric"
                    className="flex-1 text-2xl font-extrabold text-darkText"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                {expenseCurrency !== 'KRW' && (
                  <Text className="text-[11px] font-bold text-primary mb-3 px-1">
                    ≈ 약{' '}
                    {convertToKrw(
                      parseFloat(expenseAmountStr.replace(/,/g, '')) || 0,
                      expenseCurrency,
                      exchangeRates[expenseCurrency]
                    ).toLocaleString()}
                    원 (환율 자동 적용)
                  </Text>
                )}

                {/* Title */}
                <Text className="text-xs font-bold text-mutedText mb-1.5 mt-1">지출 내용</Text>
                <TextInput
                  value={expenseTitle}
                  onChangeText={setExpenseTitle}
                  placeholder="예: 입장료, 점심 식사, 굿즈 구매"
                  className="bg-gray-50 border border-borderLine rounded-2xl px-4 py-2.5 text-sm font-bold text-darkText mb-3"
                  placeholderTextColor="#9CA3AF"
                />

                {/* Paid By */}
                <Text className="text-xs font-bold text-mutedText mb-1.5">결제한 사람</Text>
                <View className="flex-row gap-2 mb-4">
                  {tripMembers.map((m) => {
                    const isSelected = expensePaidBy === m.id;
                    return (
                      <TouchableOpacity
                        key={m.id}
                        onPress={() => setExpensePaidBy(m.id)}
                        className={`flex-1 py-2 rounded-xl border flex-row items-center justify-center ${isSelected
                          ? 'bg-darkText border-darkText'
                          : 'bg-white border-borderLine'
                          }`}
                      >
                        <Text
                          className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-darkText'
                            }`}
                        >
                          {m.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Button
                  title="가계부에 지출 추가하기"
                  onPress={handleSaveStopExpense}
                  variant="primary"
                  size="lg"
                  className="w-full mb-3"
                />
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Trip Switcher Modal */}
      <TripSwitcherModal
        visible={tripSwitcherVisible}
        onClose={() => setTripSwitcherVisible(false)}
      />

      {/* Optimize Route Confirmation Modal (Req [3]) */}
      <OptimizeConfirmModal
        visible={optimizeModalVisible}
        onClose={() => setOptimizeModalVisible(false)}
        onConfirm={handleConfirmOptimization}
        dayStops={dayStops}
        dayNumber={selectedDay}
      />

      {/* Direct Add Spot Modal (Req [6]) */}
      <AddSpotModal
        visible={addSpotModalVisible}
        onClose={() => setAddSpotModalVisible(false)}
        dayNumber={selectedDay}
        existingPlaceIds={dayStops.map((s) => s.place_id)}
        onSelectPlace={(place) => addPlaceToSchedule(selectedDay, place)}
      />

      {/* 장소 상세 설명 모달 (PlaceDetailModal) */}
      <PlaceDetailModal
        visible={Boolean(selectedPlaceForDetail)}
        place={selectedPlaceForDetail}
        onClose={() => setSelectedPlaceForDetail(null)}
        onTogglePin={(id) => togglePin(id)}
        onRemove={(id) => removePlace(id)}
        onAddToPlanner={(targetPlace, day) => {
          addPlaceToSchedule(day, targetPlace);
          setSelectedPlaceForDetail(null);
          Alert.alert(
            '일정에 핀치 완료! 🤏',
            `"${targetPlace.name}" 장소를 Day ${day} 일정에 핀치했어요!\n동선 플래너에서 확인해보세요.`
          );
        }}
      />

      {/* 항공권 입력 및 확인 모달 (FlightModal) */}
      <FlightModal
        visible={flightModalVisible}
        onClose={() => setFlightModalVisible(false)}
        tripStartDate={currentTrip?.startDate}
        tripEndDate={currentTrip?.endDate}
        initialFlight={tripFlight}
        onSaveFlight={(flight) => setTripFlight(currentTrip?.id || 't_first', flight)}
        onDeleteFlight={() => deleteTripFlight(currentTrip?.id || 't_first')}
      />

      {/* 일정 시작 시간 수정 모달 (DayStartTimeModal) */}
      <DayStartTimeModal
        visible={startTimeModalVisible}
        onClose={() => setStartTimeModalVisible(false)}
        dayNumber={selectedDay}
        currentStartTime={dayStartTime}
        onSaveStartTime={(time) => setDayStartTime(selectedDay, time)}
        onOpenFlightModal={() => setFlightModalVisible(true)}
      />


      {/* 체류 시간 직접 입력 모달 (CustomDurationModal) */}
      <CustomDurationModal
        visible={Boolean(customDurationStop)}
        onClose={() => setCustomDurationStop(null)}
        stopName={customDurationStop?.place_name || ''}
        currentMinutes={customDurationStop?.stay_duration_minutes || 60}
        onSave={(mins) => {
          if (customDurationStop) {
            updateStayDuration(customDurationStop.id, mins);
            setCustomDurationStop(null);
          }
        }}
      />

      {/* 이동수단 직접 입력 모달 (CustomTransportModal) */}
      <CustomTransportModal
        visible={Boolean(customTransportPair)}
        onClose={() => setCustomTransportPair(null)}
        fromName={customTransportPair?.stop.place_name || ''}
        toName={customTransportPair?.nextStop.place_name || ''}
        initialModeName={customTransportPair?.nextStop.custom_transport_name || ''}
        initialMinutes={
          customTransportPair?.nextStop.custom_travel_minutes ||
          customTransportPair?.nextStop.travel_duration_minutes ||
          15
        }
        onSave={(modeName, minutes) => {
          if (customTransportPair) {
            updateCustomTransport(customTransportPair.nextStop.id, modeName, minutes);
            setCustomTransportPair(null);
          }
        }}
      />
    </View>
  );
}

// StyleSheet for Day Selector — avoids NativeWind className inside nested ScrollViews
// which causes "Couldn't find a navigation context" in expo-router + gesture handler
const dayTabStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F0F5',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabActive: {
    backgroundColor: '#1B2A4A',
    borderColor: '#1B2A4A',
  },
  tabInactive: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  tabDayLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  tabDateLabel: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabTextInactive: {
    color: '#2B2D42',
  },
  tabSubTextActive: {
    color: 'rgba(255,255,255,0.8)',
  },
  tabSubTextInactive: {
    color: '#8D99AE',
  },
  countBadge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 99,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  countBadgeInactive: {
    backgroundColor: '#E5E7EB',
  },
  countText: {
    fontSize: 10,
    fontWeight: '800',
  },
  countTextActive: {
    color: '#FFFFFF',
  },
  countTextInactive: {
    color: '#4B5563',
  },
});
