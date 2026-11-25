import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { userScopedAsyncStorage } from './userScopedStorage';
import type { SavedLink } from '../types';
import { parseLinkWithPlaces, detectSnsPlatform } from '../services/parserService';
import { useTripStore } from './useTripStore';

interface SavedLinkState {
  savedLinks: SavedLink[];
  isExtractingLink: boolean;

  // Actions
  addLinkFromUrl: (url: string, tripId?: string) => Promise<SavedLink | null>;
  removeSavedLink: (id: string) => void;
  updateExtractedPlaceImage: (linkId: string, placeId: string, imageUrl: string) => void;
  resetToDefaults: () => void;
}

export const useSavedLinkStore = create<SavedLinkState>()(
  persist(
    (set) => ({
      savedLinks: [],
      isExtractingLink: false,

      addLinkFromUrl: async (url: string, tripId?: string) => {
        const allTrips = useTripStore.getState().trips;
        const currentTrip = useTripStore.getState().currentTrip;
        const activeTripId = tripId || currentTrip?.id || 't_first';
        const targetTrip = allTrips.find((t) => t.id === activeTripId) || currentTrip;
        const destinationHint = targetTrip?.destination || targetTrip?.title || '';

        const tempId = `link_pending_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const pendingLink: SavedLink = {
          id: tempId,
          trip_id: activeTripId,
          title: '링크에서 장소 분석 중...',
          url,
          platform: detectSnsPlatform(url),
          thumbnailUrl: '',
          summary: '링크 내용을 분석해 방문할 장소를 보관함에 정리하고 있습니다.',
          createdAt: new Date().toISOString(),
          extractedPlaces: [],
          status: 'extracting',
        };

        set((state) => ({
          savedLinks: [pendingLink, ...state.savedLinks],
          isExtractingLink: true,
        }));

        try {
          const newSavedLink = await parseLinkWithPlaces(url, activeTripId, destinationHint);
          const readyLink: SavedLink = { ...newSavedLink, status: 'ready' };

          set((state) => ({
            savedLinks: state.savedLinks.map((l) => (l.id === tempId ? readyLink : l)),
            isExtractingLink: false,
          }));

          return readyLink;
        } catch {
          set((state) => ({
            savedLinks: state.savedLinks.filter((l) => l.id !== tempId),
            isExtractingLink: false,
          }));
          return null;
        }
      },

      removeSavedLink: (id: string) => {
        set((state) => ({
          savedLinks: state.savedLinks.filter((l) => l.id !== id),
        }));
      },

      updateExtractedPlaceImage: (linkId: string, placeId: string, imageUrl: string) => {
        set((state) => ({
          savedLinks: state.savedLinks.map((link) => {
            if (link.id !== linkId) return link;
            return {
              ...link,
              extractedPlaces: link.extractedPlaces.map((ep) =>
                ep.id === placeId ? { ...ep, imageUrl } : ep
              ),
            };
          }),
        }));
      },

      resetToDefaults: () => {
        set({
          savedLinks: [],
          isExtractingLink: false,
        });
      },
    }),
    {
      name: 'pinch-saved-links-storage',
      storage: createJSONStorage(() => userScopedAsyncStorage),
      skipHydration: true,
      partialize: (state) => ({
        savedLinks: state.savedLinks.filter((l) => l.status !== 'extracting'),
      }),
    }
  )
);
