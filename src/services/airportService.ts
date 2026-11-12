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
  // ==================== 대한민국 ====================
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
    city: '서울/김포',
    country: '대한민국',
    latitude: 37.5583,
    longitude: 126.7906,
    address: '서울특별시 강서구 하늘길 38',
  },
  {
    code: 'PUS',
    nameKo: '김해국제공항',
    nameEn: 'Gimhae International Airport',
    city: '부산/김해',
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
    longitude: 126.493,
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

  // ==================== 일본 ====================
  {
    code: 'FUK',
    nameKo: '후쿠오카 공항',
    nameEn: 'Fukuoka Airport',
    city: '후쿠오카 · 유후인',
    country: '일본',
    latitude: 33.5859,
    longitude: 130.4507,
    address: 'Fukuoka, Hakata Ward, Shimousui 778-1',
  },
  {
    code: 'NRT',
    nameKo: '도쿄 나리타 국제공항',
    nameEn: 'Narita International Airport',
    city: '도쿄 (나리타)',
    country: '일본',
    latitude: 35.772,
    longitude: 140.3929,
    address: 'Chiba, Narita, Goryo 1-1',
  },
  {
    code: 'HND',
    nameKo: '도쿄 하네다 국제공항',
    nameEn: 'Tokyo Haneda Airport',
    city: '도쿄 (하네다)',
    country: '일본',
    latitude: 35.5494,
    longitude: 139.7798,
    address: 'Tokyo, Ota City, Hanedakuko',
  },
  {
    code: 'KIX',
    nameKo: '오사카 간사이 국제공항',
    nameEn: 'Kansai International Airport',
    city: '오사카 · 교토',
    country: '일본',
    latitude: 34.432,
    longitude: 135.2304,
    address: 'Osaka, Izumisano, Senshukukonaka 1',
  },
  {
    code: 'CTS',
    nameKo: '삿포로 신치토세 공항',
    nameEn: 'New Chitose Airport',
    city: '삿포로 · 홋카이도',
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
  {
    code: 'NGO',
    nameKo: '나고야 주부 센트레아 국제공항',
    nameEn: 'Chubu Centrair International Airport',
    city: '나고야',
    country: '일본',
    latitude: 34.8584,
    longitude: 136.8054,
    address: 'Tokoname, Aichi, Japan',
  },

  // ==================== 베트남 ====================
  {
    code: 'DAD',
    nameKo: '다낭 국제공항',
    nameEn: 'Da Nang International Airport',
    city: '다낭 · 호이안',
    country: '베트남',
    latitude: 16.0539,
    longitude: 108.1994,
    address: 'Hoa Thuan Tay, Hai Chau, Da Nang, Vietnam',
  },
  {
    code: 'CXR',
    nameKo: '나트랑 깜라인 국제공항',
    nameEn: 'Cam Ranh International Airport',
    city: '나트랑 · 달랏',
    country: '베트남',
    latitude: 11.9981,
    longitude: 109.2194,
    address: 'Nguyen Tat Thanh, Cam Ranh, Khanh Hoa, Vietnam',
  },
  {
    code: 'HAN',
    nameKo: '하노이 노이바이 국제공항',
    nameEn: 'Noi Bai International Airport',
    city: '하노이',
    country: '베트남',
    latitude: 21.2187,
    longitude: 105.8042,
    address: 'Phu Minh, Soc Son, Hanoi, Vietnam',
  },
  {
    code: 'PQC',
    nameKo: '푸꾸옥 국제공항',
    nameEn: 'Phu Quoc International Airport',
    city: '푸꾸옥',
    country: '베트남',
    latitude: 10.1698,
    longitude: 103.9931,
    address: 'Duong To, Phu Quoc, Kien Giang, Vietnam',
  },
  {
    code: 'SGN',
    nameKo: '호치민 떤선녓 국제공항',
    nameEn: 'Tan Son Nhat International Airport',
    city: '호치민',
    country: '베트남',
    latitude: 10.8185,
    longitude: 106.6588,
    address: 'Tan Binh, Ho Chi Minh City, Vietnam',
  },
  {
    code: 'DLI',
    nameKo: '달랏 리엔크엉 국제공항',
    nameEn: 'Lien Khuong Airport',
    city: '달랏',
    country: '베트남',
    latitude: 11.7505,
    longitude: 108.367,
    address: 'Lien Nghia, Duc Trong, Lam Dong, Vietnam',
  },

  // ==================== 태국 · 동남아 ====================
  {
    code: 'BKK',
    nameKo: '방콕 수완나품 국제공항',
    nameEn: 'Suvarnabhumi Airport',
    city: '방콕 · 파타야',
    country: '태국',
    latitude: 13.69,
    longitude: 100.7501,
    address: 'Bang Phli, Samut Prakan, Thailand',
  },
  {
    code: 'DMK',
    nameKo: '방콕 돈므앙 국제공항',
    nameEn: 'Don Mueang International Airport',
    city: '방콕 (돈므앙)',
    country: '태국',
    latitude: 13.9126,
    longitude: 100.6068,
    address: 'Don Mueang, Bangkok, Thailand',
  },
  {
    code: 'CNX',
    nameKo: '치앙마이 국제공항',
    nameEn: 'Chiang Mai International Airport',
    city: '치앙마이',
    country: '태국',
    latitude: 18.7668,
    longitude: 98.9626,
    address: 'Mueang Chiang Mai, Thailand',
  },
  {
    code: 'HKT',
    nameKo: '푸켓 국제공항',
    nameEn: 'Phuket International Airport',
    city: '푸켓',
    country: '태국',
    latitude: 8.1132,
    longitude: 98.3169,
    address: 'Thalang District, Phuket, Thailand',
  },
  {
    code: 'CEB',
    nameKo: '세부 막탄 국제공항',
    nameEn: 'Mactan-Cebu International Airport',
    city: '세부',
    country: '필리핀',
    latitude: 10.3075,
    longitude: 123.9794,
    address: 'Lapu-Lapu City, Cebu, Philippines',
  },
  {
    code: 'TAG',
    nameKo: '보홀 팡라오 국제공항',
    nameEn: 'Bohol-Panglao International Airport',
    city: '보홀',
    country: '필리핀',
    latitude: 9.5767,
    longitude: 123.7745,
    address: 'Panglao, Bohol, Philippines',
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
    address: 'Kuta, Badung, Bali, Indonesia',
  },
  {
    code: 'BKI',
    nameKo: '코타키나발루 국제공항',
    nameEn: 'Kota Kinabalu International Airport',
    city: '코타키나발루',
    country: '말레이시아',
    latitude: 5.9372,
    longitude: 116.0512,
    address: 'Kota Kinabalu, Sabah, Malaysia',
  },

  // ==================== 대만 · 홍콩 · 마카오 ====================
  {
    code: 'TPE',
    nameKo: '타이베이 타오위안 국제공항',
    nameEn: 'Taiwan Taoyuan International Airport',
    city: '타이베이',
    country: '대만',
    latitude: 25.0797,
    longitude: 121.2342,
    address: 'Dayuan District, Taoyuan City, Taiwan',
  },
  {
    code: 'TSA',
    nameKo: '타이베이 송산 공항',
    nameEn: 'Taipei Songshan Airport',
    city: '타이베이 (송산)',
    country: '대만',
    latitude: 25.0694,
    longitude: 121.5517,
    address: 'Songshan District, Taipei City, Taiwan',
  },
  {
    code: 'KHH',
    nameKo: '가오슝 국제공항',
    nameEn: 'Kaohsiung International Airport',
    city: '가오슝',
    country: '대만',
    latitude: 22.5771,
    longitude: 120.35,
    address: 'Xiaogang District, Kaohsiung City, Taiwan',
  },
  {
    code: 'HKG',
    nameKo: '홍콩 첵랍콕 국제공항',
    nameEn: 'Hong Kong International Airport',
    city: '홍콩',
    country: '홍콩',
    latitude: 22.308,
    longitude: 113.9185,
    address: 'Lantau Island, Hong Kong',
  },
  {
    code: 'MFM',
    nameKo: '마카오 국제공항',
    nameEn: 'Macau International Airport',
    city: '마카오',
    country: '마카오',
    latitude: 22.1496,
    longitude: 113.5915,
    address: 'Taipa, Macau',
  },

  // ==================== 괌 · 사이판 · 미주 · 대양주 · 유럽 ====================
  {
    code: 'GUM',
    nameKo: '괌 안토니오 B. 원 팻 국제공항',
    nameEn: 'Guam Antonio B. Won Pat International Airport',
    city: '괌',
    country: '미국',
    latitude: 13.4839,
    longitude: 144.7972,
    address: 'Tamuning, 96913, Guam',
  },
  {
    code: 'SPN',
    nameKo: '사이판 국제공항',
    nameEn: 'Saipan International Airport',
    city: '사이판',
    country: '미국',
    latitude: 15.119,
    longitude: 145.7294,
    address: 'Saipan 96950, Northern Mariana Islands',
  },
  {
    code: 'HNL',
    nameKo: '하와이 호놀룰루 국제공항',
    nameEn: 'Daniel K. Inouye International Airport',
    city: '하와이 (호놀룰루)',
    country: '미국',
    latitude: 21.3187,
    longitude: -157.9253,
    address: 'Honolulu, HI 96819, USA',
  },
  {
    code: 'LAX',
    nameKo: '로스앤젤레스 국제공항',
    nameEn: 'Los Angeles International Airport',
    city: '로스앤젤레스',
    country: '미국',
    latitude: 33.9416,
    longitude: -118.4085,
    address: 'Los Angeles, CA 90045, USA',
  },
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
    code: 'SYD',
    nameKo: '시드니 킹스포드 스미스 국제공항',
    nameEn: 'Sydney Kingsford Smith Airport',
    city: '시드니',
    country: '호주',
    latitude: -33.9399,
    longitude: 151.1753,
    address: 'Mascot NSW 2020, Australia',
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
    latitude: 51.47,
    longitude: -0.4543,
    address: 'Hounslow TW6 1AP, United Kingdom',
  },
  {
    code: 'FCO',
    nameKo: '로마 피우미치노 레오나르도 다빈치 공항',
    nameEn: 'Rome Fiumicino Airport',
    city: '로마',
    country: '이탈리아',
    latitude: 41.8003,
    longitude: 12.2389,
    address: 'Via dell Aeroporto di Fiumicino, Rome, Italy',
  },
  {
    code: 'BCN',
    nameKo: '바르셀로나 엘프라트 공항',
    nameEn: ' Josep Tarradellas Barcelona-El Prat Airport',
    city: '바르셀로나',
    country: '스페인',
    latitude: 41.2974,
    longitude: 2.0833,
    address: '08820 El Prat de Llobregat, Barcelona, Spain',
  },
  {
    code: 'FRA',
    nameKo: '프랑크푸르트 암마인 공항',
    nameEn: 'Frankfurt Airport',
    city: '프랑크푸르트',
    country: '독일',
    latitude: 50.0379,
    longitude: 8.5622,
    address: '60547 Frankfurt, Germany',
  },
];

/**
 * 한국 주요 출발 공항 빠른 선택 목록
 */
export const KOREAN_DEPARTURE_AIRPORTS: AirportItem[] = POPULAR_AIRPORTS.filter((a) =>
  ['ICN', 'GMP', 'PUS', 'CJJ', 'TAE', 'CJU'].includes(a.code)
);

/**
 * 선택한 여행지(다구간 포함)에 해당하는 추천 도착 공항 목록 반환
 */
export function getRecommendedAirportsForDestination(destination?: string): AirportItem[] {
  if (!destination || !destination.trim()) {
    return POPULAR_AIRPORTS.filter((a) => !['ICN', 'GMP', 'PUS', 'TAE', 'CJJ'].includes(a.code)).slice(0, 6);
  }
  const tokens = destination
    .split(/[·,\s]+/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const matched = POPULAR_AIRPORTS.filter((a) =>
    tokens.some(
      (tok) =>
        a.city.toLowerCase().includes(tok) ||
        a.nameKo.toLowerCase().includes(tok) ||
        a.country.toLowerCase().includes(tok) ||
        a.code.toLowerCase() === tok
    )
  );

  if (matched.length > 0) return matched;
  return POPULAR_AIRPORTS.filter((a) => !['ICN', 'GMP', 'PUS', 'TAE', 'CJJ'].includes(a.code)).slice(0, 6);
}

/**
 * 공항 검색 함수 (IATA 코드, 한글명, 영문명, 도시명)
 */
export function searchAirports(query: string): AirportItem[] {
  if (!query || query.trim().length === 0) {
    return POPULAR_AIRPORTS.slice(0, 12);
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

  return {
    name: query,
    code: 'ICN',
    latitude: 37.4602,
    longitude: 126.4407,
    address: '인천광역시 중구 공항로 272',
  };
}
