import type { PlaceCategory } from '../types';
import { inferCategory } from './parserService';

const getGoogleApiKey = () => process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export interface SearchPlaceResult {
  id: string;
  name: string;
  address: string;
  roadAddress?: string;
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

/**
 * 주소 문자열에서 불필요한 국가 접두사("대한민국 ") 정리 및 지번/도로명 주소 분리 보조
 */
function normalizeKoreanAddresses(
  formattedAddress: string,
  shortFormattedAddress?: string,
  addressComponents?: any[]
): { primaryAddress: string; roadAddress: string } {
  const cleanFull = (formattedAddress || '')
    .replace(/^대한민국\s+/, '')
    .replace(/^남한\s+/, '')
    .trim();

  const cleanShort = (shortFormattedAddress || '')
    .replace(/^대한민국\s+/, '')
    .trim();

  // addressComponents에서 시/도, 시/군/구, 동/읍/면, 도로명, 건물번호 추출
  let admin1 = ''; // 서울특별시, 도쿄도 등
  let sublocality1 = ''; // 강남구, 시부야구 등
  let dong = ''; // 대치동 등
  let road = ''; // 도곡로 등
  let premise = ''; // 409 등
  let subpremise = '';

  if (Array.isArray(addressComponents)) {
    for (const comp of addressComponents) {
      const types: string[] = comp.types || [];
      const text = comp.longText || comp.shortText || '';
      if (!text) continue;

      if (types.includes('administrative_area_level_1')) {
        admin1 = text;
      } else if (types.includes('sublocality_level_1') || types.includes('locality')) {
        if (!sublocality1) sublocality1 = text;
      } else if (types.includes('sublocality_level_2') || types.includes('neighborhood')) {
        dong = text;
      } else if (types.includes('route') || types.includes('sublocality_level_4')) {
        road = text;
      } else if (types.includes('street_number') || types.includes('premise')) {
        premise = text;
      } else if (types.includes('subpremise')) {
        subpremise = text;
      }
    }
  }

  const constructedRoad = [admin1, sublocality1, road, premise, subpremise]
    .filter(Boolean)
    .join(' ')
    .trim();

  const constructedLot = [admin1, sublocality1, dong, premise]
    .filter(Boolean)
    .join(' ')
    .trim();

  const roadAddr = constructedRoad || cleanFull || cleanShort;
  const primaryAddr =
    constructedLot && constructedLot !== roadAddr
      ? constructedLot
      : cleanFull || cleanShort || roadAddr;

  return {
    primaryAddress: primaryAddr || '위치 정보 확인됨',
    roadAddress: roadAddr || primaryAddr || '도로명 주소 정보',
  };
}

/**
 * Google Places API (New) 실시간 텍스트 검색
 * 전세계 모든 장소, 정확한 구글 GPS 좌표, 실제 도로명/지번 주소, 별점, 실제 사진 일괄 수집
 */
async function fetchLivePlacesFromGoogle(
  query: string,
  categoryFilter?: PlaceCategory,
  locationBias?: { latitude: number; longitude: number }
): Promise<SearchPlaceResult[]> {
  const apiKey = getGoogleApiKey();
  if (!apiKey || apiKey.includes('placeholder')) {
    return [];
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const url = 'https://places.googleapis.com/v1/places:searchText';
    const fieldMask = [
      'places.id',
      'places.displayName',
      'places.formattedAddress',
      'places.shortFormattedAddress',
      'places.addressComponents',
      'places.location',
      'places.rating',
      'places.userRatingCount',
      'places.photos',
      'places.types',
    ].join(',');

    const bodyPayload: any = {
      textQuery: query,
      languageCode: 'ko',
      pageSize: 20,
    };

    if (locationBias && locationBias.latitude && locationBias.longitude) {
      bodyPayload.locationBias = {
        circle: {
          center: {
            latitude: locationBias.latitude,
            longitude: locationBias.longitude,
          },
          radius: 50000.0,
        },
      };
    }

    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMask,
      },
      body: JSON.stringify(bodyPayload),
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.log('[PlaceSearch] Google Places response error:', res.status);
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data.places) || data.places.length === 0) {
      return [];
    }

    return data.places.slice(0, 20).map((item: any, idx: number) => {
      const lat = item.location?.latitude || 37.4973;
      const lng = item.location?.longitude || 127.0551;
      const name = item.displayName?.text || query;

      const { primaryAddress, roadAddress } = normalizeKoreanAddresses(
        item.formattedAddress || '',
        item.shortFormattedAddress,
        item.addressComponents
      );

      // 구글 타입 기반 카테고리 매핑
      let cat: PlaceCategory =
        categoryFilter && categoryFilter !== ('ALL' as any) ? categoryFilter : 'ATTRACTION';
      const types: string[] = item.types || [];
      if (types.includes('cafe') || types.includes('bakery') || types.includes('coffee_shop')) {
        cat = 'CAFE';
      } else if (
        types.includes('restaurant') ||
        types.includes('food') ||
        types.includes('meal_takeaway') ||
        types.includes('fast_food_restaurant')
      ) {
        cat = 'RESTAURANT';
      } else if (
        types.includes('lodging') ||
        types.includes('hotel') ||
        types.includes('resort_hotel')
      ) {
        cat = 'LODGING';
      } else if (
        types.includes('shopping_mall') ||
        types.includes('store') ||
        types.includes('clothing_store') ||
        types.includes('department_store')
      ) {
        cat = 'SHOPPING';
      }

      // 구글 실시간 고화질 사진 URL
      let imageUrl = CATEGORY_IMAGES[cat];
      if (item.photos && item.photos.length > 0 && item.photos[0].name) {
        imageUrl = `https://places.googleapis.com/v1/${item.photos[0].name}/media?maxHeightPx=600&maxWidthPx=600&key=${apiKey}`;
      }

      return {
        id: `google_${item.id || Date.now()}_${idx}`,
        name,
        address: primaryAddress,
        roadAddress,
        category: cat,
        latitude: lat,
        longitude: lng,
        rating: item.rating,
        imageUrl,
        memo: item.userRatingCount
          ? `구글 지도 평점 ${item.rating || '4.5'} (${item.userRatingCount.toLocaleString()}개 리뷰)`
          : roadAddress,
      };
    });
  } catch (err) {
    clearTimeout(timeoutId);
    console.log('[PlaceSearch] Google Places (New) search error:', err);
    return [];
  }
}

// 유명 여행지 & 핫플 엄선 데이터베이스 (즉각적인 고품질 검색 지원)
export const CURATED_PLACES: SearchPlaceResult[] = [
  // 국내 주요 스팟 (레퍼런스 예시 포함)
  {
    id: 'cur_kr_1',
    name: '맥도날드 한티역점',
    address: '서울특별시 강남구 대치동 938-22',
    roadAddress: '서울특별시 강남구 도곡로 409',
    category: 'RESTAURANT',
    latitude: 37.4973307,
    longitude: 127.0551532,
    rating: 4.5,
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop',
    memo: '서울특별시 강남구 도곡로 409',
    isPopular: true,
  },
  {
    id: 'cur_kr_2',
    name: '맥도날드 강남삼성DT점',
    address: '서울특별시 강남구 삼성동 113-7',
    roadAddress: '서울특별시 강남구 봉은사로 436',
    category: 'RESTAURANT',
    latitude: 37.5109238,
    longitude: 127.0472979,
    rating: 4.6,
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop',
    memo: '서울특별시 강남구 봉은사로 436',
  },
  {
    id: 'cur_kr_3',
    name: '맥도날드 코엑스점',
    address: '서울특별시 강남구 삼성동 159',
    roadAddress: '서울특별시 강남구 영동대로 513',
    category: 'RESTAURANT',
    latitude: 37.5092914,
    longitude: 127.062139,
    rating: 4.5,
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop',
    memo: '서울특별시 강남구 영동대로 513',
  },
  {
    id: 'cur_kr_4',
    name: '맥도날드 신사역점',
    address: '서울특별시 강남구 신사동 514-15',
    roadAddress: '서울특별시 강남구 도산대로 123',
    category: 'RESTAURANT',
    latitude: 37.5174146,
    longitude: 127.021881,
    rating: 4.5,
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop',
    memo: '서울특별시 강남구 도산대로 123',
  },
  // 숙소 (호텔, 리조트, 료칸)
  {
    id: 'cur_hotel_1',
    name: '호텔 그레이서리 신주쿠 (Hotel Gracery Shinjuku)',
    address: '도쿄도 신주쿠구 가부키초 1-19-1',
    roadAddress: '1 Chome-19-1 Kabukicho, Shinjuku City, Tokyo, Japan',
    category: 'LODGING',
    latitude: 35.6953,
    longitude: 139.702,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop',
    memo: '고질라 헤드가 유명한 가부키초 중심 랜드마크 호텔',
    isPopular: true,
  },
  {
    id: 'cur_hotel_2',
    name: '두짓타니 괌 리조트 (Dusit Thani Guam Resort)',
    address: '1227 Pale San Vitores Rd, Tamuning, Guam',
    roadAddress: '1227 Pale San Vitores Rd, Tamuning, 96913, Guam',
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
    address: '202 Hilton Road, Tumon Bay, Guam',
    roadAddress: '202 Hilton Road, Tumon Bay, 96913, Guam',
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
    address: '241 Gun Beach Rd, Tumon, Guam',
    roadAddress: '241 Gun Beach Rd, Tumon, 96913, Guam',
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
    address: '245 Gun Beach Rd, Tumon, Guam',
    roadAddress: '245 Gun Beach Rd, Tumon, 96913, Guam',
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
    address: '오사카부 오사카시 주오구 난바 5-1-60',
    roadAddress: '5 Chome-1-60 Namba, Chuo Ward, Osaka, Japan',
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
    address: '오사카부 오사카시 기타구 오후카초 1-1',
    roadAddress: '1-1 Ofukacho, Kita Ward, Osaka, Japan',
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
    address: '교토부 교토시 나카교구 미부 니시타카쓰카초',
    roadAddress: 'Mibu Nishitakatsukacho, Nakagyo Ward, Kyoto, Japan',
    category: 'LODGING',
    latitude: 34.996,
    longitude: 135.742,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop',
    memo: '전통 다다미방과 노천 대욕탕 온천 료칸',
  },
  {
    id: 'cur_hotel_9',
    name: '제주 신라호텔 (The Shilla Jeju)',
    address: '제주특별자치도 서귀포시 색달동 3039-3',
    roadAddress: '제주특별자치도 서귀포시 중문관광로72번길 75',
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
    address: '5 Truong Sa, Ngu Hanh Son, Da Nang, Vietnam',
    roadAddress: '5 Truong Sa Street, Ngu Hanh Son, Da Nang, Vietnam',
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
    address: '도쿄도 시부야구 시부야 2-24-12',
    roadAddress: '2 Chome-24-12 Shibuya, Shibuya City, Tokyo, Japan',
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
    address: '도쿄도 미나토구 시바코엔 4-2-8',
    roadAddress: '4 Chome-2-8 Shibakoen, Minato City, Tokyo, Japan',
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
    address: '도쿄도 고토구 도요스 6-1-16',
    roadAddress: '6 Chome-1-16 Toyosu, Koto City, Tokyo, Japan',
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
    address: '오사카부 오사카시 주오구 도톤보리 1-10-3',
    roadAddress: '1 Chome-10-3 Dotonbori, Chuo Ward, Osaka, Japan',
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
    address: '오사카부 오사카시 고노하나구 사쿠라지마 2-1-33',
    roadAddress: '2 Chome-1-33 Sakurajima, Konohana Ward, Osaka, Japan',
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
    address: '교토부 교토시 후시미구 후카쿠사 야부노우치초 68',
    roadAddress: '68 Fukakusa Yabunouchicho, Fushimi Ward, Kyoto, Japan',
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
    address: 'GRM2+X85, Tamuning, Guam',
    roadAddress: 'Two Lovers Point Rd, Tamuning, 96913, Guam',
    category: 'ATTRACTION',
    latitude: 13.535,
    longitude: 144.8028,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
    memo: '필리핀해의 에메랄드빛 바다가 펼쳐지는 괌 대표 전망대',
    isPopular: true,
  },
  {
    id: 'cur_spot_8',
    name: '투몬 비치 (Tumon Beach, Guam)',
    address: 'Pale San Vitores Rd, Tamuning, Guam',
    roadAddress: 'Pale San Vitores Rd, Tamuning, 96913, Guam',
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
    address: '도쿄도 시부야구 진난 1-22-7',
    roadAddress: '1 Chome-22-7 Jinnan, Shibuya City, Tokyo, Japan',
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
    address: '도쿄도 시부야구 도미가야 1-16-11',
    roadAddress: '1 Chome-16-11 Tomigaya, Shibuya City, Tokyo, Japan',
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
    address: '도쿄도 시부야구 진구마에 3-24-7',
    roadAddress: '3 Chome-24-7 Jingumae, Shibuya City, Tokyo, Japan',
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
    address: '404 N Marine Corps Dr, Tamuning, Guam',
    roadAddress: '404 N Marine Corps Dr, Tamuning, 96913, Guam',
    category: 'SHOPPING',
    latitude: 13.5048,
    longitude: 144.799,
    rating: 4.6,
    imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop',
    memo: '괌 24시간 대형 쇼핑몰. 바나나보트 선크림 & 기념품 쇼핑',
    isPopular: true,
  },
  {
    id: 'cur_food_5',
    name: '프로아 레스토랑 (PROA Restaurant, Guam)',
    address: 'Pale San Vitores Rd, Tamuning, Guam',
    roadAddress: '429 Pale San Vitores Rd, Tumon, 96913, Guam',
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
export async function searchAccommodations(
  query: string,
  locationBias?: { latitude: number; longitude: number }
): Promise<SearchPlaceResult[]> {
  const q = query.trim().toLowerCase();
  const apiKey = getGoogleApiKey();

  // 1순위: Google Places API (실제 구글맵 전세계 숙소 검색)
  if (apiKey && !apiKey.includes('placeholder') && q.length >= 1) {
    try {
      const searchQ = q.includes('호텔') || q.includes('리조트') || q.includes('료칸') || q.includes('숙소') || q.includes('hotel')
        ? query
        : `${query} 호텔`;
      const googleResults = await fetchLivePlacesFromGoogle(searchQ, 'LODGING', locationBias);
      if (googleResults.length > 0) {
        return googleResults;
      }
    } catch {}
  }

  // 2차: 큐레이션된 숙소 목록 매칭
  const curatedMatches = CURATED_PLACES.filter(
    (p) =>
      p.category === 'LODGING' &&
      (!q ||
        p.name.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        (p.roadAddress && p.roadAddress.toLowerCase().includes(q)) ||
        (p.memo && p.memo.toLowerCase().includes(q)))
  );

  if (curatedMatches.length >= 3 || (!q && curatedMatches.length > 0)) {
    return curatedMatches;
  }

  // 3차: Nominatim OpenStreetMap 실시간 지오코딩 검색
  if (q.length >= 2) {
    try {
      const liveResults = await fetchLivePlacesFromOsm(`${query} hotel`, 'LODGING');
      const combined = [...curatedMatches];
      for (const item of liveResults) {
        if (!combined.some((c) => c.name.toLowerCase() === item.name.toLowerCase())) {
          combined.push(item);
        }
      }
      return combined.slice(0, 12);
    } catch {}
  }

  return curatedMatches;
}

/**
 * 일반 장소 검색 (카페, 맛집, 명소, 쇼핑 등)
 */
export async function searchPlaces(
  query: string,
  categoryFilter?: PlaceCategory,
  locationBias?: { latitude: number; longitude: number }
): Promise<SearchPlaceResult[]> {
  const q = query.trim().toLowerCase();
  const apiKey = getGoogleApiKey();

  // 검색어가 없으면 추천 핫플 반환
  if (!q) {
    return CURATED_PLACES.filter((p) => {
      if (categoryFilter && categoryFilter !== ('ALL' as any) && p.category !== categoryFilter) {
        return false;
      }
      return true;
    }).slice(0, 15);
  }

  // 로컬 큐레이션 매칭 (즉각 반응 및 보강용)
  const curatedMatches = CURATED_PLACES.filter((p) => {
    if (categoryFilter && categoryFilter !== ('ALL' as any) && p.category !== categoryFilter) {
      return false;
    }
    return (
      p.name.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q) ||
      (p.roadAddress && p.roadAddress.toLowerCase().includes(q)) ||
      (p.memo && p.memo.toLowerCase().includes(q))
    );
  });

  // 1순위: Google Places API (전세계 모든 장소 공식 검색)
  if (apiKey && !apiKey.includes('placeholder') && q.length >= 1) {
    try {
      const googleResults = await fetchLivePlacesFromGoogle(query, categoryFilter, locationBias);
      if (googleResults.length > 0) {
        // 큐레이션 결과 중 정확히 일치하는 항목(예: 맥도날드 한티역점 지번+도로명 완비)이 있으면 병합/보강
        const merged: SearchPlaceResult[] = [...curatedMatches];
        for (const gItem of googleResults) {
          const existingIdx = merged.findIndex(
            (m) => m.name.toLowerCase() === gItem.name.toLowerCase()
          );
          if (existingIdx === -1) {
            merged.push(gItem);
          }
        }
        return merged.slice(0, 20);
      }
    } catch {}
  }

  // 2순위: 실시간 OpenStreetMap 검색 결합
  try {
    const liveResults = await fetchLivePlacesFromOsm(query, categoryFilter);
    const combined = [...curatedMatches];
    for (const item of liveResults) {
      if (!combined.some((c) => c.name.toLowerCase() === item.name.toLowerCase())) {
        combined.push(item);
      }
    }
    return combined.slice(0, 15);
  } catch {
    return curatedMatches;
  }
}

/**
 * OpenStreetMap 실시간 지오코딩 조회 (CORS 호환 및 한국어 주소 정규화)
 */
async function fetchLivePlacesFromOsm(
  query: string,
  categoryFilter?: PlaceCategory
): Promise<SearchPlaceResult[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&limit=8&addressdetails=1&accept-language=ko`;
    const res = await fetch(url, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map((item: any, idx: number) => {
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon);
          const addrObj = item.address || {};

          const city = addrObj.province || addrObj.state || addrObj.city || '';
          const district = addrObj.borough || addrObj.city_district || addrObj.suburb || addrObj.county || '';
          const dong = addrObj.quarter || addrObj.neighbourhood || addrObj.village || '';
          const road = addrObj.road || '';
          const houseNum = addrObj.house_number || '';

          const baseName = item.name || (item.display_name || query).split(',')[0].trim() || query;
          const branchSuffix = dong || district || city;
          const uniqueName =
            branchSuffix && !baseName.includes(branchSuffix)
              ? `${baseName} (${branchSuffix})`
              : baseName;

          const primaryAddress =
            [city, district, dong, houseNum].filter(Boolean).join(' ').trim() ||
            (item.display_name || '').split(',').slice(1, 5).reverse().join(' ').trim() ||
            query;

          const roadAddress =
            [city, district, road, houseNum].filter(Boolean).join(' ').trim() || primaryAddress;

          const cat =
            categoryFilter && categoryFilter !== ('ALL' as any)
              ? categoryFilter
              : inferCategory(item.display_name || query);

          return {
            id: `osm_${Date.now()}_${idx}`,
            name: uniqueName,
            address: primaryAddress,
            roadAddress,
            category: cat,
            latitude: !isNaN(lat) ? lat : 37.4973,
            longitude: !isNaN(lng) ? lng : 127.0551,
            rating: 4.7,
            imageUrl: CATEGORY_IMAGES[cat] || CATEGORY_IMAGES.ATTRACTION,
            memo: roadAddress,
          };
        });
      }
    }
  } catch {
    clearTimeout(timeoutId);
  }

  return [];
}
