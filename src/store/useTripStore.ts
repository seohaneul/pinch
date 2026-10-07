import { create } from 'zustand';
import { Trip, Expense, Member, Place } from '../types';

interface TripState {
  trips: Trip[];
  activeTripId: string | null;
  expenses: Expense[];
  
  // Getters
  getActiveTrip: () => Trip | undefined;
  
  // Actions
  setActiveTrip: (id: string) => void;
  createTrip: (trip: Omit<Trip, 'id' | 'createdAt' | 'places' | 'schedules' | 'members'>) => void;
  addPlaceToTrip: (tripId: string, dayNumber: number, place: Place) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (expenseId: string) => void;
}

const MOCK_MEMBERS: Member[] = [
  { id: 'm1', name: '나 (민지)', color: '#FF6B6B' },
  { id: 'm2', name: '수현', color: '#4ECDC4' },
  { id: 'm3', name: '도윤', color: '#FFE66D' },
];

const INITIAL_TRIPS: Trip[] = [
  {
    id: 't1',
    title: '성수 & 북촌 핫플 도장깨기 🥐',
    destination: '서울 성수/북촌',
    startDate: '2026-10-15',
    endDate: '2026-10-17',
    coverImage: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=800&auto=format&fit=crop',
    status: 'ongoing',
    budget: 500000,
    createdAt: '2026-10-01T00:00:00Z',
    members: MOCK_MEMBERS,
    places: [
      {
        id: 'p1',
        name: '런던베이글뮤지엄 안국점',
        address: '서울 종로구 북촌로4길 20',
        category: 'cafe',
        latitude: 37.5794,
        longitude: 126.9866,
        isPinned: true,
        createdAt: '2026-10-01T10:00:00Z',
      },
      {
        id: 'p4',
        name: '난포 성수',
        address: '서울 성동구 서울숲4길 18.8',
        category: 'restaurant',
        latitude: 37.5475,
        longitude: 127.0435,
        isPinned: true,
        createdAt: '2026-10-04T18:00:00Z',
      }
    ],
    schedules: [
      { dayNumber: 1, date: '2026-10-15', placeIds: ['p1'], notes: '북촌 아침 베이글 투어' },
      { dayNumber: 2, date: '2026-10-16', placeIds: ['p4'], notes: '성수동 감성 한식 레스토랑' },
      { dayNumber: 3, date: '2026-10-17', placeIds: [], notes: '쇼핑 및 자유시간' },
    ],
  },
  {
    id: 't2',
    title: '제주도 힐링 힐링 카페 투어 🌊',
    destination: '제주 애월 & 애월',
    startDate: '2026-11-01',
    endDate: '2026-11-04',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
    status: 'planning',
    budget: 800000,
    createdAt: '2026-10-05T00:00:00Z',
    members: MOCK_MEMBERS,
    places: [],
    schedules: [],
  },
];

const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'e1',
    tripId: 't1',
    payerId: 'm1',
    amount: 45000,
    category: 'food',
    description: '런던베이글 브런치',
    date: '2026-10-15',
    splitMemberIds: ['m1', 'm2', 'm3'],
  },
  {
    id: 'e2',
    tripId: 't1',
    payerId: 'm2',
    amount: 28000,
    category: 'transport',
    description: '택시 이동 (북촌->성수)',
    date: '2026-10-15',
    splitMemberIds: ['m1', 'm2', 'm3'],
  },
  {
    id: 'e3',
    tripId: 't1',
    payerId: 'm3',
    amount: 62000,
    category: 'food',
    description: '난포 저녁 식사',
    date: '2026-10-16',
    splitMemberIds: ['m1', 'm2', 'm3'],
  },
];

export const useTripStore = create<TripState>((set, get) => ({
  trips: INITIAL_TRIPS,
  activeTripId: 't1',
  expenses: INITIAL_EXPENSES,

  getActiveTrip: () => {
    const { trips, activeTripId } = get();
    return trips.find((t) => t.id === activeTripId) || trips[0];
  },

  setActiveTrip: (id) => set({ activeTripId: id }),

  createTrip: (tripData) => {
    const newTrip: Trip = {
      ...tripData,
      id: `t_${Date.now()}`,
      createdAt: new Date().toISOString(),
      places: [],
      schedules: [
        { dayNumber: 1, date: tripData.startDate, placeIds: [] },
        { dayNumber: 2, date: tripData.startDate, placeIds: [] },
      ],
      members: MOCK_MEMBERS,
    };
    set((state) => ({
      trips: [newTrip, ...state.trips],
      activeTripId: newTrip.id,
    }));
  },

  addPlaceToTrip: (tripId, dayNumber, place) => {
    set((state) => ({
      trips: state.trips.map((t) => {
        if (t.id !== tripId) return t;
        
        // Add place to trip places if not existing
        const exists = t.places.some((p) => p.id === place.id);
        const updatedPlaces = exists ? t.places : [...t.places, place];
        
        // Add placeId to corresponding day schedule
        const updatedSchedules = t.schedules.map((s) => {
          if (s.dayNumber === dayNumber) {
            return {
              ...s,
              placeIds: s.placeIds.includes(place.id) ? s.placeIds : [...s.placeIds, place.id],
            };
          }
          return s;
        });

        return {
          ...t,
          places: updatedPlaces,
          schedules: updatedSchedules,
        };
      }),
    }));
  },

  addExpense: (expenseData) => {
    const newExpense: Expense = {
      ...expenseData,
      id: `e_${Date.now()}`,
    };
    set((state) => ({
      expenses: [newExpense, ...state.expenses],
    }));
  },

  deleteExpense: (expenseId) => {
    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== expenseId),
    }));
  },
}));
