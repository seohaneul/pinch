import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { userScopedAsyncStorage } from './userScopedStorage';
import type {
  CurrencyCode,
  ExpenseItem,
  WalletMember,
  SettlementTransaction,
  MemberBalance,
} from '../utils/settlementUtils';
import {
  DEFAULT_EXCHANGE_RATES,
  calculateMemberBalances,
  calculateMinCashFlowSettlement,
  formatSettlementShareText,
  convertToKrw,
} from '../utils/settlementUtils';
import { fetchLiveExchangeRates } from '../services/exchangeRateService';

import type { CustomBudgetItem, TourPackageItem } from '../types';

export interface WalletState {
  expenses: ExpenseItem[];
  members: WalletMember[];
  activeTab: 'budget' | 'expenses' | 'settlement';
  exchangeRates: Record<CurrencyCode, number>;
  lastExchangeRateUpdate: string;
  isUpdatingRates: boolean;
  settledTransactionIds: string[];
  tripCurrencies: Record<string, CurrencyCode>;
  categoryBudgets: Record<string, Record<string, number>>;
  customBudgets: Record<string, CustomBudgetItem[]>;
  tourPackages: Record<string, TourPackageItem[]>;

  // Actions
  setActiveTab: (tab: 'budget' | 'expenses' | 'settlement') => void;
  setTripCurrency: (tripId: string, currency: CurrencyCode) => void;
  getTripCurrency: (tripId?: string) => CurrencyCode;
  setCategoryBudget: (tripId: string, category: string, amount: number) => void;
  getCategoryBudgets: (tripId?: string) => Record<string, number>;
  addCustomBudget: (tripId: string, item: Omit<CustomBudgetItem, 'id' | 'trip_id'>) => void;
  removeCustomBudget: (tripId: string, id: string) => void;
  updateCustomBudget: (tripId: string, id: string, amount: number) => void;
  getCustomBudgets: (tripId?: string) => CustomBudgetItem[];
  addTourPackage: (tripId: string, item: Omit<TourPackageItem, 'id' | 'trip_id'>) => void;
  removeTourPackage: (tripId: string, id: string) => void;
  getTourPackages: (tripId?: string) => TourPackageItem[];
  addExpense: (expense: Omit<ExpenseItem, 'id' | 'created_at' | 'krw_amount'>) => void;
  deleteExpense: (id: string) => void;
  refreshLiveExchangeRates: () => Promise<void>;
  toggleTransactionSettled: (id: string) => void;
  getMemberBalances: (tripId?: string, customMembers?: WalletMember[]) => MemberBalance[];
  getTransactions: (tripId?: string, customMembers?: WalletMember[]) => SettlementTransaction[];
  getTotalKrw: (tripId?: string) => number;
  generateShareText: (tripTitle?: string, tripId?: string, customMembers?: WalletMember[]) => string;
  resetToDefaults: () => void;
}

const INITIAL_CUSTOM_BUDGETS: Record<string, CustomBudgetItem[]> = {};
const INITIAL_TOUR_PACKAGES: Record<string, TourPackageItem[]> = {};
const INITIAL_CATEGORY_BUDGETS: Record<string, Record<string, number>> = {};
const INITIAL_TRIP_CURRENCIES: Record<string, CurrencyCode> = {};

export const DEFAULT_CATEGORY_BUDGET_MAP: Record<string, number> = {
  FOOD: 400000,
  LODGING: 600000,
  FLIGHT: 450000,
  TRANSPORT: 250000,
  SHOPPING: 350000,
  ACTIVITY: 150000,
  OTHER: 100000,
};

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
  expenses: [],
  members: [],
  activeTab: 'expenses',
  exchangeRates: { ...DEFAULT_EXCHANGE_RATES },
  lastExchangeRateUpdate: '실시간 환율 연동',
  isUpdatingRates: false,
  settledTransactionIds: [],
  tripCurrencies: INITIAL_TRIP_CURRENCIES,
  categoryBudgets: INITIAL_CATEGORY_BUDGETS,
  customBudgets: INITIAL_CUSTOM_BUDGETS,
  tourPackages: INITIAL_TOUR_PACKAGES,

  setActiveTab: (tab) => set({ activeTab: tab }),

  setTripCurrency: (tripId: string, currency: CurrencyCode) => {
    set((state) => ({
      tripCurrencies: {
        ...state.tripCurrencies,
        [tripId]: currency,
      },
    }));
  },

  getTripCurrency: (tripId?: string) => {
    if (!tripId) return 'JPY';
    return get().tripCurrencies?.[tripId] || 'JPY';
  },

  setCategoryBudget: (tripId: string, category: string, amount: number) => {
    set((state) => {
      const current = state.categoryBudgets[tripId] || { ...DEFAULT_CATEGORY_BUDGET_MAP };
      return {
        categoryBudgets: {
          ...state.categoryBudgets,
          [tripId]: {
            ...current,
            [category]: amount,
          },
        },
      };
    });
  },

  getCategoryBudgets: (tripId?: string) => {
    if (!tripId) return {};
    const saved = get().categoryBudgets?.[tripId];
    if (saved) {
      const normalized = { ...saved };
      if (saved.STAY && !saved.LODGING) {
        normalized.LODGING = saved.STAY;
      }
      return normalized;
    }
    return {};
  },

  addCustomBudget: (tripId: string, item) => {
    const id = `cb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newItem: CustomBudgetItem = {
      ...item,
      id,
      trip_id: tripId,
    };
    set((state) => ({
      customBudgets: {
        ...state.customBudgets,
        [tripId]: [...(state.customBudgets[tripId] || []), newItem],
      },
    }));
  },

  removeCustomBudget: (tripId: string, id: string) => {
    set((state) => ({
      customBudgets: {
        ...state.customBudgets,
        [tripId]: (state.customBudgets[tripId] || []).filter((b) => b.id !== id),
      },
    }));
  },

  updateCustomBudget: (tripId: string, id: string, amount: number) => {
    set((state) => ({
      customBudgets: {
        ...state.customBudgets,
        [tripId]: (state.customBudgets[tripId] || []).map((b) =>
          b.id === id ? { ...b, amount } : b
        ),
      },
    }));
  },

  getCustomBudgets: (tripId?: string) => {
    if (!tripId) return [];
    return get().customBudgets?.[tripId] || [];
  },

  addTourPackage: (tripId: string, item) => {
    const id = `tp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newItem: TourPackageItem = {
      ...item,
      id,
      trip_id: tripId,
    };
    set((state) => {
      const currentList = state.tourPackages[tripId] || [];
      const updatedList = [...currentList, newItem];
      
      // Auto-update or suggest ACTIVITY budget if tour sum exceeds current activity budget
      const totalTours = updatedList.reduce((sum, t) => sum + t.amount, 0);
      const currentBudgets = state.categoryBudgets[tripId] || { ...DEFAULT_CATEGORY_BUDGET_MAP };
      const currentActivityBudget = currentBudgets.ACTIVITY || 0;
      
      const newActivityBudget = Math.max(currentActivityBudget, totalTours);

      return {
        tourPackages: {
          ...state.tourPackages,
          [tripId]: updatedList,
        },
        categoryBudgets: {
          ...state.categoryBudgets,
          [tripId]: {
            ...currentBudgets,
            ACTIVITY: newActivityBudget,
          },
        },
      };
    });
  },

  removeTourPackage: (tripId: string, id: string) => {
    set((state) => {
      const existing = state.tourPackages[tripId] || [];
      const removed = existing.find((t) => t.id === id);
      const updatedList = existing.filter((t) => t.id !== id);
      const currentBudgets = state.categoryBudgets[tripId];

      if (!removed || !currentBudgets) {
        return {
          tourPackages: {
            ...state.tourPackages,
            [tripId]: updatedList,
          },
        };
      }

      const nextActivity = Math.max(0, (currentBudgets.ACTIVITY || 0) - removed.amount);
      return {
        tourPackages: {
          ...state.tourPackages,
          [tripId]: updatedList,
        },
        categoryBudgets: {
          ...state.categoryBudgets,
          [tripId]: {
            ...currentBudgets,
            ACTIVITY: nextActivity,
          },
        },
      };
    });
  },

  getTourPackages: (tripId?: string) => {
    if (!tripId) return [];
    return get().tourPackages?.[tripId] || [];
  },


  refreshLiveExchangeRates: async () => {
    set({ isUpdatingRates: true });
    try {
      const { rates, lastUpdated } = await fetchLiveExchangeRates();
      // Recalculate KRW amount for all expenses based on new rates
      const updatedExpenses = get().expenses.map((item) => {
        const newRate = rates[item.currency] || item.exchange_rate;
        return {
          ...item,
          exchange_rate: newRate,
          krw_amount: convertToKrw(item.amount, item.currency, newRate),
        };
      });

      set({
        exchangeRates: rates,
        expenses: updatedExpenses,
        lastExchangeRateUpdate: lastUpdated,
        isUpdatingRates: false,
      });
    } catch (e) {
      set({ isUpdatingRates: false });
    }
  },

  addExpense: (expenseData) => {
    const rate = expenseData.exchange_rate || get().exchangeRates[expenseData.currency] || 1;
    const krw_amount = convertToKrw(expenseData.amount, expenseData.currency, rate);

    const newExpense: ExpenseItem = {
      ...expenseData,
      id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      exchange_rate: rate,
      krw_amount,
      created_at: new Date().toISOString(),
    };

    set({ expenses: [newExpense, ...get().expenses] });
  },

  deleteExpense: (id) => {
    set({ expenses: get().expenses.filter((e) => e.id !== id) });
  },

  toggleTransactionSettled: (id) => {
    const { settledTransactionIds } = get();
    if (settledTransactionIds.includes(id)) {
      set({ settledTransactionIds: settledTransactionIds.filter((tId) => tId !== id) });
    } else {
      set({ settledTransactionIds: [...settledTransactionIds, id] });
    }
  },

  getMemberBalances: (tripId?: string, customMembers?: WalletMember[]) => {
    const { members, expenses } = get();
    const activeMembers = customMembers || members;
    const targetExpenses = tripId
      ? expenses.filter((e) => !e.trip_id || e.trip_id === tripId)
      : expenses;
    return calculateMemberBalances(activeMembers, targetExpenses);
  },

  getTransactions: (tripId?: string, customMembers?: WalletMember[]) => {
    const { members, expenses, settledTransactionIds } = get();
    const activeMembers = customMembers || members;
    const targetExpenses = tripId
      ? expenses.filter((e) => !e.trip_id || e.trip_id === tripId)
      : expenses;
    const txns = calculateMinCashFlowSettlement(activeMembers, targetExpenses);
    return txns.map((t) => {
      const scopedId = tripId ? `${tripId}::${t.from.id}->${t.to.id}` : t.id;
      return {
        ...t,
        id: scopedId,
        is_settled: settledTransactionIds.includes(scopedId),
      };
    });
  },

  getTotalKrw: (tripId?: string) => {
    const { expenses } = get();
    const targetExpenses = tripId
      ? expenses.filter((e) => !e.trip_id || e.trip_id === tripId)
      : expenses;
    return targetExpenses.reduce((acc, curr) => acc + curr.krw_amount, 0);
  },

  generateShareText: (
    tripTitle = '여행 정산서',
    tripId?: string,
    customMembers?: WalletMember[]
  ) => {
    const { members, expenses, settledTransactionIds } = get();
    const activeMembers = customMembers || members;
    const targetExpenses = tripId
      ? expenses.filter((e) => !e.trip_id || e.trip_id === tripId)
      : expenses;
    const totalKrw = targetExpenses.reduce((acc, curr) => acc + curr.krw_amount, 0);
    const memberBalances = calculateMemberBalances(activeMembers, targetExpenses);
    const txns = calculateMinCashFlowSettlement(activeMembers, targetExpenses).map((t) => ({
      ...t,
      is_settled: settledTransactionIds.includes(t.id),
    }));

    return formatSettlementShareText(tripTitle, totalKrw, memberBalances, txns);
  },

  resetToDefaults: () => {
    set({
      expenses: [],
      members: [],
      activeTab: 'expenses',
      exchangeRates: { ...DEFAULT_EXCHANGE_RATES },
      settledTransactionIds: [],
      tripCurrencies: INITIAL_TRIP_CURRENCIES,
      categoryBudgets: INITIAL_CATEGORY_BUDGETS,
      customBudgets: INITIAL_CUSTOM_BUDGETS,
      tourPackages: INITIAL_TOUR_PACKAGES,
    });
  },
}),
{
  name: 'pinch-wallet-storage',
  storage: createJSONStorage(() => userScopedAsyncStorage),
  skipHydration: true,
  partialize: (state) => ({
    expenses: state.expenses,
    exchangeRates: state.exchangeRates,
    settledTransactionIds: state.settledTransactionIds,
    tripCurrencies: state.tripCurrencies,
    categoryBudgets: state.categoryBudgets,
    customBudgets: state.customBudgets,
    tourPackages: state.tourPackages,
  }),
}
));

