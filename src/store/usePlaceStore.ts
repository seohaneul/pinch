import { create } from 'zustand';
import { Place, PlaceCategory } from '../types';

interface PlaceState {
  places: Place[];
  selectedCategory: PlaceCategory | 'all';
  searchQuery: string;
  isExtracting: boolean;
  
  // Actions
  setCategory: (category: PlaceCategory | 'all') => void;
  setSearchQuery: (query: string) => void;
  addPlace: (place: Omit<Place, 'id' | 'createdAt'>) => void;
  togglePin: (id: string) => void;
  removePlace: (id: string) => void;
  extractFromUrl: (url: string) => Promise<Place | null>;
}

const INITIAL_PLACES: Place[] = [
  {
    id: 'p1',
    name: '런던베이글뮤지엄 안국점',
    address: '서울 종로구 북촌로4길 20',
    category: 'cafe',
    latitude: 37.5794,
    longitude: 126.9866,
    memo: '인스타 핫플 베이글 맛집! 대기 필수',
    snsUrl: 'https://instagram.com/p/example1',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop',
    rating: 4.8,
    isPinned: true,
    createdAt: '2026-10-01T10:00:00Z',
    tags: ['베이글', '안국핫플', '빵지순례'],
  },
  {
    id: 'p2',
    name: '카멜커피 성수점',
    address: '서울 성동구 성수이로7길 39',
    category: 'cafe',
    latitude: 37.5445,
    longitude: 127.0560,
    memo: '시그니처 카멜커피 바닐라 크림 존맛',
    snsUrl: 'https://instagram.com/p/example2',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop',
    rating: 4.6,
    isPinned: true,
    createdAt: '2026-10-02T14:30:00Z',
    tags: ['커피', '성수동', '감성카페'],
  },
  {
    id: 'p3',
    name: '아모레성수',
    address: '서울 성동구 아차산로11길 7',
    category: 'spot',
    latitude: 37.5461,
    longitude: 127.0583,
    memo: '뷰티 체험 공간 & 정원 산책',
    snsUrl: 'https://instagram.com/p/example3',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&auto=format&fit=crop',
    rating: 4.7,
    isPinned: false,
    createdAt: '2026-10-03T11:20:00Z',
    tags: ['체험', '성수', '전시'],
  },
  {
    id: 'p4',
    name: '난포 성수',
    address: '서울 성동구 서울숲4길 18.8',
    category: 'restaurant',
    latitude: 37.5475,
    longitude: 127.0435,
    memo: '퓨전 퓨전 한식, 강쌈밥 추천!',
    snsUrl: 'https://instagram.com/p/example4',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop',
    rating: 4.9,
    isPinned: true,
    createdAt: '2026-10-04T18:00:00Z',
    tags: ['퓨전한식', '서울숲', '웨이팅맛집'],
  },
];

export const usePlaceStore = create<PlaceState>((set, get) => ({
  places: INITIAL_PLACES,
  selectedCategory: 'all',
  searchQuery: '',
  isExtracting: false,

  setCategory: (category) => set({ selectedCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  addPlace: (placeData) => {
    const newPlace: Place = {
      ...placeData,
      id: `p_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ places: [newPlace, ...state.places] }));
  },

  togglePin: (id) => {
    set((state) => ({
      places: state.places.map((p) =>
        p.id === id ? { ...p, isPinned: !p.isPinned } : p
      ),
    }));
  },

  removePlace: (id) => {
    set((state) => ({
      places: state.places.filter((p) => p.id !== id),
    }));
  },

  extractFromUrl: async (url) => {
    set({ isExtracting: true });
    // Mock extraction simulation for Step 1
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const extractedPlace: Place = {
      id: `extracted_${Date.now()}`,
      name: '핀치 추출 핫플 #1',
      address: '서울 마포구 연남동 223-14',
      category: 'cafe',
      latitude: 37.5612,
      longitude: 126.9245,
      memo: `링크에서 추출됨: ${url}`,
      snsUrl: url,
      imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&auto=format&fit=crop',
      rating: 4.9,
      isPinned: true,
      createdAt: new Date().toISOString(),
      tags: ['자동추출', 'SNS핫플'],
    };

    set((state) => ({
      places: [extractedPlace, ...state.places],
      isExtracting: false,
    }));

    return extractedPlace;
  },
}));
