import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  calculateDistance,
  estimateTravelTime,
  formatMinutesToTime,
  solveTSPNearestNeighbor,
  formatTravelSummary,
} from '../src/utils/geoUtils';

describe('Geo & Routing Utils (FN-PLN)', () => {
  describe('calculateDistance (Haversine formula)', () => {
    it('returns 0 for identical coordinates', () => {
      const dist = calculateDistance(35.6895, 139.6917, 35.6895, 139.6917);
      assert.strictEqual(dist, 0);
    });

    it('calculates accurate distance between Tokyo Shibuya and Shinjuku (~3.5km)', () => {
      // Shibuya Station: 35.6580, 139.7016
      // Shinjuku Station: 35.6896, 139.7006
      const dist = calculateDistance(35.658, 139.7016, 35.6896, 139.7006);
      assert.ok(dist >= 3.3 && dist <= 3.8, `Expected ~3.5km, got ${dist}km`);
    });

    it('handles negative/opposite hemisphere coordinates without NaN', () => {
      // Seoul to Sydney
      const dist = calculateDistance(37.5665, 126.978, -33.8688, 151.2093);
      assert.ok(!isNaN(dist));
      assert.ok(dist > 8000 && dist < 9000, `Expected ~8300km, got ${dist}km`);
    });
  });

  describe('estimateTravelTime & formatTravelSummary (Req [7] Calibrated Travel Model)', () => {
    it('returns 0 if distance is 0 or negative', () => {
      assert.strictEqual(estimateTravelTime(0, 'WALK'), 0);
      assert.strictEqual(estimateTravelTime(-5, 'DRIVE'), 0);
    });

    it('calculates walking time with calibrated 4.2 km/h speed and 2 min intersection buffer', () => {
      // 1.4 km walk: ceil(1.4 / 4.2 * 60) = 20 + 2 = 22 mins
      const time = estimateTravelTime(1.4, 'WALK');
      assert.strictEqual(time, 22);
    });

    it('calculates transit time with calibrated 22 km/h speed and 6 min transfer overhead', () => {
      // 5.5 km transit: ceil(5.5 / 22 * 60) = 15 + 6 = 21 mins
      const time = estimateTravelTime(5.5, 'TRANSIT');
      assert.strictEqual(time, 21);
    });

    it('calculates driving time with calibrated 25 km/h speed and 3 min boarding buffer', () => {
      // 5.0 km drive: ceil(5.0 / 25 * 60) = 12 + 3 = 15 mins
      const time = estimateTravelTime(5.0, 'DRIVE');
      assert.strictEqual(time, 15);
    });

    it('enforces a minimum travel time of at least 2 minutes', () => {
      const time = estimateTravelTime(0.01, 'WALK');
      assert.ok(time >= 2, `Expected >= 2 min, got ${time}`);
    });

    it('formatTravelSummary returns accurate formatted summary string', () => {
      const walkSummary = formatTravelSummary(0.75, 'WALK', 12);
      assert.strictEqual(walkSummary, '도보 12분 (750m)');

      const transitSummary = formatTravelSummary(4.2, 'TRANSIT', 24);
      assert.strictEqual(transitSummary, '대중교통 24분 (4.2km)');
    });
  });

  describe('formatMinutesToTime', () => {
    it('formats 10:00 AM (600 minutes)', () => {
      assert.strictEqual(formatMinutesToTime(600), '10:00 AM');
    });

    it('formats 12:30 PM (750 minutes)', () => {
      assert.strictEqual(formatMinutesToTime(750), '12:30 PM');
    });

    it('formats 6:05 PM (1085 minutes)', () => {
      assert.strictEqual(formatMinutesToTime(1085), '6:05 PM');
    });

    it('formats midnight 12:00 AM (0 minutes)', () => {
      assert.strictEqual(formatMinutesToTime(0), '12:00 AM');
    });

    it('formats noon 12:00 PM (720 minutes)', () => {
      assert.strictEqual(formatMinutesToTime(720), '12:00 PM');
    });

    it('handles overflow beyond 24 hours (e.g. 1500 mins = 1:00 AM next day)', () => {
      assert.strictEqual(formatMinutesToTime(1500), '1:00 AM');
    });
  });

  describe('solveTSPNearestNeighbor (Route Optimization)', () => {
    it('returns identical or clone array when stops <= 2', () => {
      const items = [
        { id: '1', latitude: 35.658, longitude: 139.7016 },
        { id: '2', latitude: 35.6896, longitude: 139.7006 },
      ];
      const result = solveTSPNearestNeighbor(items);
      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].id, '1');
      assert.strictEqual(result[1].id, '2');
    });

    it('keeps stop index 0 (hotel/start point) firmly at index 0', () => {
      const stops = [
        { id: 'hotel', latitude: 35.6895, longitude: 139.6917 },
        { id: 'spot_far', latitude: 35.7148, longitude: 139.7967 }, // Asakusa (~11km)
        { id: 'spot_near', latitude: 35.6852, longitude: 139.7099 }, // Shinjuku Gyoen (~1.7km)
        { id: 'spot_mid', latitude: 35.6702, longitude: 139.7027 }, // Harajuku (~2.3km)
      ];

      const optimized = solveTSPNearestNeighbor(stops);
      assert.strictEqual(optimized[0].id, 'hotel', 'First stop must remain the starting anchor');
      assert.strictEqual(optimized[1].id, 'spot_near', 'Second stop must be the nearest to hotel');
      assert.strictEqual(optimized[2].id, 'spot_mid', 'Third stop should follow sequentially');
      assert.strictEqual(optimized[3].id, 'spot_far', 'Far stop should be visited last');
    });

    it('ensures optimized route total distance is strictly <= scrambled route', () => {
      // 4 points along a straight line: A(0,0), B(0,0.05), C(0,0.1), D(0,0.2)
      const start = { id: 'A', latitude: 35.0, longitude: 139.0 };
      const B = { id: 'B', latitude: 35.0, longitude: 139.05 };
      const C = { id: 'C', latitude: 35.0, longitude: 139.1 };
      const D = { id: 'D', latitude: 35.0, longitude: 139.2 };

      // Scrambled order: A -> D -> B -> C
      const scrambled = [start, D, B, C];
      const calculateTotalDist = (arr: typeof scrambled) => {
        let total = 0;
        for (let i = 0; i < arr.length - 1; i++) {
          total += calculateDistance(arr[i].latitude, arr[i].longitude, arr[i + 1].latitude, arr[i + 1].longitude);
        }
        return total;
      };

      const scrambledDist = calculateTotalDist(scrambled);
      const optimized = solveTSPNearestNeighbor(scrambled);
      const optimizedDist = calculateTotalDist(optimized);

      assert.ok(
        optimizedDist <= scrambledDist,
        `Optimized distance (${optimizedDist}km) must be <= scrambled (${scrambledDist}km)`
      );
    });
  });
});
