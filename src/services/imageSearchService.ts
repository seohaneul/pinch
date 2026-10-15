import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PlaceCategory } from '../types';

const IMAGE_CACHE_KEY_PREFIX = '@pinchi_place_image_cache_v1_';
const MEMORY_CACHE: Map<string, string> = new Map();

// Known curated high-resolution photography for renowned places/cafes
const CURATED_REAL_IMAGES: Record<string, string> = {
  푸글렌: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&auto=format&fit=crop',
  fuglen: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&auto=format&fit=crop',
  모토커피: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop',
  'moto coffee': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop',
  우무: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=1200&auto=format&fit=crop',
  umu: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=1200&auto=format&fit=crop',
  하브스: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200&auto=format&fit=crop',
  harbs: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200&auto=format&fit=crop',
  블루보틀: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&auto=format&fit=crop',
  'blue bottle': 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&auto=format&fit=crop',
  '이치란': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1200&auto=format&fit=crop',
  'ichiran': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1200&auto=format&fit=crop',
  '시부야 스카이': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&auto=format&fit=crop',
  'shibuya sky': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&auto=format&fit=crop',
};

// Category curated fallbacks
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

/**
 * Clean place name into search keywords
 */
export function extractSearchKeywords(rawName: string): string[] {
  if (!rawName) return [];

  // Remove emojis, bracket contents, and generic symbols
  const cleanBase = rawName
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/[✨🗼🍜☕🛍️🏮📍🇯🇵✈️🍰🍮🎉⭐🔥❤️]/g, '')
    .replace(/[#@]/g, '')
    .trim();

  // Extract English or original script in parens if present (e.g. "伏見稲荷大社", "Fuglen Tokyo", "Sensō-ji")
  const parenMatch = rawName.match(/\((.*?)\)/);
  const parenText = parenMatch ? parenMatch[1].trim() : '';

  const candidates: string[] = [];
  if (cleanBase) candidates.push(cleanBase);
  if (parenText) candidates.push(parenText);

  // If name has branch suffix like "이치란 라멘 시부야스페인자카점", also extract the brand "이치란 라멘"
  const tokens = cleanBase.split(/\s+/);
  if (tokens.length > 1) {
    candidates.push(tokens.slice(0, 2).join(' '));
    candidates.push(tokens[0]);
  }

  return Array.from(new Set(candidates.filter((c) => c && c.length >= 2)));
}

/**
 * Fetch real place image from Wikipedia / Wikimedia / Curated DB
 */
export async function fetchRealPlaceImage(
  placeName: string,
  address?: string,
  category?: PlaceCategory,
  latitude?: number,
  longitude?: number
): Promise<string | null> {
  if (!placeName) return null;

  const cacheKey = `${placeName.trim()}_${address || ''}`.toLowerCase();

  // 1. In-memory cache check
  if (MEMORY_CACHE.has(cacheKey)) {
    return MEMORY_CACHE.get(cacheKey)!;
  }

  // 2. Persistent storage cache check
  try {
    const cached = await AsyncStorage.getItem(IMAGE_CACHE_KEY_PREFIX + cacheKey);
    if (cached) {
      MEMORY_CACHE.set(cacheKey, cached);
      return cached;
    }
  } catch (e) {
    // Continue
  }

  const keywords = extractSearchKeywords(placeName);
  const lowerName = placeName.toLowerCase();

  // 3. Curated Database Check
  for (const [key, url] of Object.entries(CURATED_REAL_IMAGES)) {
    if (lowerName.includes(key)) {
      saveToCache(cacheKey, url);
      return url;
    }
  }

  // 4. Wikipedia Search (Korean -> English -> Japanese)
  for (const term of keywords) {
    for (const lang of ['ko', 'en', 'ja']) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);

        const url = `https://${lang}.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
          term
        )}&gsrlimit=1&prop=pageimages&pithumbsize=1200&format=json&origin=*`;

        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'PinchiTravelApp/1.0 (contact@pinchi.app)',
            Accept: 'application/json',
          },
        });
        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          const pages = data.query?.pages;
          if (pages) {
            const page = Object.values(pages)[0] as any;
            const src = page?.thumbnail?.source;
            if (
              src &&
              !src.includes('Disambig') &&
              !src.endsWith('.svg') &&
              !src.endsWith('.svg.png')
            ) {
              saveToCache(cacheKey, src);
              return src;
            }
          }
        }
      } catch (err) {
        // Fallthrough to next candidate
      }
    }
  }

  // 5. Wikimedia Commons Bitmap Search
  for (const term of keywords) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(
        term + ' filetype:bitmap'
      )}&gsrlimit=3&prop=imageinfo&iiprop=url|thumburl&iiurlwidth=1200&format=json&origin=*`;

      const res = await fetch(commonsUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'PinchiTravelApp/1.0 (contact@pinchi.app)',
          Accept: 'application/json',
        },
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const pages = data.query?.pages;
        if (pages) {
          for (const p of Object.values(pages) as any[]) {
            const thumb = p.imageinfo?.[0]?.thumburl || p.imageinfo?.[0]?.url;
            if (
              thumb &&
              !thumb.endsWith('.svg') &&
              !thumb.endsWith('.pdf') &&
              !thumb.endsWith('.ogg')
            ) {
              saveToCache(cacheKey, thumb);
              return thumb;
            }
          }
        }
      }
    } catch (err) {
      // Fallthrough
    }
  }

  // 6. Wikipedia Geosearch (Coordinates based)
  if (
    latitude &&
    longitude &&
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude !== 0 &&
    longitude !== 0
  ) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const geoUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=geosearch&ggscoord=${latitude}|${longitude}&ggsradius=1000&prop=pageimages&pithumbsize=1200&format=json&origin=*`;

      const res = await fetch(geoUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'PinchiTravelApp/1.0 (contact@pinchi.app)',
        },
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const pages = data.query?.pages;
        if (pages) {
          for (const p of Object.values(pages) as any[]) {
            const src = p.thumbnail?.source;
            if (src && !src.endsWith('.svg') && !src.includes('Disambig')) {
              saveToCache(cacheKey, src);
              return src;
            }
          }
        }
      }
    } catch (err) {
      // Fallthrough
    }
  }

  // 7. Category Fallback
  const fallback =
    (category && CATEGORY_FALLBACK_IMAGES[category]) ||
    CATEGORY_FALLBACK_IMAGES.ATTRACTION;
  return fallback;
}

function saveToCache(key: string, url: string) {
  MEMORY_CACHE.set(key, url);
  try {
    AsyncStorage.setItem(IMAGE_CACHE_KEY_PREFIX + key, url);
  } catch (e) {
    // Ignore cache persistence errors
  }
}
