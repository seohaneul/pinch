import { Linking, Platform } from 'react-native';

/**
 * Open place in Google Maps (App if installed, otherwise Web)
 */
export async function openInGoogleMaps(
  placeName: string,
  latitude?: number,
  longitude?: number
): Promise<void> {
  const query = latitude && longitude
    ? `${latitude},${longitude}`
    : encodeURIComponent(placeName);

  const webUrl = latitude && longitude
    ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}&query_place_id=${encodeURIComponent(placeName)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeName)}`;

  const appUrl = Platform.select({
    ios: `comgooglemaps://?q=${encodeURIComponent(placeName)}&center=${latitude || 0},${longitude || 0}`,
    android: `geo:${latitude || 0},${longitude || 0}?q=${encodeURIComponent(placeName)}`,
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
 * Open Turn-by-Turn Navigation / Route Directions in Google Maps
 */
export async function openGoogleMapsDirections(
  destLat: number,
  destLng: number,
  destName: string,
  startLat?: number,
  startLng?: number,
  mode: 'WALK' | 'TRANSIT' | 'DRIVE' = 'TRANSIT'
): Promise<void> {
  const travelMode = mode === 'WALK' ? 'walking' : mode === 'DRIVE' ? 'driving' : 'transit';

  let webUrl = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=${travelMode}`;
  if (startLat && startLng) {
    webUrl += `&origin=${startLat},${startLng}`;
  }

  const appUrl = Platform.select({
    ios: `comgooglemaps://?daddr=${destLat},${destLng}&directionsmode=${travelMode}${
      startLat && startLng ? `&saddr=${startLat},${startLng}` : ''
    }`,
    android: `google.navigation:q=${destLat},${destLng}&mode=${travelMode === 'walking' ? 'w' : travelMode === 'driving' ? 'd' : 'r'}`,
    default: webUrl,
  });

  try {
    if (appUrl && (await Linking.canOpenURL(appUrl))) {
      await Linking.openURL(appUrl);
    } else {
      await Linking.openURL(webUrl);
    }
  } catch (err) {
    await Linking.openURL(webUrl);
  }
}

/**
 * Open full day multi-stop route in Google Maps
 */
export async function openMultiStopRouteInGoogleMaps(
  stops: { latitude: number; longitude: number; place_name?: string }[]
): Promise<void> {
  if (stops.length < 2) {
    if (stops.length === 1) {
      await openInGoogleMaps(stops[0].place_name || '목적지', stops[0].latitude, stops[0].longitude);
    }
    return;
  }

  const origin = `${stops[0].latitude},${stops[0].longitude}`;
  const destination = `${stops[stops.length - 1].latitude},${stops[stops.length - 1].longitude}`;
  const waypoints = stops
    .slice(1, -1)
    .map((s) => `${s.latitude},${s.longitude}`)
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
