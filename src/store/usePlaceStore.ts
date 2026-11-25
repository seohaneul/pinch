import { Alert } from 'react-native';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { userScopedAsyncStorage } from './userScopedStorage';
import type { Place } from '../types';
import { isDummyOrEmptyImage, resolveBestPlaceImage } from '../services/imageSearchService';
import { useTripStore } from './useTripStore';

export type CategoryFilter = 'ALL' | 'CAFE' | 'RESTAURANT' | 'ATTRACTION' | 'LODGING' | 'SHOPPING';

interface PlaceState {
  places: Place[];
  selectedCategory: CategoryFilter;
  searchQuery: string;

  // Actions
  setCategory: (category: CategoryFilter) => void;
  setSearchQuery: (query: string) => void;
  addPlace: (place: Place, tripId?: string) => boolean;
  addPlacesBulk: (newPlaces: Place[]) => void;
  removePlace: (id: string) => void;
  togglePin: (id: string) => void;
  updatePlaceImage: (id: string, imageUrl: string) => void;
  checkIsDuplicate: (name: string, url?: string, tripId?: string) => Place | null;
  getPlacesByTrip: (tripId: string) => Place[];
  resetToDefaults: () => void;
}

export const usePlaceStore = create<PlaceState>()(
  persist(
    (set, get) => ({
      places: [],
      selectedCategory: 'ALL',
      searchQuery: '',

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
            // 여행별 엄격한 중복 검사: 대상 여행이 지정된 경우 반드시 동일한 trip_id만 비교
            if (targetTripId && p.trip_id !== targetTripId) {
              return false;
            }
            if (normalizedName) {
              return p.name.trim().toLowerCase() === normalizedName;
            }
            if (normalizedUrl && p.snsUrl) {
              return p.snsUrl.trim().toLowerCase() === normalizedUrl;
            }
            return false;
          }) || null
        );
      },

      addPlace: (place, tripId) => {
        const activeTripId = tripId || place.trip_id || useTripStore.getState().currentTrip?.id || 't_first';
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

        if (isDummyOrEmptyImage(placeWithTrip.imageUrl)) {
          resolveBestPlaceImage(
            placeWithTrip.name,
            placeWithTrip.address,
            placeWithTrip.category,
            placeWithTrip.latitude,
            placeWithTrip.longitude
          ).then((resolved) => {
            if (resolved) {
              get().updatePlaceImage(placeWithTrip.id, resolved);
            }
          });
        }

        return true;
      },

      addPlacesBulk: (newPlaces) => {
        const existingIds = new Set(get().places.map((p) => p.id));
        const filtered = newPlaces.filter((p) => !existingIds.has(p.id));
        set((state) => ({
          places: [...filtered, ...state.places],
        }));

        filtered.forEach((p) => {
          if (isDummyOrEmptyImage(p.imageUrl)) {
            resolveBestPlaceImage(p.name, p.address, p.category, p.latitude, p.longitude).then(
              (resolved) => {
                if (resolved) {
                  get().updatePlaceImage(p.id, resolved);
                }
              }
            );
          }
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

      resetToDefaults: () => {
        set({
          places: [],
          selectedCategory: 'ALL',
          searchQuery: '',
        });
      },
    }),
    {
      name: 'pinch-place-storage',
      storage: createJSONStorage(() => userScopedAsyncStorage),
      skipHydration: true,
      partialize: (state) => ({
        places: state.places,
      }),
    }
  )
);
