import { create } from 'zustand';
import {
  CurrencyCode,
  ExpenseItem,
  WalletMember,
  SettlementTransaction,
  MemberBalance,
  DEFAULT_EXCHANGE_RATES,
  calculateMemberBalances,
  calculateMinCashFlowSettlement,
  formatSettlementShareText,
  convertToKrw,
} from '../utils/settlementUtils';

export interface WalletState {
  expenses: ExpenseItem[];
  members: WalletMember[];
  activeTab: 'expenses' | 'settlement';
  exchangeRates: Record<CurrencyCode, number>;
  settledTransactionIds: string[];

  // Actions
  setActiveTab: (tab: 'expenses' | 'settlement') => void;
  addExpense: (expense: Omit<ExpenseItem, 'id' | 'created_at' | 'krw_amount'>) => void;
  deleteExpense: (id: string) => void;
  updateExchangeRate: (currency: CurrencyCode, rate: number) => void;
  toggleTransactionSettled: (id: string) => void;
  getMemberBalances: () => MemberBalance[];
  getTransactions: () => SettlementTransaction[];
  getTotalKrw: () => number;
  generateShareText: (tripTitle?: string) => string;
}

const MOCK_MEMBERS: WalletMember[] = [
  { id: 'm1', name: '나 (민지)', color: '#FF6B6B' },
  { id: 'm2', name: '수현', color: '#4ECDC4' },
  { id: 'm3', name: '도윤', color: '#FFE66D' },
];

const INITIAL_EXPENSES: ExpenseItem[] = [
  {
    id: 'exp_1',
    trip_id: 't_tokyo',
    schedule_id: 's1',
    place_name: '푸글렌 도쿄 (Fuglen Tokyo)',
    title: '푸글렌 드립커피 & 시나몬롤',
    paid_by: 'm1',
    currency: 'JPY',
    amount: 3200,
    exchange_rate: 9.15,
    krw_amount: Math.round(3200 * 9.15), // 29,280원
    split_members: ['m1', 'm2', 'm3'],
    category: 'FOOD',
    created_at: '2026-11-10T10:30:00Z',
  },
  {
    id: 'exp_2',
    trip_id: 't_tokyo',
    schedule_id: 's2',
    place_name: '도쿄 빔즈 (BEAMS Harajuku)',
    title: '하라주쿠 빔즈 의류 & 소품',
    paid_by: 'm2',
    currency: 'JPY',
    amount: 15400,
    exchange_rate: 9.15,
    krw_amount: Math.round(15400 * 9.15), // 140,910원
    split_members: ['m1', 'm2'],
    category: 'SHOPPING',
    created_at: '2026-11-10T12:30:00Z',
  },
  {
    id: 'exp_3',
    trip_id: 't_tokyo',
    title: '도쿄 메트로 & 스이카 3인 충전',
    paid_by: 'm3',
    currency: 'JPY',
    amount: 6000,
    exchange_rate: 9.15,
    krw_amount: Math.round(6000 * 9.15), // 54,900원
    split_members: ['m1', 'm2', 'm3'],
    category: 'TRANSPORT',
    created_at: '2026-11-10T09:15:00Z',
  },
  {
    id: 'exp_4',
    trip_id: 't_tokyo',
    place_name: '이치란 라멘 하카타 본점',
    title: '이치란 돈코츠 라멘 & 맥주 세트',
    paid_by: 'm1',
    currency: 'JPY',
    amount: 5800,
    exchange_rate: 9.15,
    krw_amount: Math.round(5800 * 9.15), // 53,070원
    split_members: ['m1', 'm2', 'm3'],
    category: 'FOOD',
    created_at: '2026-11-11T13:00:00Z',
  },
  {
    id: 'exp_5',
    trip_id: 't_tokyo',
    title: '신주쿠 드럭스토어 기념품 면세',
    paid_by: 'm3',
    currency: 'JPY',
    amount: 12000,
    exchange_rate: 9.15,
    krw_amount: Math.round(12000 * 9.15), // 109,800원
    split_members: ['m1', 'm2', 'm3'],
    category: 'SHOPPING',
    created_at: '2026-11-11T19:30:00Z',
  },
  {
    id: 'exp_6',
    trip_id: 't_tokyo',
    title: '도쿄 나리타 익스프레스(N-EX) 왕복권',
    paid_by: 'm2',
    currency: 'KRW',
    amount: 126000,
    exchange_rate: 1.0,
    krw_amount: 126000,
    split_members: ['m1', 'm2', 'm3'],
    category: 'TRANSPORT',
    created_at: '2026-11-09T15:00:00Z',
  },
];

export const useWalletStore = create<WalletState>((set, get) => ({
  expenses: INITIAL_EXPENSES,
  members: MOCK_MEMBERS,
  activeTab: 'expenses',
  exchangeRates: { ...DEFAULT_EXCHANGE_RATES },
  settledTransactionIds: [],

  setActiveTab: (tab) => set({ activeTab: tab }),

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

  updateExchangeRate: (currency, rate) => {
    const updatedRates = {
      ...get().exchangeRates,
      [currency]: rate,
    };

    // Recalculate KRW amount for expenses with that currency
    const updatedExpenses = get().expenses.map((item) => {
      if (item.currency === currency) {
        return {
          ...item,
          exchange_rate: rate,
          krw_amount: convertToKrw(item.amount, currency, rate),
        };
      }
      return item;
    });

    set({
      exchangeRates: updatedRates,
      expenses: updatedExpenses,
    });
  },

  toggleTransactionSettled: (id) => {
    const { settledTransactionIds } = get();
    if (settledTransactionIds.includes(id)) {
      set({ settledTransactionIds: settledTransactionIds.filter((tId) => tId !== id) });
    } else {
      set({ settledTransactionIds: [...settledTransactionIds, id] });
    }
  },

  getMemberBalances: () => {
    const { members, expenses } = get();
    return calculateMemberBalances(members, expenses);
  },

  getTransactions: () => {
    const { members, expenses, settledTransactionIds } = get();
    const txns = calculateMinCashFlowSettlement(members, expenses);
    return txns.map((t) => ({
      ...t,
      is_settled: settledTransactionIds.includes(t.id),
    }));
  },

  getTotalKrw: () => {
    return get().expenses.reduce((acc, curr) => acc + curr.krw_amount, 0);
  },

  generateShareText: (tripTitle = '도쿄 3박 4일 감성 여행') => {
    const { members, expenses, settledTransactionIds } = get();
    const totalKrw = get().getTotalKrw();
    const memberBalances = calculateMemberBalances(members, expenses);
    const txns = calculateMinCashFlowSettlement(members, expenses).map((t) => ({
      ...t,
      is_settled: settledTransactionIds.includes(t.id),
    }));

    return formatSettlementShareText(tripTitle, totalKrw, memberBalances, txns);
  },
}));
