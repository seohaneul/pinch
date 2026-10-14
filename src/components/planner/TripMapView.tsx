import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Image, TouchableOpacity } from 'react-native';
import type { ScheduleItem } from '../../types';
import { MapPin, Navigation, Sparkles, ExternalLink } from 'lucide-react-native';
import { openInGoogleMaps, openMultiStopRouteInGoogleMaps } from '../../utils/mapUtils';

// Safely attempt react-native-maps import for native mobile, fallback gracefully
let NativeMapView: any = null;
let NativeMarker: any = null;
let NativePolyline: any = null;
let NativeCallout: any = null;
let PROVIDER_GOOGLE: any = null;

try {
  const Maps = require('react-native-maps');
  NativeMapView = Maps.default || Maps.MapView;
  NativeMarker = Maps.Marker;
  NativePolyline = Maps.Polyline;
  NativeCallout = Maps.Callout;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
} catch (e) {
  // Graceful fallback on web or unlinked environments
}

interface TripMapViewProps {
  stops: ScheduleItem[];
  selectedDay: number;
}

export const TripMapView: React.FC<TripMapViewProps> = ({ stops, selectedDay }) => {
  const mapRef = useRef<any>(null);

  // Compute bounding region with comfortable padding around all stops
  const getCalculatedRegion = () => {
    if (stops.length === 0) {
      return {
        latitude: 35.6762,
        longitude: 139.6503,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    const lats = stops.map((s) => s.latitude);
    const lngs = stops.map((s) => s.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const midLat = (minLat + maxLat) / 2;
    const midLng = (minLng + maxLng) / 2;
    const deltaLat = Math.max((maxLat - minLat) * 1.5, 0.02);
    const deltaLng = Math.max((maxLng - minLng) * 1.5, 0.02);

    return {
      latitude: midLat,
      longitude: midLng,
      latitudeDelta: deltaLat,
      longitudeDelta: deltaLng,
    };
  };

  const polylineCoords = stops.map((s) => ({
    latitude: s.latitude,
    longitude: s.longitude,
  }));

  // Auto-fit to coordinates when day or stops change
  useEffect(() => {
    if (mapRef.current && polylineCoords.length > 0) {
      try {
        mapRef.current.fitToCoordinates(polylineCoords, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      } catch (err) {
        // Safe fallback
      }
    }
  }, [stops, selectedDay]);

  // If native map is supported and available
  if (NativeMapView && Platform.OS !== 'web') {
    return (
      <View style={styles.mapContainer}>
        <NativeMapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={getCalculatedRegion()}
          showsUserLocation={false}
          showsCompass={true}
        >
          {stops.map((stop) => (
            <NativeMarker
              key={stop.id}
              coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
              title={`${stop.order_index}. ${stop.place_name}`}
              description={`도착: ${stop.arrival_time} · 터치 시 구글 지도 이동`}
              onCalloutPress={() => openInGoogleMaps(stop.place_name, stop.latitude, stop.longitude)}
            >
              <View style={styles.markerBadge}>
                <Text style={styles.markerText}>{stop.order_index}</Text>
              </View>
              {NativeCallout && (
                <NativeCallout tooltip={false}>
                  <View style={styles.calloutBox}>
                    <Text style={styles.calloutTitle}>
                      {stop.order_index}. {stop.place_name}
                    </Text>
                    <Text style={styles.calloutSubtitle}>
                      도착 {stop.arrival_time} · 구글 지도 열기 ↗
                    </Text>
                  </View>
                </NativeCallout>
              )}
            </NativeMarker>
          ))}

          {polylineCoords.length > 1 && (
            <NativePolyline
              coordinates={polylineCoords}
              strokeColor="#FF6B6B"
              strokeWidth={4}
              lineDashPattern={[1, 0]}
            />
          )}
        </NativeMapView>

        {/* Floating Day Indicator Overlay */}
        <View style={styles.overlayBadge}>
          <Sparkles size={14} color="#FF6B6B" />
          <Text style={styles.overlayText}>DAY {selectedDay} 실시간 동선 지도</Text>
        </View>

        {/* Quick Google Maps App Launcher */}
        {stops.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => openMultiStopRouteInGoogleMaps(stops)}
            style={styles.googleMapsButton}
            accessibilityLabel="구글 지도에서 전체 경로 열기"
          >
            <Navigation size={12} color="#FFF" />
            <Text style={styles.googleMapsButtonText}>구글 지도 전체 경로 ↗</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Fallback rich interactive map visualization (Web & Expo preview)
  return (
    <View style={styles.mapContainer}>
      <View style={styles.fallbackBackground}>
        {/* Background Map Graphic Pattern */}
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&auto=format&fit=crop' }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
        <View style={styles.fallbackDarkOverlay} />

        {/* Interactive Stops overlay nodes */}
        <View style={styles.stopsTrack}>
          {stops.map((stop, index) => (
            <React.Fragment key={stop.id}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => openInGoogleMaps(stop.place_name, stop.latitude, stop.longitude)}
                style={styles.stopNode}
              >
                <View style={styles.stopPinCircle}>
                  <Text style={styles.stopPinNumber}>{stop.order_index}</Text>
                </View>
                <View style={styles.stopNameCard}>
                  <Text style={styles.stopNameText} numberOfLines={1}>
                    {stop.place_name}
                  </Text>
                  <Text style={styles.stopTimeText}>
                    {stop.arrival_time}
                  </Text>
                </View>
              </TouchableOpacity>

              {index < stops.length - 1 && (
                <View style={styles.routeConnector}>
                  <View style={styles.routeConnectorIcon}>
                    <Navigation size={10} color="#FFF" />
                  </View>
                </View>
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Top Floating Badge */}
        <View style={styles.overlayBadge}>
          <MapPin size={14} color="#FF6B6B" fill="#FF6B6B" />
          <Text style={styles.overlayText}>
            DAY {selectedDay} 스마트 동선 경로 ({stops.length}개 스팟)
          </Text>
        </View>

        {/* Google Maps External Route Launch Button */}
        {stops.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => openMultiStopRouteInGoogleMaps(stops)}
            style={styles.googleMapsButton}
          >
            <ExternalLink size={12} color="#FFF" />
            <Text style={styles.googleMapsButtonText}>구글 지도 전체 경로 ↗</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    height: 230,
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  markerText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  calloutBox: {
    padding: 8,
    minWidth: 140,
    alignItems: 'center',
  },
  calloutTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  calloutSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
  },
  overlayBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  overlayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2B2D42',
    marginLeft: 6,
  },
  googleMapsButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  googleMapsButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 5,
  },
  fallbackBackground: {
    width: '100%',
    height: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  fallbackDarkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  stopsTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 380,
    paddingHorizontal: 8,
    zIndex: 10,
  },
  stopNode: {
    alignItems: 'center',
  },
  stopPinCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  stopPinNumber: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  stopNameCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 5,
    alignItems: 'center',
    maxWidth: 90,
  },
  stopNameText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E293B',
  },
  stopTimeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
  },
  routeConnector: {
    flex: 1,
    height: 2,
    backgroundColor: '#FF6B6B',
    marginHorizontal: 4,
    position: 'relative',
    bottom: 12,
  },
  routeConnectorIcon: {
    position: 'absolute',
    top: -8,
    left: '50%',
    marginLeft: -8,
    backgroundColor: '#4ECDC4',
    padding: 3,
    borderRadius: 10,
  },
});
