import type { TransportMode } from '../utils/routeUtils';

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
  trip_id?: string; // Trip-scoped pocket identifier
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

export interface LodgingInfo {
  id?: string;
  trip_id?: string;
  day_number?: number;
  startDate?: string; // e.g. "2026-11-10"
  endDate?: string;   // e.g. "2026-11-12"
  stayNights?: number; // e.g. 2
  startDay?: number;  // e.g. 1
  endDay?: number;    // e.g. 3
  name: string;
  address?: string;
  checkInTime?: string;
  checkOutTime?: string;
  memo?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  phoneNumber?: string;
}

export interface ScheduleItem {
  id: string;
  trip_id: string;
  place_id: string;
  place_name: string;
  category: string;
  latitude: number;
  longitude: number;
  day_number: number;
  order_index: number;
  stay_duration_minutes: number;
  transport_mode: TransportMode;
  travel_duration_minutes: number;
  arrival_time: string;
  memo?: string;
  imageUrl?: string;
  address?: string;
  custom_transport_name?: string;
  custom_travel_minutes?: number;
}

export interface DaySchedule {
  dayNumber: number;
  date: string;
  placeIds: string[];
  notes?: string;
  startTime?: string; // e.g. "10:00"
  lodging?: LodgingInfo;
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
  currency?: 'KRW' | 'JPY' | 'USD' | 'EUR';
  lodging?: LodgingInfo;
  categoryBudgets?: Record<string, number>;
  flightInfo?: FlightInfo;
  flightArrival?: {
    time: string;
    bufferMinutes?: number;
    flightNumber?: string;
  };
  centerLat?: number;
  centerLng?: number;
}

export interface SingleFlightLeg {
  flightNumber: string; // e.g. KE113
  airline?: string; // e.g. 대한항공
  departureAirport: string; // e.g. ICN (인천)
  departureDate: string; // e.g. 2026-11-10
  departureTime: string; // e.g. 23:00
  arrivalAirport: string; // e.g. GUM (괌)
  arrivalDate: string; // e.g. 2026-11-11
  arrivalTime: string; // e.g. 04:00
  bufferMinutes?: number; // e.g. 90분
  terminal?: string; // e.g. 제2터미널
  memo?: string;
}

export interface FlightInfo {
  id?: string;
  trip_id?: string;
  tripType?: 'roundTrip' | 'oneWay'; // default roundTrip
  outbound?: SingleFlightLeg; // 가는 편
  returnFlight?: SingleFlightLeg; // 오는 편
  autoAddToSchedule?: boolean; // 일정에 자동 등록

  // Backwards compatibility legacy fields
  flightNumber?: string;
  airline?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  departureDate?: string;
  departureTime?: string;
  arrivalDate?: string;
  arrivalTime?: string;
  bufferMinutes?: number;
  terminal?: string;
  memo?: string;
}

export interface TourPackageItem {
  id: string;
  trip_id: string;
  name: string;
  amount: number;
  memo?: string;
}

export interface CustomBudgetItem {
  id: string;
  trip_id: string;
  name: string;
  amount: number;
  color?: string;
}

export type ExpenseCategory = 'food' | 'transport' | 'stay' | 'activity' | 'flight' | 'shopping' | 'other';

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

export interface ExtractedPlaceItem {
  id: string;
  name: string;
  address: string;
  category: PlaceCategory;
  latitude: number;
  longitude: number;
  memo: string;
  imageUrl?: string;
  rating?: number;
  tags?: string[];
}

export interface SavedLink {
  id: string;
  trip_id: string;
  title: string;
  url: string;
  platform: 'instagram' | 'youtube' | 'naver' | 'tiktok' | 'manual';
  thumbnailUrl: string;
  summary: string;
  createdAt: string;
  extractedPlaces: ExtractedPlaceItem[];
}

