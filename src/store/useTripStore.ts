import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Trip, ScheduleItem, Place, Member, Expense } from '../types';
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

  // Actions
  getActiveTrip: () => Trip;
  setSelectedDay: (day: number) => void;
  setActiveTrip: (id: string) => void;
  reorderSchedule: (dayNumber: number, fromIndex: number, toIndex: number) => void;
  updateTransportMode: (scheduleId: string, mode: TransportMode) => void;
  updateStayDuration: (scheduleId: string, minutes: number) => void;
  optimizeDayRoute: (dayNumber: number) => void;
  recalculateTimes: (dayNumber: number) => void;
  addPlaceToSchedule: (dayNumber: number, place: Place) => void;
  removeScheduleItem: (scheduleId: string) => void;
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
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop',
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
    imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&auto=format&fit=crop',
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
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop',
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

export const useTripStore = create<TripState>()(
  persist(
    (set, get) => ({
  trips: [DEFAULT_TRIP],
  currentTrip: DEFAULT_TRIP,
  activeTripId: DEFAULT_TRIP.id,
  selectedDay: 1,
  scheduleItems: INITIAL_SCHEDULE_ITEMS,
  expenses: INITIAL_EXPENSES,

  getActiveTrip: () => {
    const { trips, activeTripId } = get();
    return trips.find((t) => t.id === activeTripId) || DEFAULT_TRIP;
  },

  setSelectedDay: (day) => set({ selectedDay: day }),

  setActiveTrip: (id) => {
    const trip = get().trips.find((t) => t.id === id) || DEFAULT_TRIP;
    set({ activeTripId: id, currentTrip: trip });
  },

  reorderSchedule: (dayNumber, fromIndex, toIndex) => {
    const { scheduleItems, recalculateTimes } = get();
    const dayItems = scheduleItems
      .filter((s) => s.day_number === dayNumber)
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

    // Merge back into scheduleItems
    const otherItems = scheduleItems.filter((s) => s.day_number !== dayNumber);
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
    const { scheduleItems, recalculateTimes } = get();
    const dayItems = scheduleItems
      .filter((s) => s.day_number === dayNumber)
      .sort((a, b) => a.order_index - b.order_index);

    if (dayItems.length <= 2) return;

    const optimized = solveTSPNearestNeighbor(dayItems);
    const updatedDayItems = optimized.map((item, idx) => ({
      ...item,
      order_index: idx + 1,
    }));

    const otherItems = scheduleItems.filter((s) => s.day_number !== dayNumber);
    set({ scheduleItems: [...otherItems, ...updatedDayItems] });

    recalculateTimes(dayNumber);
  },

  recalculateTimes: (dayNumber) => {
    const { scheduleItems } = get();
    const dayItems = scheduleItems
      .filter((s) => s.day_number === dayNumber)
      .sort((a, b) => a.order_index - b.order_index);

    if (dayItems.length === 0) return;

    let currentMinutes = 10 * 60; // Start day at 10:00 AM (600 mins from midnight)

    const updatedDayItems = dayItems.map((item, index) => {
      let travelMins = 0;

      if (index > 0) {
        const prev = dayItems[index - 1];
        const distKm = calculateDistance(
          prev.latitude,
          prev.longitude,
          item.latitude,
          item.longitude
        );
        travelMins = estimateTravelTime(distKm, item.transport_mode);
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

    const otherItems = scheduleItems.filter((s) => s.day_number !== dayNumber);
    set({ scheduleItems: [...otherItems, ...updatedDayItems] });
  },

  addPlaceToSchedule: (dayNumber, place) => {
    const { scheduleItems, recalculateTimes } = get();
    const dayItems = scheduleItems.filter((s) => s.day_number === dayNumber);

    const newItem: ScheduleItem = {
      id: `sched_${Date.now()}`,
      trip_id: get().activeTripId,
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

    // Re-index order_index for that day
    const updated = remaining.map((item) => {
      if (item.day_number === target.day_number && item.order_index > target.order_index) {
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
      trips: [DEFAULT_TRIP],
      currentTrip: DEFAULT_TRIP,
      activeTripId: DEFAULT_TRIP.id,
      selectedDay: 1,
      scheduleItems: INITIAL_SCHEDULE_ITEMS,
      expenses: INITIAL_EXPENSES,
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
  }),
}
));
