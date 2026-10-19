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

import { DEMO_SAVED_LINKS } from '../data/mockDemoData';

const INITIAL_SAVED_LINKS: SavedLink[] = DEMO_SAVED_LINKS;

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
