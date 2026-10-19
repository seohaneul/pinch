export interface WorldwideDestination {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  flag: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  defaultTitle: string;
  coverImage: string;
}

// 2-letter ISO 국가 코드를 깃발 이모지로 변환
export function getCountryFlag(countryCode?: string): string {
  if (!countryCode || countryCode.length !== 2) return '✈️';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  try {
    return String.fromCodePoint(...codePoints);
  } catch {
    return '✈️';
  }
}

// 도시/국가 키워드에 따른 고화질 커버 이미지 매핑
export function resolveDestinationCoverImage(name: string, country?: string): string {
  const q = `${name} ${country || ''}`.toLowerCase();

  // 일본
  if (q.includes('도쿄') || q.includes('tokyo') || q.includes('시부야') || q.includes('신주쿠')) {
    return 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1000&auto=format&fit=crop';
  }
  if (q.includes('오사카') || q.includes('osaka') || q.includes('도톤보리')) {
    return 'https://images.unsplash.com/photo-1590559899731-a3f376dd4558?w=1000&auto=format&fit=crop';
  }
  if (q.includes('교토') || q.includes('kyoto')) {
    return 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1000&auto=format&fit=crop';
  }
  if (q.includes('후쿠오카') || q.includes('fukuoka') || q.includes('유후인')) {
    return 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1000&auto=format&fit=crop';
  }
  if (q.includes('삿포로') || q.includes('sapporo') || q.includes('홋카이도')) {
    return 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1000&auto=format&fit=crop';
  }
  if (q.includes('오키나와') || q.includes('okinawa')) {
    return 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=1000&auto=format&fit=crop';
  }

  // 국내
  if (q.includes('제주') || q.includes('jeju')) {
    return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&auto=format&fit=crop';
  }
  if (q.includes('부산') || q.includes('busan') || q.includes('해운대')) {
    return 'https://images.unsplash.com/photo-1627916607164-7b20241db935?w=1000&auto=format&fit=crop';
  }
  if (q.includes('강릉') || q.includes('속초') || q.includes('양양')) {
    return 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1000&auto=format&fit=crop';
  }
  if (q.includes('경주') || q.includes('gyeongju')) {
    return 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1000&auto=format&fit=crop';
  }
  if (q.includes('서울') || q.includes('seoul')) {
    return 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=1000&auto=format&fit=crop';
  }

  // 동남아 / 휴양지
  if (q.includes('다낭') || q.includes('호이안') || q.includes('danang')) {
    return 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1000&auto=format&fit=crop';
  }
  if (q.includes('나트랑') || q.includes('냐짱') || q.includes('nhatrang')) {
    return 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1000&auto=format&fit=crop';
  }
  if (q.includes('방콕') || q.includes('bangkok')) {
    return 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1000&auto=format&fit=crop';
  }
  if (q.includes('발리') || q.includes('bali')) {
    return 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1000&auto=format&fit=crop';
  }
  if (q.includes('괌') || q.includes('guam')) {
    return 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000&auto=format&fit=crop';
  }
  if (q.includes('하와이') || q.includes('hawaii') || q.includes('호놀룰루')) {
    return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&auto=format&fit=crop';
  }
  if (q.includes('싱가포르') || q.includes('singapore')) {
    return 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1000&auto=format&fit=crop';
  }
  if (q.includes('타이베이') || q.includes('대만') || q.includes('taipei')) {
    return 'https://images.unsplash.com/photo-1508247967583-7d982ea01526?w=1000&auto=format&fit=crop';
  }

  // 유럽 / 미주
  if (q.includes('파리') || q.includes('paris') || q.includes('프랑스')) {
    return 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1000&auto=format&fit=crop';
  }
  if (q.includes('런던') || q.includes('london') || q.includes('영국')) {
    return 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1000&auto=format&fit=crop';
  }
  if (q.includes('로마') || q.includes('rome') || q.includes('이탈리아')) {
    return 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1000&auto=format&fit=crop';
  }
  if (q.includes('바르셀로나') || q.includes('barcelona') || q.includes('스페인')) {
    return 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1000&auto=format&fit=crop';
  }
  if (q.includes('뉴욕') || q.includes('new york') || q.includes('미국')) {
    return 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1000&auto=format&fit=crop';
  }
  if (q.includes('시드니') || q.includes('sydney') || q.includes('호주')) {
    return 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1000&auto=format&fit=crop';
  }

  // 글로벌 기본 멋진 랜드마크
  return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1000&auto=format&fit=crop';
}

// 1. 기본 추천 인기 여행지 (상단 캐러셀 노출용)
export const POPULAR_RECOMMENDED_DESTINATIONS: WorldwideDestination[] = [
  {
    id: 'tokyo',
    name: '도쿄 (Tokyo)',
    country: '일본',
    countryCode: 'JP',
    flag: '🇯🇵',
    admin1: '도쿄도',
    latitude: 35.6762,
    longitude: 139.6503,
    defaultTitle: '도쿄 감성 카페 & 쇼핑 투어 🗼',
    coverImage: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1000&auto=format&fit=crop',
  },
  {
    id: 'osaka',
    name: '오사카 / 교토',
    country: '일본',
    countryCode: 'JP',
    flag: '🇯🇵',
    admin1: '오사카부',
    latitude: 34.6937,
    longitude: 135.5023,
    defaultTitle: '오사카 먹방 & 교토 힐링 여행 🏯',
    coverImage: 'https://images.unsplash.com/photo-1590559899731-a3f376dd4558?w=1000&auto=format&fit=crop',
  },
  {
    id: 'guam',
    name: '괌 (Guam)',
    country: '미국',
    countryCode: 'US',
    flag: '🇬🇺',
    admin1: '투몬',
    latitude: 13.4443,
    longitude: 144.7937,
    defaultTitle: '에메랄드빛 괌 힐링 바캉스 🌴',
    coverImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000&auto=format&fit=crop',
  },
  {
    id: 'jeju',
    name: '제주도',
    country: '대한민국',
    countryCode: 'KR',
    flag: '🇰🇷',
    admin1: '제주특별자치도',
    latitude: 33.4996,
    longitude: 126.5312,
    defaultTitle: '푸른 바다 제주 드라이브 🍊',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&auto=format&fit=crop',
  },
  {
    id: 'danang',
    name: '다낭 / 호이안',
    country: '베트남',
    countryCode: 'VN',
    flag: '🇻🇳',
    admin1: '다낭시',
    latitude: 16.0544,
    longitude: 108.2022,
    defaultTitle: '가성비 최고 다낭 & 호이안 힐링 🏮',
    coverImage: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1000&auto=format&fit=crop',
  },
  {
    id: 'fukuoka',
    name: '후쿠오카 (Fukuoka)',
    country: '일본',
    countryCode: 'JP',
    flag: '🇯🇵',
    admin1: '후쿠오카현',
    latitude: 33.5904,
    longitude: 130.4017,
    defaultTitle: '후쿠오카 라멘 & 온천 투어 🍜',
    coverImage: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1000&auto=format&fit=crop',
  },
  {
    id: 'paris',
    name: '파리 (Paris)',
    country: '프랑스',
    countryCode: 'FR',
    flag: '🇫🇷',
    admin1: '일드프랑스',
    latitude: 48.8566,
    longitude: 2.3522,
    defaultTitle: '낭만의 도시 파리 예술 여행 🥐',
    coverImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1000&auto=format&fit=crop',
  },
  {
    id: 'bangkok',
    name: '방콕 (Bangkok)',
    country: '태국',
    countryCode: 'TH',
    flag: '🇹🇭',
    admin1: '방콕',
    latitude: 13.7563,
    longitude: 100.5018,
    defaultTitle: '방콕 미식 & 야시장 투어 🇹🇭',
    coverImage: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1000&auto=format&fit=crop',
  },
  {
    id: 'newyork',
    name: '뉴욕 (New York)',
    country: '미국',
    countryCode: 'US',
    flag: '🇺🇸',
    admin1: '뉴욕주',
    latitude: 40.7128,
    longitude: -74.006,
    defaultTitle: '잠들지 않는 도시 뉴욕 투어 🗽',
    coverImage: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1000&auto=format&fit=crop',
  },
  {
    id: 'london',
    name: '런던 (London)',
    country: '영국',
    countryCode: 'GB',
    flag: '🇬🇧',
    admin1: '잉글랜드',
    latitude: 51.5074,
    longitude: -0.1278,
    defaultTitle: '클래식한 런던 박물관 & 뮤지컬 🇬🇧',
    coverImage: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1000&auto=format&fit=crop',
  },
  {
    id: 'barcelona',
    name: '바르셀로나 (Barcelona)',
    country: '스페인',
    countryCode: 'ES',
    flag: '🇪🇸',
    admin1: '카탈루냐',
    latitude: 41.3851,
    longitude: 2.1734,
    defaultTitle: '가우디 건축과 지중해 바르셀로나 🇪🇸',
    coverImage: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1000&auto=format&fit=crop',
  },
  {
    id: 'bali',
    name: '발리 (Bali)',
    country: '인도네시아',
    countryCode: 'ID',
    flag: '🇮🇩',
    admin1: '발리주',
    latitude: -8.4095,
    longitude: 115.1889,
    defaultTitle: '지상낙원 발리 리조트 & 선셋 🏄',
    coverImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1000&auto=format&fit=crop',
  },
];

/**
 * 2. 전세계 모든 도시 실시간 검색 (Open-Meteo Geocoding API)
 * - 100% 무료, API 키 불필요
 * - 한국어(ko) 및 영어, 현지어 지원
 * - 도시명, 국가, 위경도 좌표 실시간 취득
 */
export async function searchWorldwideDestinations(query: string): Promise<WorldwideDestination[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return POPULAR_RECOMMENDED_DESTINATIONS;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      cleanQuery
    )}&count=15&language=ko&format=json`;

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.results) && data.results.length > 0) {
        return data.results.map((item: any) => {
          const flag = getCountryFlag(item.country_code);
          const countryName = item.country || item.country_code || '해외';
          const coverImage = resolveDestinationCoverImage(item.name, countryName);
          const defaultTitle = `${item.name} ${flag} 힐링 여행 ✈️`;

          return {
            id: `geo_${item.id || Math.random().toString(36).substring(7)}`,
            name: item.name,
            country: countryName,
            countryCode: item.country_code || '',
            flag,
            admin1: item.admin1,
            latitude: Number(item.latitude),
            longitude: Number(item.longitude),
            defaultTitle,
            coverImage,
          };
        });
      }
    }
  } catch (err) {
    console.log('[DestinationSearch] Open-Meteo search failed, falling back to local filter:', err);
  }

  // API 실패 시 로컬 인기 목록에서 텍스트 필터링
  const q = cleanQuery.toLowerCase();
  const matched = POPULAR_RECOMMENDED_DESTINATIONS.filter(
    (item) =>
      item.name.toLowerCase().includes(q) ||
      item.country.toLowerCase().includes(q) ||
      (item.admin1 && item.admin1.toLowerCase().includes(q))
  );

  if (matched.length > 0) return matched;

  // 검색 결과가 아예 없더라도 사용자가 직접 입력한 도시로 즉석 생성
  return [
    {
      id: `custom_${Date.now()}`,
      name: cleanQuery,
      country: '여행지',
      countryCode: '',
      flag: '✈️',
      latitude: 35.6762,
      longitude: 139.6503,
      defaultTitle: `${cleanQuery} 힐링 여행 ✈️`,
      coverImage: resolveDestinationCoverImage(cleanQuery),
    },
  ];
}
