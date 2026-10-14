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
 * Estimates travel duration in minutes based on distance and mode
 */
export function estimateTravelTime(
  distanceKm: number,
  mode: TransportMode
): number {
  if (distanceKm <= 0) return 0;

  let speedKmH = 4; // Default walk 4km/h
  let bufferMinutes = 0;

  switch (mode) {
    case 'WALK':
      speedKmH = 4.5;
      bufferMinutes = 2;
      break;
    case 'TRANSIT':
      speedKmH = 22;
      bufferMinutes = 7; // Waiting & transfer time
      break;
    case 'DRIVE':
      speedKmH = 35;
      bufferMinutes = 4; // Traffic & parking
      break;
  }

  const travelMins = Math.ceil((distanceKm / speedKmH) * 60) + bufferMinutes;
  return Math.max(travelMins, 3);
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
