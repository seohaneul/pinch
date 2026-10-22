import { Linking, Platform } from 'react-native';

/**
 * Open single place in Google Maps (App if installed, otherwise Web)
 * 장소 이름(과 주소)을 우선 검색어로 사용하여 좌표 오차 없이 구글맵 공식 장소 핀(영업시간, 입구 등)을 엽니다.
 */
export async function openInGoogleMaps(
  placeName: string,
  latitude?: number,
  longitude?: number,
  address?: string
): Promise<void> {
  const cleanName = placeName ? placeName.trim() : '';
  const cleanAddress = address ? address.trim() : '';

  // 장소 이름과 주소를 결합하여 가장 정확한 구글맵 POI 검색 쿼리 구성
  let searchQuery = cleanName;
  if (cleanAddress && !cleanName.includes(cleanAddress)) {
    searchQuery = `${cleanName} ${cleanAddress}`;
  }

  // 장소 이름이 아예 없을 때만 위도/경도 좌표 fallback
  if (!searchQuery && latitude !== undefined && longitude !== undefined && latitude !== 0 && longitude !== 0) {
    searchQuery = `${latitude},${longitude}`;
  }

  if (!searchQuery) return;

  const encodedQuery = encodeURIComponent(searchQuery);
  const webUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;

  const appUrl = Platform.select({
    ios: `comgooglemaps://?q=${encodedQuery}`,
    android: `geo:0,0?q=${encodedQuery}`,
    default: webUrl,
  });

  try {
    if (appUrl && (await Linking.canOpenURL(appUrl))) {
      await Linking.openURL(appUrl);
    } else {
      await Linking.openURL(webUrl);
    }
  } catch (error) {
    await Linking.openURL(webUrl);
  }
}

/**
 * Open Route Directions between two specific stops in Google Maps
 * 좌표 대신 출발지 및 목적지의 "장소 이름"을 구글맵에 직접 넘겨주어
 * 건물 입구, 지하철역 출입구, 대중교통 정류장 기준으로 가장 정확한 실시간 길찾기 시간과 경로를 안내합니다.
 */
export async function openGoogleMapsDirections(
  destLat: number,
  destLng: number,
  destName: string,
  startLat?: number,
  startLng?: number,
  startName?: string,
  mode: 'WALK' | 'TRANSIT' | 'DRIVE' = 'TRANSIT',
  destAddress?: string,
  startAddress?: string
): Promise<void> {
  const travelMode = mode === 'WALK' ? 'walking' : mode === 'DRIVE' ? 'driving' : 'transit';

  // 목적지 쿼리: 장소명 우선 (필요시 주소 보조), 없을 때 좌표
  const cleanDestName = destName?.trim() || '';
  const cleanDestAddr = destAddress?.trim() || '';
  let destQuery = cleanDestName;
  if (cleanDestAddr && !cleanDestName.includes(cleanDestAddr)) {
    destQuery = `${cleanDestName} ${cleanDestAddr}`;
  }
  if (!destQuery && destLat && destLng) {
    destQuery = `${destLat},${destLng}`;
  }

  // 출발지 쿼리: 장소명 우선 (필요시 주소 보조), 없을 때 좌표
  const cleanStartName = startName?.trim() || '';
  const cleanStartAddr = startAddress?.trim() || '';
  let originQuery = cleanStartName;
  if (cleanStartAddr && !cleanStartName.includes(cleanStartAddr)) {
    originQuery = `${cleanStartName} ${cleanStartAddr}`;
  }
  if (!originQuery && startLat && startLng) {
    originQuery = `${startLat},${startLng}`;
  }

  const encodedDest = encodeURIComponent(destQuery);
  const encodedOrigin = encodeURIComponent(originQuery);

  // Official Google Maps Directions API URL
  let directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedDest}&travelmode=${travelMode}`;
  if (originQuery) {
    directionsUrl += `&origin=${encodedOrigin}`;
  }

  // iOS Google Maps App Custom Scheme
  const iosAppUrl = originQuery
    ? `comgooglemaps://?saddr=${encodedOrigin}&daddr=${encodedDest}&directionsmode=${travelMode}`
    : `comgooglemaps://?daddr=${encodedDest}&directionsmode=${travelMode}`;

  if (Platform.OS === 'ios') {
    try {
      if (await Linking.canOpenURL(iosAppUrl)) {
        await Linking.openURL(iosAppUrl);
        return;
      }
    } catch (e) {
      // Fall through to universal directionsUrl
    }
  }

  // Universal directionsUrl opens Google Maps app directly on Android / web on browser
  try {
    await Linking.openURL(directionsUrl);
  } catch (err) {
    console.warn('Failed to open Google Maps directions:', err);
  }
}

/**
 * Open full day multi-stop route in Google Maps
 * 하루 전체 일정의 경유지들을 장소 이름으로 구글맵에 넘겨 도로가 아닌 실제 장소들로 동선을 연결합니다.
 */
export async function openMultiStopRouteInGoogleMaps(
  stops: { latitude: number; longitude: number; place_name?: string; address?: string }[]
): Promise<void> {
  if (stops.length < 2) {
    if (stops.length === 1) {
      await openInGoogleMaps(stops[0].place_name || '목적지', stops[0].latitude, stops[0].longitude, stops[0].address);
    }
    return;
  }

  const formatStopQuery = (s: { latitude: number; longitude: number; place_name?: string; address?: string }) => {
    const name = s.place_name?.trim();
    if (name) {
      return encodeURIComponent(s.address && !name.includes(s.address) ? `${name} ${s.address}` : name);
    }
    return `${s.latitude},${s.longitude}`;
  };

  const origin = formatStopQuery(stops[0]);
  const destination = formatStopQuery(stops[stops.length - 1]);
  const waypoints = stops
    .slice(1, -1)
    .map(formatStopQuery)
    .join('|');

  let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=transit`;
  if (waypoints) {
    url += `&waypoints=${waypoints}`;
  }

  try {
    await Linking.openURL(url);
  } catch (err) {
    console.warn('Failed to open Google Maps route:', err);
  }
}
