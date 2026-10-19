import { Alert } from 'react-native';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Place, PlaceCategory } from '../types';
import { parseSnsUrl } from '../services/parserService';
import { useTripStore } from './useTripStore';

export type CategoryFilter = 'ALL' | 'CAFE' | 'RESTAURANT' | 'ATTRACTION' | 'LODGING' | 'SHOPPING';

interface PlaceState {
  places: Place[];
  selectedCategory: CategoryFilter;
  searchQuery: string;
  isParsing: boolean;
  isExtracting: boolean;

  // Actions
  setCategory: (category: CategoryFilter) => void;
  setSearchQuery: (query: string) => void;
  addPlace: (place: Place, tripId?: string) => boolean;
  addPlacesBulk: (newPlaces: Place[]) => void;
  removePlace: (id: string) => void;
  togglePin: (id: string) => void;
  updatePlaceImage: (id: string, imageUrl: string) => void;
  extractFromUrl: (url: string, tripId?: string) => Promise<Place | null>;
  checkIsDuplicate: (name: string, url?: string, tripId?: string) => Place | null;
  getPlacesByTrip: (tripId: string) => Place[];
  restorePlaces: (places: Place[]) => void;
  resetToDefaults: () => void;
}

import { DEMO_PLACES } from '../data/mockDemoData';

const INITIAL_PLACES: Place[] = DEMO_PLACES;

export const usePlaceStore = create<PlaceState>()(
  persist(
    (set, get) => ({
      places: INITIAL_PLACES,
      selectedCategory: 'ALL',
      searchQuery: '',
      isParsing: false,
      isExtracting: false,

      setCategory: (category) => set({ selectedCategory: category }),
      setSearchQuery: (query) => set({ searchQuery: query }),

      getPlacesByTrip: (tripId: string) => {
        return get().places.filter((p) => p.trip_id === tripId);
      },

      checkIsDuplicate: (name: string, url?: string, tripId?: string) => {
        const currentPlaces = get().places;
        const targetTripId = tripId || useTripStore.getState().currentTrip?.id;
        const normalizedName = name.trim().toLowerCase();
        const normalizedUrl = url ? url.trim().toLowerCase() : '';

        return (
          currentPlaces.find((p) => {
            // 여행별 중복 검사: 대상 여행이 지정된 경우, 해당 여행 내에서만 중복 여부 판정
            if (targetTripId && p.trip_id && p.trip_id !== targetTripId) {
              return false;
            }
            const sameName = Boolean(normalizedName && p.name.trim().toLowerCase() === normalizedName);
            const sameUrl = Boolean(
              normalizedUrl && p.snsUrl && p.snsUrl.trim().toLowerCase() === normalizedUrl
            );
            return sameName || sameUrl;
          }) || null
        );
      },

      addPlace: (place, tripId) => {
        const activeTripId = tripId || place.trip_id || useTripStore.getState().currentTrip?.id || 't_tokyo';
        const duplicate = get().checkIsDuplicate(place.name, place.snsUrl, activeTripId);
        if (duplicate) {
          Alert.alert('이미 보관된 장소 📌', '이미 보관함에 핀치된 장소예요!');
          return false;
        }

        const placeWithTrip: Place = {
          ...place,
          trip_id: activeTripId,
        };

        set((state) => ({
          places: [placeWithTrip, ...state.places],
        }));
        return true;
      },

      addPlacesBulk: (newPlaces) => {
        set((state) => {
          const existingIds = new Set(state.places.map((p) => p.id));
          const filtered = newPlaces.filter((p) => !existingIds.has(p.id));
          return {
            places: [...filtered, ...state.places],
          };
        });
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

      updatePlaceImage: (id, imageUrl) => {
        set((state) => ({
          places: state.places.map((p) =>
            p.id === id ? { ...p, imageUrl } : p
          ),
        }));
      },

      extractFromUrl: async (url, tripId) => {
        set({ isParsing: true, isExtracting: true });
        try {
          const allTrips = useTripStore.getState().trips;
          const currentTrip = useTripStore.getState().currentTrip;
          const activeTripId = tripId || currentTrip?.id || 't_tokyo';
          const targetTrip = allTrips.find((t) => t.id === activeTripId) || currentTrip;
          const destinationHint = targetTrip?.destination || targetTrip?.title || '';

          const duplicate = get().checkIsDuplicate('', url, activeTripId);
          if (duplicate) {
            set({ isParsing: false, isExtracting: false });
            Alert.alert('이미 보관된 장소 📌', '이미 보관함에 핀치된 장소예요!');
            return null;
          }

          const newPlace = await parseSnsUrl(url, destinationHint);
          newPlace.trip_id = activeTripId;

          // Check again with parsed name
          const duplicateByName = get().checkIsDuplicate(newPlace.name, newPlace.snsUrl, activeTripId);
          if (duplicateByName) {
            set({ isParsing: false, isExtracting: false });
            Alert.alert('이미 보관된 장소 📌', '이미 보관함에 핀치된 장소예요!');
            return null;
          }

          set((state) => ({
            places: [newPlace, ...state.places],
            isParsing: false,
            isExtracting: false,
          }));
          return newPlace;
        } catch (err) {
          set({ isParsing: false, isExtracting: false });
          return null;
        }
      },

      restorePlaces: (places: Place[]) => {
        set({ places: places || [] });
      },

      resetToDefaults: () => {
        set({
          places: INITIAL_PLACES,
          selectedCategory: 'ALL',
          searchQuery: '',
          isParsing: false,
          isExtracting: false,
        });
      },
    }),
    {
      name: 'pinch-place-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        places: state.places,
      }),
    }
  )
);
