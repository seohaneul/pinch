import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StateStorage } from 'zustand/middleware';

/**
 * 계정별 로컬 데이터 분리용 저장소.
 *
 * - 여행/장소/링크/가계부 스토어는 `이름::사용자ID` 키로 저장되어
 *   계정마다 데이터가 섞이지 않는다.
 * - 로그아웃(게스트) 상태에서는 `이름::guest` 범위를 쓰지만 실제로는 저장하지 않는다.
 */

export const USER_DATA_STORE_KEYS = [
  'pinch-place-storage',
  'pinch-saved-links-storage',
  'pinch-trip-storage',
  'pinch-wallet-storage',
] as const;

export type UserDataStoreKey = (typeof USER_DATA_STORE_KEYS)[number];

const GUEST_SCOPE = 'guest';

let currentScope = GUEST_SCOPE;
let writesSuspended = false;

function sanitizeScope(userId: string | null | undefined): string {
  if (!userId) return GUEST_SCOPE;
  return String(userId).replace(/[^a-zA-Z0-9_-]/g, '_');
}

export function scopedKey(name: string, userId?: string | null): string {
  const scope = userId === undefined ? currentScope : sanitizeScope(userId);
  return `${name}::${scope}`;
}

export function getStorageScope(): string {
  return currentScope;
}

export function setStorageScope(userId: string | null | undefined): void {
  currentScope = sanitizeScope(userId);
}

/** 메모리 상태를 초기화하는 동안 이전 계정 데이터를 덮어쓰지 않도록 쓰기를 잠시 막는다. */
export function suspendStorageWrites(suspended: boolean): void {
  writesSuspended = suspended;
}

export const userScopedAsyncStorage: StateStorage = {
  getItem: (name) => AsyncStorage.getItem(scopedKey(name)),
  setItem: async (name, value) => {
    if (writesSuspended || currentScope === GUEST_SCOPE) return;
    // 키는 호출 시점에 확정해서, 계정 전환 중이던 쓰기가 다른 계정으로 새지 않게 한다.
    await AsyncStorage.setItem(scopedKey(name), value);
  },
  removeItem: async (name) => {
    if (writesSuspended || currentScope === GUEST_SCOPE) return;
    await AsyncStorage.removeItem(scopedKey(name));
  },
};

/**
 * 계정 분리 도입 이전 버전이 저장한 데이터(고정 키)를 첫 로그인 계정으로 이전한다.
 * 이전이 끝나면 예전 키는 삭제한다.
 */
export async function migrateLegacyData(userId: string): Promise<void> {
  for (const name of USER_DATA_STORE_KEYS) {
    try {
      const legacy = await AsyncStorage.getItem(name);
      if (legacy == null) continue;
      const target = scopedKey(name, userId);
      const existing = await AsyncStorage.getItem(target);
      if (existing == null) {
        await AsyncStorage.setItem(target, legacy);
      }
      await AsyncStorage.removeItem(name);
    } catch (err) {
      console.log('[UserScopedStorage] legacy migration failed:', name, err);
    }
  }
}

/** 해당 계정의 로컬 저장 데이터를 JSON으로 읽는다 (데이터 내보내기용). */
export async function readScopedData(
  userId: string
): Promise<Record<UserDataStoreKey, unknown>> {
  const result = {} as Record<UserDataStoreKey, unknown>;
  for (const name of USER_DATA_STORE_KEYS) {
    try {
      const raw = await AsyncStorage.getItem(scopedKey(name, userId));
      result[name] = raw ? JSON.parse(raw)?.state ?? null : null;
    } catch {
      result[name] = null;
    }
  }
  return result;
}

/** 해당 계정의 로컬 저장 데이터를 모두 삭제한다 (계정 삭제용). */
export async function clearScopedData(userId: string): Promise<void> {
  for (const name of USER_DATA_STORE_KEYS) {
    try {
      await AsyncStorage.removeItem(scopedKey(name, userId));
    } catch (err) {
      console.log('[UserScopedStorage] clear failed:', name, err);
    }
  }
}
