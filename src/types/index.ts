export type PlaceCategory =
  | 'ALL'
  | 'CAFE'
  | 'RESTAURANT'
  | 'ATTRACTION'
  | 'LODGING'
  | 'SHOPPING'
  | 'cafe'
  | 'restaurant'
  | 'spot'
  | 'stay'
  | 'shopping'
  | 'other';

export interface Place {
  id: string;
  name: string;
  address: string;
  category: PlaceCategory;
  latitude: number;
  longitude: number;
  memo?: string;
  snsUrl?: string;
  imageUrl?: string;
  rating?: number;
  isPinned: boolean;
  createdAt: string;
  tags?: string[];
  sourcePlatform?: 'instagram' | 'youtube' | 'naver' | 'tiktok' | 'manual';
}

export interface DaySchedule {
  dayNumber: number;
  date: string;
  placeIds: string[];
  notes?: string;
}

export interface Member {
  id: string;
  name: string;
  avatarUrl?: string;
  color?: string;
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverImage?: string;
  status: 'planning' | 'ongoing' | 'completed';
  places: Place[];
  schedules: DaySchedule[];
  members: Member[];
  budget?: number;
  createdAt: string;
}

export type ExpenseCategory = 'food' | 'transport' | 'stay' | 'activity' | 'shopping' | 'other';

export interface Expense {
  id: string;
  tripId: string;
  payerId: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: string;
  splitMemberIds: string[];
}
