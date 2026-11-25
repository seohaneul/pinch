import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { userScopedAsyncStorage } from './userScopedStorage';
import { useAuthStore } from './useAuthStore';
import type { Trip, DaySchedule, ScheduleItem, Place, Member, LodgingInfo, FlightInfo } from '../types';
import type { CurrencyCode } from '../utils/settlementUtils';
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
  dayStartTimes: Record<string, string>;
  dayLodgings: Record<string, LodgingInfo>;
  tripLodgings: Record<string, LodgingInfo[]>;
  tripFlights: Record<string, FlightInfo>;
  hasCompletedOnboarding: boolean;

  // Actions
  setHasCompletedOnboarding: (completed: boolean) => void;
  setSelectedDay: (day: number) => void;
  setActiveTrip: (id: string) => void;
  setTripFlight: (tripId: string, flight: FlightInfo) => void;
  getTripFlight: (tripId?: string) => FlightInfo | null;
  deleteTripFlight: (tripId: string) => void;
  setRangeLodging: (tripId: string, lodging: LodgingInfo, startDayNumber: number, endDayNumber: number) => void;
  setTripLodgings: (tripId: string, lodgings: LodgingInfo[]) => void;
  getDayLodgings: (dayNumber: number, tripId?: string) => LodgingInfo[];

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
    currency?: CurrencyCode;
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
  updateCustomTransport: (
    scheduleId: string,
    customName: string,
    minutes: number,
    mode?: TransportMode
  ) => void;
  setDayStartTime: (dayNumber: number, timeStr: string) => void;
  getDayStartTime: (dayNumber: number) => string;
  setDayLodging: (dayNumber: number, lodging: LodgingInfo) => void;
  getDayLodging: (dayNumber: number) => LodgingInfo | null;
  applyRecommendedItinerary: (tripId: string, items: ScheduleItem[], dayStartTimes?: Record<number, string>) => void;
  resetToDefaults: () => void;
}

function parseDatePartsUtc(isoDate: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate.trim());
  if (m) {
    return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  const parsed = Date.parse(isoDate);
  if (Number.isNaN(parsed)) return NaN;
  const d = new Date(parsed);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function getLocalIsoDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildDaySchedules(
  startDate: string,
  endDate: string,
  existingSchedules?: DaySchedule[]
): DaySchedule[] {
  const startMs = parseDatePartsUtc(startDate);
  const endMs = parseDatePartsUtc(endDate);
  const safeStartMs = Number.isNaN(startMs) ? parseDatePartsUtc(getLocalIsoDate(0)) : startMs;
  const diffTime = Number.isNaN(endMs) ? 0 : Math.max(0, endMs - safeStartMs);
  const dayCount = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);
  const schedules: DaySchedule[] = [];
  for (let i = 1; i <= dayCount; i++) {
    const dayDate = new Date(safeStartMs + (i - 1) * 86400000);
    const existingDay = existingSchedules?.find((s) => s.dayNumber === i);
    schedules.push({
      dayNumber: i,
      date: dayDate.toISOString().slice(0, 10),
      placeIds: existingDay?.placeIds || [],
      notes: existingDay?.notes,
      startTime: existingDay?.startTime,
      lodging: existingDay?.lodging,
    });
  }
  return schedules;
}

function createDefaultEmptyTrip(): Trip {
  const startDate = getLocalIsoDate(0);
  const endDate = getLocalIsoDate(2);
  return {
    id: 't_first',
    title: '나의 첫 여행 ✈️',
    destination: '여행지 설정',
    startDate,
    endDate,
    coverImage: '',
    status: 'ongoing',
    budget: 0,
    createdAt: new Date().toISOString(),
    members: [],
    places: [],
    schedules: buildDaySchedules(startDate, endDate),
  };
}

const DEFAULT_TRIP = createDefaultEmptyTrip();
const INITIAL_DAY_START_TIMES: Record<string, string> = {
  t_first_day_1: '10:00',
  t_first_day_2: '10:00',
  t_first_day_3: '10:00',
};

export const useTripStore = create<TripState>()(
  persist(
    (set, get) => ({
  trips: [DEFAULT_TRIP],
  currentTrip: DEFAULT_TRIP,
  activeTripId: DEFAULT_TRIP.id,
  selectedDay: 1,
  scheduleItems: [],
  dayStartTimes: INITIAL_DAY_START_TIMES,
  dayLodgings: {},
  tripLodgings: {},
  tripFlights: {},
  hasCompletedOnboarding: false,

  setHasCompletedOnboarding: (completed: boolean) => set({ hasCompletedOnboarding: completed }),

  setTripFlight: (tripId: string, flight: FlightInfo) => {
    set((state) => {
      const nonFlightItems = state.scheduleItems.filter(
        (s) => !(s.trip_id === tripId && (s.id.startsWith(`flight_${tripId}`) || s.category === 'FLIGHT'))
      );

      const targetTrip = state.trips.find((t) => t.id === tripId) || state.currentTrip;
      const schedules = targetTrip?.schedules || [];
      const totalDays = Math.max(1, schedules.length);

      const findDayByDate = (dateStr?: string, fallbackDay: number = 1): number => {
        if (!dateStr || schedules.length === 0) return fallbackDay;
        const matched = schedules.find((s) => s.date === dateStr);
        return matched ? matched.dayNumber : fallbackDay;
      };

      const flightScheduleItems: ScheduleItem[] = [];

      const outLeg = flight.outbound || {
        flightNumber: flight.flightNumber,
        airline: flight.airline,
        departureAirport: flight.departureAirport,
        departureDate: flight.departureDate,
        departureTime: flight.departureTime,
        arrivalAirport: flight.arrivalAirport,
        arrivalDate: flight.arrivalDate,
        arrivalTime: flight.arrivalTime,
        arrivalNextDay: flight.arrivalNextDay,
        terminal: flight.terminal,
      };

      if (outLeg.flightNumber || outLeg.departureAirport || outLeg.arrivalAirport) {
        const outDay = findDayByDate(outLeg.departureDate, 1);
        const label = [outLeg.airline, outLeg.flightNumber].filter(Boolean).join(' ').trim() || '가는 편 항공';
        flightScheduleItems.push({
          id: `flight_${tripId}_out`,
          place_id: `flight_${tripId}_out`,
          trip_id: tripId,
          day_number: outDay,
          order_index: 0,
          place_name: `🛫 ${label}`,
          category: 'FLIGHT',
          latitude: 0,
          longitude: 0,
          arrival_time: outLeg.departureTime || '09:30',
          stay_duration_minutes: 0,
          transport_mode: 'TRANSIT',
          travel_duration_minutes: 0,
          memo: `${outLeg.departureAirport || '출발'} (${outLeg.departureTime || ''}) → ${outLeg.arrivalAirport || '도착'} (${outLeg.arrivalTime || ''}${outLeg.arrivalNextDay ? ' +1일' : ''})`,
        });
      }

      if (flight.returnFlight && (flight.returnFlight.flightNumber || flight.returnFlight.departureAirport)) {
        const retLeg = flight.returnFlight;
        const retDay = findDayByDate(retLeg.departureDate, totalDays);
        const retLabel = [retLeg.airline, retLeg.flightNumber].filter(Boolean).join(' ').trim() || '오는 편 항공';
        flightScheduleItems.push({
          id: `flight_${tripId}_ret`,
          place_id: `flight_${tripId}_ret`,
          trip_id: tripId,
          day_number: retDay,
          order_index: 999,
          place_name: `🛬 ${retLabel}`,
          category: 'FLIGHT',
          latitude: 0,
          longitude: 0,
          arrival_time: retLeg.departureTime || '15:00',
          stay_duration_minutes: 0,
          transport_mode: 'TRANSIT',
          travel_duration_minutes: 0,
          memo: `${retLeg.departureAirport || '출발'} (${retLeg.departureTime || ''}) → ${retLeg.arrivalAirport || '도착'} (${retLeg.arrivalTime || ''}${retLeg.arrivalNextDay ? ' +1일' : ''})`,
        });
      }

      return {
        tripFlights: {
          ...state.tripFlights,
          [tripId]: flight,
        },
        scheduleItems: [...flightScheduleItems, ...nonFlightItems],
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

  setSelectedDay: (day) => set({ selectedDay: day }),

  setActiveTrip: (id) => {
    const trip = get().trips.find((t) => t.id === id) || DEFAULT_TRIP;
    set({ activeTripId: id, currentTrip: trip, selectedDay: 1 });
  },

  createTrip: (tripData) => {
    const tripId = `t_${Date.now()}`;
    const schedules = buildDaySchedules(tripData.startDate, tripData.endDate);

    const members: Member[] = (tripData.memberNames && tripData.memberNames.length > 0)
      ? tripData.memberNames.map((name, idx) => ({
          id: `m_${Date.now()}_${idx}`,
          name,
          color: ['#1B2A4A', '#2B50AA', '#3B82F6', '#6366F1', '#0D9488'][idx % 5],
        }))
      : [];

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
    const { trips, activeTripId, scheduleItems, dayStartTimes, dayLodgings, tripLodgings, tripFlights } = get();
    const remaining = trips.filter((t) => t.id !== tripId);

    const nextScheduleItems = scheduleItems.filter((s) => s.trip_id !== tripId);
    const prefix = `${tripId}_`;
    const nextDayStartTimes = Object.fromEntries(
      Object.entries(dayStartTimes).filter(([k]) => !k.startsWith(prefix))
    );
    const nextDayLodgings = Object.fromEntries(
      Object.entries(dayLodgings).filter(([k]) => !k.startsWith(prefix))
    );
    const { [tripId]: _removedLodgings, ...nextTripLodgings } = tripLodgings;
    const { [tripId]: _removedFlights, ...nextTripFlights } = tripFlights;

    if (remaining.length === 0) {
      const freshDefault = createDefaultEmptyTrip();
      set({
        trips: [freshDefault],
        currentTrip: freshDefault,
        activeTripId: freshDefault.id,
        selectedDay: 1,
        scheduleItems: nextScheduleItems,
        dayStartTimes: nextDayStartTimes,
        dayLodgings: nextDayLodgings,
        tripLodgings: nextTripLodgings,
        tripFlights: nextTripFlights,
      });
      return;
    }

    if (activeTripId === tripId) {
      set({
        trips: remaining,
        currentTrip: remaining[0],
        activeTripId: remaining[0].id,
        selectedDay: 1,
        scheduleItems: nextScheduleItems,
        dayStartTimes: nextDayStartTimes,
        dayLodgings: nextDayLodgings,
        tripLodgings: nextTripLodgings,
        tripFlights: nextTripFlights,
      });
    } else {
      set({
        trips: remaining,
        scheduleItems: nextScheduleItems,
        dayStartTimes: nextDayStartTimes,
        dayLodgings: nextDayLodgings,
        tripLodgings: nextTripLodgings,
        tripFlights: nextTripFlights,
      });
    }
  },

  updateTrip: (tripId: string, updates: Partial<Trip>) => {
    set((state) => {
      const rebuildTrip = (t: Trip): Trip => {
        const merged = { ...t, ...updates };
        if (updates.startDate || updates.endDate) {
          merged.schedules = buildDaySchedules(merged.startDate, merged.endDate, t.schedules);
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

    const outboundFlights = dayItems.filter((s) => s.category === 'FLIGHT' && s.order_index < 900);
    const returnFlights = dayItems.filter((s) => s.category === 'FLIGHT' && s.order_index >= 900);
    const placeItems = dayItems.filter((s) => s.category !== 'FLIGHT');

    if (placeItems.length <= 2) return;

    const optimized = solveTSPNearestNeighbor(placeItems);
    const updatedDayItems = [
      ...outboundFlights,
      ...optimized.map((item, idx) => ({
        ...item,
        order_index: idx + 1,
      })),
      ...returnFlights,
    ];

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
      if (item.category === 'FLIGHT') {
        return { ...item, travel_duration_minutes: 0 };
      }

      let travelMins = 0;

      if (index > 0) {
        const prev = dayItems[index - 1];
        if (item.custom_travel_minutes !== undefined && item.custom_travel_minutes > 0) {
          travelMins = item.custom_travel_minutes;
          currentMinutes += travelMins;
        } else if (prev.category !== 'FLIGHT') {
          const distKm = calculateDistance(
            prev.latitude,
            prev.longitude,
            item.latitude,
            item.longitude
          );
          travelMins = estimateTravelTime(distKm, item.transport_mode);
          currentMinutes += travelMins;
        }
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

  updateCustomTransport: (scheduleId, customName, minutes, mode) => {
    const { scheduleItems, recalculateTimes } = get();
    const target = scheduleItems.find((s) => s.id === scheduleId);
    if (!target) return;

    set({
      scheduleItems: scheduleItems.map((s) =>
        s.id === scheduleId
          ? {
              ...s,
              ...(mode ? { transport_mode: mode } : {}),
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
    set((state) => {
      const { activeTripId, dayLodgings, trips, currentTrip } = state;
      const key = `${activeTripId}_day_${dayNumber}`;
      const syncTripLodging = (t: Trip): Trip =>
        t.id === activeTripId && (dayNumber === 1 || !t.lodging?.name)
          ? { ...t, lodging }
          : t;
      return {
        dayLodgings: {
          ...dayLodgings,
          [key]: lodging,
        },
        trips: trips.map(syncTripLodging),
        currentTrip: currentTrip ? syncTripLodging(currentTrip) : currentTrip,
      };
    });
  },

  getDayLodging: (dayNumber) => {
    const { activeTripId, dayLodgings } = get();
    return dayLodgings?.[`${activeTripId}_day_${dayNumber}`] || null;
  },

  setRangeLodging: (tripId: string, lodging: LodgingInfo, startDayNumber: number, endDayNumber: number) => {
    set((state) => {
      const { dayLodgings, tripLodgings, trips, currentTrip } = state;
      const updated = { ...dayLodgings };
      const minDay = Math.min(startDayNumber, endDayNumber);
      const maxDay = Math.max(startDayNumber, endDayNumber);
      const normalizedLodging: LodgingInfo = {
        ...lodging,
        trip_id: tripId,
        startDay: minDay,
        endDay: maxDay,
        stayNights: Math.max(1, maxDay - minDay),
      };
      for (let d = minDay; d <= maxDay; d++) {
        updated[`${tripId}_day_${d}`] = {
          ...normalizedLodging,
          day_number: d,
        };
      }
      const prevList = tripLodgings?.[tripId] || [];
      const filteredList = prevList.filter(
        (item) => !(item.name === normalizedLodging.name && item.startDay === minDay && item.endDay === maxDay)
      );
      const nextList = [...filteredList, normalizedLodging];
      const syncTripLodging = (t: Trip): Trip =>
        t.id === tripId && (minDay === 1 || !t.lodging?.name)
          ? { ...t, lodging: normalizedLodging }
          : t;
      return {
        dayLodgings: updated,
        tripLodgings: {
          ...tripLodgings,
          [tripId]: nextList,
        },
        trips: trips.map(syncTripLodging),
        currentTrip: currentTrip ? syncTripLodging(currentTrip) : currentTrip,
      };
    });
  },

  setTripLodgings: (tripId: string, lodgings: LodgingInfo[]) => {
    set((state) => {
      const { dayLodgings, tripLodgings, trips, currentTrip } = state;
      const updatedDayLodgings = { ...dayLodgings };
      Object.keys(updatedDayLodgings).forEach((k) => {
        if (k.startsWith(`${tripId}_day_`)) {
          delete updatedDayLodgings[k];
        }
      });

      const normalizedList: LodgingInfo[] = lodgings.map((l) => {
        const sDay = l.startDay || 1;
        const eDay = l.endDay || sDay;
        const minDay = Math.min(sDay, eDay);
        const maxDay = Math.max(sDay, eDay);
        const item: LodgingInfo = {
          ...l,
          trip_id: tripId,
          startDay: minDay,
          endDay: maxDay,
          stayNights: l.stayNights || Math.max(1, maxDay - minDay),
        };
        for (let d = minDay; d <= maxDay; d++) {
          updatedDayLodgings[`${tripId}_day_${d}`] = {
            ...item,
            day_number: d,
          };
        }
        return item;
      });

      const primaryLodging = normalizedList[0] || undefined;
      const syncTripLodging = (t: Trip): Trip =>
        t.id === tripId ? { ...t, lodging: primaryLodging } : t;

      return {
        dayLodgings: updatedDayLodgings,
        tripLodgings: {
          ...tripLodgings,
          [tripId]: normalizedList,
        },
        trips: trips.map(syncTripLodging),
        currentTrip: currentTrip ? syncTripLodging(currentTrip) : currentTrip,
      };
    });
  },

  getDayLodgings: (dayNumber: number, tripId?: string) => {
    const { activeTripId, tripLodgings, dayLodgings } = get();
    const targetTripId = tripId || activeTripId;
    const list = tripLodgings?.[targetTripId];
    if (list && list.length > 0) {
      return list.filter((l) => {
        const s = l.startDay || 1;
        const e = l.endDay || s;
        return dayNumber >= s && dayNumber <= e;
      });
    }
    const single = dayLodgings?.[`${targetTripId}_day_${dayNumber}`];
    return single?.name ? [single] : [];
  },

  addPlaceToSchedule: (dayNumber, place) => {
    const { scheduleItems, recalculateTimes, activeTripId } = get();
    const isTripMatch = (s: ScheduleItem) => (!s.trip_id || s.trip_id === activeTripId);
    const dayItems = scheduleItems.filter((s) => s.day_number === dayNumber && isTripMatch(s));

    const defaultMode: TransportMode =
      useAuthStore.getState().defaultTransportMode === 'TRANSIT' ? 'TRANSIT' : 'WALK';

    const newItem: ScheduleItem = {
      id: `sched_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      trip_id: activeTripId,
      place_id: place.id,
      place_name: place.name,
      category: place.category as string,
      latitude: place.latitude,
      longitude: place.longitude,
      day_number: dayNumber,
      order_index: dayItems.length + 1,
      stay_duration_minutes: 60,
      transport_mode: defaultMode,
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
    const { scheduleItems, recalculateTimes, activeTripId } = get();
    const target = scheduleItems.find((s) => s.id === scheduleId);
    if (!target) return;

    const remaining = scheduleItems.filter((s) => s.id !== scheduleId);
    const targetTripId = target.trip_id || activeTripId || 't_first';

    // Re-index order_index for that day AND that trip only
    const updated = remaining.map((item) => {
      const itemTripId = item.trip_id || activeTripId || 't_first';
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

  resetToDefaults: () => {
    const freshDefault = createDefaultEmptyTrip();
    set({
      trips: [freshDefault],
      currentTrip: freshDefault,
      activeTripId: freshDefault.id,
      selectedDay: 1,
      scheduleItems: [],
      dayStartTimes: INITIAL_DAY_START_TIMES,
      dayLodgings: {},
      tripLodgings: {},
      tripFlights: {},
      hasCompletedOnboarding: false,
    });
  },
}),
{
  name: 'pinch-trip-storage',
  storage: createJSONStorage(() => userScopedAsyncStorage),
  skipHydration: true,
  partialize: (state) => ({
    trips: state.trips,
    currentTrip: state.currentTrip,
    activeTripId: state.activeTripId,
    scheduleItems: state.scheduleItems,
    selectedDay: state.selectedDay,
    dayStartTimes: state.dayStartTimes,
    dayLodgings: state.dayLodgings,
    tripLodgings: state.tripLodgings,
    tripFlights: state.tripFlights,
    hasCompletedOnboarding: state.hasCompletedOnboarding,
  }),
}
));

