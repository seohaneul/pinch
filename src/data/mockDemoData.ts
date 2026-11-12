import type {
  Trip,
  Place,
  ScheduleItem,
  Member,
  Expense,
  LodgingInfo,
  FlightInfo,
  SavedLink,
} from '../types';
import type { ExpenseItem, WalletMember } from '../utils/settlementUtils';

// ==============================================================================
// 1. 초기 멤버 (Clean Empty State)
// ==============================================================================
export const DEMO_MEMBERS: Member[] = [];
export const DEMO_WALLET_MEMBERS: WalletMember[] = [];

// ==============================================================================
// 2. 초기 장소 보관함 (Clean Empty State)
// ==============================================================================
export const DEMO_PLACES: Place[] = [];

// ==============================================================================
// 3. 초기 시간표 스팟 (Clean Empty State)
// ==============================================================================
export const DEMO_SCHEDULE_ITEMS: ScheduleItem[] = [];

// ==============================================================================
// 4. 초기 여행 목록 (Clean Empty State)
// ==============================================================================
export const DEMO_DEFAULT_TRIP: Trip = {
  id: 't_first',
  title: '나의 첫 여행 ✈️',
  destination: '여행지 설정',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
  coverImage: '',
  status: 'ongoing',
  budget: 0,
  createdAt: new Date().toISOString(),
  members: [],
  places: [],
  schedules: [
    { dayNumber: 1, date: new Date().toISOString().split('T')[0], placeIds: [] },
    { dayNumber: 2, date: new Date(Date.now() + 86400000).toISOString().split('T')[0], placeIds: [] },
    { dayNumber: 3, date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], placeIds: [] },
  ],
};

export const DEMO_OSAKA_TRIP: Trip = {
  id: 't_second',
  title: '새 여행',
  destination: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  coverImage: '',
  status: 'planning',
  budget: 0,
  createdAt: new Date().toISOString(),
  members: [],
  places: [],
  schedules: [],
};

// 기본 여행 1개 (깨끗한 빈 3일 템플릿, 스팟 0개, 장소 0개, 지출 0개)
export const DEMO_TRIPS: Trip[] = [DEMO_DEFAULT_TRIP];

// ==============================================================================
// 5. 부가 정보 (출발시각, 숙소, 항공권 - Clean Empty State)
// ==============================================================================
export const DEMO_DAY_START_TIMES: Record<string, string> = {
  t_first_day_1: '10:00',
  t_first_day_2: '10:00',
  t_first_day_3: '10:00',
};

export const DEMO_DAY_LODGINGS: Record<string, LodgingInfo> = {};

export const DEMO_TRIP_FLIGHTS: Record<string, FlightInfo> = {};

// ==============================================================================
// 6. 가계부 지출 (Clean Empty State)
// ==============================================================================
export const DEMO_WALLET_EXPENSES: ExpenseItem[] = [];

export const DEMO_TRIP_EXPENSES: Expense[] = [];

// ==============================================================================
// 7. 링크 보관함 (Clean Empty State)
// ==============================================================================
export const DEMO_SAVED_LINKS: SavedLink[] = [];
