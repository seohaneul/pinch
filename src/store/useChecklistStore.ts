import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { userScopedAsyncStorage } from './userScopedStorage';
import type { ChecklistItem } from '../types';

const DEFAULT_CHECKLIST_LABELS = [
  '여권 / 신분증',
  '항공권 · 숙소 바우처 저장',
  '해외 결제 카드 · 환전',
  'eSIM / 유심 / 로밍 확인',
  '멀티어댑터 · 보조배터리',
  '상비약 · 개인 세면도구',
];

interface ChecklistState {
  itemsByTrip: Record<string, ChecklistItem[]>;
  initTripChecklist: (tripId: string) => void;
  toggleItem: (tripId: string, itemId: string) => void;
  addItem: (tripId: string, label: string) => void;
  removeItem: (tripId: string, itemId: string) => void;
  resetToDefaults: () => void;
}

function buildDefaultItems(tripId: string): ChecklistItem[] {
  return DEFAULT_CHECKLIST_LABELS.map((label, idx) => ({
    id: `chk_${tripId}_${idx}_${Date.now()}`,
    trip_id: tripId,
    label,
    checked: false,
  }));
}

export const useChecklistStore = create<ChecklistState>()(
  persist(
    (set, get) => ({
      itemsByTrip: {},

      initTripChecklist: (tripId: string) => {
        if (!tripId) return;
        const existing = get().itemsByTrip[tripId];
        if (existing && existing.length > 0) return;
        set((state) => ({
          itemsByTrip: {
            ...state.itemsByTrip,
            [tripId]: buildDefaultItems(tripId),
          },
        }));
      },

      toggleItem: (tripId: string, itemId: string) => {
        set((state) => ({
          itemsByTrip: {
            ...state.itemsByTrip,
            [tripId]: (state.itemsByTrip[tripId] || []).map((item) =>
              item.id === itemId ? { ...item, checked: !item.checked } : item
            ),
          },
        }));
      },

      addItem: (tripId: string, label: string) => {
        const trimmed = label.trim();
        if (!tripId || !trimmed) return;
        const newItem: ChecklistItem = {
          id: `chk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          trip_id: tripId,
          label: trimmed,
          checked: false,
        };
        set((state) => ({
          itemsByTrip: {
            ...state.itemsByTrip,
            [tripId]: [newItem, ...(state.itemsByTrip[tripId] || [])],
          },
        }));
      },

      removeItem: (tripId: string, itemId: string) => {
        set((state) => ({
          itemsByTrip: {
            ...state.itemsByTrip,
            [tripId]: (state.itemsByTrip[tripId] || []).filter((item) => item.id !== itemId),
          },
        }));
      },

      resetToDefaults: () => {
        set({ itemsByTrip: {} });
      },
    }),
    {
      name: 'pinch-checklist-storage',
      storage: createJSONStorage(() => userScopedAsyncStorage),
      skipHydration: true,
      partialize: (state) => ({
        itemsByTrip: state.itemsByTrip,
      }),
    }
  )
);
