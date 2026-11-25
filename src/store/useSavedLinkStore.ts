import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { userScopedAsyncStorage } from './userScopedStorage';
import type { SavedLink } from '../types';
import { parseLinkWithPlaces } from '../services/parserService';
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
        set({ isExtractingLink: true });
        try {
          const allTrips = useTripStore.getState().trips;
          const currentTrip = useTripStore.getState().currentTrip;
          const activeTripId = tripId || currentTrip?.id || 't_first';
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
        savedLinks: state.savedLinks,
      }),
    }
  )
);
