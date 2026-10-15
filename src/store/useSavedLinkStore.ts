import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SavedLink, ExtractedPlaceItem } from '../types';
import { parseLinkWithPlaces } from '../services/parserService';
import { useTripStore } from './useTripStore';

interface SavedLinkState {
  savedLinks: SavedLink[];
  isExtractingLink: boolean;

  // Actions
  addLinkFromUrl: (url: string, tripId?: string) => Promise<SavedLink | null>;
  removeSavedLink: (id: string) => void;
  getLinksByTrip: (tripId: string) => SavedLink[];
  resetToDefaults: () => void;
}

const INITIAL_SAVED_LINKS: SavedLink[] = [
  {
    id: 'link_sample_1',
    trip_id: 't_tokyo',
    title: '도쿄 시부야 핫플 & 카페 투어 릴스 🗼',
    url: 'https://www.instagram.com/reel/tokyo_shibuya_hotplaces',
    platform: 'instagram',
    thumbnailUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop',
    summary: '인스타그램 릴스 조회수 100만 돌파! 시부야 스카이와 푸글렌 도쿄 코스',
    createdAt: '2026-10-10T12:00:00Z',
    extractedPlaces: [
      {
        id: 'ep_sample_1',
        name: '푸글렌 도쿄 (Fuglen Tokyo)',
        address: '1 Chome-16-11 Tomigaya, Shibuya City, Tokyo',
        category: 'CAFE',
        latitude: 35.6664,
        longitude: 139.6917,
        memo: '노르웨이 오슬로 감성 로스팅 카페 & 핸드드립 커피 맛집 ☕',
        imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1000&auto=format&fit=crop',
        rating: 4.8,
        tags: ['도쿄카페', '푸글렌', '핸드드립'],
      },
      {
        id: 'ep_sample_2',
        name: '시부야 스카이 (SHIBUYA SKY)',
        address: '2 Chome-24-12 Shibuya, Shibuya City, Tokyo',
        category: 'ATTRACTION',
        latitude: 35.6591,
        longitude: 139.7027,
        memo: '도쿄 최고 높이의 루프탑 야경 전망대! 예약 필수 인생샷 성지 🗼',
        imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1000&auto=format&fit=crop',
        rating: 4.9,
        tags: ['시부야', '전망대', '야경'],
      },
      {
        id: 'ep_sample_3',
        name: '이치란 라멘 시부야점',
        address: '1 Chome-13-7 Jinnan, Shibuya City, Tokyo',
        category: 'RESTAURANT',
        latitude: 35.6618,
        longitude: 139.7001,
        memo: '나만의 레시피로 커스텀하는 진한 돈코츠 라멘 🍜',
        imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1000&auto=format&fit=crop',
        rating: 4.7,
        tags: ['도쿄라멘', '이치란', '돈코츠'],
      },
      {
        id: 'ep_sample_4',
        name: '미야시타 파크 & 빔즈 (Miyashita Park)',
        address: '1 Chome-26-5 Shibuya, Shibuya City, Tokyo',
        category: 'SHOPPING',
        latitude: 35.6622,
        longitude: 139.7021,
        memo: '루프탑 공원과 트렌디한 스트릿 패션 브랜드 셀렉트샵 🛍️',
        imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop',
        rating: 4.6,
        tags: ['시부야쇼핑', '빔즈', '편집샵'],
      },
    ],
  },
  {
    id: 'link_sample_2',
    trip_id: 't_osaka',
    title: '오사카 먹방 성지 도톤보리 & 우메다 필수 4곳 🍢',
    url: 'https://youtube.com/shorts/osaka_food_best',
    platform: 'youtube',
    thumbnailUrl: 'https://images.unsplash.com/photo-1590559899731-a3f376dd4558?w=800&auto=format&fit=crop',
    summary: '유튜브 숏츠 추천! 모토커피와 원조 쿠시카츠, 오사카성 완벽 루트',
    createdAt: '2026-10-11T14:30:00Z',
    extractedPlaces: [
      {
        id: 'ep_sample_5',
        name: '모토커피 키타하마 (MOTO COFFEE)',
        address: '2 Chome-1-1 Kitahama, Chuo Ward, Osaka',
        category: 'CAFE',
        latitude: 34.6922,
        longitude: 135.5065,
        memo: '강변 테라스에서 즐기는 푸딩과 라떼 뷰 맛집 🍮',
        imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop',
        rating: 4.7,
        tags: ['오사카카페', '키타하마', '테라스'],
      },
      {
        id: 'ep_sample_6',
        name: '쿠시카츠 다루마 도톤보리점',
        address: '1 Chome-6-4 Dotonbori, Chuo Ward, Osaka',
        category: 'RESTAURANT',
        latitude: 34.6687,
        longitude: 135.5015,
        memo: '바삭한 튀김옷과 비법 소스가 일품인 원조 쿠시카츠 🍢',
        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop',
        rating: 4.6,
        tags: ['오사카맛집', '쿠시카츠', '도톤보리'],
      },
      {
        id: 'ep_sample_7',
        name: '오사카성 천수각',
        address: '1-1 Osakajo, Chuo Ward, Osaka',
        category: 'ATTRACTION',
        latitude: 34.6873,
        longitude: 135.5262,
        memo: '황금빛 장식의 웅장한 역사 랜드마크 & 공원 산책 🏯',
        imageUrl: 'https://images.unsplash.com/photo-1590559899731-a3f376dd4558?w=800&auto=format&fit=crop',
        rating: 4.8,
        tags: ['오사카성', '랜드마크', '산책'],
      },
    ],
  },
];

export const useSavedLinkStore = create<SavedLinkState>()(
  persist(
    (set, get) => ({
      savedLinks: INITIAL_SAVED_LINKS,
      isExtractingLink: false,

      getLinksByTrip: (tripId: string) => {
        return get().savedLinks.filter((l) => l.trip_id === tripId);
      },

      addLinkFromUrl: async (url: string, tripId?: string) => {
        set({ isExtractingLink: true });
        try {
          const allTrips = useTripStore.getState().trips;
          const currentTrip = useTripStore.getState().currentTrip;
          const activeTripId = tripId || currentTrip?.id || 't_tokyo';
          const targetTrip = allTrips.find((t) => t.id === activeTripId) || currentTrip;
          const destinationHint = targetTrip?.destination || targetTrip?.title || '';
          const newSavedLink = await parseLinkWithPlaces(url, activeTripId, destinationHint);

          set((state) => ({
            savedLinks: [newSavedLink, ...state.savedLinks],
            isExtractingLink: false,
          }));

          return newSavedLink;
        } catch (err) {
          set({ isExtractingLink: false });
          return null;
        }
      },

      removeSavedLink: (id: string) => {
        set((state) => ({
          savedLinks: state.savedLinks.filter((l) => l.id !== id),
        }));
      },

      resetToDefaults: () => {
        set({
          savedLinks: INITIAL_SAVED_LINKS,
          isExtractingLink: false,
        });
      },
    }),
    {
      name: 'pinch-saved-links-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        savedLinks: state.savedLinks,
      }),
    }
  )
);
