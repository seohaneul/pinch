import { Linking, Platform } from 'react-native';

/**
 * Open single place in Google Maps (App if installed, otherwise Web)
 */
export async function openInGoogleMaps(
  placeName: string,
  latitude?: number,
  longitude?: number
): Promise<void> {
  const hasCoords = latitude !== undefined && longitude !== undefined && latitude !== 0 && longitude !== 0;

  // Universal Google Maps search URL
  const query = hasCoords
    ? `${latitude},${longitude}`
    : encodeURIComponent(placeName);

  const webUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${query}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeName)}`;

  const appUrl = Platform.select({
    ios: hasCoords
      ? `comgooglemaps://?q=${encodeURIComponent(placeName)}&center=${latitude},${longitude}&zoom=16`
      : `comgooglemaps://?q=${encodeURIComponent(placeName)}`,
    android: hasCoords
      ? `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(placeName)})`
      : `geo:0,0?q=${encodeURIComponent(placeName)}`,
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
 * Explicitly pins both origin and destination so Google Maps NEVER defaults to "My Location".
 */
export async function openGoogleMapsDirections(
  destLat: number,
  destLng: number,
  destName: string,
  startLat?: number,
  startLng?: number,
  startName?: string,
  mode: 'WALK' | 'TRANSIT' | 'DRIVE' = 'TRANSIT'
): Promise<void> {
  const travelMode = mode === 'WALK' ? 'walking' : mode === 'DRIVE' ? 'driving' : 'transit';

  // Construct destination query
  const destQuery = `${destLat},${destLng}`;

  // Construct origin query (if start coordinates exist, use them so Google Maps won't use current GPS)
  let originQuery = '';
  if (startLat !== undefined && startLng !== undefined && startLat !== 0 && startLng !== 0) {
    originQuery = `${startLat},${startLng}`;
  }

  // Official Google Maps Directions API URL
  // Supported natively by both Google Maps App (Android/iOS) and Web
  let directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destQuery}&travelmode=${travelMode}`;
  if (originQuery) {
    directionsUrl += `&origin=${originQuery}`;
  }

  // iOS Google Maps App Custom Scheme
  const iosAppUrl = originQuery
    ? `comgooglemaps://?saddr=${originQuery}&daddr=${destQuery}&directionsmode=${travelMode}`
    : `comgooglemaps://?daddr=${destQuery}&directionsmode=${travelMode}`;

  // On iOS, check if Google Maps app is installed, otherwise use universal directionsUrl
  if (Platform.OS === 'ios') {
    try {
      if (await Linking.canOpenURL(iosAppUrl)) {
        await Linking.openURL(iosAppUrl);
        return;
      }
    } catch (e) {
      // Fall through to directionsUrl
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
