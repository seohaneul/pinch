import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../src/store/useAuthStore';
import { usePlaceStore } from '../src/store/usePlaceStore';
import { useTripStore } from '../src/store/useTripStore';
import { initUserDataScope, useUserDataScope } from '../src/store/userDataScope';
import { importBackupJson } from '../src/store/cloudSync';
import {
  getStorageScope,
  scopedKey,
  readScopedData,
  clearScopedData,
} from '../src/store/userScopedStorage';

const makeUser = (id: string) => ({
  id,
  email: `${id}@example.com`,
  nickname: id,
  createdAt: new Date().toISOString(),
});

const loginAs = (id: string) =>
  useAuthStore.setState({ isLoggedIn: true, user: makeUser(id) });

const logoutLocal = () => useAuthStore.setState({ isLoggedIn: false, user: null });

/** 계정 전환(비동기 큐)이 끝나 expectedScope 가 적용되고 ready 가 될 때까지 기다린다. */
async function settle(expectedScope: string) {
  for (let i = 0; i < 100; i++) {
    await new Promise((r) => setTimeout(r, 10));
    if (useUserDataScope.getState().ready && getStorageScope() === expectedScope) {
      // persist 쓰기(비동기)까지 마무리될 시간
      await new Promise((r) => setTimeout(r, 20));
      return;
    }
  }
  throw new Error(`scope did not settle to ${expectedScope}`);
}

const fakePlace = (id: string, name: string) =>
  ({ id, name, address: 'addr', category: 'CAFE', trip_id: 't1' }) as any;

describe('Account-scoped local data (계정별 데이터 분리)', () => {
  before(async () => {
    logoutLocal();
    initUserDataScope();
    await settle('guest');
  });

  after(async () => {
    logoutLocal();
    await settle('guest');
  });

  it('keeps each account data separate and restores it on re-login', async () => {
    loginAs('userA');
    await settle('userA');
    usePlaceStore.setState({ places: [fakePlace('p1', 'A의 카페')] });
    await new Promise((r) => setTimeout(r, 30));

    loginAs('userB');
    await settle('userB');
    assert.strictEqual(usePlaceStore.getState().places.length, 0, 'B must not see A data');
    usePlaceStore.setState({ places: [fakePlace('p2', 'B의 식당'), fakePlace('p3', 'B의 공원')] });
    await new Promise((r) => setTimeout(r, 30));

    loginAs('userA');
    await settle('userA');
    const aPlaces = usePlaceStore.getState().places;
    assert.strictEqual(aPlaces.length, 1);
    assert.strictEqual(aPlaces[0].name, 'A의 카페');

    loginAs('userB');
    await settle('userB');
    assert.strictEqual(usePlaceStore.getState().places.length, 2);
  });

  it('clears in-memory data on logout without deleting the stored account data', async () => {
    loginAs('userA');
    await settle('userA');
    assert.strictEqual(usePlaceStore.getState().places.length, 1);

    logoutLocal();
    await settle('guest');
    assert.strictEqual(usePlaceStore.getState().places.length, 0, 'memory must be cleared');

    const stored = await AsyncStorage.getItem(scopedKey('pinch-place-storage', 'userA'));
    assert.ok(stored, 'disk data of userA must remain');
  });

  it('does not persist anything while logged out (guest)', async () => {
    usePlaceStore.setState({ places: [fakePlace('g1', '게스트 장소')] });
    await new Promise((r) => setTimeout(r, 30));
    const guestStored = await AsyncStorage.getItem(scopedKey('pinch-place-storage', null));
    assert.strictEqual(guestStored, null);
    usePlaceStore.setState({ places: [] });
  });

  it('gives a brand-new account a fresh onboarding state', async () => {
    loginAs('userNew');
    await settle('userNew');
    assert.strictEqual(useTripStore.getState().hasCompletedOnboarding, false);
    assert.strictEqual(usePlaceStore.getState().places.length, 0);
  });

  it('migrates legacy (un-scoped) data to the first account that logs in', async () => {
    logoutLocal();
    await settle('guest');

    await AsyncStorage.setItem(
      'pinch-place-storage',
      JSON.stringify({ state: { places: [fakePlace('l1', '예전 데이터')] }, version: 0 })
    );

    loginAs('userLegacy');
    await settle('userLegacy');
    const places = usePlaceStore.getState().places;
    assert.strictEqual(places.length, 1);
    assert.strictEqual(places[0].name, '예전 데이터');
    assert.strictEqual(await AsyncStorage.getItem('pinch-place-storage'), null, 'legacy key removed');
  });

  it('readScopedData / clearScopedData only touch the given account', async () => {
    const dataA = (await readScopedData('userA')) as any;
    assert.strictEqual(dataA['pinch-place-storage'].places.length, 1);

    await clearScopedData('userA');
    const afterClear = (await readScopedData('userA')) as any;
    assert.strictEqual(afterClear['pinch-place-storage'], null);

    const dataB = (await readScopedData('userB')) as any;
    assert.strictEqual(dataB['pinch-place-storage'].places.length, 2, 'userB untouched');
  });

  it('importBackupJson restores exported Pinch JSON and rejects invalid payloads', async () => {
    const invalidRes = await importBackupJson('userB', '{not-valid-json');
    assert.strictEqual(invalidRes.success, false);

    const emptyRes = await importBackupJson('userB', JSON.stringify({ hello: 'world' }));
    assert.strictEqual(emptyRes.success, false);

    loginAs('userB');
    await settle('userB');

    const exportedSample = JSON.stringify({
      app: 'Pinch',
      data: {
        'pinch-place-storage': {
          places: [{ id: 'imp_1', name: '복원된 도쿄 타워', category: 'sight', address: '도쿄' }],
        },
        'pinch-trip-storage': {
          trips: [{ id: 'trip_imp', title: '도쿄 복원 여행', destination: '도쿄', startDate: '2026-12-01', endDate: '2026-12-03', members: [] }],
          currentTrip: { id: 'trip_imp', title: '도쿄 복원 여행', destination: '도쿄', startDate: '2026-12-01', endDate: '2026-12-03', members: [] },
          activeTripId: 'trip_imp',
          scheduleItems: [],
          hasCompletedOnboarding: true,
        },
      },
    });

    const okRes = await importBackupJson('userB', exportedSample);
    assert.strictEqual(okRes.success, true);
    assert.strictEqual(usePlaceStore.getState().places.length, 1);
    assert.strictEqual(usePlaceStore.getState().places[0].name, '복원된 도쿄 타워');
    assert.strictEqual(useTripStore.getState().activeTripId, 'trip_imp');
  });
});
