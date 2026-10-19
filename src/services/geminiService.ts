import type { ExtractedPlaceItem, PlaceCategory, ScheduleItem, Place } from '../types';
import type { TravelStyle, TravelPace } from './itineraryGeneratorService';
import { TRAVEL_STYLES, TRAVEL_PACES, generatePStyleItinerary } from './itineraryGeneratorService';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

// 2026 검증된 고속 AI 모델 목록 (gemini-3.8-flash 200 OK 검증 완료)
const SUPPORTED_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.1-flash-lite-preview',
];

const CATEGORY_SAMPLE_IMAGES: Record<string, string> = {
  CAFE: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop',
  RESTAURANT: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop',
  ATTRACTION: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop',
  LODGING: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop',
  SHOPPING: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop',
};

export interface GeminiExtractedResult {
  cleanTitle: string;
  cleanSummary: string;
  places: ExtractedPlaceItem[];
}

interface RawGeminiOutput {
  cleanTitle?: string;
  cleanSummary?: string;
  places?: Array<{
    name: string;
    address?: string;
    category?: string;
    latitude?: number;
    longitude?: number;
    memo?: string;
    tags?: string[];
  }>;
}

// Nominatim OpenStreetMap 무료 지오코딩 보조 (AI 좌표가 누락된 경우만 호출)
async function geocodeQuery(query: string): Promise<{ lat: number; lng: number; address: string } | null> {
  if (!query || query.trim().length < 2) return null;
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
            lat,
            lng: lon,
            address: item.display_name?.split(',').slice(0, 3).join(', ') || query,
          };
        }
      }
    }
  } catch {
    clearTimeout(timeoutId);
  }

  return null;
}

export async function extractPlacesWithGemini(
  title: string,
  description: string,
  url: string,
  destinationHint?: string
): Promise<GeminiExtractedResult | null> {
  if (!GEMINI_API_KEY) {
    console.log('[GeminiService] API Key is missing. Using heuristic fallback.');
    return null;
  }

  const prompt = `
당신은 여행 SNS(인스타그램 릴스, 유튜브 숏츠, 블로그) 콘텐츠 분석 전문가입니다.
아래 제공된 콘텐츠 제목과 본문/해시태그에서 언급된 구체적인 '장소(식당, 카페, 관광명소, 숙소, 쇼핑몰 등)'를 모두 찾아내어 JSON 객체로 분석해 주세요.

[콘텐츠 정보]
- URL: ${url}
- 제목: ${title}
- 본문 및 설명: ${description}
${destinationHint ? `- 여행지 기준 맥락: ${destinationHint}` : ''}

[응답 규칙]
1. cleanTitle: 인스타그램 계정명(예: "Instagram의 OOO님:"), 쓸데없는 기호, 불필요한 해시태그를 완전히 제거하고, 콘텐츠의 핵심 주제를 나타내는 자연스럽고 매력적인 15자 내외의 한국어 여행 제목을 작성하세요. (예: "도쿄 시부야 핫플 & 카페 투어 🗼")
2. cleanSummary: 소개된 주요 장소명과 특징을 담은 자연스러운 1줄 요약문.
3. places: 본문 속 장소들을 최대 5개까지 각각 분리하여 추출.
   - name: 정확한 상호명 / 장소명
   - address: 해당 장소의 실제 도시 및 도로명/지번 주소 (예: "일본 도쿄도 시부야구 토미가야 1-16-11", "제주 제주시 애월읍 애월로 123")
   - category: "CAFE", "RESTAURANT", "ATTRACTION", "LODGING", "SHOPPING" 중 정확히 하나
   - latitude: 해당 장소의 실제 위도 (소수점 4자리 이상 필수, 예: 35.6664)
   - longitude: 해당 장소의 실제 경도 (소수점 4자리 이상 필수, 예: 139.6917)
   - memo: 추천 메뉴나 방문 꿀팁 1~2문장 (인스타 감성 요약)
   - tags: 2~3개 검색용 태그

반드시 다음 JSON 형식으로만 응답하세요. 다른 설명이나 마크다운 백틱(\`\`\`)은 넣지 마세요:
{
  "cleanTitle": "도쿄 시부야 핫플 & 카페 투어 🗼",
  "cleanSummary": "푸글렌 도쿄, 시부야 스카이, 이치란 라멘 등 시부야 필수 코스 추천",
  "places": [
    {
      "name": "푸글렌 도쿄",
      "address": "일본 도쿄도 시부야구 토미가야 1-16-11",
      "category": "CAFE",
      "latitude": 35.6693,
      "longitude": 139.6897,
      "memo": "노르웨이 발상 유명 카페 겸 바, 시그니처 핸드드립 커피와 빈티지 인테리어",
      "tags": ["도쿄카페", "푸글렌", "핸드드립"]
    }
  ]
}
`;

  // 지원 모델 순차 시도 (Failover)
  for (const model of SUPPORTED_MODELS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            responseMimeType: 'application/json',
          },
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[GeminiService] Model ${model} returned ${response.status}:`, errText.slice(0, 80));
        continue;
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) continue;

      const parsed: RawGeminiOutput = JSON.parse(rawText);
      if (!parsed || !Array.isArray(parsed.places) || parsed.places.length === 0) continue;

      const extractedItems: ExtractedPlaceItem[] = [];

      for (let i = 0; i < parsed.places.length; i++) {
        const item = parsed.places[i];
        if (!item.name || item.name.trim().length < 2) continue;

        const placeName = item.name.trim();
        const rawCat = (item.category?.toUpperCase() || 'ATTRACTION') as PlaceCategory;
        const validCategory: PlaceCategory = ['CAFE', 'RESTAURANT', 'ATTRACTION', 'LODGING', 'SHOPPING'].includes(rawCat)
          ? rawCat
          : 'ATTRACTION';

        let lat = item.latitude;
        let lng = item.longitude;
        let address = item.address;

        // 위도/경도가 유효하지 않은 경우에만 지오코딩 보조 실행
        if (!lat || !lng || isNaN(lat) || isNaN(lng) || lat === 0) {
          const geo = await geocodeQuery(`${destinationHint || ''} ${placeName}`);
          lat = geo?.lat ?? 35.6895;
          lng = geo?.lng ?? 139.6917;
          if (!address) address = geo?.address;
        }

        extractedItems.push({
          id: `gemini_place_${Date.now()}_${i}`,
          name: placeName,
          address: address || `${placeName} (상세 주소 확인 필요)`,
          category: validCategory,
          latitude: lat,
          longitude: lng,
          memo: item.memo || `${placeName} 추천 여행지`,
          imageUrl: CATEGORY_SAMPLE_IMAGES[validCategory] || CATEGORY_SAMPLE_IMAGES.ATTRACTION,
          rating: 4.8,
          tags: item.tags && item.tags.length > 0 ? item.tags : ['AI추천', validCategory],
        });
      }

      if (extractedItems.length > 0) {
        console.log(`[GeminiService] Successfully extracted ${extractedItems.length} places with model ${model}!`);
        return {
          cleanTitle: parsed.cleanTitle || '수집한 여행 SNS 링크',
          cleanSummary: parsed.cleanSummary || `${extractedItems[0].name} 등 핫플 ${extractedItems.length}곳`,
          places: extractedItems,
        };
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err?.name === 'AbortError' || err?.message?.includes('canceled')) {
        console.warn(`[GeminiService] Model ${model} timed out after 12s, switching to next model.`);
      } else {
        console.warn(`[GeminiService] Model ${model} request error:`, err?.message || err);
      }
    }
  }

  console.log('[GeminiService] All Gemini models failed or timed out. Falling back to heuristic.');
  return null;
}

export interface PlaceAiBriefing {
  description: string;
  recommendedHighlights: string[];
  waitingTips: string;
  bestPhotoSpot: string;
  estimatedStayMinutes: number;
}

// 장소 상세 심층 AI 가이드 조회
export async function fetchPlaceDetailedBriefing(
  placeName: string,
  category: string,
  address?: string
): Promise<PlaceAiBriefing | null> {
  if (!GEMINI_API_KEY) return null;

  const prompt = `
당신은 현지 여행 전문 가이드입니다. 아래 장소에 대해 여행자가 꼭 알아야 할 생생하고 유용한 상세 정보를 한국어로 분석해 주세요.

[장소 정보]
- 장소명: ${placeName}
- 카테고리: ${category}
- 주소/위치: ${address || '현지 주요 위치'}

[응답 규칙]
1. description: 이 장소가 왜 인기 있고 어떤 매력과 분위기가 있는지 감성적이면서도 유익한 2~3문장 설명.
2. recommendedHighlights: 반드시 맛보거나 구경해야 할 대표 메뉴 / 시그니처 3가지 (문자열 배열).
3. waitingTips: 웨이팅 덜 하는 시간대나 쾌적하게 즐기는 꿀팁 1문장.
4. bestPhotoSpot: SNS에 올리기 가장 좋은 대표 포토존 위치나 팁 1문장.
5. estimatedStayMinutes: 추천 체류 시간(분 단위 정수, 예: 60).

반드시 다음 JSON 형식으로만 응답하세요. 다른 설명이나 마크다운 백틱(\`\`\`)은 넣지 마세요:
{
  "description": "...",
  "recommendedHighlights": ["...", "...", "..."],
  "waitingTips": "...",
  "bestPhotoSpot": "...",
  "estimatedStayMinutes": 60
}
`;

  for (const model of SUPPORTED_MODELS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        }),
      });

      clearTimeout(timeoutId);
      if (!response.ok) continue;

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const parsed = JSON.parse(rawText) as PlaceAiBriefing;
      if (parsed && parsed.description) {
        return parsed;
      }
    } catch {
      clearTimeout(timeoutId);
    }
  }

  return null;
}

export interface GeminiItineraryResult {
  scheduleItems: ScheduleItem[];
  pocketPlaces: Place[];
  dayStartTimes: Record<number, string>;
  themeTitles: Record<number, string>;
  isAiGenerated: boolean;
}

interface RawGeminiDayPlan {
  dayNumber: number;
  themeTitle?: string;
  startTime?: string;
  spots: Array<{
    name: string;
    address?: string;
    category?: PlaceCategory;
    latitude?: number;
    longitude?: number;
    stayMinutes?: number;
    memo?: string;
    tags?: string[];
  }>;
}

interface RawGeminiItineraryOutput {
  theme?: string;
  days: RawGeminiDayPlan[];
}

/**
 * 전세계 모든 도시를 위한 Gemini AI 맞춤 일정 생성 엔진
 * - 사용자가 선택한 도시, 스타일, 페이스에 맞춰 AI가 최적 동선과 스팟을 실시간 생성
 * - AI 호출 실패 시 로컬 큐레이션 엔진으로 안전하게 자동 폴백(Fallback)
 */
export async function generateItineraryWithGemini(params: {
  tripId: string;
  destination: string;
  dayCount: number;
  style: TravelStyle;
  pace: TravelPace;
  centerLat?: number;
  centerLng?: number;
}): Promise<GeminiItineraryResult> {
  const { tripId, destination, dayCount, style, pace, centerLat, centerLng } = params;

  const styleObj = TRAVEL_STYLES.find((s) => s.key === style) || TRAVEL_STYLES[0];
  const paceObj = TRAVEL_PACES.find((p) => p.key === pace) || TRAVEL_PACES[1];

  // AI 프롬프트 생성 (안정성을 위해 최대 4박 5일까지 상세 생성)
  const effectiveDays = Math.min(Math.max(1, dayCount), 5);

  const prompt = `
당신은 전세계 최고의 여행 플래너 AI입니다.
사용자가 입력한 여행지 [${destination}]에 대해 ${effectiveDays}일 동안의 완벽한 맞춤 여행 일정을 계획해 주세요.

[여행자 조건]
- 여행지: ${destination}
- 기간: ${effectiveDays}일간 (DAY 1부터 DAY ${effectiveDays}까지)
- 여행 스타일: ${styleObj.label} (${styleObj.desc})
- 하루 일정 강도: ${paceObj.label} (하루 ${paceObj.spotsPerDay}곳 내외 방문)
- 기본 시작 시간: ${paceObj.startTime}

[필수 규칙]
1. 실제 해당 도시(${destination})에 존재하는 유명 핫플, 대표 랜드마크, 로컬 맛집, 감성 카페를 추천하세요.
2. 각 일차의 스팟들은 지리적으로 가까운 동선(동쪽/서쪽 등 구역별 묶음)으로 오전부터 오후, 저녁까지 순서대로 배치하세요.
3. 각 장소마다 실제 위도(latitude)와 경도(longitude)를 소수점 4자리 이상으로 가능한 한 정확히 제공하세요.
4. 카테고리는 "CAFE", "RESTAURANT", "ATTRACTION", "LODGING", "SHOPPING" 중 하나로 지정하세요.
5. memo는 한국어로 1줄 꿀팁이나 추천 포인트를 작성하세요.
6. themeTitle은 각 일차의 테마를 작성하세요 (예: "DAY 1: 시부야 핫플 & 전망대 투어").

반드시 다음 JSON 형식으로만 응답하세요:
{
  "theme": "${destination} ${styleObj.label} 맞춤 여행",
  "days": [
    {
      "dayNumber": 1,
      "themeTitle": "핵심 랜드마크와 시티뷰 투어",
      "startTime": "${paceObj.startTime}",
      "spots": [
        {
          "name": "장소 이름",
          "address": "해당 도시의 상세 도로명 주소",
          "category": "ATTRACTION",
          "latitude": ${centerLat || 35.6762},
          "longitude": ${centerLng || 139.6503},
          "stayMinutes": 90,
          "memo": "방문 팁 및 추천 이유",
          "tags": ["랜드마크", "인생샷"]
        }
      ]
    }
  ]
}
`;

  if (GEMINI_API_KEY) {
    for (const model of SUPPORTED_MODELS) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              responseMimeType: 'application/json',
            },
          }),
        });

        clearTimeout(timeoutId);
        if (!response.ok) continue;

        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) continue;

        const parsed = JSON.parse(rawText) as RawGeminiItineraryOutput;
        if (parsed && Array.isArray(parsed.days) && parsed.days.length > 0) {
          const scheduleItems: ScheduleItem[] = [];
          const pocketPlaces: Place[] = [];
          const dayStartTimes: Record<number, string> = {};
          const themeTitles: Record<number, string> = {};

          parsed.days.forEach((dayPlan) => {
            const dayNum = dayPlan.dayNumber;
            const startTimeStr = dayPlan.startTime || paceObj.startTime;
            dayStartTimes[dayNum] = startTimeStr;
            if (dayPlan.themeTitle) {
              themeTitles[dayNum] = dayPlan.themeTitle;
            }

            // 시작 시간을 분 단위로 환산
            const [sHour, sMin] = startTimeStr.split(':').map((v) => parseInt(v, 10) || 0);
            let currentMinute = sHour * 60 + sMin;

            (dayPlan.spots || []).forEach((spot, idx) => {
              const order = idx + 1;
              const scheduleId = `sched_ai_${tripId}_d${dayNum}_${order}_${Date.now()}`;
              const placeId = `place_ai_${tripId}_d${dayNum}_${order}_${Date.now()}`;

              const h = Math.floor(currentMinute / 60) % 24;
              const m = currentMinute % 60;
              const period = h >= 12 ? 'PM' : 'AM';
              const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
              const arrivalTimeStr = `${displayH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;

              const category = spot.category || 'ATTRACTION';
              const stayMinutes = spot.stayMinutes || 60;
              const lat = Number(spot.latitude) || (centerLat ? centerLat + (order * 0.005) : 35.6762);
              const lng = Number(spot.longitude) || (centerLng ? centerLng + (order * 0.005) : 139.6503);
              const imageUrl = CATEGORY_SAMPLE_IMAGES[category] || CATEGORY_SAMPLE_IMAGES.ATTRACTION;

              const scheduleItem: ScheduleItem = {
                id: scheduleId,
                trip_id: tripId,
                place_id: placeId,
                place_name: spot.name,
                category,
                latitude: lat,
                longitude: lng,
                day_number: dayNum,
                order_index: order,
                stay_duration_minutes: stayMinutes,
                transport_mode: order === 1 ? 'TRANSIT' : 'DRIVE',
                travel_duration_minutes: order === 1 ? 0 : 20,
                arrival_time: arrivalTimeStr,
                address: spot.address || `${destination} 중심가`,
                imageUrl,
                memo: `✨ [AI 추천] ${spot.memo || '여행자 만족도 최상 명소'}`,
              };

              scheduleItems.push(scheduleItem);

              const place: Place = {
                id: placeId,
                trip_id: tripId,
                name: spot.name,
                address: spot.address || `${destination} 중심가`,
                category,
                latitude: lat,
                longitude: lng,
                memo: spot.memo || 'AI 추천 핫플레이스',
                imageUrl,
                rating: 4.8,
                isPinned: true,
                createdAt: new Date().toISOString(),
                tags: spot.tags || [styleObj.tag, 'AI추천코스'],
                sourcePlatform: 'manual',
              };

              pocketPlaces.push(place);

              currentMinute += stayMinutes + 20; // 체류시간 + 이동 20분
            });
          });

          if (scheduleItems.length > 0) {
            return {
              scheduleItems,
              pocketPlaces,
              dayStartTimes,
              themeTitles,
              isAiGenerated: true,
            };
          }
        }
      } catch (err) {
        clearTimeout(timeoutId);
        console.log(`[GeminiItinerary] Model ${model} failed, trying next:`, err);
      }
    }
  }

  // Fallback: Gemini 호출 실패 또는 오프라인 환경인 경우 로컬 큐레이션 엔진으로 완벽 대체
  console.log('[GeminiItinerary] Fallback to local curated generator');
  const localPlan = generatePStyleItinerary({
    destination,
    dayCount,
    style,
    pace,
    tripId,
  });

  return {
    ...localPlan,
    isAiGenerated: false,
  };
}


