import { Place, PlaceCategory } from '../types';

interface MockPlaceTemplate {
  name: string;
  address: string;
  category: PlaceCategory;
  latitude: number;
  longitude: number;
  memo: string;
  imageUrl: string;
  rating: number;
  tags: string[];
}

const SAMPLE_PLACES: MockPlaceTemplate[] = [
  {
    name: '푸글렌 도쿄 (Fuglen Tokyo)',
    address: '1 Chome-16-11 Tomigaya, Shibuya City, Tokyo',
    category: 'CAFE',
    latitude: 35.6664,
    longitude: 139.6917,
    memo: '인스타 릴스 핫플! 노르웨이 감성 로스팅 카페 & 싱글오리진 브루잉',
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop',
    rating: 4.8,
    tags: ['도쿄카페', '푸글렌', '핸드드립'],
  },
  {
    name: '후시미 이나리 신사 (伏見稲荷大社)',
    address: '68 Fukakusa Yabunouchicho, Fushimi Ward, Kyoto',
    category: 'ATTRACTION',
    latitude: 34.9671,
    longitude: 135.7727,
    memo: '유튜브 숏츠 추천! 붉은 토리이 터널과 여우 신사 산책 코스',
    imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&auto=format&fit=crop',
    rating: 4.9,
    tags: ['교토여행', '토리이', '인생샷'],
  },
  {
    name: '어니언 성수 (Cafe Onion)',
    address: '서울 성동구 아차산로9길 8',
    category: 'CAFE',
    latitude: 37.5458,
    longitude: 127.0581,
    memo: '폐공장 개조 베이커리 카페. 팡도르와 아메리카노 조합 강추!',
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format&fit=crop',
    rating: 4.7,
    tags: ['성수동', '팡도르', '베이커리'],
  },
  {
    name: '이치란 라멘 하카타 본점',
    address: '5 Chome-3-2 Nakasu, Hakata Ward, Fukuoka',
    category: 'RESTAURANT',
    latitude: 33.5932,
    longitude: 130.4037,
    memo: '네이버 블로그 후기 1위! 1인 독서실 독서대에서 즐기는 돈코츠 라멘',
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop',
    rating: 4.6,
    tags: ['후쿠오카', '돈코츠라멘', '웨이팅'],
  },
  {
    name: '파크 하얏트 도쿄',
    address: '3-7-1-2 Nishi-Shinjuku, Shinjuku-ku, Tokyo',
    category: 'LODGING',
    latitude: 35.6858,
    longitude: 139.6908,
    memo: '신주쿠 야경 한눈에 보이는 럭셔리 호텔 뷰버',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop',
    rating: 4.9,
    tags: ['도쿄호텔', '시티뷰', '호캉스'],
  },
  {
    name: '도쿄 빔즈 (BEAMS Harajuku)',
    address: '3 Chome-24-7 Jingumae, Shibuya City, Tokyo',
    category: 'SHOPPING',
    latitude: 35.6708,
    longitude: 139.7067,
    memo: '하늘 아래 같은 옷은 없다! 스트릿 셀렉트샵 빔즈 본점',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop',
    rating: 4.7,
    tags: ['하라도쿄', '빔즈', '편집샵'],
  },
];

export function detectSnsPlatform(url: string): 'instagram' | 'youtube' | 'naver' | 'tiktok' | 'manual' {
  const lower = url.toLowerCase();
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) return 'instagram';
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  if (lower.includes('naver.com') || lower.includes('naver.me')) return 'naver';
  if (lower.includes('tiktok.com')) return 'tiktok';
  return 'manual';
}

export async function parseSnsUrl(url: string): Promise<Place> {
  // Simulate Gemini AI + Geocoding latency (1.2s)
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const platform = detectSnsPlatform(url);

  // Pick template based on URL length hash or random
  const index = Math.abs(url.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % SAMPLE_PLACES.length;
  const template = SAMPLE_PLACES[index];

  const parsedPlace: Place = {
    id: `place_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: template.name,
    address: template.address,
    category: template.category,
    latitude: template.latitude,
    longitude: template.longitude,
    memo: `${template.memo} (출처: ${platform.toUpperCase()})`,
    snsUrl: url,
    imageUrl: template.imageUrl,
    rating: template.rating,
    isPinned: true,
    createdAt: new Date().toISOString(),
    tags: template.tags,
    sourcePlatform: platform,
  };

  return parsedPlace;
}
