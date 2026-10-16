import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Trip, ScheduleItem, Place, Member, Expense, LodgingInfo, FlightInfo } from '../types';
import type { TransportMode } from '../utils/routeUtils';
import {
  calculateDistance,
  estimateTravelTime,
  formatMinutesToTime,
  solveTSPNearestNeighbor,
} from '../utils/routeUtils';

interface TripState {
  trips: Trip[];
  currentTrip: Trip | null;
  activeTripId: string;
  selectedDay: number;
  scheduleItems: ScheduleItem[];
  expenses: Expense[];
  dayStartTimes: Record<string, string>;
  dayLodgings: Record<string, LodgingInfo>;
  tripFlights: Record<string, FlightInfo>;

  // Actions
  getActiveTrip: () => Trip;
  getActiveScheduleItems: () => ScheduleItem[];
  setSelectedDay: (day: number) => void;
  setActiveTrip: (id: string) => void;
  setTripFlight: (tripId: string, flight: FlightInfo) => void;
  getTripFlight: (tripId?: string) => FlightInfo | null;
  deleteTripFlight: (tripId: string) => void;

  createTrip: (tripData: {
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    budget?: number;
    coverImage?: string;
    memberNames?: string[];
  }) => Trip;
  deleteTrip: (tripId: string) => void;
  updateTrip: (tripId: string, updates: Partial<Trip>) => void;
  reorderSchedule: (dayNumber: number, fromIndex: number, toIndex: number) => void;
  updateTransportMode: (scheduleId: string, mode: TransportMode) => void;
  updateStayDuration: (scheduleId: string, minutes: number) => void;
  optimizeDayRoute: (dayNumber: number) => void;
  recalculateTimes: (dayNumber: number) => void;
  addPlaceToSchedule: (dayNumber: number, place: Place) => void;
  removeScheduleItem: (scheduleId: string) => void;
  updateCustomTransport: (scheduleId: string, customName: string, minutes: number) => void;
  setDayStartTime: (dayNumber: number, timeStr: string) => void;
  getDayStartTime: (dayNumber: number) => string;
  setDayLodging: (dayNumber: number, lodging: LodgingInfo) => void;
  getDayLodging: (dayNumber: number) => LodgingInfo | null;
  applyFlightStartTime: (dayNumber: number, flightTimeStr: string, bufferMinutes?: number) => string;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (expenseId: string) => void;
  resetToDefaults: () => void;
}

const MOCK_MEMBERS: Member[] = [
  { id: 'm1', name: '나 (민지)', color: '#FF6B6B' },
  { id: 'm2', name: '수현', color: '#4ECDC4' },
  { id: 'm3', name: '도윤', color: '#FFE66D' },
];

const INITIAL_SCHEDULE_ITEMS: ScheduleItem[] = [
  // DAY 1 - Tokyo Shibuya & Harajuku
  {
    id: 's1',
    trip_id: 't_tokyo',
    place_id: 'p1',
    place_name: '푸글렌 도쿄 (Fuglen Tokyo)',
    category: 'CAFE',
    latitude: 35.6664,
    longitude: 139.6917,
    day_number: 1,
    order_index: 1,
    stay_duration_minutes: 60,
    transport_mode: 'WALK',
    travel_duration_minutes: 0,
    arrival_time: '10:00 AM',
    address: '1 Chome-16-11 Tomigaya, Shibuya',
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1000&auto=format&fit=crop',
    memo: '인스타 감성 브루잉 카페',
  },
  {
    id: 's2',
    trip_id: 't_tokyo',
    place_id: 'p5',
    place_name: '도쿄 빔즈 (BEAMS Harajuku)',
    category: 'SHOPPING',
    latitude: 35.6708,
    longitude: 139.7067,
    day_number: 1,
    order_index: 2,
    stay_duration_minutes: 90,
    transport_mode: 'WALK',
    travel_duration_minutes: 18,
    arrival_time: '11:18 AM',
    address: '3 Chome-24-7 Jingumae, Shibuya',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop',
    memo: '하라도쿄 스트릿 브랜드 쇼핑',
  },
  {
    id: 's3',
    trip_id: 't_tokyo',
    place_id: 'p6',
    place_name: '파크 하얏트 도쿄',
    category: 'LODGING',
    latitude: 35.6858,
    longitude: 139.6908,
    day_number: 1,
    order_index: 3,
    stay_duration_minutes: 120,
    transport_mode: 'TRANSIT',
    travel_duration_minutes: 15,
    arrival_time: '01:03 PM',
    address: '3-7-1-2 Nishi-Shinjuku, Shinjuku',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop',
    memo: '체크인 및 쉬어가기',
  },

  // DAY 2 - Kyoto / Fukuoka
  {
    id: 's4',
    trip_id: 't_tokyo',
    place_id: 'p2',
    place_name: '후시미 이나리 신사',
    category: 'ATTRACTION',
    latitude: 34.9671,
    longitude: 135.7727,
    day_number: 2,
    order_index: 1,
    stay_duration_minutes: 90,
    transport_mode: 'TRANSIT',
    travel_duration_minutes: 0,
    arrival_time: '10:00 AM',
    address: '68 Fukakusa Yabunouchicho, Kyoto',
    imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1000&auto=format&fit=crop',
    memo: '붉은 토리이 인생샷',
  },
  {
    id: 's5',
    trip_id: 't_tokyo',
    place_id: 'p4',
    place_name: '이치란 라멘 하카타 본점',
    category: 'RESTAURANT',
    latitude: 33.5932,
    longitude: 130.4037,
    day_number: 2,
    order_index: 2,
    stay_duration_minutes: 60,
    transport_mode: 'DRIVE',
    travel_duration_minutes: 25,
    arrival_time: '11:55 AM',
    address: '5 Chome-3-2 Nakasu, Fukuoka',
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1000&auto=format&fit=crop',
    memo: '돈코츠 라멘 전문점',
  },
];

const DEFAULT_TRIP: Trip = {
  id: 't_tokyo',
  title: '도쿄 3박 4일 감성 여행 🗼',
  destination: '일본 도쿄 / 신주쿠',
  startDate: '2026-11-10',
  endDate: '2026-11-13',
  coverImage: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop',
  status: 'ongoing',
  budget: 1200000,
  createdAt: '2026-10-01T00:00:00Z',
  members: MOCK_MEMBERS,
  places: [],
  schedules: [
    { dayNumber: 1, date: '2026-11-10', placeIds: ['p1', 'p5', 'p6'] },
    { dayNumber: 2, date: '2026-11-11', placeIds: ['p2', 'p4'] },
    { dayNumber: 3, date: '2026-11-12', placeIds: [] },
    { dayNumber: 4, date: '2026-11-13', placeIds: [] },
  ],
};

const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'e1',
    tripId: 't_tokyo',
    amount: 32000,
    category: 'food',
    description: '푸글렌 도쿄 커피 & 디저트',
    payerId: 'm1',
    date: '11.10',
    splitMemberIds: ['m1', 'm2', 'm3'],
  },
  {
    id: 'e2',
    tripId: 't_tokyo',
    amount: 145000,
    category: 'shopping',
    description: '빔즈 하라주쿠 맨투맨 티셔츠',
    payerId: 'm2',
    date: '11.10',
    splitMemberIds: ['m1', 'm2', 'm3'],
  },
  {
    id: 'e3',
    tripId: 't_tokyo',
    amount: 18000,
    category: 'transport',
    description: '도쿄 메트로 패스 3일권',
    payerId: 'm3',
    date: '11.10',
    splitMemberIds: ['m1', 'm2', 'm3'],
  },
];

const OSAKA_TRIP: Trip = {
  id: 't_osaka',
  title: '오사카 식도락 2박 3일 🍢',
  destination: '일본 오사카 / 도톤보리',
  startDate: '2026-12-05',
  endDate: '2026-12-07',
  coverImage: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=800&auto=format&fit=crop',
  status: 'planning',
  budget: 900000,
  createdAt: '2026-10-05T00:00:00Z',
  members: [MOCK_MEMBERS[0], MOCK_MEMBERS[1]],
  places: [],
  schedules: [
    { dayNumber: 1, date: '2026-12-05', placeIds: [] },
    { dayNumber: 2, date: '2026-12-06', placeIds: [] },
    { dayNumber: 3, date: '2026-12-07', placeIds: [] },
  ],
};

const INITIAL_TRIPS: Trip[] = [DEFAULT_TRIP, OSAKA_TRIP];

const INITIAL_DAY_START_TIMES: Record<string, string> = {
  t_tokyo_day_1: '10:00',
  t_tokyo_day_2: '10:00',
};

const INITIAL_DAY_LODGINGS: Record<string, LodgingInfo> = {
  t_tokyo_day_1: {
    name: '호텔 그레이서리 신주쿠 (Hotel Gracery Shinjuku)',
    address: '1 Chome-19-1 Kabukicho, Shinjuku City, Tokyo',
    checkInTime: '15:00',
    checkOutTime: '11:00',
    memo: '고질라 헤드가 보이는 가부키초 중심 호텔. 아고다 예약 완료 (예약번호 #GRC-9281)',
    phoneNumber: '+81 3-6833-1111',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000&auto=format&fit=crop',
  },
};

const INITIAL_TRIP_FLIGHTS: Record<string, FlightInfo> = {
  t_tokyo: {
    flightNumber: 'KE703',
    airline: '대한항공 (Korean Air)',
    departureAirport: 'ICN (인천 제2터미널)',
    arrivalAirport: 'NRT (도쿄 나리타 제1터미널)',
    departureTime: '09:20',
    arrivalTime: '12:40',
    terminal: '제2터미널 탑승구 242',
    bufferMinutes: 90,
    memo: '모바일 체크인 완료 / 수하물 23kg 1개 무료',
  },
  t_osaka: {
    flightNumber: 'OZ112',
    airline: '아시아나항공',
    departureAirport: 'ICN (인천)',
    arrivalAirport: 'KIX (오사카 간사이)',
    departureTime: '08:00',
    arrivalTime: '09:50',
    terminal: '제1터미널',
    bufferMinutes: 60,
    memo: '라피트 특급 열차 교환권 포함',
  },
};

export const useTripStore = create<TripState>()(
  persist(
    (set, get) => ({
  trips: INITIAL_TRIPS,
  currentTrip: DEFAULT_TRIP,
  activeTripId: DEFAULT_TRIP.id,
  selectedDay: 1,
  scheduleItems: INITIAL_SCHEDULE_ITEMS,
  expenses: INITIAL_EXPENSES,
  dayStartTimes: INITIAL_DAY_START_TIMES,
  dayLodgings: INITIAL_DAY_LODGINGS,
  tripFlights: INITIAL_TRIP_FLIGHTS,

  setTripFlight: (tripId: string, flight: FlightInfo) => {
    set((state) => ({
      tripFlights: {
        ...state.tripFlights,
        [tripId]: flight,
      },
    }));
  },

  getTripFlight: (tripId?: string) => {
    const { activeTripId, tripFlights } = get();
    const target = tripId || activeTripId;
    return tripFlights?.[target] || null;
  },

  deleteTripFlight: (tripId: string) => {
    set((state) => {
      const current = { ...state.tripFlights };
      delete current[tripId];
      return { tripFlights: current };
    });
  },


  getActiveTrip: () => {
    const { trips, activeTripId } = get();
    return trips.find((t) => t.id === activeTripId) || DEFAULT_TRIP;
  },

  getActiveScheduleItems: () => {
    const { scheduleItems, activeTripId } = get();
    return scheduleItems.filter((s) => !s.trip_id || s.trip_id === activeTripId);
  },

  setSelectedDay: (day) => set({ selectedDay: day }),

  setActiveTrip: (id) => {
    const trip = get().trips.find((t) => t.id === id) || DEFAULT_TRIP;
    set({ activeTripId: id, currentTrip: trip, selectedDay: 1 });
  },

  createTrip: (tripData) => {
    const tripId = `t_${Date.now()}`;
    const start = new Date(tripData.startDate);
    const end = new Date(tripData.endDate);
    const diffTime = Math.max(0, end.getTime() - start.getTime());
    const dayCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    const schedules: DaySchedule[] = [];
    for (let i = 1; i <= dayCount; i++) {
      const dayDate = new Date(start);
      dayDate.setDate(dayDate.getDate() + (i - 1));
      schedules.push({
        dayNumber: i,
        date: dayDate.toISOString().slice(0, 10),
        placeIds: [],
      });
    }

    const members: Member[] = (tripData.memberNames && tripData.memberNames.length > 0)
      ? tripData.memberNames.map((name, idx) => ({
          id: `m_${Date.now()}_${idx}`,
          name,
          color: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A06CD5', '#20BF55'][idx % 5],
        }))
      : MOCK_MEMBERS;

    const newTrip: Trip = {
      id: tripId,
      title: tripData.title,
      destination: tripData.destination,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      coverImage: tripData.coverImage || 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop',
      status: 'planning',
      budget: tripData.budget || 1000000,
      createdAt: new Date().toISOString(),
      members,
      places: [],
      schedules,
    };

    set((state) => ({
      trips: [newTrip, ...state.trips],
      currentTrip: newTrip,
      activeTripId: newTrip.id,
      selectedDay: 1,
    }));

    return newTrip;
  },

  deleteTrip: (tripId: string) => {
    const { trips, activeTripId } = get();
    const remaining = trips.filter((t) => t.id !== tripId);
    if (remaining.length === 0) {
      set({
        trips: [DEFAULT_TRIP],
        currentTrip: DEFAULT_TRIP,
        activeTripId: DEFAULT_TRIP.id,
        selectedDay: 1,
      });
      return;
    }

    if (activeTripId === tripId) {
      set({
        trips: remaining,
        currentTrip: remaining[0],
        activeTripId: remaining[0].id,
        selectedDay: 1,
      });
    } else {
      set({ trips: remaining });
    }
  },

  updateTrip: (tripId: string, updates: Partial<Trip>) => {
    set((state) => {
      const updatedTrips = state.trips.map((t) => (t.id === tripId ? { ...t, ...updates } : t));
      const current = state.currentTrip?.id === tripId ? { ...state.currentTrip, ...updates } : state.currentTrip;
      return { trips: updatedTrips, currentTrip: current };
    });
  },

  reorderSchedule: (dayNumber, fromIndex, toIndex) => {
    const { scheduleItems, recalculateTimes, activeTripId } = get();
    const isTripMatch = (s: ScheduleItem) => (!s.trip_id || s.trip_id === activeTripId);
    const dayItems = scheduleItems
      .filter((s) => s.day_number === dayNumber && isTripMatch(s))
      .sort((a, b) => a.order_index - b.order_index);

    if (fromIndex < 0 || fromIndex >= dayItems.length || toIndex < 0 || toIndex >= dayItems.length) {
      return;
    }

    const reorderedDay = [...dayItems];
    const [moved] = reorderedDay.splice(fromIndex, 1);
    reorderedDay.splice(toIndex, 0, moved);

    // Update order_index
    const updatedDayItems = reorderedDay.map((item, idx) => ({
      ...item,
      order_index: idx + 1,
    }));

    // Merge back into scheduleItems (preserving items of other trips and other days)
    const otherItems = scheduleItems.filter((s) => s.day_number !== dayNumber || !isTripMatch(s));
    set({ scheduleItems: [...otherItems, ...updatedDayItems] });

    // Recalculate arrival times
    recalculateTimes(dayNumber);
  },

  updateTransportMode: (scheduleId, mode) => {
    const { scheduleItems, recalculateTimes } = get();
    const target = scheduleItems.find((s) => s.id === scheduleId);
    if (!target) return;

    set({
      scheduleItems: scheduleItems.map((s) =>
        s.id === scheduleId ? { ...s, transport_mode: mode } : s
      ),
    });

    recalculateTimes(target.day_number);
  },

  updateStayDuration: (scheduleId, minutes) => {
    const { scheduleItems, recalculateTimes } = get();
    const target = scheduleItems.find((s) => s.id === scheduleId);
    if (!target) return;

    set({
      scheduleItems: scheduleItems.map((s) =>
        s.id === scheduleId ? { ...s, stay_duration_minutes: minutes } : s
      ),
    });

    recalculateTimes(target.day_number);
  },

  optimizeDayRoute: (dayNumber) => {
    const { scheduleItems, recalculateTimes, activeTripId } = get();
    const isTripMatch = (s: ScheduleItem) => (!s.trip_id || s.trip_id === activeTripId);
    const dayItems = scheduleItems
      .filter((s) => s.day_number === dayNumber && isTripMatch(s))
      .sort((a, b) => a.order_index - b.order_index);

    if (dayItems.length <= 2) return;

    const optimized = solveTSPNearestNeighbor(dayItems);
    const updatedDayItems = optimized.map((item, idx) => ({
      ...item,
      order_index: idx + 1,
    }));

    const otherItems = scheduleItems.filter((s) => s.day_number !== dayNumber || !isTripMatch(s));
    set({ scheduleItems: [...otherItems, ...updatedDayItems] });

    recalculateTimes(dayNumber);
  },

  recalculateTimes: (dayNumber) => {
    const { scheduleItems, activeTripId } = get();
    const isTripMatch = (s: ScheduleItem) => (!s.trip_id || s.trip_id === activeTripId);
    const dayItems = scheduleItems
      .filter((s) => s.day_number === dayNumber && isTripMatch(s))
      .sort((a, b) => a.order_index - b.order_index);

    if (dayItems.length === 0) return;

    const startKey = `${activeTripId}_day_${dayNumber}`;
    const startTimeStr = get().dayStartTimes?.[startKey] || '10:00';
    let [startHour, startMin] = startTimeStr.split(':').map((v) => parseInt(v, 10));
    if (isNaN(startHour)) startHour = 10;
    if (isNaN(startMin)) startMin = 0;
    let currentMinutes = startHour * 60 + startMin;

    const updatedDayItems = dayItems.map((item, index) => {
      let travelMins = 0;

      if (index > 0) {
        if (item.custom_travel_minutes !== undefined && item.custom_travel_minutes > 0) {
          travelMins = item.custom_travel_minutes;
        } else {
          const prev = dayItems[index - 1];
          const distKm = calculateDistance(
            prev.latitude,
            prev.longitude,
            item.latitude,
            item.longitude
          );
          travelMins = estimateTravelTime(distKm, item.transport_mode);
        }
        currentMinutes += travelMins;
      }

      const arrivalTime = formatMinutesToTime(currentMinutes);

      // Add stay duration for next stop calculation
      currentMinutes += item.stay_duration_minutes || 60;

      return {
        ...item,
        travel_duration_minutes: travelMins,
        arrival_time: arrivalTime,
      };
    });

    const otherItems = scheduleItems.filter((s) => s.day_number !== dayNumber || !isTripMatch(s));
    set({ scheduleItems: [...otherItems, ...updatedDayItems] });
  },

  updateCustomTransport: (scheduleId, customName, minutes) => {
    const { scheduleItems, recalculateTimes } = get();
    const target = scheduleItems.find((s) => s.id === scheduleId);
    if (!target) return;

    set({
      scheduleItems: scheduleItems.map((s) =>
        s.id === scheduleId
          ? {
              ...s,
              custom_transport_name: customName,
              custom_travel_minutes: minutes,
            }
          : s
      ),
    });

    recalculateTimes(target.day_number);
  },

  setDayStartTime: (dayNumber, timeStr) => {
    const { activeTripId, dayStartTimes, recalculateTimes } = get();
    const startKey = `${activeTripId}_day_${dayNumber}`;
    set({
      dayStartTimes: {
        ...dayStartTimes,
        [startKey]: timeStr,
      },
    });
    recalculateTimes(dayNumber);
  },

  getDayStartTime: (dayNumber) => {
    const { activeTripId, dayStartTimes } = get();
    return dayStartTimes?.[`${activeTripId}_day_${dayNumber}`] || '10:00';
  },

  setDayLodging: (dayNumber, lodging) => {
    const { activeTripId, dayLodgings } = get();
    const key = `${activeTripId}_day_${dayNumber}`;
    set({
      dayLodgings: {
        ...dayLodgings,
        [key]: lodging,
      },
    });
  },

  getDayLodging: (dayNumber) => {
    const { activeTripId, dayLodgings } = get();
    return dayLodgings?.[`${activeTripId}_day_${dayNumber}`] || null;
  },

  applyFlightStartTime: (dayNumber, flightTimeStr, bufferMinutes = 90) => {
    const [h, m] = flightTimeStr.split(':').map((v) => parseInt(v, 10));
    const totalFlightMinutes = (isNaN(h) ? 12 : h) * 60 + (isNaN(m) ? 0 : m);
    const startMins = (totalFlightMinutes + bufferMinutes) % (24 * 60);
    const newH = Math.floor(startMins / 60).toString().padStart(2, '0');
    const newM = (startMins % 60).toString().padStart(2, '0');
    const formatted = `${newH}:${newM}`;
    get().setDayStartTime(dayNumber, formatted);
    return formatted;
  },

  addPlaceToSchedule: (dayNumber, place) => {
    const { scheduleItems, recalculateTimes, activeTripId } = get();
    const isTripMatch = (s: ScheduleItem) => (!s.trip_id || s.trip_id === activeTripId);
    const dayItems = scheduleItems.filter((s) => s.day_number === dayNumber && isTripMatch(s));

    const newItem: ScheduleItem = {
      id: `sched_${Date.now()}`,
      trip_id: activeTripId,
      place_id: place.id,
      place_name: place.name,
      category: place.category as string,
      latitude: place.latitude,
      longitude: place.longitude,
      day_number: dayNumber,
      order_index: dayItems.length + 1,
      stay_duration_minutes: 60,
      transport_mode: 'WALK',
      travel_duration_minutes: 0,
      arrival_time: '10:00 AM',
      address: place.address,
      imageUrl: place.imageUrl,
      memo: place.memo,
    };

    set({ scheduleItems: [...scheduleItems, newItem] });
    recalculateTimes(dayNumber);
  },

  removeScheduleItem: (scheduleId) => {
    const { scheduleItems, recalculateTimes } = get();
    const target = scheduleItems.find((s) => s.id === scheduleId);
    if (!target) return;

    const remaining = scheduleItems.filter((s) => s.id !== scheduleId);
    const targetTripId = target.trip_id || 't_tokyo';

    // Re-index order_index for that day AND that trip only
    const updated = remaining.map((item) => {
      const itemTripId = item.trip_id || 't_tokyo';
      if (
        itemTripId === targetTripId &&
        item.day_number === target.day_number &&
        item.order_index > target.order_index
      ) {
        return { ...item, order_index: item.order_index - 1 };
      }
      return item;
    });

    set({ scheduleItems: updated });
    recalculateTimes(target.day_number);
  },

  addExpense: (expenseData) => {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp_${Date.now()}`,
    };
    set({ expenses: [newExpense, ...get().expenses] });
  },

  deleteExpense: (expenseId) => {
    set({ expenses: get().expenses.filter((e) => e.id !== expenseId) });
  },

  resetToDefaults: () => {
    set({
      trips: INITIAL_TRIPS,
      currentTrip: DEFAULT_TRIP,
      activeTripId: DEFAULT_TRIP.id,
      selectedDay: 1,
      scheduleItems: INITIAL_SCHEDULE_ITEMS,
      expenses: INITIAL_EXPENSES,
      dayStartTimes: INITIAL_DAY_START_TIMES,
      dayLodgings: INITIAL_DAY_LODGINGS,
      tripFlights: INITIAL_TRIP_FLIGHTS,
    });
  },
}),
{
  name: 'pinch-trip-storage',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (state) => ({
    trips: state.trips,
    currentTrip: state.currentTrip,
    activeTripId: state.activeTripId,
    scheduleItems: state.scheduleItems,
    selectedDay: state.selectedDay,
    expenses: state.expenses,
    dayStartTimes: state.dayStartTimes,
    dayLodgings: state.dayLodgings,
    tripFlights: state.tripFlights,
  }),
}
));

