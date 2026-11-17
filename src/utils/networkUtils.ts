import type { PlaceCategory } from '../types';

/**
 * Shared fallback category cover images used only when live photos are unavailable.
 */
export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  CAFE: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop',
  cafe: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop',
  RESTAURANT: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop',
  restaurant: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop',
  ATTRACTION: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200&auto=format&fit=crop',
  spot: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200&auto=format&fit=crop',
  LODGING: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&auto=format&fit=crop',
  stay: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&auto=format&fit=crop',
  SHOPPING: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop',
  shopping: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop',
};

export function getCategoryFallbackImage(category?: PlaceCategory | string): string {
  if (!category) return CATEGORY_FALLBACK_IMAGES.ATTRACTION;
  return CATEGORY_FALLBACK_IMAGES[category] || CATEGORY_FALLBACK_IMAGES[category.toUpperCase()] || CATEGORY_FALLBACK_IMAGES.ATTRACTION;
}

/**
 * Shared Korean display label for PlaceCategory variants.
 */
export function getCategoryKoreanLabel(category?: PlaceCategory | string): string {
  switch (category) {
    case 'CAFE':
    case 'cafe':
      return '카페';
    case 'RESTAURANT':
    case 'restaurant':
      return '맛집';
    case 'ATTRACTION':
    case 'spot':
      return '명소';
    case 'LODGING':
    case 'stay':
      return '숙소';
    case 'SHOPPING':
    case 'shopping':
      return '쇼핑';
    case 'FLIGHT':
      return '항공';
    default:
      return '장소';
  }
}

/**
 * Shared fetch with guaranteed AbortController cleanup via finally.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = 4000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...fetchOptions, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchJsonWithTimeout<T = any>(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<T | null> {
  try {
    const res = await fetchWithTimeout(url, options);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Add days to YYYY-MM-DD ISO string safely in local calendar time.
 */
export function addDaysToIsoDate(isoDate: string, days: number): string {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return isoDate;
  const dt = new Date(parts[0], parts[1] - 1, parts[2] + days);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayIsoDate(): string {
  return new Date().toISOString().split('T')[0];
}

