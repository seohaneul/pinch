import type { Place, ScheduleItem, PlaceCategory } from '../types';

export type TravelStyle = 'RELAX' | 'LANDMARK' | 'NATURE' | 'FOODIE' | 'SHOPPING';
export type TravelPace = 'RELAXED' | 'BALANCED' | 'INTENSIVE';

export interface StyleOption {
  key: TravelStyle;
  label: string;
  emoji: string;
  desc: string;
  accentColor: string;
  tag: string;
}

export const TRAVEL_STYLES: StyleOption[] = [
  {
    key: 'RELAX',
    label: '여유 & 힐링',
    emoji: '🌿',
    desc: '느긋한 늦잠, 브런치, 감성 카페, 가벼운 산책과 선셋 뷰',
    accentColor: '#10B981',
    tag: '힐링여행',
  },
  {
    key: 'LANDMARK',
    label: '핵심 랜드마크',
    emoji: '📸',
    desc: '그 도시 대표 1티어 명소와 인증샷 필수 포토스팟',
    accentColor: '#FF6B6B',
    tag: '필수명소',
  },
  {
    key: 'NATURE',
    label: '자연 & 풍경',
    emoji: '🌊',
    desc: '에메랄드 비치, 국립공원, 절경 전망대, 야외 드라이브',
    accentColor: '#0EA5E9',
    tag: '자연탐험',
  },
  {
    key: 'FOODIE',
    label: '미식 & 맛집 탐방',
    emoji: '🍴',
    desc: '현지 로컬 맛집, 백년 전통 가게, 야시장, 감성 베이커리',
    accentColor: '#F59E0B',
    tag: '먹방투어',
  },
  {
    key: 'SHOPPING',
    label: '쇼핑 & 트렌드',
    emoji: '🛍️',
    desc: '대형 프리미엄 아울렛, 플래그십 스토어, 편집숍 투어',
    accentColor: '#8B5CF6',
    tag: '쇼핑홀릭',
  },
];

export interface PaceOption {
  key: TravelPace;
  label: string;
  spotsPerDay: number;
  startTime: string;
  desc: string;
}

export const TRAVEL_PACES: PaceOption[] = [
  {
    key: 'RELAXED',
    label: '느긋하게 (하루 2~3곳)',
    spotsPerDay: 3,
    startTime: '11:00',
    desc: '오전엔 여유롭게 늦잠 자고 한 장소에서 오래 머무는 스타일',
  },
  {
    key: 'BALANCED',
    label: '알차게 (하루 3~4곳)',
    spotsPerDay: 4,
    startTime: '10:00',
    desc: '적당히 알차게 보고 여유도 챙기는 황금 밸런스 코스',
  },
  {
    key: 'INTENSIVE',
    label: '빡세게 (하루 5곳)',
    spotsPerDay: 5,
    startTime: '09:00',
    desc: '아침 일찍부터 부지런히 그 도시 핫플을 정복하는 스타일',
  },
];

interface DestinationSpotTemplate {
  name: string;
  address: string;
  category: PlaceCategory;
  latitude: number;
  longitude: number;
  rating: number;
  imageUrl: string;
  memo: string;
  stayMinutes: number;
  styles: TravelStyle[];
}

// 목적지별 큐레이션 데이터베이스
const DESTINATION_SPOTS: Record<string, DestinationSpotTemplate[]> = {
  // 1. 괌 (GUAM)
  guam: [
    {
      name: '투몬 비치 (Tumon Beach)',
      address: 'Pale San Vitores Rd, Tamuning, 96913, Guam',
      category: 'ATTRACTION',
      latitude: 13.5147,
      longitude: 144.8062,
      rating: 4.9,
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
      memo: '에메랄드빛 바다와 화이트 샌드 비치 산책 및 스노클링',
      stayMinutes: 90,
      styles: ['RELAX', 'NATURE', 'LANDMARK'],
    },
    {
      name: '사랑의 절벽 (Two Lovers Point)',
      address: 'GRM2+XX Tamuning, 96913, Guam',
      category: 'ATTRACTION',
      latitude: 13.5352,
      longitude: 144.8025,
      rating: 4.8,
      imageUrl: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800&auto=format&fit=crop',
      memo: '투몬만을 120m 높이에서 내려다보는 최고의 파노라마 전망대',
      stayMinutes: 60,
      styles: ['LANDMARK', 'NATURE', 'RELAX'],
    },
    {
      name: '피카스 카페 (Pika\'s Cafe)',
      address: '888 N Marine Corps Dr, Tamuning, 96913, Guam',
      category: 'RESTAURANT',
      latitude: 13.5042,
      longitude: 144.7951,
      rating: 4.8,
      imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop',
      memo: '현지인들이 극찬하는 차모로 로코모코와 베네딕트 브런치',
      stayMinutes: 60,
      styles: ['FOODIE', 'RELAX'],
    },
    {
      name: '두짓타니 타시 그릴 (Tasi Grill)',
      address: '1227 Pale San Vitores Rd, Tamuning, 96913, Guam',
      category: 'RESTAURANT',
      latitude: 13.5134,
      longitude: 144.8055,
      rating: 4.9,
      imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop',
      memo: '투몬 비치 바로 앞 오션프론트 럭셔리 선셋 디너 & 칵테일',
      stayMinutes: 90,
      styles: ['RELAX', 'FOODIE'],
    },
    {
      name: '괌 프리미어 아울렛 (GPO)',
      address: '199 Chalan San Antonio, Tamuning, 96913, Guam',
      category: 'SHOPPING',
      latitude: 13.4988,
      longitude: 144.7794,
      rating: 4.6,
      imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop',
      memo: '타미힐피거, 캘빈클라인, 로스(ROSS) 등 파격 할인 쇼핑',
      stayMinutes: 120,
      styles: ['SHOPPING', 'LANDMARK'],
    },
    {
      name: '이나라한 천연 해수 풀장 (Inarajan Natural Pool)',
      address: 'Route 4, Inarajan, 96915, Guam',
      category: 'ATTRACTION',
      latitude: 13.2758,
      longitude: 144.7503,
      rating: 4.8,
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
      memo: '화산암으로 둘러싸여 파도가 치지 않는 신비로운 천연 바다 수영장',
      stayMinutes: 75,
      styles: ['NATURE', 'RELAX'],
    },
    {
      name: '스페인 광장 & 아가냐 대성당',
      address: '207 Archbishop FC Flores St, Hagåtña, 96910, Guam',
      category: 'ATTRACTION',
      latitude: 13.4735,
      longitude: 144.7516,
      rating: 4.7,
      imageUrl: 'https://images.unsplash.com/photo-1548625361-195982859942?w=800&auto=format&fit=crop',
      memo: '스페인 통치 시대의 고풍스러운 유적과 GUAM 포토존',
      stayMinutes: 50,
      styles: ['LANDMARK', 'RELAX'],
    },
    {
      name: '차모로 야시장 (Chamorro Village Night Market)',
      address: '153 W Marine Corps Dr, Hagåtña, 96910, Guam',
      category: 'RESTAURANT',
      latitude: 13.4764,
      longitude: 144.7547,
      rating: 4.7,
      imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop',
      memo: '차모로 전통 숯불 바비큐 꼬치와 바나나 룸피아, 야시장 버스킹',
      stayMinutes: 75,
      styles: ['FOODIE', 'SHOPPING'],
    },
    {
      name: 'T갤러리아 DFS 럭셔리 면세점',
      address: '1296 Pale San Vitores Rd, Tamuning, 96913, Guam',
      category: 'SHOPPING',
      latitude: 13.5152,
      longitude: 144.8081,
      rating: 4.6,
      imageUrl: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800&auto=format&fit=crop',
      memo: '투몬 시내 중심 명품 브랜드 및 코스메틱 면세 쇼핑',
      stayMinutes: 90,
      styles: ['SHOPPING'],
    },
    {
      name: '세티만 전망대 (Cetti Bay Overlook)',
      address: 'Route 2, Umatac, 96915, Guam',
      category: 'ATTRACTION',
      latitude: 13.3155,
      longitude: 144.6542,
      rating: 4.8,
      imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop',
      memo: '남부 드라이브 코스의 백미, 푸른 세티만과 화산 구릉 파노라마',
      stayMinutes: 45,
      styles: ['NATURE', 'LANDMARK'],
    },
  ],

  // 2. 도쿄 (TOKYO)
  tokyo: [
    {
      name: '시부야 스카이 전망대 (SHIBUYA SKY)',
      address: '2 Chome-24-12 Shibuya, Shibuya City, Tokyo',
      category: 'ATTRACTION',
      latitude: 35.6598,
      longitude: 139.7028,
      rating: 4.9,
      imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop',
      memo: '도쿄 도심과 스크램블 교차로를 한눈에 내려다보는 루프탑',
      stayMinutes: 75,
      styles: ['LANDMARK', 'RELAX'],
    },
    {
      name: '푸글렌 도쿄 (Fuglen Tokyo)',
      address: '1 Chome-16-11 Tomigaya, Shibuya City, Tokyo',
      category: 'CAFE',
      latitude: 35.6664,
      longitude: 139.6917,
      rating: 4.8,
      imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop',
      memo: '노르웨이 감성의 로스팅 스페셜티 커피 & 감성 골목 산책',
      stayMinutes: 60,
      styles: ['RELAX', 'FOODIE'],
    },
    {
      name: '이치란 라멘 시부야점',
      address: '1 Chome-22-7 Jinnan, Shibuya City, Tokyo',
      category: 'RESTAURANT',
      latitude: 35.6622,
      longitude: 139.7011,
      rating: 4.7,
      imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop',
      memo: '비법 매운 소스를 곁들인 진한 돈코츠 라멘',
      stayMinutes: 50,
      styles: ['FOODIE', 'LANDMARK'],
    },
    {
      name: '도쿄 타워 (Tokyo Tower)',
      address: '4 Chome-2-8 Shibakoen, Minato City, Tokyo',
      category: 'ATTRACTION',
      latitude: 35.6586,
      longitude: 139.7454,
      rating: 4.9,
      imageUrl: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800&auto=format&fit=crop',
      memo: '붉은색의 상징적인 도쿄 랜드마크 & 시바공원 잔디밭 피크닉',
      stayMinutes: 60,
      styles: ['LANDMARK', 'RELAX'],
    },
    {
      name: '긴자 식스 (GINZA SIX)',
      address: '6 Chome-10-1 Ginza, Chuo City, Tokyo',
      category: 'SHOPPING',
      latitude: 35.6696,
      longitude: 139.7640,
      rating: 4.7,
      imageUrl: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800&auto=format&fit=crop',
      memo: '츠타야 서점과 루프탑 정원이 어우러진 최고급 쇼핑 콤플렉스',
      stayMinutes: 90,
      styles: ['SHOPPING', 'RELAX'],
    },
    {
      name: '메이지 신궁 & 요요기 공원',
      address: '1-1 Yoyogikamizonocho, Shibuya City, Tokyo',
      category: 'ATTRACTION',
      latitude: 35.6764,
      longitude: 139.6993,
      rating: 4.8,
      imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop',
      memo: '도심 속 거대한 삼나무 숲길 산책과 평화로운 힐링',
      stayMinutes: 75,
      styles: ['NATURE', 'RELAX'],
    },
    {
      name: '아사쿠사 센소지 (Senso-ji)',
      address: '2 Chome-3-1 Asakusa, Taito City, Tokyo',
      category: 'ATTRACTION',
      latitude: 35.7148,
      longitude: 139.7967,
      rating: 4.8,
      imageUrl: 'https://images.unsplash.com/photo-1508248467877-aec1b08de376?w=800&auto=format&fit=crop',
      memo: '도쿄에서 가장 오래된 고풍스러운 사원과 나카미세도리 길거리 간식',
      stayMinutes: 70,
      styles: ['LANDMARK', 'FOODIE'],
    },
    {
      name: '스타벅스 리저브 로스터리 도쿄',
      address: '2 Chome-19-23 Aobadai, Meguro City, Tokyo',
      category: 'CAFE',
      latitude: 35.6496,
      longitude: 139.6924,
      rating: 4.8,
      imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop',
      memo: '메구로 강변 4층 규모의 세계적 플래그십 커피 로스터리',
      stayMinutes: 60,
      styles: ['RELAX', 'FOODIE'],
    },
    {
      name: '시부야 파르코 (PARCO)',
      address: '15-1 Udagawacho, Shibuya City, Tokyo',
      category: 'SHOPPING',
      latitude: 35.6621,
      longitude: 139.6987,
      rating: 4.7,
      imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop',
      memo: '닌텐도 도쿄 공식 스토어 & 포켓몬 센터 & 트렌디 패션',
      stayMinutes: 90,
      styles: ['SHOPPING'],
    },
  ],

  // 3. 오사카 / 교토
  osaka: [
    {
      name: '도톤보리 글리코상 & 신사이바시',
      address: '1 Chome Dotonbori, Chuo Ward, Osaka',
      category: 'ATTRACTION',
      latitude: 34.6687,
      longitude: 135.5013,
      rating: 4.8,
      imageUrl: 'https://images.unsplash.com/photo-1590559899731-a3f376dd4558?w=800&auto=format&fit=crop',
      memo: '오사카의 심장! 글리코상 인증샷과 활기찬 번화가 거리',
      stayMinutes: 70,
      styles: ['LANDMARK', 'FOODIE', 'SHOPPING'],
    },
    {
      name: '교토 후시미 이나리 신사 (Fushimi Inari)',
      address: '68 Fukakusa Yabunouchicho, Fushimi Ward, Kyoto',
      category: 'ATTRACTION',
      latitude: 34.9671,
      longitude: 135.7727,
      rating: 4.9,
      imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop',
      memo: '끝없이 펼쳐지는 신비로운 붉은 천 개의 토리이 터널',
      stayMinutes: 90,
      styles: ['LANDMARK', 'NATURE', 'RELAX'],
    },
    {
      name: '교토 아라시야마 대나무숲 (Bamboo Forest)',
      address: 'Arashiyama, Ukyo Ward, Kyoto',
      category: 'ATTRACTION',
      latitude: 35.0169,
      longitude: 135.6713,
      rating: 4.8,
      imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop',
      memo: '피톤치드 가득한 치쿠린 숲길과 % 아라비카(응커피) 산책',
      stayMinutes: 80,
      styles: ['RELAX', 'NATURE'],
    },
    {
      name: '쿠시카츠 다루마 도톤보리점',
      address: '1 Chome-6-4 Dotonbori, Chuo Ward, Osaka',
      category: 'RESTAURANT',
      latitude: 34.6685,
      longitude: 135.5022,
      rating: 4.7,
      imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop',
      memo: '바삭한 튀김옷과 특제 소스의 오사카 명물 꼬치튀김',
      stayMinutes: 60,
      styles: ['FOODIE'],
    },
    {
      name: '오사카성 천수각',
      address: '1-1 Osakajo, Chuo Ward, Osaka',
      category: 'ATTRACTION',
      latitude: 34.6873,
      longitude: 135.5262,
      rating: 4.7,
      imageUrl: 'https://images.unsplash.com/photo-1590559899731-a3f376dd4558?w=800&auto=format&fit=crop',
      memo: '웅장한 해자와 금빛 누각이 어우러진 오사카 대표 역사 명소',
      stayMinutes: 75,
      styles: ['LANDMARK', 'NATURE'],
    },
    {
      name: '기요미즈데라 (청수사)',
      address: '1 Chome-294 Kiyomizu, Higashiyama Ward, Kyoto',
      category: 'ATTRACTION',
      latitude: 34.9949,
      longitude: 135.7850,
      rating: 4.9,
      imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop',
      memo: '교토 시내가 한눈에 내려다보이는 목조 본당과 니넨자카 골목',
      stayMinutes: 80,
      styles: ['LANDMARK', 'RELAX'],
    },
  ],

  // 4. 제주도 (JEJU)
  jeju: [
    {
      name: '협재 해수욕장 & 비양도 뷰',
      address: '제주특별자치도 제주시 한림읍 협재리 2497-1',
      category: 'ATTRACTION',
      latitude: 33.3938,
      longitude: 126.2396,
      rating: 4.9,
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
      memo: '투명한 은빛 모래와 에메랄드 바다, 비양도를 바라보는 힐링 비치',
      stayMinutes: 80,
      styles: ['RELAX', 'NATURE'],
    },
    {
      name: '성산일출봉',
      address: '제주특별자치도 서귀포시 성산읍 일출로 284-12',
      category: 'ATTRACTION',
      latitude: 33.4581,
      longitude: 126.9426,
      rating: 4.8,
      imageUrl: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800&auto=format&fit=crop',
      memo: '유네스코 세계자연유산의 웅장한 분화구와 시원한 동쪽 바다 절경',
      stayMinutes: 90,
      styles: ['LANDMARK', 'NATURE'],
    },
    {
      name: '애월 한담해변 산책로 & 노을 카페',
      address: '제주특별자치도 제주시 애월읍 애월로1길 24-9',
      category: 'CAFE',
      latitude: 33.4617,
      longitude: 126.3106,
      rating: 4.8,
      imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop',
      memo: '현무암 해안선을 따라 걷는 환상적인 일몰 산책로와 감성 카페',
      stayMinutes: 75,
      styles: ['RELAX', 'FOODIE'],
    },
    {
      name: '숙성도 노형본점 (제주 흑돼지)',
      address: '제주특별자치도 제주시 원노형로 41',
      category: 'RESTAURANT',
      latitude: 33.4851,
      longitude: 126.4828,
      rating: 4.9,
      imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop',
      memo: '교차 숙성으로 육즙이 살아있는 제주 최고 인기 흑돼지 구이',
      stayMinutes: 70,
      styles: ['FOODIE'],
    },
    {
      name: '사려니숲길 (붉은오름 입구)',
      address: '제주특별자치도 서귀포시 표선면 가시리 산 158-4',
      category: 'ATTRACTION',
      latitude: 33.4077,
      longitude: 126.6874,
      rating: 4.8,
      imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop',
      memo: '삼나무가 곧게 뻗은 피톤치드 숲길 걷기 명소',
      stayMinutes: 70,
      styles: ['NATURE', 'RELAX'],
    },
  ],

  // 5. 다낭 (DANANG)
  danang: [
    {
      name: '바나힐 골든브릿지 (Ba Na Hills)',
      address: 'Thon An Son, Hoa Vang, Da Nang, Vietnam',
      category: 'ATTRACTION',
      latitude: 15.9996,
      longitude: 107.9877,
      rating: 4.9,
      imageUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&auto=format&fit=crop',
      memo: '거대한 신의 손이 받치고 있는 해발 1400m 랜드마크 다리',
      stayMinutes: 120,
      styles: ['LANDMARK', 'NATURE'],
    },
    {
      name: '미케 비치 & 비치클럽 (My Khe Beach)',
      address: 'Vo Nguyen Giap, Da Nang, Vietnam',
      category: 'ATTRACTION',
      latitude: 16.0594,
      longitude: 108.2464,
      rating: 4.8,
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
      memo: '포브스 선정 세계 6대 해변, 백사장 썬베드와 야자수 그늘 휴식',
      stayMinutes: 90,
      styles: ['RELAX', 'NATURE'],
    },
    {
      name: '호이안 올드타운 투본강 소원배',
      address: 'Old Town, Hoi An, Quang Nam, Vietnam',
      category: 'ATTRACTION',
      latitude: 15.8778,
      longitude: 108.3275,
      rating: 4.9,
      imageUrl: 'https://images.unsplash.com/photo-1508248467877-aec1b08de376?w=800&auto=format&fit=crop',
      memo: '형형색색의 등불 야경과 소원초 띄우기 전통 배 체험',
      stayMinutes: 90,
      styles: ['LANDMARK', 'RELAX', 'FOODIE'],
    },
    {
      name: '콩카페 1호점 (Cong Caphe)',
      address: '98-96 Bach Dang, Hai Chau 1, Da Nang, Vietnam',
      category: 'CAFE',
      latitude: 16.0688,
      longitude: 108.2238,
      rating: 4.8,
      imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop',
      memo: '한강 뷰를 바라보며 마시는 시원 달콤한 코코넛 스무디 커피',
      stayMinutes: 60,
      styles: ['FOODIE', 'RELAX'],
    },
  ],
};

/**
 * 목적지 키워드 매칭 함수
 */
function resolveDestinationKey(query: string): string {
  const q = query.toLowerCase();
  if (q.includes('괌') || q.includes('guam')) return 'guam';
  if (q.includes('도쿄') || q.includes('tokyo') || q.includes('시부야') || q.includes('신주쿠')) return 'tokyo';
  if (q.includes('오사카') || q.includes('교토') || q.includes('간사이') || q.includes('osaka') || q.includes('kyoto')) return 'osaka';
  if (q.includes('제주') || q.includes('jeju')) return 'jeju';
  if (q.includes('다낭') || q.includes('호이안') || q.includes('danang')) return 'danang';
  return 'guam'; // Default fallback
}

/**
 * P형 맞춤 추천 일정 생성 엔진
 */
export function generatePStyleItinerary(params: {
  tripId: string;
  destination: string;
  dayCount?: number;
  totalDays?: number;
  style: TravelStyle;
  pace: TravelPace;
}): {
  scheduleItems: ScheduleItem[];
  pocketPlaces: Place[];
  dayStartTimes: Record<number, string>;
  themeTitles: Record<number, string>;
} {
  const { tripId, destination, style, pace } = params;
  const dayCount = params.dayCount || params.totalDays || 3;
  const destKey = resolveDestinationKey(destination);
  const allSpots = DESTINATION_SPOTS[destKey] || DESTINATION_SPOTS.guam;

  // 선택된 스타일에 맞는 스팟 필터링 (부족하면 다른 스타일 스팟도 포함)
  let matchingSpots = allSpots.filter((s) => s.styles.includes(style));
  if (matchingSpots.length < 4) {
    const remaining = allSpots.filter((s) => !matchingSpots.includes(s));
    matchingSpots = [...matchingSpots, ...remaining];
  }

  const paceOption = TRAVEL_PACES.find((p) => p.key === pace) || TRAVEL_PACES[1];
  const spotsPerDay = paceOption.spotsPerDay;

  const generatedItems: ScheduleItem[] = [];
  const pocketPlaces: Place[] = [];
  const dayStartTimes: Record<number, string> = {};
  const themeTitles: Record<number, string> = {};

  const styleObj = TRAVEL_STYLES.find((s) => s.key === style) || TRAVEL_STYLES[0];

  let spotCursor = 0;

  for (let day = 1; day <= dayCount; day++) {
    dayStartTimes[day] = paceOption.startTime;
    themeTitles[day] = `DAY ${day}: ${destination} ${styleObj.label} 추천 코스 ${styleObj.emoji}`;

    const [startH, startM] = paceOption.startTime.split(':').map((v) => parseInt(v, 10));
    let currentMin = (isNaN(startH) ? 10 : startH) * 60 + (isNaN(startM) ? 0 : startM);

    for (let order = 1; order <= spotsPerDay; order++) {
      const template = matchingSpots[spotCursor % matchingSpots.length];
      spotCursor++;

      const placeId = `p_auto_${destKey}_d${day}_${order}_${Date.now()}`;
      const scheduleId = `sched_auto_${tripId}_d${day}_${order}`;

      const h = Math.floor(currentMin / 60);
      const m = currentMin % 60;
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
      const arrivalTimeStr = `${displayH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;

      const scheduleItem: ScheduleItem = {
        id: scheduleId,
        trip_id: tripId,
        place_id: placeId,
        place_name: template.name,
        category: template.category,
        latitude: template.latitude,
        longitude: template.longitude,
        day_number: day,
        order_index: order,
        stay_duration_minutes: template.stayMinutes,
        transport_mode: order === 1 ? 'TRANSIT' : 'DRIVE',
        travel_duration_minutes: order === 1 ? 0 : 20,
        arrival_time: arrivalTimeStr,
        address: template.address,
        imageUrl: template.imageUrl,
        memo: `${styleObj.emoji} [P형 추천] ${template.memo}`,
      };

      generatedItems.push(scheduleItem);

      // Pocket Place
      const pocketPlace: Place = {
        id: placeId,
        trip_id: tripId,
        name: template.name,
        address: template.address,
        category: template.category,
        latitude: template.latitude,
        longitude: template.longitude,
        memo: template.memo,
        imageUrl: template.imageUrl,
        rating: template.rating,
        isPinned: true,
        createdAt: new Date().toISOString(),
        tags: [styleObj.tag, 'P추천코스'],
        sourcePlatform: 'manual',
      };

      pocketPlaces.push(pocketPlace);

      // 다음 스팟 시간 누적 (체류 시간 + 이동 시간 약 20분)
      currentMin += template.stayMinutes + 20;
    }
  }

  return {
    scheduleItems: generatedItems,
    pocketPlaces,
    dayStartTimes,
    themeTitles,
  };
}
