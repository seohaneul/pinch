export type TransportMode = 'WALK' | 'TRANSIT' | 'DRIVE';

/**
 * Calculates distance in kilometers between two GPS coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10;
}

/**
 * Calibrated realistic travel speeds & buffers:
 * - Walk: 4.2 km/h + 2 min intersection buffer
 * - Transit: Urban subway/bus model (Average 22 km/h + 6 min transfer/wait overhead)
 * - Drive/Taxi: City traffic model (Average 25 km/h + 3 min boarding buffer)
 */
export function estimateTravelTime(
  distanceKm: number,
  mode: TransportMode
): number {
  if (distanceKm <= 0) return 0;

  let speedKmH = 4.2;
  let bufferMinutes = 2;

  switch (mode) {
    case 'WALK':
      speedKmH = 4.2;
      bufferMinutes = 2;
      break;
    case 'TRANSIT':
      speedKmH = 22.0;
      bufferMinutes = 6;
      break;
    case 'DRIVE':
      speedKmH = 25.0;
      bufferMinutes = 3;
      break;
  }

  const travelMins = Math.ceil((distanceKm / speedKmH) * 60) + bufferMinutes;
  return Math.max(travelMins, 2);
}

/**
 * Formats distance and duration into a clean, human-readable string:
 * e.g., "도보 12분 (750m)", "대중교통 24분 (4.2km)", "차량 15분 (6.5km)"
 */
export function formatTravelSummary(
  distanceKm: number,
  mode: TransportMode,
  durationMinutes?: number
): string {
  const duration = durationMinutes ?? estimateTravelTime(distanceKm, mode);
  const distanceFormatted =
    distanceKm < 1
      ? `${Math.round(distanceKm * 1000)}m`
      : `${distanceKm.toFixed(1)}km`;

  const modeLabel =
    mode === 'WALK' ? '도보' : mode === 'TRANSIT' ? '대중교통' : '차량';

  return `${modeLabel} ${duration}분 (${distanceFormatted})`;
}

/**
 * Formats total minutes from midnight into 12-hour AM/PM time string (e.g. "10:30 AM")
 */
export function formatMinutesToTime(totalMinutes: number): string {
  const normalized = (totalMinutes + 24 * 60) % (24 * 60);
  const hours24 = Math.floor(normalized / 60);
  const minutes = normalized % 60;

  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;

  return `${hours12}:${formattedMinutes} ${period}`;
}

/**
 * TSP (Travelling Salesperson Problem) Greedy Nearest-Neighbor Algorithm
 * Reorders stops to minimize total travel distance starting from the first stop.
 */
export function solveTSPNearestNeighbor<T extends { latitude: number; longitude: number }>(
  items: T[]
): T[] {
  if (items.length <= 2) return [...items];

  const unvisited = [...items];
  const result: T[] = [];

  // Start with the first stop
  let current = unvisited.shift()!;
  result.push(current);

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = calculateDistance(
        current.latitude,
        current.longitude,
        unvisited[i].latitude,
        unvisited[i].longitude
      );

      if (dist < minDistance) {
        minDistance = dist;
        nearestIndex = i;
      }
    }

    current = unvisited.splice(nearestIndex, 1)[0];
    result.push(current);
  }

  return result;
}

/**
 * Computes total route distance in km for a sequence of stops
 */
export function calculateTotalRouteDistance<T extends { latitude: number; longitude: number }>(
  stops: T[]
): number {
  if (stops.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < stops.length; i++) {
    total += calculateDistance(
      stops[i - 1].latitude,
      stops[i - 1].longitude,
      stops[i].latitude,
      stops[i].longitude
    );
  }
  return Math.round(total * 10) / 10;
}

/**
 * Computes total travel duration in minutes for a sequence of stops
 */
export function calculateTotalRouteTravelTime<
  T extends { latitude: number; longitude: number; transport_mode?: TransportMode }
>(stops: T[]): number {
  if (stops.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < stops.length; i++) {
    const dist = calculateDistance(
      stops[i - 1].latitude,
      stops[i - 1].longitude,
      stops[i].latitude,
      stops[i].longitude
    );
    const mode = stops[i].transport_mode || 'WALK';
    total += estimateTravelTime(dist, mode);
  }
  return total;
}
