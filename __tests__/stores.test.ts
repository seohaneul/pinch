import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { usePlaceStore } from '../src/store/usePlaceStore';
import { useTripStore } from '../src/store/useTripStore';
import { useWalletStore } from '../src/store/useWalletStore';
import { detectSnsPlatform, parseSnsUrl } from '../src/services/parserService';

describe('Store Actions & Cross-Store Integration (FN-PLC, FN-PLN, FN-WAL)', () => {
  beforeEach(() => {
    usePlaceStore.getState().resetToDefaults();
    useTripStore.getState().resetToDefaults();
    useWalletStore.getState().resetToDefaults();
  });

  describe('[FN-PLC-001] Clipboard Detector Logic', () => {
    // Logic helper modeled directly from app/(tabs)/index.tsx and places.tsx
    const isValidUrl = (text: string): boolean => {
      if (!text || typeof text !== 'string') return false;
      const trimmed = text.trim();
      return trimmed.startsWith('http://') || trimmed.startsWith('https://');
    };

    it('identifies valid HTTP/HTTPS URLs', () => {
      assert.strictEqual(isValidUrl('https://instagram.com/p/Cxyz123'), true);
      assert.strictEqual(isValidUrl('http://blog.naver.com/my_place'), true);
      assert.strictEqual(isValidUrl('https://maps.app.goo.gl/tokyo_tower'), true);
    });

    it('rejects plain text and non-URL inputs', () => {
      assert.strictEqual(isValidUrl('안녕하세요 오늘 도쿄 여행 어때요?'), false);
      assert.strictEqual(isValidUrl('ftp://example.com/file'), false);
      assert.strictEqual(isValidUrl(''), false);
      assert.strictEqual(isValidUrl('   '), false);
    });

    it('ensures dismissed URLs in the same session are not re-prompted', () => {
      const dismissedUrls = new Set<string>();
      const testUrl = 'https://instagram.com/p/Cxyz123';

      const shouldPrompt = (url: string) => isValidUrl(url) && !dismissedUrls.has(url);

      assert.strictEqual(shouldPrompt(testUrl), true);
      // User dismisses
      dismissedUrls.add(testUrl);
      assert.strictEqual(shouldPrompt(testUrl), false, 'Dismissed URL should not prompt again');

      // A new distinct URL will still prompt
      const newUrl = 'https://youtube.com/shorts/japan_spot';
      assert.strictEqual(shouldPrompt(newUrl), true);
    });
  });

  describe('[FN-PLC-002] Parsing Service (parseSnsUrl & detectSnsPlatform)', () => {
    it('correctly detects SNS platforms from URLs', () => {
      assert.strictEqual(detectSnsPlatform('https://www.instagram.com/p/DA123'), 'instagram');
      assert.strictEqual(detectSnsPlatform('https://instagr.am/reel/XYZ'), 'instagram');
      assert.strictEqual(detectSnsPlatform('https://youtube.com/shorts/abc'), 'youtube');
      assert.strictEqual(detectSnsPlatform('https://youtu.be/watch?v=123'), 'youtube');
      assert.strictEqual(detectSnsPlatform('https://blog.naver.com/post/1'), 'naver');
      assert.strictEqual(detectSnsPlatform('https://m.tiktok.com/v/12345'), 'tiktok');
      assert.strictEqual(detectSnsPlatform('https://maps.google.com/place'), 'manual');
    });

    it('parseSnsUrl returns a valid Place object with required non-empty fields', async () => {
      const url = 'https://instagram.com/p/test_place';
      const place = await parseSnsUrl(url);

      assert.ok(place.id, 'Must have unique place id');
      assert.ok(place.name.length > 0, 'Must have place name');
      assert.ok(place.address.length > 0, 'Must have address');
      assert.ok(place.latitude !== 0 && !isNaN(place.latitude), 'Must have valid latitude');
      assert.ok(place.longitude !== 0 && !isNaN(place.longitude), 'Must have valid longitude');
      assert.ok(place.category, 'Must have category');
      assert.ok(place.imageUrl?.startsWith('http'), 'Must have valid image URL');
      assert.strictEqual(place.sourcePlatform, 'instagram');
      assert.strictEqual(place.isPinned, true);
    });
  });

  describe('[FN-PLC-003 & 005] usePlaceStore Actions & Filtering', () => {
    it('filters places by category', () => {
      const places = usePlaceStore.getState().places;
      const cafeCount = places.filter((p) => p.category === 'CAFE').length;

      usePlaceStore.getState().setCategory('CAFE');
      assert.strictEqual(usePlaceStore.getState().selectedCategory, 'CAFE');

      const filtered = places.filter(
        (p) => usePlaceStore.getState().selectedCategory === 'ALL' || p.category === 'CAFE'
      );
      assert.strictEqual(filtered.length, cafeCount);
    });

    it('filters places by keyword matching name and address', () => {
      const places = usePlaceStore.getState().places;

      // Search by name "푸글렌"
      const nameMatch = places.filter((p) =>
        p.name.toLowerCase().includes('푸글렌') || p.address.toLowerCase().includes('푸글렌')
      );
      assert.ok(nameMatch.length >= 1);
      assert.strictEqual(nameMatch[0].name.includes('푸글렌'), true);

      // Search by address "Shibuya"
      const addressMatch = places.filter((p) =>
        p.name.toLowerCase().includes('shibuya') || p.address.toLowerCase().includes('shibuya')
      );
      assert.ok(addressMatch.length >= 1);
    });

    it('removes a place by ID without mutating other items', () => {
      const initialCount = usePlaceStore.getState().places.length;
      const targetId = 'p1';

      usePlaceStore.getState().removePlace(targetId);
      const remaining = usePlaceStore.getState().places;

      assert.strictEqual(remaining.length, initialCount - 1);
      assert.strictEqual(remaining.some((p) => p.id === targetId), false);
    });

    it('toggles pin state on place item', () => {
      const target = usePlaceStore.getState().places.find((p) => p.id === 'p3')!;
      const initialPinned = target.isPinned;

      usePlaceStore.getState().togglePin('p3');
      const updated = usePlaceStore.getState().places.find((p) => p.id === 'p3')!;
      assert.strictEqual(updated.isPinned, !initialPinned);
    });
  });

  describe('[FN-PLN-002, 003, 004] useTripStore Scheduling Engine', () => {
    it('reorders schedule items and ensures order_index is strictly sequential (1, 2, 3...)', () => {
      const dayNumber = 1;
      const itemsBefore = useTripStore
        .getState()
        .scheduleItems.filter((s) => s.day_number === dayNumber)
        .sort((a, b) => a.order_index - b.order_index);

      assert.ok(itemsBefore.length >= 3, 'Day 1 should start with at least 3 items');
      const originalFirstId = itemsBefore[0].id;
      const originalThirdId = itemsBefore[2].id;

      // Move index 2 (third item) to index 0 (first)
      useTripStore.getState().reorderSchedule(dayNumber, 2, 0);

      const itemsAfter = useTripStore
        .getState()
        .scheduleItems.filter((s) => s.day_number === dayNumber)
        .sort((a, b) => a.order_index - b.order_index);

      // First item is now original third item
      assert.strictEqual(itemsAfter[0].id, originalThirdId);
      assert.strictEqual(itemsAfter[1].id, originalFirstId);

      // Strictly 1-indexed sequential check
      itemsAfter.forEach((item, idx) => {
        assert.strictEqual(item.order_index, idx + 1, `order_index at pos ${idx} must be ${idx + 1}`);
      });
    });

    it('propagates stay_duration_minutes change to downstream arrival times', () => {
      const dayNumber = 1;
      useTripStore.getState().recalculateTimes(dayNumber);

      const items = useTripStore
        .getState()
        .scheduleItems.filter((s) => s.day_number === dayNumber)
        .sort((a, b) => a.order_index - b.order_index);

      const firstItem = items[0];
      const secondItemBefore = items[1];
      const initialSecondArrival = secondItemBefore.arrival_time; // e.g. "11:22 AM"

      // Increase stay duration of first item from 60 to 90 (+30 minutes)
      useTripStore.getState().updateStayDuration(firstItem.id, 90);

      const itemsAfter = useTripStore
        .getState()
        .scheduleItems.filter((s) => s.day_number === dayNumber)
        .sort((a, b) => a.order_index - b.order_index);

      const secondItemAfter = itemsAfter[1];
      assert.notStrictEqual(
        secondItemAfter.arrival_time,
        initialSecondArrival,
        'Second stop arrival time must shift after extending first stop stay duration'
      );
    });

    it('adds a place from usePlaceStore into Day 1 schedule and updates order_index', () => {
      const place = usePlaceStore.getState().places[0];
      const dayNumber = 1;

      const countBefore = useTripStore
        .getState()
        .scheduleItems.filter((s) => s.day_number === dayNumber).length;

      useTripStore.getState().addPlaceToSchedule(dayNumber, place);

      const dayItemsAfter = useTripStore
        .getState()
        .scheduleItems.filter((s) => s.day_number === dayNumber)
        .sort((a, b) => a.order_index - b.order_index);

      assert.strictEqual(dayItemsAfter.length, countBefore + 1);

      const added = dayItemsAfter[dayItemsAfter.length - 1];
      assert.strictEqual(added.place_name, place.name);
      assert.strictEqual(added.place_id, place.id);
      assert.strictEqual(added.order_index, dayItemsAfter.length);
      assert.ok(added.arrival_time, 'Must compute arrival time');
    });

    it('removes schedule item and cleanly shifts remaining order_index down by 1', () => {
      const dayNumber = 1;
      const dayItems = useTripStore
        .getState()
        .scheduleItems.filter((s) => s.day_number === dayNumber)
        .sort((a, b) => a.order_index - b.order_index);

      const middleItem = dayItems[1]; // order_index 2
      useTripStore.getState().removeScheduleItem(middleItem.id);

      const remaining = useTripStore
        .getState()
        .scheduleItems.filter((s) => s.day_number === dayNumber)
        .sort((a, b) => a.order_index - b.order_index);

      remaining.forEach((item, idx) => {
        assert.strictEqual(item.order_index, idx + 1, 'order_index must stay dense without gaps');
      });
    });
  });

  describe('Cross-Store Flow: Places -> Planner -> Wallet', () => {
    it('attaches itinerary schedule item to wallet expense and updates total KRW', () => {
      const tripSchedule = useTripStore.getState().scheduleItems[0];
      const initialTotalKrw = useWalletStore.getState().getTotalKrw();

      useWalletStore.getState().addExpense({
        trip_id: tripSchedule.trip_id,
        schedule_id: tripSchedule.id,
        place_name: tripSchedule.place_name,
        title: '신주쿠 라멘 단체 식사',
        paid_by: 'm1',
        currency: 'JPY',
        amount: 4500,
        exchange_rate: 9.15,
        split_members: ['m1', 'm2', 'm3'],
        category: 'FOOD',
      });

      const expenses = useWalletStore.getState().expenses;
      const latest = expenses[0];

      assert.strictEqual(latest.schedule_id, tripSchedule.id);
      assert.strictEqual(latest.place_name, tripSchedule.place_name);
      assert.strictEqual(latest.krw_amount, Math.round(4500 * 9.15));

      const newTotalKrw = useWalletStore.getState().getTotalKrw();
      assert.strictEqual(newTotalKrw, initialTotalKrw + Math.round(4500 * 9.15));
    });
  });
});
