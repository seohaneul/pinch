import type { Place, PlaceCategory, SavedLink, ExtractedPlaceItem } from '../types';
import { extractPlacesWithGemini } from './geminiService';
import { fetchRealPlaceImage } from './imageSearchService';

export interface ExtractedMeta {
  title: string;
  description: string;
  imageUrl: string;
  canonicalUrl?: string;
}

// 주요 도시/지역 기본 좌표 및 대표 핫플 앵커 좌표
const CITY_ANCHOR_COORDS: Record<string, { lat: number; lng: number; address: string }> = {
  도쿄: { lat: 35.6895, lng: 139.6917, address: '일본 도쿄도 시부야구' },
  오사카: { lat: 34.6937, lng: 135.5023, address: '일본 오사카부 오사카시' },
  교토: { lat: 35.0116, lng: 135.7681, address: '일본 교토부 교토시' },
  후쿠오카: { lat: 33.5904, lng: 130.4017, address: '일본 후쿠오카현 후쿠오카시 하카타구' },
  삿포로: { lat: 43.0618, lng: 141.3545, address: '일본 홋카이도 삿포로시 중앙구' },
  오키나와: { lat: 26.2124, lng: 127.6809, address: '일본 오키나와현 나하시' },
  제주: { lat: 33.4996, lng: 126.5312, address: '대한민국 제주특별자치도 제주시' },
  서울: { lat: 37.5665, lng: 126.978, address: '대한민국 서울특별시 중구' },
  부산: { lat: 35.1796, lng: 129.0756, address: '대한민국 부산광역시 해운대구' },
  강릉: { lat: 37.7519, lng: 128.8761, address: '대한민국 강원도 강릉시' },
  다낭: { lat: 16.0544, lng: 108.2022, address: '베트남 다낭 하이쩌우' },
  방콕: { lat: 13.7563, lng: 100.5018, address: '태국 방콕 프라나콘' },
  파리: { lat: 48.8566, lng: 2.3522, address: '프랑스 일드프랑스 파리' },
  런던: { lat: 51.5074, lng: -0.1278, address: '영국 런던 웨스트민스터' },
  뉴욕: { lat: 40.7128, lng: -74.006, address: '미국 뉴욕주 뉴욕 맨해튼' },
};

// 카테고리별 고해상도 백업 썸네일
const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {
  CAFE: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop',
  RESTAURANT: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop',
  ATTRACTION: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop',
  LODGING: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop',
  SHOPPING: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop',
};

// 1. 플랫폼 감지
export function detectSnsPlatform(url: string): 'instagram' | 'youtube' | 'naver' | 'tiktok' | 'manual' {
  const lower = url.toLowerCase();
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) return 'instagram';
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  if (lower.includes('blog.naver.com') || lower.includes('map.naver.com') || lower.includes('naver.me')) return 'naver';
  if (lower.includes('tiktok.com')) return 'tiktok';
  return 'manual';
}

// 2. HTML 태그 및 엔티티 디코딩
function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\\n/g, ' ')
    .trim();
}

// 3. 실제 OpenGraph 메타 태그 스크래퍼
export async function fetchOpenGraphMetadata(targetUrl: string): Promise<ExtractedMeta> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5초 타임아웃

  try {
    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const html = await res.text();

    // og:title, og:description, og:image 정규식 추출
    const ogTitleMatch =
      html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:title["']/i) ||
      html.match(/<title>([^<]*)<\/title>/i);

    const ogDescMatch =
      html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:description["']/i) ||
      html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);

    const ogImageMatch =
      html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:image["']/i);

    const title = decodeHtmlEntities(ogTitleMatch ? ogTitleMatch[1] : '');
    const description = decodeHtmlEntities(ogDescMatch ? ogDescMatch[1] : '');
    let imageUrl = ogImageMatch ? ogImageMatch[1].trim() : '';

    if (imageUrl.startsWith('//')) {
      imageUrl = `https:${imageUrl}`;
    }

    return { title, description, imageUrl, canonicalUrl: targetUrl };
  } catch (err) {
    clearTimeout(timeoutId);
    return { title: '', description: '', imageUrl: '', canonicalUrl: targetUrl };
  }
}

// 4. 텍스트에서 장소명 및 키워드 정제
export function cleanPlaceTitle(rawTitle: string, rawDesc: string, platform: string): { placeName: string; memo: string; tags: string[] } {
  let cleaned = rawTitle || rawDesc || '';
  const tags: string[] = [];

  // 해시태그 추출 (#도쿄카페 등)
  const hashtagMatches = (rawTitle + ' ' + rawDesc).match(/#([a-zA-Z0-9가-힣_-]+)/g);
  if (hashtagMatches) {
    hashtagMatches.slice(0, 4).forEach((h) => {
      const cleanTag = h.replace('#', '').trim();
      if (cleanTag && !tags.includes(cleanTag) && cleanTag.length <= 10) {
        tags.push(cleanTag);
      }
    });
  }

  // 인스타그램 특유의 타이틀 접두사 제거
  // 예: "Instagram의 홍길동님: '푸글렌 도쿄 꿀팁...'"
  cleaned = cleaned.replace(/^Instagram의\s*[^:]+님:\s*["']?/i, '');
  cleaned = cleaned.replace(/^Instagram\s*photo\s*by\s*[^:]+:\s*["']?/i, '');

  // 유튜브 특유의 접미사 제거
  // 예: "... - YouTube", "#shorts"
  cleaned = cleaned.replace(/\s*-\s*YouTube$/i, '');
  cleaned = cleaned.replace(/#shorts/gi, '');

  // 지도 플랫폼 접미사 제거
  // 예: "푸글렌 도쿄 : 네이버 지도", "블루보틀 성수점 | 카카오맵"
  cleaned = cleaned.replace(/\s*[:|]\s*(네이버\s*지도|카카오맵|Google\s*Maps).*$/i, '');

  // 따옴표 및 불필요한 기호 정리
  cleaned = cleaned.replace(/["'“”]/g, '').trim();

  // 문장이 너무 길 경우 첫 번째 문장이나 구문 분리 (최대 30자)
  let placeName = cleaned.split(/[\n|·–—:]/)[0].trim();
  if (placeName.length > 28) {
    placeName = placeName.substring(0, 28) + '...';
  }

  if (!placeName || placeName.length < 2) {
    placeName = platform === 'instagram' ? '인스타그램 핫플' : '새로운 추천 여행지';
  }

  const memo = rawDesc ? rawDesc.substring(0, 80) : `${placeName} (출처: ${platform.toUpperCase()})`;

  return { placeName, memo, tags };
}

// 5. 텍스트 기반 카테고리 자동 추론
export function inferCategory(text: string): PlaceCategory {
  const lower = text.toLowerCase();
  if (/(카페|커피|베이커리|디저트|빵집|로스터리|티하우스|cafe|coffee|bakery|dessert)/i.test(lower)) {
    return 'CAFE';
  }
  if (/(맛집|식당|라멘|스시|초밥|고기|삼겹살|파스타|이자카야|우동|피자|바베큐|레스토랑|야시장|덮밥|restaurant|food|ramen)/i.test(lower)) {
    return 'RESTAURANT';
  }
  if (/(호텔|료칸|리조트|펜션|게스트하우스|에어비앤비|숙소|민박|hotel|resort|stay|hostel)/i.test(lower)) {
    return 'LODGING';
  }
  if (/(쇼핑|백화점|아울렛|편집샵|빈티지|소품샵|플래그십|마켓|shopping|mall|store)/i.test(lower)) {
    return 'SHOPPING';
  }
  return 'ATTRACTION';
}

// 6. 위치 좌표(Geocoding) 검색 (Nominatim OpenStreetMap)
export async function geocodePlace(query: string): Promise<{ latitude: number; longitude: number; address: string } | null> {
  if (!query || query.trim().length < 2) return null;

  // 1차: 미리 정의된 주요 도시/지역 키워드 매칭
  for (const [cityName, coord] of Object.entries(CITY_ANCHOR_COORDS)) {
    if (query.includes(cityName)) {
      return {
        latitude: coord.lat,
        longitude: coord.lng,
        address: `${coord.address} (${query.trim()})`,
      };
    }
  }

  // 2차: Nominatim OpenStreetMap 무료 지오코딩 API 시도 (최대 2.5초)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&limit=1`;
    const res = await fetch(searchUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'PinchiTravelPlanner/1.0 (contact@pinchi.app)',
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        if (!isNaN(lat) && !isNaN(lon) && lat !== 0) {
          return {
            latitude: lat,
            longitude: lon,
            address: item.display_name?.split(',').slice(0, 3).join(', ') || query,
          };
        }
      }
    }
  } catch (e) {
    clearTimeout(timeoutId);
  }

  return null;
}

// 7. 메인 함수: 링크 분석 및 Place 객체 생성
export async function parseSnsUrl(url: string, destinationHint?: string): Promise<Place> {
  const platform = detectSnsPlatform(url);

  // 1) OpenGraph 메타데이터 추출
  const meta = await fetchOpenGraphMetadata(url);

  // 2) 장소명 및 설명 정제
  const { placeName, memo, tags } = cleanPlaceTitle(meta.title, meta.description, platform);

  // 3) 카테고리 자동 추론
  const category = inferCategory(`${placeName} ${meta.title} ${meta.description}`);

  // 4) 위치 좌표 및 주소 획득 (지오코딩 또는 스마트 기본값)
  const geocodeResult = await geocodePlace(placeName);
  let defaultCoord = CITY_ANCHOR_COORDS['도쿄'];
  if (destinationHint) {
    for (const [cityName, coord] of Object.entries(CITY_ANCHOR_COORDS)) {
      if (destinationHint.includes(cityName)) {
        defaultCoord = coord;
        break;
      }
    }
  }

  const latitude = geocodeResult?.latitude ?? defaultCoord.lat;
  const longitude = geocodeResult?.longitude ?? defaultCoord.lng;
  const address = geocodeResult?.address ?? `${defaultCoord.address} 부근`;

  // 5) 실제 이미지 URL 탐색
  let imageUrl = meta.imageUrl && meta.imageUrl.startsWith('http') ? meta.imageUrl : '';
  if (!imageUrl || imageUrl.includes('unsplash.com')) {
    const realImg = await fetchRealPlaceImage(placeName, address, category, latitude, longitude);
    if (realImg) {
      imageUrl = realImg;
    }
  }
  if (!imageUrl) {
    imageUrl = CATEGORY_DEFAULT_IMAGES[category] || CATEGORY_DEFAULT_IMAGES.ATTRACTION;
  }

  const parsedPlace: Place = {
    id: `place_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: placeName,
    address,
    category,
    latitude,
    longitude,
    memo,
    snsUrl: url,
    imageUrl,
    rating: 4.8,
    isPinned: true,
    createdAt: new Date().toISOString(),
    tags: tags.length > 0 ? tags : ['핫플', category],
    sourcePlatform: platform,
  };

  return parsedPlace;
}

// 지역별/테마별 릴스·블로그 다중 핫플 지식 베이스
const REGIONAL_HOTPLACE_POOLS: Record<string, ExtractedPlaceItem[]> = {
  tokyo: [
    {
      id: 'ep_t1',
      name: '푸글렌 도쿄 (Fuglen Tokyo)',
      address: '1 Chome-16-11 Tomigaya, Shibuya City, Tokyo',
      category: 'CAFE',
      latitude: 35.6664,
      longitude: 139.6917,
      memo: '노르웨이 오슬로 감성 로스팅 카페 & 핸드드립 커피 맛집 ☕',
      imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop',
      rating: 4.8,
      tags: ['도쿄카페', '푸글렌', '핸드드립'],
    },
    {
      id: 'ep_t2',
      name: '시부야 스카이 (SHIBUYA SKY)',
      address: '2 Chome-24-12 Shibuya, Shibuya City, Tokyo',
      category: 'ATTRACTION',
      latitude: 35.6591,
      longitude: 139.7027,
      memo: '도쿄 최고 높이의 루프탑 야경 전망대! 예약 필수 인생샷 성지 🗼',
      imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop',
      rating: 4.9,
      tags: ['시부야', '전망대', '야경'],
    },
    {
      id: 'ep_t3',
      name: '이치란 라멘 시부야 스페인자카점',
      address: '1 Chome-13-7 Jinnan, Shibuya City, Tokyo',
      category: 'RESTAURANT',
      latitude: 35.6618,
      longitude: 139.7001,
      memo: '나만의 레시피로 커스텀하는 진한 돈코츠 라멘 🍜',
      imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop',
      rating: 4.7,
      tags: ['도쿄라멘', '이치란', '돈코츠'],
    },
    {
      id: 'ep_t4',
      name: '미야시타 파크 & 빔즈 (Miyashita Park)',
      address: '1 Chome-26-5 Shibuya, Shibuya City, Tokyo',
      category: 'SHOPPING',
      latitude: 35.6622,
      longitude: 139.7021,
      memo: '루프탑 공원과 트렌디한 스트릿 패션 브랜드 셀렉트샵 🛍️',
      imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop',
      rating: 4.6,
      tags: ['시부야쇼핑', '빔즈', '편집샵'],
    },
  ],
  osaka: [
    {
      id: 'ep_o1',
      name: '모토커피 키타하마 (MOTO COFFEE)',
      address: '2 Chome-1-1 Kitahama, Chuo Ward, Osaka',
      category: 'CAFE',
      latitude: 34.6922,
      longitude: 135.5065,
      memo: '강변 테라스에서 즐기는 푸딩과 라떼 뷰 맛집 🍮',
      imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop',
      rating: 4.7,
      tags: ['오사카카페', '키타하마', '테라스'],
    },
    {
      id: 'ep_o2',
      name: '쿠시카츠 다루마 도톤보리점',
      address: '1 Chome-6-4 Dotonbori, Chuo Ward, Osaka',
      category: 'RESTAURANT',
      latitude: 34.6687,
      longitude: 135.5015,
      memo: '바삭한 튀김옷과 비법 소스가 일품인 원조 쿠시카츠 🍢',
      imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop',
      rating: 4.6,
      tags: ['오사카맛집', '쿠시카츠', '도톤보리'],
    },
    {
      id: 'ep_o3',
      name: '오사카성 천수각',
      address: '1-1 Osakajo, Chuo Ward, Osaka',
      category: 'ATTRACTION',
      latitude: 34.6873,
      longitude: 135.5262,
      memo: '황금빛 장식의 웅장한 역사 랜드마크 & 공원 산책 🏯',
      imageUrl: 'https://images.unsplash.com/photo-1590559899731-a3f376dd4558?w=800&auto=format&fit=crop',
      rating: 4.8,
      tags: ['오사카성', '랜드마크', '산책'],
    },
    {
      id: 'ep_o4',
      name: '신사이바시 파르코 (PARCO)',
      address: '1 Chome-8-3 Shinsaibashisuji, Chuo Ward, Osaka',
      category: 'SHOPPING',
      latitude: 34.6734,
      longitude: 135.5008,
      memo: '지브리샵, 레고, 디자이너 브랜드가 가득한 쇼핑몰 🛍️',
      imageUrl: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&auto=format&fit=crop',
      rating: 4.7,
      tags: ['신사이바시', '파르코', '캐릭터샵'],
    },
  ],
  kyoto: [
    {
      id: 'ep_k1',
      name: '후시미 이나리 신사 (伏見稲荷大社)',
      address: '68 Fukakusa Yabunouchicho, Fushimi Ward, Kyoto',
      category: 'ATTRACTION',
      latitude: 34.9671,
      longitude: 135.7727,
      memo: '끝없이 이어지는 붉은 천 개의 토리이 터널길 ⛩️',
      imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop',
      rating: 4.9,
      tags: ['교토명소', '토리이', '인생샷'],
    },
    {
      id: 'ep_k2',
      name: '아라비카 교토 아라시야마 (% ARABICA)',
      address: '3-47 Sagatenryuji Susukinobabacho, Ukyo Ward, Kyoto',
      category: 'CAFE',
      latitude: 35.0135,
      longitude: 135.6775,
      memo: '도게츠교 강변 풍경을 보며 마시는 교토 응커피 ☕',
      imageUrl: 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=800&auto=format&fit=crop',
      rating: 4.8,
      tags: ['응커피', '아라시야마', '라떼'],
    },
    {
      id: 'ep_k3',
      name: '니시키 시장 (錦市場)',
      address: 'Nakagyo Ward, Kyoto',
      category: 'RESTAURANT',
      latitude: 35.0051,
      longitude: 135.7649,
      memo: '교토의 부엌! 타코야키, 당고, 해산물 꼬치 먹방 투어 🍡',
      imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop',
      rating: 4.6,
      tags: ['니시키시장', '길거리음식', '교토먹방'],
    },
  ],
  fukuoka: [
    {
      id: 'ep_f1',
      name: '이치란 라멘 하카타 본점',
      address: '5 Chome-3-2 Nakasu, Hakata Ward, Fukuoka',
      category: 'RESTAURANT',
      latitude: 33.5932,
      longitude: 130.4037,
      memo: '빨간 등불 건물 전체가 라멘 빌딩! 독서실 돈코츠 라멘 🍜',
      imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop',
      rating: 4.8,
      tags: ['후쿠오카맛집', '이치란본점', '돈코츠'],
    },
    {
      id: 'ep_f2',
      name: 'FUK COFFEE (후쿠 커피)',
      address: '6-22 Gionmachi, Hakata Ward, Fukuoka',
      category: 'CAFE',
      latitude: 33.5911,
      longitude: 130.4124,
      memo: '비행기 티켓 디자인과 푸딩이 유명한 감성 카페 ✈️',
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop',
      rating: 4.7,
      tags: ['후쿠오카카페', '푸딩맛집', '공항컨셉'],
    },
    {
      id: 'ep_f3',
      name: '오호리 공원 & 스타벅스',
      address: '1 Ohorikoen, Chuo Ward, Fukuoka',
      category: 'ATTRACTION',
      latitude: 33.5862,
      longitude: 130.3762,
      memo: '넓은 호수를 바라보며 힐링하는 교외 휴식 명소 🌿',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
      rating: 4.7,
      tags: ['오호리공원', '산책', '호수'],
    },
  ],
  jeju: [
    {
      id: 'ep_j1',
      name: '카페 노티드 제주 애월',
      address: '제주 제주시 애월읍 애월로1길 24-9',
      category: 'CAFE',
      latitude: 33.4651,
      longitude: 126.3106,
      memo: '야자수 정원과 크림 도넛이 반겨주는 애월 핫플레이스 🍩',
      imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop',
      rating: 4.8,
      tags: ['애월카페', '노티드', '도넛'],
    },
    {
      id: 'ep_j2',
      name: '협재 해수욕장',
      address: '제주 제주시 한림읍 한림로 329-10',
      category: 'ATTRACTION',
      latitude: 33.3941,
      longitude: 126.2397,
      memo: '비양도가 보이는 투명한 에메랄드빛 바다와 은빛 백사장 🌊',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
      rating: 4.9,
      tags: ['협재', '에메랄드바다', '일몰'],
    },
    {
      id: 'ep_j3',
      name: '우진해장국',
      address: '제주 제주시 서사로 11',
      category: 'RESTAURANT',
      latitude: 33.5115,
      longitude: 126.5201,
      memo: '걸쭉하고 깊은 풍미의 제주 전통 고사리육개장 🍲',
      imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop',
      rating: 4.7,
      tags: ['제주맛집', '고사리육개장', '웨이팅'],
    },
  ],
};

// 8. 신규 핵심 기능: 링크 내 여러 장소 다중 추출 엔진
export async function parseLinkWithPlaces(
  url: string,
  tripId?: string,
  destinationHint?: string
): Promise<SavedLink> {
  const platform = detectSnsPlatform(url);

  // 1) OpenGraph 메타데이터 추출
  const meta = await fetchOpenGraphMetadata(url);

  // 2) 타이틀 정제
  const { placeName, memo } = cleanPlaceTitle(meta.title, meta.description, platform);

  // 3) 실제 Google Gemini AI 추출 우선 시도
  let extractedPlaces: ExtractedPlaceItem[] = [];
  let aiTitle = '';
  let aiSummary = '';

  try {
    const aiResult = await extractPlacesWithGemini(
      meta.title || placeName,
      meta.description || memo,
      url,
      destinationHint
    );
    if (aiResult && aiResult.places.length > 0) {
      extractedPlaces = await Promise.all(
        aiResult.places.map(async (p, idx) => {
          let realImg = p.imageUrl;
          if (!realImg || !realImg.startsWith('http')) {
            realImg = (await fetchRealPlaceImage(p.name, p.address, p.category, p.latitude, p.longitude)) || undefined;
          }
          if ((!realImg || realImg.includes('unsplash.com')) && idx === 0 && meta.imageUrl?.startsWith('http')) {
            realImg = meta.imageUrl;
          }
          return {
            ...p,
            id: p.id || `extracted_${Date.now()}_${idx}`,
            imageUrl: realImg || undefined,
          };
        })
      );
      aiTitle = aiResult.cleanTitle;
      aiSummary = aiResult.cleanSummary;
    }
  } catch (aiErr) {
    console.warn('[ParserService] Gemini AI extraction failed, using fallback:', aiErr);
  }

  // 4) Gemini 결과가 없을 때 키워드 매칭 기반 지역 풀 Fallback
  if (extractedPlaces.length === 0) {
    const combinedText = `${url} ${meta.title} ${meta.description} ${destinationHint || ''}`.toLowerCase();
    let selectedRegionKey = 'tokyo';

    if (combinedText.includes('오사카') || combinedText.includes('osaka')) {
      selectedRegionKey = 'osaka';
    } else if (combinedText.includes('교토') || combinedText.includes('kyoto')) {
      selectedRegionKey = 'kyoto';
    } else if (combinedText.includes('후쿠오카') || combinedText.includes('fukuoka')) {
      selectedRegionKey = 'fukuoka';
    } else if (combinedText.includes('제주') || combinedText.includes('jeju')) {
      selectedRegionKey = 'jeju';
    }

    const basePlaces = REGIONAL_HOTPLACE_POOLS[selectedRegionKey] || REGIONAL_HOTPLACE_POOLS.tokyo;
    extractedPlaces = basePlaces.map((bp, idx) => ({
      ...bp,
      id: `extracted_${Date.now()}_${idx}`,
    }));
  }

  const finalTitle =
    aiTitle ||
    (placeName && placeName.length >= 4 && !placeName.includes('Instagram')
      ? placeName
      : `${platform === 'instagram' ? '인스타그램 릴스' : '추천 여행'} 핫플 모음 ✈️`);

  const finalSummary =
    aiSummary ||
    memo ||
    `해당 ${platform.toUpperCase()} 링크에 포함된 추천 장소 ${extractedPlaces.length}곳`;

  const savedLink: SavedLink = {
    id: `link_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    trip_id: tripId || 'trip-1',
    title: finalTitle,
    url,
    platform,
    thumbnailUrl:
      meta.imageUrl && meta.imageUrl.startsWith('http')
        ? meta.imageUrl
        : extractedPlaces[0]?.imageUrl || 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop',
    summary: finalSummary,
    createdAt: new Date().toISOString(),
    extractedPlaces,
  };

  return savedLink;
}
