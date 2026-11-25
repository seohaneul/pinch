import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { usePlaceStore } from './usePlaceStore';
import { useSavedLinkStore } from './useSavedLinkStore';
import { useTripStore } from './useTripStore';
import { useWalletStore } from './useWalletStore';
import { useChecklistStore } from './useChecklistStore';
import {
  migrateLegacyData,
  setStorageScope,
  suspendStorageWrites,
} from './userScopedStorage';
import {
  attachCloudSyncListeners,
  setActiveCloudSyncUser,
  syncCloudOnLogin,
} from './cloudSync';

/**
 * 로그인한 계정에 맞춰 로컬 데이터(여행/장소/링크/가계부)를 전환한다.
 *
 * - 로그인: 해당 계정의 저장 데이터를 불러온다 (없으면 초기 상태).
 * - 로그아웃: 메모리 데이터를 비운다. 디스크의 계정 데이터는 그대로 남아
 *   같은 계정으로 다시 로그인하면 복원된다.
 */

interface UserDataScopeState {
  ready: boolean;
}

export const useUserDataScope = create<UserDataScopeState>(() => ({ ready: false }));

let appliedUserId: string | null | undefined; // undefined = 아직 적용 전
let queue: Promise<void> = Promise.resolve();
let initialized = false;

function resetAllStoresInMemory() {
  usePlaceStore.getState().resetToDefaults();
  useSavedLinkStore.getState().resetToDefaults();
  useTripStore.getState().resetToDefaults();
  useWalletStore.getState().resetToDefaults();
  useChecklistStore.getState().resetToDefaults();
}

async function rehydrateAllStores() {
  await Promise.all([
    Promise.resolve(usePlaceStore.persist.rehydrate()),
    Promise.resolve(useSavedLinkStore.persist.rehydrate()),
    Promise.resolve(useTripStore.persist.rehydrate()),
    Promise.resolve(useWalletStore.persist.rehydrate()),
    Promise.resolve(useChecklistStore.persist.rehydrate()),
  ]);
}

async function applyUserScope(userId: string | null) {
  if (appliedUserId === userId) {
    useUserDataScope.setState({ ready: true });
    return;
  }

  useUserDataScope.setState({ ready: false });
  try {
    setActiveCloudSyncUser(null);
    // 동기 구간: 이전 계정 저장소를 덮어쓰지 않도록 쓰기를 막고 메모리만 비운다.
    suspendStorageWrites(true);
    resetAllStoresInMemory();
    setStorageScope(userId);
    suspendStorageWrites(false);

    if (userId) {
      await migrateLegacyData(userId);
      await rehydrateAllStores();
      await syncCloudOnLogin(userId);
      setActiveCloudSyncUser(userId);
    }
    appliedUserId = userId;
  } catch (err) {
    console.log('[UserDataScope] failed to switch user data:', err);
  } finally {
    suspendStorageWrites(false);
    useUserDataScope.setState({ ready: true });
  }
}

function currentUserId(): string | null {
  const { isLoggedIn, user } = useAuthStore.getState();
  return isLoggedIn && user ? user.id : null;
}

function scheduleApply() {
  queue = queue.then(() => applyUserScope(currentUserId()));
}

export function initUserDataScope() {
  if (initialized) return;
  initialized = true;
  attachCloudSyncListeners();

  useAuthStore.subscribe((state, prev) => {
    const next = state.isLoggedIn && state.user ? state.user.id : null;
    const before = prev.isLoggedIn && prev.user ? prev.user.id : null;
    if (next !== before) scheduleApply();
  });

  if (useAuthStore.persist.hasHydrated()) {
    scheduleApply();
  } else {
    useAuthStore.persist.onFinishHydration(() => scheduleApply());
  }
}
