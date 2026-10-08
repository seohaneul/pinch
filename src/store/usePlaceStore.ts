import { create } from 'zustand';
import { Place, PlaceCategory } from '../types';
import { parseSnsUrl } from '../services/parserService';

export type CategoryFilter = 'ALL' | 'CAFE' | 'RESTAURANT' | 'ATTRACTION' | 'LODGING' | 'SHOPPING';

interface PlaceState {
  places: Place[];
  selectedCategory: CategoryFilter;
  searchQuery: string;
  isParsing: boolean;

  // Actions
  setCategory: (category: CategoryFilter) => void;
  setSearchQuery: (query: string) => void;
  addPlace: (place: Place) => void;
  removePlace: (id: string) => void;
  togglePin: (id: string) => void;
  extractFromUrl: (url: string) => Promise<Place | null>;
}

const INITIAL_PLACES: Place[] = [
  {
    id: 'p1',
    name: '푸글렌 도쿄 (Fuglen Tokyo)',
    address: '1 Chome-16-11 Tomigaya, Shibuya City, Tokyo',
    category: 'CAFE',
    latitude: 35.6664,
    longitude: 139.6917,
    memo: '인스타 릴스 핫플! 노르웨이 감성 로스팅 카페',
    snsUrl: 'https://instagram.com/p/fuglen_tokyo',
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop',
    rating: 4.8,
    isPinned: true,
    createdAt: '2026-10-01T10:00:00Z',
    tags: ['도쿄카페', '푸글렌', '핸드드립'],
    sourcePlatform: 'instagram',
  },
  {
    name: '후시미 이나리 신사 (伏見稲荷大社)',
    id: 'p2',
    address: '68 Fukakusa Yabunouchicho, Fushimi Ward, Kyoto',
    category: 'ATTRACTION',
    latitude: 34.9671,
    longitude: 135.7727,
    memo: '유튜브 숏츠 추천! 붉은 토리이 터널과 여우 신사 산책 코스',
    snsUrl: 'https://youtube.com/shorts/kyoto_temple',
    imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&auto=format&fit=crop',
    rating: 4.9,
    isPinned: true,
    createdAt: '2026-10-02T11:00:00Z',
    tags: ['교토여행', '토리이', '인생샷'],
    sourcePlatform: 'youtube',
  },
  {
    id: 'p3',
    name: '어니언 성수 (Cafe Onion)',
    address: '서울 성동구 아차산로9길 8',
    category: 'CAFE',
    latitude: 37.5458,
    longitude: 127.0581,
    memo: '폐공장 개조 베이커리 카페. 팡도르 필수!',
    snsUrl: 'https://blog.naver.com/onion_seongsu',
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format&fit=crop',
    rating: 4.7,
    isPinned: false,
    createdAt: '2026-10-03T14:30:00Z',
    tags: ['성수동', '팡도르', '베이커리'],
    sourcePlatform: 'naver',
  },
  {
    id: 'p4',
    name: '이치란 라멘 하카타 본점',
    address: '5 Chome-3-2 Nakasu, Hakata Ward, Fukuoka',
    category: 'RESTAURANT',
    latitude: 33.5932,
    longitude: 130.4037,
    memo: '1인 독서실 스타일 돈코츠 라멘 본점',
    snsUrl: 'https://tiktok.com/@ramen_fukuoka',
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop',
    rating: 4.6,
    isPinned: true,
    createdAt: '2026-10-04T18:00:00Z',
    tags: ['후쿠오카', '돈코츠라멘', '웨이팅'],
    sourcePlatform: 'tiktok',
  },
];

export const usePlaceStore = create<PlaceState>((set, get) => ({
  places: INITIAL_PLACES,
  selectedCategory: 'ALL',
  searchQuery: '',
  isParsing: false,

  setCategory: (category) => set({ selectedCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  addPlace: (place) => {
    set((state) => ({
      places: [place, ...state.places],
    }));
  },

  removePlace: (id) => {
    set((state) => ({
      places: state.places.filter((p) => p.id !== id),
    }));
  },

  togglePin: (id) => {
    set((state) => ({
      places: state.places.map((p) =>
        p.id === id ? { ...p, isPinned: !p.isPinned } : p
      ),
    }));
  },

  extractFromUrl: async (url) => {
    set({ isParsing: true });
    try {
      const newPlace = await parseSnsUrl(url);
      set((state) => ({
        places: [newPlace, ...state.places],
        isParsing: false,
      }));
      return newPlace;
    } catch (err) {
      set({ isParsing: false });
      return null;
    }
  },
}));
