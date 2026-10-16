import { geocodePlace } from './parserService';

export interface AirportItem {
  code: string; // IATA (e.g. ICN)
  nameKo: string; // e.g. 인천국제공항
  nameEn: string; // Incheon International Airport
  city: string; // 서울 / 인천
  country: string; // 대한민국
  latitude: number;
  longitude: number;
  address: string;
}

export const POPULAR_AIRPORTS: AirportItem[] = [
  // 대한민국
  {
    code: 'ICN',
    nameKo: '인천국제공항',
    nameEn: 'Incheon International Airport',
    city: '서울/인천',
    country: '대한민국',
    latitude: 37.4602,
    longitude: 126.4407,
    address: '인천광역시 중구 공항로 272',
  },
  {
    code: 'GMP',
    nameKo: '김포국제공항',
    nameEn: 'Gimpo International Airport',
    city: '서울',
    country: '대한민국',
    latitude: 37.5583,
    longitude: 126.7906,
    address: '서울특별시 강서구 하늘길 38',
  },
  {
    code: 'PUS',
    nameKo: '김해국제공항',
    nameEn: 'Gimhae International Airport',
    city: '부산',
    country: '대한민국',
    latitude: 35.1795,
    longitude: 128.9382,
    address: '부산광역시 강서구 공항진입로 108',
  },
  {
    code: 'CJU',
    nameKo: '제주국제공항',
    nameEn: 'Jeju International Airport',
    city: '제주',
    country: '대한민국',
    latitude: 33.5113,
    longitude: 126.4930,
    address: '제주특별자치도 제주시 공항로 2',
  },
  {
    code: 'TAE',
    nameKo: '대구국제공항',
    nameEn: 'Daegu International Airport',
    city: '대구',
    country: '대한민국',
    latitude: 35.8994,
    longitude: 128.6535,
    address: '대구광역시 동구 공항로 221',
  },
  {
    code: 'CJJ',
    nameKo: '청주국제공항',
    nameEn: 'Cheongju International Airport',
    city: '청주',
    country: '대한민국',
    latitude: 36.7166,
    longitude: 127.4991,
    address: '충청북도 청주시 청원구 오창읍 공항로 980',
  },

  // 일본
  {
    code: 'NRT',
    nameKo: '도쿄 나리타 국제공항',
    nameEn: 'Narita International Airport',
    city: '도쿄',
    country: '일본',
    latitude: 35.7720,
    longitude: 140.3929,
    address: 'Chiba, Narita, Goryo 1-1',
  },
  {
    code: 'HND',
    nameKo: '도쿄 하네다 공항',
    nameEn: 'Tokyo Haneda Airport',
    city: '도쿄',
    country: '일본',
    latitude: 35.5494,
    longitude: 139.7798,
    address: 'Tokyo, Ota City, Hanedakuko',
  },
  {
    code: 'KIX',
    nameKo: '오사카 간사이 국제공항',
    nameEn: 'Kansai International Airport',
    city: '오사카',
    country: '일본',
    latitude: 34.4320,
    longitude: 135.2304,
    address: 'Osaka, Izumisano, Senshukukonaka 1',
  },
  {
    code: 'ITM',
    nameKo: '오사카 이타미 공항',
    nameEn: 'Osaka Itami Airport',
    city: '오사카',
    country: '일본',
    latitude: 34.7855,
    longitude: 135.4382,
    address: 'Osaka, Toyonaka, Hotarugaike Nishimachi',
  },
  {
    code: 'FUK',
    nameKo: '후쿠오카 공항',
    nameEn: 'Fukuoka Airport',
    city: '후쿠오카',
    country: '일본',
    latitude: 33.5859,
    longitude: 130.4507,
    address: 'Fukuoka, Hakata Ward, Shimousui 778-1',
  },
  {
    code: 'CTS',
    nameKo: '삿포로 신치토세 공항',
    nameEn: 'New Chitose Airport',
    city: '삿포로',
    country: '일본',
    latitude: 42.7752,
    longitude: 141.6923,
    address: 'Hokkaido, Chitose, Bibi',
  },
  {
    code: 'OKA',
    nameKo: '오키나와 나하 공항',
    nameEn: 'Naha Airport',
    city: '오키나와',
    country: '일본',
    latitude: 26.2065,
    longitude: 127.6465,
    address: 'Okinawa, Naha, Kagamizu 150',
  },

  // 괌 & 사이판 & 태평양
  {
    code: 'GUM',
    nameKo: '괌 안토니오 B. 원 팻 국제공항',
    nameEn: 'Guam Antonio B. Won Pat International Airport',
    city: '괌',
    country: '미국',
    latitude: 13.4839,
    longitude: 144.7972,
    address: '355 Chalan Pasaheru B220-A, Tamuning, 96913, Guam',
  },
  {
    code: 'SPN',
    nameKo: '사이판 국제공항',
    nameEn: 'Saipan International Airport',
    city: '사이판',
    country: '미국',
    latitude: 15.1190,
    longitude: 145.7294,
    address: 'I Fadang, Saipan 96950, Northern Mariana Islands',
  },
  {
    code: 'HNL',
    nameKo: '하와이 호놀룰루 국제공항',
    nameEn: 'Daniel K. Inouye International Airport',
    city: '호놀룰루',
    country: '미국',
    latitude: 21.3187,
    longitude: -157.9253,
    address: '300 Rodgers Blvd, Honolulu, HI 96819, USA',
  },

  // 동남아 & 중화권
  {
    code: 'DAD',
    nameKo: '다낭 국제공항',
    nameEn: 'Da Nang International Airport',
    city: '다낭',
    country: '베트남',
    latitude: 16.0539,
    longitude: 108.1994,
    address: 'Hoa Thuan Tay, Hai Chau, Da Nang, Vietnam',
  },
  {
    code: 'CXR',
    nameKo: '나트랑 깜라인 국제공항',
    nameEn: 'Cam Ranh International Airport',
    city: '나트랑',
    country: '베트남',
    latitude: 11.9981,
    longitude: 109.2194,
    address: 'Nguyen Tat Thanh, Cam Ranh, Khanh Hoa, Vietnam',
  },
  {
    code: 'BKK',
    nameKo: '방콕 수완나품 국제공항',
    nameEn: 'Suvarnabhumi Airport',
    city: '방콕',
    country: '태국',
    latitude: 13.6900,
    longitude: 100.7501,
    address: '999 Soi Mu Ban Nakhon Thong 1, Nong Prue, Bang Phli, Samut Prakan, Thailand',
  },
  {
    code: 'TPE',
    nameKo: '타이베이 타오위안 국제공항',
    nameEn: 'Taiwan Taoyuan International Airport',
    city: '타이베이',
    country: '대만',
    latitude: 25.0797,
    longitude: 121.2342,
    address: 'No. 9, Hangzhan S. Rd, Dayuan District, Taoyuan City, Taiwan',
  },
  {
    code: 'SIN',
    nameKo: '싱가포르 창이 국제공항',
    nameEn: 'Singapore Changi Airport',
    city: '싱가포르',
    country: '싱가포르',
    latitude: 1.3644,
    longitude: 103.9915,
    address: 'Airport Blvd., Singapore',
  },
  {
    code: 'DPS',
    nameKo: '발리 응우라라이 국제공항',
    nameEn: 'I Gusti Ngurah Rai International Airport',
    city: '발리',
    country: '인도네시아',
    latitude: -8.7482,
    longitude: 115.1672,
    address: 'Jalan Raya Gusti Ngurah Rai, Tuban, Kuta, Badung, Bali, Indonesia',
  },

  // 미주 & 유럽
  {
    code: 'JFK',
    nameKo: '뉴욕 존 F. 케네디 국제공항',
    nameEn: 'John F. Kennedy International Airport',
    city: '뉴욕',
    country: '미국',
    latitude: 40.6413,
    longitude: -73.7781,
    address: 'Queens, NY 11430, USA',
  },
  {
    code: 'LAX',
    nameKo: '로스앤젤레스 국제공항',
    nameEn: 'Los Angeles International Airport',
    city: '로스앤젤레스',
    country: '미국',
    latitude: 33.9416,
    longitude: -118.4085,
    address: '1 World Way, Los Angeles, CA 90045, USA',
  },
  {
    code: 'CDG',
    nameKo: '파리 샤를 드골 국제공항',
    nameEn: 'Charles de Gaulle Airport',
    city: '파리',
    country: '프랑스',
    latitude: 49.0097,
    longitude: 2.5479,
    address: '95700 Roissy-en-France, France',
  },
  {
    code: 'LHR',
    nameKo: '런던 히드로 공항',
    nameEn: 'Heathrow Airport',
    city: '런던',
    country: '영국',
    latitude: 51.4700,
    longitude: -0.4543,
    address: 'Hounslow TW6 1AP, United Kingdom',
  },
];

/**
 * 공항 검색 함수 (IATA 코드, 한글명, 영문명, 도시명)
 */
export function searchAirports(query: string): AirportItem[] {
  if (!query || query.trim().length === 0) {
    return POPULAR_AIRPORTS.slice(0, 8);
  }
  const q = query.trim().toLowerCase();
  return POPULAR_AIRPORTS.filter(
    (a) =>
      a.code.toLowerCase().includes(q) ||
      a.nameKo.toLowerCase().includes(q) ||
      a.nameEn.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.country.toLowerCase().includes(q)
  );
}

/**
 * 텍스트 또는 코드로부터 공항 매칭 및 좌표 추출
 */
export async function resolveAirportLocation(
  query: string
): Promise<{ name: string; code: string; latitude: number; longitude: number; address: string }> {
  if (!query || query.trim().length === 0) {
    const defaultAirport = POPULAR_AIRPORTS[0];
    return {
      name: defaultAirport.nameKo,
      code: defaultAirport.code,
      latitude: defaultAirport.latitude,
      longitude: defaultAirport.longitude,
      address: defaultAirport.address,
    };
  }

  const clean = query.trim().toUpperCase();

  // 1차: IATA 코드 정확 일치 확인 (괄호 안에 있는 경우 포함)
  for (const a of POPULAR_AIRPORTS) {
    if (
      clean === a.code ||
      clean.includes(`(${a.code})`) ||
      clean.includes(`[${a.code}]`) ||
      clean.includes(` ${a.code} `) ||
      clean.endsWith(` ${a.code}`) ||
      clean.startsWith(`${a.code} `)
    ) {
      return {
        name: a.nameKo,
        code: a.code,
        latitude: a.latitude,
        longitude: a.longitude,
        address: a.address,
      };
    }
  }

  // 2차: 한글/영문 공항명 부분 일치
  const lowerQuery = query.toLowerCase();
  for (const a of POPULAR_AIRPORTS) {
    if (
      lowerQuery.includes(a.nameKo.toLowerCase()) ||
      lowerQuery.includes(a.city.toLowerCase()) ||
      lowerQuery.includes(a.nameEn.toLowerCase())
    ) {
      return {
        name: a.nameKo,
        code: a.code,
        latitude: a.latitude,
        longitude: a.longitude,
        address: a.address,
      };
    }
  }

  // 3차: 키워드 유추 (인천, 김포, 괌, 나리타, 간사이, 후쿠오카, 하네다 등)
  const KEYWORD_MAP: Record<string, string> = {
    인천: 'ICN',
    김포: 'GMP',
    김해: 'PUS',
    부산: 'PUS',
    제주: 'CJU',
    대구: 'TAE',
    청주: 'CJJ',
    나리타: 'NRT',
    하네다: 'HND',
    도쿄: 'NRT',
    간사이: 'KIX',
    오사카: 'KIX',
    후쿠오카: 'FUK',
    삿포로: 'CTS',
    치토세: 'CTS',
    오키나와: 'OKA',
    나하: 'OKA',
    괌: 'GUM',
    사이판: 'SPN',
    다낭: 'DAD',
    나트랑: 'CXR',
    방콕: 'BKK',
    타이베이: 'TPE',
    대만: 'TPE',
    싱가포르: 'SIN',
    발리: 'DPS',
    하와이: 'HNL',
    호놀룰루: 'HNL',
    뉴욕: 'JFK',
    로스앤젤레스: 'LAX',
    파리: 'CDG',
    런던: 'LHR',
  };

  for (const [kw, code] of Object.entries(KEYWORD_MAP)) {
    if (query.includes(kw)) {
      const matched = POPULAR_AIRPORTS.find((a) => a.code === code);
      if (matched) {
        return {
          name: matched.nameKo,
          code: matched.code,
          latitude: matched.latitude,
          longitude: matched.longitude,
          address: matched.address,
        };
      }
    }
  }

  // 4차: OpenStreetMap 지오코딩 조회
  try {
    const geo = await geocodePlace(query.includes('공항') ? query : `${query} 공항`);
    if (geo) {
      return {
        name: query,
        code: 'AIR',
        latitude: geo.latitude,
        longitude: geo.longitude,
        address: geo.address,
      };
    }
  } catch {}

  // 기본값 (인천공항)
  return {
    name: query,
    code: 'ICN',
    latitude: 37.4602,
    longitude: 126.4407,
    address: '인천광역시 중구 공항로 272',
  };
}
