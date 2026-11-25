import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '../utils/supabase';
import { usePlaceStore } from './usePlaceStore';
import { useSavedLinkStore } from './useSavedLinkStore';
import { useTripStore } from './useTripStore';
import { useWalletStore } from './useWalletStore';

const SYNC_META_PREFIX = 'pinch-sync-meta::';
const DEBOUNCE_MS = 1500;
const SYNC_TIMEOUT_MS = 6000;

interface CloudBackupPayload {
  version: 1;
  updatedAt: string;
  place: { places: ReturnType<typeof usePlaceStore.getState>['places'] };
  savedLinks: { savedLinks: ReturnType<typeof useSavedLinkStore.getState>['savedLinks'] };
  trip: {
    trips: ReturnType<typeof useTripStore.getState>['trips'];
    currentTrip: ReturnType<typeof useTripStore.getState>['currentTrip'];
    activeTripId: string;
    scheduleItems: ReturnType<typeof useTripStore.getState>['scheduleItems'];
    selectedDay: number;
    dayStartTimes: ReturnType<typeof useTripStore.getState>['dayStartTimes'];
    dayLodgings: ReturnType<typeof useTripStore.getState>['dayLodgings'];
    tripLodgings: ReturnType<typeof useTripStore.getState>['tripLodgings'];
    tripFlights: ReturnType<typeof useTripStore.getState>['tripFlights'];
    hasCompletedOnboarding: boolean;
  };
  wallet: {
    expenses: ReturnType<typeof useWalletStore.getState>['expenses'];
    exchangeRates: ReturnType<typeof useWalletStore.getState>['exchangeRates'];
    settledTransactionIds: string[];
    tripCurrencies: ReturnType<typeof useWalletStore.getState>['tripCurrencies'];
    categoryBudgets: ReturnType<typeof useWalletStore.getState>['categoryBudgets'];
    customBudgets: ReturnType<typeof useWalletStore.getState>['customBudgets'];
    tourPackages: ReturnType<typeof useWalletStore.getState>['tourPackages'];
  };
}

let activeSyncUserId: string | null = null;
let isApplyingCloudData = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let subscriptionsAttached = false;

function withSyncTimeout<T>(promise: Promise<T>, ms = SYNC_TIMEOUT_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Cloud sync timeout')), ms);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function buildBackupPayload(): CloudBackupPayload {
  const place = usePlaceStore.getState();
  const savedLinks = useSavedLinkStore.getState();
  const trip = useTripStore.getState();
  const wallet = useWalletStore.getState();

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    place: { places: place.places },
    savedLinks: { savedLinks: savedLinks.savedLinks },
    trip: {
      trips: trip.trips,
      currentTrip: trip.currentTrip,
      activeTripId: trip.activeTripId,
      scheduleItems: trip.scheduleItems,
      selectedDay: trip.selectedDay,
      dayStartTimes: trip.dayStartTimes,
      dayLodgings: trip.dayLodgings,
      tripLodgings: trip.tripLodgings,
      tripFlights: trip.tripFlights,
      hasCompletedOnboarding: trip.hasCompletedOnboarding,
    },
    wallet: {
      expenses: wallet.expenses,
      exchangeRates: wallet.exchangeRates,
      settledTransactionIds: wallet.settledTransactionIds,
      tripCurrencies: wallet.tripCurrencies,
      categoryBudgets: wallet.categoryBudgets,
      customBudgets: wallet.customBudgets,
      tourPackages: wallet.tourPackages,
    },
  };
}

function hasMeaningfulLocalData(): boolean {
  const trip = useTripStore.getState();
  const place = usePlaceStore.getState();
  const wallet = useWalletStore.getState();
  const savedLinks = useSavedLinkStore.getState();
  const hasRealTrip =
    trip.hasCompletedOnboarding ||
    trip.trips.some((t) => t.id !== 't_first' && t.destination !== '여행지 설정');

  return (
    hasRealTrip ||
    place.places.length > 0 ||
    wallet.expenses.length > 0 ||
    savedLinks.savedLinks.length > 0
  );
}

function applyBackupPayload(payload: CloudBackupPayload) {
  isApplyingCloudData = true;
  try {
    if (payload.place?.places) {
      usePlaceStore.setState({ places: payload.place.places });
    }
    if (payload.savedLinks?.savedLinks) {
      useSavedLinkStore.setState({ savedLinks: payload.savedLinks.savedLinks });
    }
    if (payload.trip) {
      useTripStore.setState({
        trips: payload.trip.trips,
        currentTrip: payload.trip.currentTrip,
        activeTripId: payload.trip.activeTripId,
        scheduleItems: payload.trip.scheduleItems || [],
        selectedDay: payload.trip.selectedDay || 1,
        dayStartTimes: payload.trip.dayStartTimes || {},
        dayLodgings: payload.trip.dayLodgings || {},
        tripLodgings: payload.trip.tripLodgings || {},
        tripFlights: payload.trip.tripFlights || {},
        hasCompletedOnboarding: Boolean(payload.trip.hasCompletedOnboarding),
      });
    }
    if (payload.wallet) {
      useWalletStore.setState({
        expenses: payload.wallet.expenses || [],
        exchangeRates: payload.wallet.exchangeRates,
        settledTransactionIds: payload.wallet.settledTransactionIds || [],
        tripCurrencies: payload.wallet.tripCurrencies || {},
        categoryBudgets: payload.wallet.categoryBudgets || {},
        customBudgets: payload.wallet.customBudgets || {},
        tourPackages: payload.wallet.tourPackages || {},
      });
    }
  } finally {
    isApplyingCloudData = false;
  }
}

async function getLastLocalChangeAt(userId: string): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(`${SYNC_META_PREFIX}${userId}`);
    return raw ? Number(raw) || 0 : 0;
  } catch {
    return 0;
  }
}

async function setLastLocalChangeAt(userId: string, ts: number): Promise<void> {
  try {
    await AsyncStorage.setItem(`${SYNC_META_PREFIX}${userId}`, String(ts));
  } catch {}
}

export async function pushCloudBackup(userId: string): Promise<boolean> {
  if (!userId || !isSupabaseConfigured()) return false;
  try {
    const { data: sessionData } = await withSyncTimeout(supabase.auth.getSession());
    if (!sessionData?.session?.user || sessionData.session.user.id !== userId) {
      return false;
    }

    const payload = buildBackupPayload();
    const { error } = await withSyncTimeout(
      Promise.resolve(
        supabase.from('user_sync_backups').upsert(
          {
            user_id: userId,
            backup_data: payload,
            trip_count: payload.trip.trips.length,
            place_count: payload.place.places.length,
            updated_at: payload.updatedAt,
          },
          { onConflict: 'user_id' }
        )
      )
    );

    if (error) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log('[CloudSync] push failed:', error.message);
      }
      return false;
    }
    await setLastLocalChangeAt(userId, Date.parse(payload.updatedAt));
    return true;
  } catch (err) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('[CloudSync] push error:', err);
    }
    return false;
  }
}

export async function syncCloudOnLogin(userId: string): Promise<void> {
  if (!userId || !isSupabaseConfigured()) return;
  try {
    const { data: sessionData } = await withSyncTimeout(supabase.auth.getSession());
    if (!sessionData?.session?.user || sessionData.session.user.id !== userId) {
      return;
    }

    const { data, error } = await withSyncTimeout(
      Promise.resolve(
        supabase
          .from('user_sync_backups')
          .select('backup_data, updated_at')
          .eq('user_id', userId)
          .maybeSingle()
      )
    );

    if (error) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log('[CloudSync] pull failed:', error.message);
      }
      return;
    }

    const cloudPayload = data?.backup_data as CloudBackupPayload | undefined;
    const cloudUpdatedAt = data?.updated_at ? Date.parse(data.updated_at) : 0;
    const localUpdatedAt = await getLastLocalChangeAt(userId);
    const localHasData = hasMeaningfulLocalData();

    if (cloudPayload && (!localHasData || cloudUpdatedAt > localUpdatedAt)) {
      applyBackupPayload(cloudPayload);
      await setLastLocalChangeAt(userId, cloudUpdatedAt || Date.now());
    } else if (localHasData && (!cloudPayload || localUpdatedAt > cloudUpdatedAt)) {
      await pushCloudBackup(userId);
    }
  } catch (err) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('[CloudSync] login sync error:', err);
    }
  }
}

function schedulePush() {
  if (isApplyingCloudData || !activeSyncUserId || !isSupabaseConfigured()) return;
  const targetUserId = activeSyncUserId;
  setLastLocalChangeAt(targetUserId, Date.now()).catch(() => {});

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    pushCloudBackup(targetUserId).catch(() => {});
  }, DEBOUNCE_MS);
}

export function setActiveCloudSyncUser(userId: string | null): void {
  activeSyncUserId = userId;
  if (!userId && debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}

export async function flushCloudSync(): Promise<void> {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  if (activeSyncUserId) {
    await pushCloudBackup(activeSyncUserId);
  }
}

export function attachCloudSyncListeners(): void {
  if (subscriptionsAttached) return;
  subscriptionsAttached = true;

  usePlaceStore.subscribe(schedulePush);
  useSavedLinkStore.subscribe(schedulePush);
  useTripStore.subscribe(schedulePush);
  useWalletStore.subscribe(schedulePush);
}
