import type { PlaceCategory } from '../types';
import { inferCategory } from './parserService';

export interface SearchPlaceResult {
  id: string;
  name: string;
  address: string;
  category: PlaceCategory;
  latitude: number;
  longitude: number;
  rating?: number;
  imageUrl?: string;
  memo?: string;
  isPopular?: boolean;
}

// 카테고리별 고해상도 테마 이미지
const CATEGORY_IMAGES: Record<string, string> = {
  CAFE: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop',
  RESTAURANT: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop',
  ATTRACTION: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop',
  LODGING: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop',
  SHOPPING: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop',
};

// 유명 여행지 & 핫플 엄선 데이터베이스 (즉각적인 고품질 검색 지원)
export const CURATED_PLACES: SearchPlaceResult[] = [
  // 숙소 (호텔, 리조트, 료칸)
  {
    id: 'cur_hotel_1',
    name: '호텔 그레이서리 신주쿠 (Hotel Gracery Shinjuku)',
    address: '1 Chome-19-1 Kabukicho, Shinjuku City, Tokyo, Japan',
    category: 'LODGING',
    latitude: 35.6953,
    longitude: 139.7020,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop',
    memo: '고질라 헤드가 유명한 가부키초 중심 랜드마크 호텔',
    isPopular: true,
  },
  {
    id: 'cur_hotel_2',
    name: '두짓타니 괌 리조트 (Dusit Thani Guam Resort)',
    address: '1227 Pale San Vitores Rd, Tamuning, 96913, Guam',
    category: 'LODGING',
    latitude: 13.5134,
    longitude: 144.8055,
    rating: 4.9,
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop',
    memo: '투몬 비치 바로 앞 5성급 최고급 오션뷰 리조트',
    isPopular: true,
  },
  {
    id: 'cur_hotel_3',
    name: '힐튼 괌 리조트 & 스파 (Hilton Guam Resort & Spa)',
    address: '202 Hilton Road, Tumon Bay, 96913, Guam',
    category: 'LODGING',
    latitude: 13.5042,
    longitude: 144.7865,
    rating: 4.7,
    imageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&auto=format&fit=crop',
    memo: '넓은 워터파크와 투몬 만 산호초 스노클링 포인트',
    isPopular: true,
  },
  {
    id: 'cur_hotel_4',
    name: '더 츠바키 타워 괌 (The Tsubaki Tower)',
    address: '241 Gun Beach Rd, Tumon, 96913, Guam',
    category: 'LODGING',
    latitude: 13.5222,
    longitude: 144.8094,
    rating: 4.9,
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop',
    memo: '전 객실 발코니 인피니티 풀 럭셔리 신축 호텔',
    isPopular: true,
  },
  {
    id: 'cur_hotel_5',
    name: '호텔 닛코 괌 (Hotel Nikko Guam)',
    address: '245 Gun Beach Rd, Tumon, 96913, Guam',
    category: 'LODGING',
    latitude: 13.5255,
    longitude: 144.8078,
    rating: 4.6,
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&auto=format&fit=crop',
    memo: '건비치 프라이빗 비치와 72m 워터슬라이드',
  },
  {
    id: 'cur_hotel_6',
    name: '스위소텔 난카이 오사카 (Swissotel Nankai Osaka)',
    address: '5 Chome-1-60 Namba, Chuo Ward, Osaka, Japan',
    category: 'LODGING',
    latitude: 34.6644,
    longitude: 135.5015,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop',
    memo: '난바역 직결 특급 라피트 접근성 최고 호텔',
  },
  {
    id: 'cur_hotel_7',
    name: '호텔 한큐 레스파이어 오사카 (Hotel Hankyu RESPIRE Osaka)',
    address: '1-1 Ofukacho, Kita Ward, Osaka, Japan',
    category: 'LODGING',
    latitude: 34.7042,
    longitude: 135.4965,
    rating: 4.7,
    imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop',
    memo: '우메다역 요도바시 카메라 타워 위 가성비 프리미엄 호텔',
  },
  {
    id: 'cur_hotel_8',
    name: '교토 온센 료칸 유노야도 쇼에이 (Shoei Ryokan)',
    address: 'Mibu Nishitakatsukacho, Nakagyo Ward, Kyoto, Japan',
    category: 'LODGING',
    latitude: 34.9960,
    longitude: 135.7420,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop',
    memo: '전통 다다미방과 노천 대욕탕 온천 료칸',
  },
  {
    id: 'cur_hotel_9',
    name: '제주 신라호텔 (The Shilla Jeju)',
    address: '제주특별자치도 서귀포시 중문관광로72번길 75',
    category: 'LODGING',
    latitude: 33.2476,
    longitude: 126.4082,
    rating: 4.9,
    imageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&auto=format&fit=crop',
    memo: '중문 해변 숨비정원과 온수풀 자쿠지',
  },
  {
    id: 'cur_hotel_10',
    name: '다낭 하얏트 리젠시 리조트 & 스파 (Hyatt Regency Danang)',
    address: '5 Truong Sa, Street, Ngu Hanh Son, Da Nang, Vietnam',
    category: 'LODGING',
    latitude: 15.9984,
    longitude: 108.2612,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop',
    memo: '논누억 비치 전용 해변 럭셔리 휴양 리조트',
  },

  // 명소 & 관광지
  {
    id: 'cur_spot_1',
    name: '시부야 스카이 (SHIBUYA SKY)',
    address: '2 Chome-24-12 Shibuya, Shibuya City, Tokyo, Japan',
    category: 'ATTRACTION',
    latitude: 35.6585,
    longitude: 139.7013,
    rating: 4.9,
    imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop',
    memo: '시부야 스크램블 교차로를 한눈에 내려다보는 360도 루프탑 전망대',
    isPopular: true,
  },
  {
    id: 'cur_spot_2',
    name: '도쿄 타워 (Tokyo Tower)',
    address: '4 Chome-2-8 Shibakoen, Minato City, Tokyo, Japan',
    category: 'ATTRACTION',
    latitude: 35.6586,
    longitude: 139.7454,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800&auto=format&fit=crop',
    memo: '도쿄의 영원한 상징. 밤에 펼쳐지는 감성 라이트업',
    isPopular: true,
  },
  {
    id: 'cur_spot_3',
    name: '팀랩 플래닛 도쿄 (teamLab Planets)',
    address: '6 Chome-1-16 Toyosu, Koto City, Tokyo, Japan',
    category: 'ATTRACTION',
    latitude: 35.6483,
    longitude: 139.7905,
    rating: 4.9,
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop',
    memo: '물속을 걷는 환상적인 미디어 아트 디지털 체험 전시',
    isPopular: true,
  },
  {
    id: 'cur_spot_4',
    name: '도톤보리 글리코상 (Glico Man Dotonbori)',
    address: '1 Chome-10-3 Dotonbori, Chuo Ward, Osaka, Japan',
    category: 'ATTRACTION',
    latitude: 34.6687,
    longitude: 135.5013,
    rating: 4.7,
    imageUrl: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=800&auto=format&fit=crop',
    memo: '오사카 여행 필수 포토존! 에비스바시 다리 위 인증샷',
    isPopular: true,
  },
  {
    id: 'cur_spot_5',
    name: '유니버셜 스튜디오 재팬 (USJ)',
    address: '2 Chome-1-33 Sakurajima, Konohana Ward, Osaka, Japan',
    category: 'ATTRACTION',
    latitude: 34.6654,
    longitude: 135.4323,
    rating: 4.9,
    imageUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&auto=format&fit=crop',
    memo: '슈퍼 닌텐도 월드와 해리포터 마법 세계 테마파크',
    isPopular: true,
  },
  {
    id: 'cur_spot_6',
    name: '후시미 이나리 신사 (伏見稲荷大社)',
    address: '68 Fukakusa Yabunouchicho, Fushimi Ward, Kyoto, Japan',
    category: 'ATTRACTION',
    latitude: 34.9671,
    longitude: 135.7727,
    rating: 4.9,
    imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop',
    memo: '끝없이 이어지는 주홍빛 천개의 토리이 터널',
    isPopular: true,
  },
  {
    id: 'cur_spot_7',
    name: '사랑의 절벽 (Two Lovers Point, Guam)',
    address: 'GRM2+X85, Tamuning, 96913, Guam',
    category: 'ATTRACTION',
    latitude: 13.5350,
    longitude: 144.8028,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
    memo: '필리핀해의 에메랄드빛 바다가 펼쳐지는 괌 대표 전망대',
    isPopular: true,
  },
  {
    id: 'cur_spot_8',
    name: '투몬 비치 (Tumon Beach, Guam)',
    address: 'Pale San Vitores Rd, Tamuning, 96913, Guam',
    category: 'ATTRACTION',
    latitude: 13.5152,
    longitude: 144.8058,
    rating: 4.9,
    imageUrl: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800&auto=format&fit=crop',
    memo: '맑고 잔잔한 수심으로 패들보드와 스노클링 천국',
    isPopular: true,
  },

  // 맛집 & 카페 & 쇼핑
  {
    id: 'cur_food_1',
    name: '이치란 라멘 시부야점',
    address: '1 Chome-22-7 Jinnan, Shibuya City, Tokyo, Japan',
    category: 'RESTAURANT',
    latitude: 35.6618,
    longitude: 139.7005,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop',
    memo: '비법 빨간 양념과 1인 독서실 좌석 돈코츠 라멘',
    isPopular: true,
  },
  {
    id: 'cur_food_2',
    name: '푸글렌 도쿄 (Fuglen Tokyo)',
    address: '1 Chome-16-11 Tomigaya, Shibuya City, Tokyo, Japan',
    category: 'CAFE',
    latitude: 35.6664,
    longitude: 139.6917,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop',
    memo: '요요기 공원 근처 노르웨이 감성 스페셜티 핸드드립 카페',
    isPopular: true,
  },
  {
    id: 'cur_food_3',
    name: '도쿄 빔즈 하라주쿠 (BEAMS Harajuku)',
    address: '3 Chome-24-7 Jingumae, Shibuya City, Tokyo, Japan',
    category: 'SHOPPING',
    latitude: 35.6698,
    longitude: 139.7088,
    rating: 4.7,
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop',
    memo: '일본 스트리트 패션의 성지 편집샵 본점',
    isPopular: true,
  },
  {
    id: 'cur_food_4',
    name: '괌 K마트 (Kmart Guam)',
    address: '404 N Marine Corps Dr, Tamuning, 96913, Guam',
    category: 'SHOPPING',
    latitude: 13.5048,
    longitude: 144.7990,
    rating: 4.6,
    imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop',
    memo: '괌 24시간 대형 쇼핑몰. 바나나보트 선크림 & 기념품 쇼핑',
    isPopular: true,
  },
  {
    id: 'cur_food_5',
    name: '프로아 레스토랑 (PROA Restaurant, Guam)',
    address: 'Pale San Vitores Rd, Tamuning, 96913, Guam',
    category: 'RESTAURANT',
    latitude: 13.5065,
    longitude: 144.7892,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop',
    memo: '차모로 전통 바비큐 플래터와 타로 치즈케이크 맛집',
    isPopular: true,
  },
];

/**
 * 숙소 검색 (호텔, 리조트, 료칸 위주 검색)
 */
export async function searchAccommodations(query: string): Promise<SearchPlaceResult[]> {
  const q = query.trim().toLowerCase();

  // 1차: 큐레이션된 숙소 목록 매칭
  const curatedMatches = CURATED_PLACES.filter(
    (p) =>
      p.category === 'LODGING' &&
      (!q ||
        p.name.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        (p.memo && p.memo.toLowerCase().includes(q)))
  );

  if (curatedMatches.length >= 3 || (!q && curatedMatches.length > 0)) {
    return curatedMatches;
  }

  // 2차: Nominatim OpenStreetMap 실시간 지오코딩 검색
  if (q.length >= 2) {
    try {
      const liveResults = await fetchLivePlacesFromOsm(`${query} hotel`, 'LODGING');
      // 중복 제거 후 합산
      const combined = [...curatedMatches];
      for (const item of liveResults) {
        if (!combined.some((c) => c.name.toLowerCase() === item.name.toLowerCase())) {
          combined.push(item);
        }
      }
      return combined.slice(0, 8);
    } catch {}
  }

  return curatedMatches;
}

/**
 * 일반 장소 검색 (카페, 맛집, 명소, 쇼핑 등)
 */
export async function searchPlaces(
  query: string,
  categoryFilter?: PlaceCategory
): Promise<SearchPlaceResult[]> {
  const q = query.trim().toLowerCase();

  // 1차: 큐레이션된 장소에서 필터링
  const curatedMatches = CURATED_PLACES.filter((p) => {
    if (categoryFilter && categoryFilter !== 'ALL' && p.category !== categoryFilter) {
      return false;
    }
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q) ||
      (p.memo && p.memo.toLowerCase().includes(q))
    );
  });

  // 검색어가 없으면 추천 핫플 반환
  if (!q) {
    return curatedMatches.slice(0, 10);
  }

  // 2차: 실시간 OpenStreetMap 검색 결합
  try {
    const liveResults = await fetchLivePlacesFromOsm(query, categoryFilter);
    const combined = [...curatedMatches];
    for (const item of liveResults) {
      if (!combined.some((c) => c.name.toLowerCase() === item.name.toLowerCase())) {
        combined.push(item);
      }
    }
    return combined.slice(0, 12);
  } catch {
    return curatedMatches;
  }
}

/**
 * OpenStreetMap 실시간 지오코딩 조회
 */
async function fetchLivePlacesFromOsm(
  query: string,
  categoryFilter?: PlaceCategory
): Promise<SearchPlaceResult[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&limit=6&addressdetails=1`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'PinchiTravelPlanner/1.0 (contact@pinchi.app)',
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map((item: any, idx: number) => {
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon);
          const displayName = item.display_name || query;
          const name = displayName.split(',')[0].trim() || query;
          const address = displayName.split(',').slice(1, 4).join(', ').trim() || displayName;
          const cat = categoryFilter && categoryFilter !== 'ALL' ? categoryFilter : inferCategory(displayName);

          return {
            id: `osm_${Date.now()}_${idx}`,
            name,
            address,
            category: cat,
            latitude: !isNaN(lat) ? lat : 35.6895,
            longitude: !isNaN(lng) ? lng : 139.6917,
            rating: 4.7,
            imageUrl: CATEGORY_IMAGES[cat] || CATEGORY_IMAGES.ATTRACTION,
            memo: `OpenStreetMap 실시간 검색 위치`,
          };
        });
      }
    }
  } catch {
    clearTimeout(timeoutId);
  }

  return [];
}
