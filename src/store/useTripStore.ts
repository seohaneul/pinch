import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Trip, DaySchedule, ScheduleItem, Place, Member, Expense, LodgingInfo, FlightInfo } from '../types';
import type { TransportMode } from '../utils/geoUtils';
import {
  calculateDistance,
  estimateTravelTime,
  formatMinutesToTime,
  solveTSPNearestNeighbor,
} from '../utils/geoUtils';
import { resolveCurrencyByDestination } from '../utils/formatUtils';

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
  hasCompletedOnboarding: boolean;

  // Actions
  setHasCompletedOnboarding: (completed: boolean) => void;
  getActiveTrip: () => Trip;
  getActiveScheduleItems: () => ScheduleItem[];
  setSelectedDay: (day: number) => void;
  setActiveTrip: (id: string) => void;
  setTripFlight: (tripId: string, flight: FlightInfo) => void;
  getTripFlight: (tripId?: string) => FlightInfo | null;
  deleteTripFlight: (tripId: string) => void;
  syncFlightToSchedule: (tripId: string, flight: FlightInfo) => void;
  setRangeLodging: (tripId: string, lodging: LodgingInfo, startDayNumber: number, endDayNumber: number) => void;
  clearTripLodgings: (tripId: string) => void;

  createTrip: (tripData: {
    title: string;
    destination: string;
    destinations?: string[];
    startDate: string;
    endDate: string;
    budget?: number;
    coverImage?: string;
    memberNames?: string[];
    centerLat?: number;
    centerLng?: number;
    currency?: 'KRW' | 'JPY' | 'USD' | 'EUR';
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
  applyRecommendedItinerary: (tripId: string, items: ScheduleItem[], dayStartTimes?: Record<number, string>) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (expenseId: string) => void;
  restoreTripsData: (trips: Trip[], scheduleItems?: ScheduleItem[]) => void;
  resetToDefaults: () => void;
}

import {
  DEMO_MEMBERS,
  DEMO_SCHEDULE_ITEMS,
  DEMO_DEFAULT_TRIP,
  DEMO_TRIPS,
  DEMO_DAY_START_TIMES,
  DEMO_DAY_LODGINGS,
  DEMO_TRIP_FLIGHTS,
  DEMO_TRIP_EXPENSES,
} from '../data/mockDemoData';

const MOCK_MEMBERS = DEMO_MEMBERS;
const INITIAL_SCHEDULE_ITEMS = DEMO_SCHEDULE_ITEMS;
const DEFAULT_TRIP = DEMO_DEFAULT_TRIP;
const INITIAL_TRIPS = DEMO_TRIPS;
const INITIAL_EXPENSES = DEMO_TRIP_EXPENSES;
const INITIAL_DAY_START_TIMES = DEMO_DAY_START_TIMES;
const INITIAL_DAY_LODGINGS = DEMO_DAY_LODGINGS;
const INITIAL_TRIP_FLIGHTS = DEMO_TRIP_FLIGHTS;

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
  hasCompletedOnboarding: false,

  setHasCompletedOnboarding: (completed: boolean) => set({ hasCompletedOnboarding: completed }),

  setTripFlight: (tripId: string, flight: FlightInfo) => {
    set((state) => {
      // 항공편 일정 경로 삭제: scheduleItems에 항공편(FLIGHT) 스팟을 넣지 않고 기존 항목도 정리
      const nonFlightItems = state.scheduleItems.filter(
        (s) => !(s.trip_id === tripId && (s.id.startsWith(`flight_${tripId}`) || s.category === 'FLIGHT'))
      );
      return {
        tripFlights: {
          ...state.tripFlights,
          [tripId]: flight,
        },
        scheduleItems: nonFlightItems,
      };
    });
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
      const nonFlightItems = state.scheduleItems.filter(
        (s) => !(s.trip_id === tripId && (s.id.startsWith(`flight_${tripId}`) || s.category === 'FLIGHT'))
      );
      return { tripFlights: current, scheduleItems: nonFlightItems };
    });
  },

  syncFlightToSchedule: (tripId: string, _flight: FlightInfo) => {
    // 항공편은 전용 항공권 예약 정보 카드에서만 표시하며 타임라인/지도 경로에 포함하지 않음
    set((state) => ({
      scheduleItems: state.scheduleItems.filter(
        (s) => !(s.trip_id === tripId && (s.id.startsWith(`flight_${tripId}`) || s.category === 'FLIGHT'))
      ),
    }));
  },

  getActiveTrip: () => {
    const { trips, activeTripId } = get();
    return trips.find((t) => t.id === activeTripId) || DEFAULT_TRIP;
  },

  getActiveScheduleItems: () => {
    const { scheduleItems, activeTripId } = get();
    return scheduleItems.filter(
      (s) => (!s.trip_id || s.trip_id === activeTripId) && s.category !== 'FLIGHT'
    );
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
          color: ['#1B2A4A', '#2B50AA', '#3B82F6', '#6366F1', '#0D9488'][idx % 5],
        }))
      : MOCK_MEMBERS;

    const autoCurrency = tripData.currency || resolveCurrencyByDestination(tripData.destination);

    const newTrip: Trip = {
      id: tripId,
      title: tripData.title,
      destination: tripData.destination,
      destinations: tripData.destinations || [tripData.destination],
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      coverImage: '',
      status: 'planning',
      budget: tripData.budget || 0,
      createdAt: new Date().toISOString(),
      members,
      places: [],
      schedules,
      centerLat: tripData.centerLat,
      centerLng: tripData.centerLng,
      currency: autoCurrency,
    };

    set((state) => {
      const filteredExisting = state.trips.filter(
        (t) => !(t.id === 't_first' && t.destination === '여행지 설정')
      );
      return {
        trips: [newTrip, ...filteredExisting],
        currentTrip: newTrip,
        activeTripId: newTrip.id,
        selectedDay: 1,
        hasCompletedOnboarding: true,
      };
    });

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
      const rebuildTrip = (t: Trip): Trip => {
        const merged = { ...t, ...updates };
        if (updates.startDate || updates.endDate) {
          const start = new Date(merged.startDate);
          const end = new Date(merged.endDate);
          const diffTime = Math.max(0, end.getTime() - start.getTime());
          const dayCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
          const schedules: DaySchedule[] = [];
          for (let i = 1; i <= dayCount; i++) {
            const dayDate = new Date(start);
            dayDate.setDate(dayDate.getDate() + (i - 1));
            const existingDay = t.schedules?.find((s) => s.dayNumber === i);
            schedules.push({
              dayNumber: i,
              date: dayDate.toISOString().slice(0, 10),
              placeIds: existingDay?.placeIds || [],
              notes: existingDay?.notes,
              startTime: existingDay?.startTime,
              lodging: existingDay?.lodging,
            });
          }
          merged.schedules = schedules;
        }
        return merged;
      };

      const updatedTrips = state.trips.map((t) => (t.id === tripId ? rebuildTrip(t) : t));
      const current =
        state.currentTrip?.id === tripId ? rebuildTrip(state.currentTrip) : state.currentTrip;
      return { trips: updatedTrips, currentTrip: current, hasCompletedOnboarding: true };
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

  setRangeLodging: (tripId: string, lodging: LodgingInfo, startDayNumber: number, endDayNumber: number) => {
    const { dayLodgings } = get();
    const updated = { ...dayLodgings };
    const minDay = Math.min(startDayNumber, endDayNumber);
    const maxDay = Math.max(startDayNumber, endDayNumber);
    for (let d = minDay; d <= maxDay; d++) {
      updated[`${tripId}_day_${d}`] = {
        ...lodging,
        trip_id: tripId,
        day_number: d,
        startDay: minDay,
        endDay: maxDay,
      };
    }
    set({ dayLodgings: updated });
  },

  clearTripLodgings: (tripId: string) => {
    const { dayLodgings } = get();
    const updated = { ...dayLodgings };
    Object.keys(updated).forEach((k) => {
      if (k.startsWith(`${tripId}_day_`)) {
        delete updated[k];
      }
    });
    set({ dayLodgings: updated });
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

  applyRecommendedItinerary: (tripId: string, items: ScheduleItem[], dayStartTimes?: Record<number, string>) => {
    const { scheduleItems, recalculateTimes, trips } = get();
    const trip = trips.find((t) => t.id === tripId) || get().currentTrip;
    const nonTripItems = scheduleItems.filter((s) => s.trip_id && s.trip_id !== tripId);

    // Update day start times if provided
    const updatedStartTimes = { ...(get().dayStartTimes || {}) };
    if (dayStartTimes) {
      Object.entries(dayStartTimes).forEach(([day, time]) => {
        updatedStartTimes[`${tripId}_day_${day}`] = time;
      });
    }

    set({
      scheduleItems: [...nonTripItems, ...items],
      dayStartTimes: updatedStartTimes,
    });

    const maxDays = trip?.schedules?.length || 3;
    for (let d = 1; d <= maxDays; d++) {
      recalculateTimes(d);
    }
  },

  restoreTripsData: (trips: Trip[], scheduleItems?: ScheduleItem[]) => {
    if (!trips || trips.length === 0) return;
    const current = trips[0];
    set({
      trips,
      currentTrip: current,
      activeTripId: current.id,
      scheduleItems: scheduleItems || [],
      selectedDay: 1,
    });
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
      hasCompletedOnboarding: false,
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
    hasCompletedOnboarding: state.hasCompletedOnboarding,
  }),
}
));

