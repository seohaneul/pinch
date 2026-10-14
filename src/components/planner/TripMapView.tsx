import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline, Callout, UrlTile } from 'react-native-maps';
import type { ScheduleItem } from '../../types';
import { MapPin, Navigation, Sparkles } from 'lucide-react-native';
import { openInGoogleMaps, openMultiStopRouteInGoogleMaps } from '../../utils/mapUtils';

interface TripMapViewProps {
  stops: ScheduleItem[];
  selectedDay: number;
}

export const TripMapView: React.FC<TripMapViewProps> = ({ stops, selectedDay }) => {
  const mapRef = useRef<MapView | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

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
    const lats = stops.map((s) => Number(s.latitude));
    const lngs = stops.map((s) => Number(s.longitude));
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const midLat = (minLat + maxLat) / 2;
    const midLng = (minLng + maxLng) / 2;
    const deltaLat = Math.max((maxLat - minLat) * 1.6, 0.025);
    const deltaLng = Math.max((maxLng - minLng) * 1.6, 0.025);

    return {
      latitude: midLat,
      longitude: midLng,
      latitudeDelta: deltaLat,
      longitudeDelta: deltaLng,
    };
  };

  const polylineCoords = stops.map((s) => ({
    latitude: Number(s.latitude),
    longitude: Number(s.longitude),
  }));

  // Force re-rendering custom markers on Android initially, then disable to save battery
  useEffect(() => {
    setTracksViewChanges(true);
    const timer = setTimeout(() => {
      setTracksViewChanges(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [stops, selectedDay]);

  // Recalculate camera position when day or stops change
  useEffect(() => {
    if (mapRef.current && isMapReady && polylineCoords.length > 0) {
      try {
        if (polylineCoords.length === 1) {
          mapRef.current.animateToRegion({
            latitude: polylineCoords[0].latitude,
            longitude: polylineCoords[0].longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }, 500);
        } else {
          mapRef.current.fitToCoordinates(polylineCoords, {
            edgePadding: { top: 70, right: 60, bottom: 60, left: 60 },
            animated: true,
          });
        }
      } catch (err) {
        // Safe fallback
      }
    }
  }, [stops, selectedDay, isMapReady]);

  const handleMapReady = () => {
    setIsMapReady(true);
    if (mapRef.current && polylineCoords.length > 0) {
      setTimeout(() => {
        try {
          if (polylineCoords.length === 1) {
            mapRef.current.animateToRegion({
              latitude: polylineCoords[0].latitude,
              longitude: polylineCoords[0].longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }, 500);
          } else {
            mapRef.current.fitToCoordinates(polylineCoords, {
              edgePadding: { top: 70, right: 60, bottom: 60, left: 60 },
              animated: true,
            });
          }
        } catch (e) {}
      }, 300);
    }
  };

  return (
    <View style={styles.mapContainer}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={getCalculatedRegion()}
        onMapReady={handleMapReady}
        showsUserLocation={false}
        showsCompass={true}
        toolbarEnabled={false}
        mapType={Platform.OS === 'android' ? 'none' : 'standard'}
      >
        {/* Real Google Maps Tile Layer (Works smoothly on Android without requiring SHA-1 API key) */}
        {Platform.OS === 'android' && (
          <UrlTile
            urlTemplate="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            maximumZ={19}
            flipY={false}
            zIndex={1}
          />
        )}

        {/* Real Route Polyline drawn DIRECTLY ON TOP OF Google Maps */}
        {polylineCoords.length > 1 && (
          <Polyline
            coordinates={polylineCoords}
            strokeColor="#FF6B6B"
            strokeWidth={4}
            lineDashPattern={[1, 0]}
            zIndex={5}
          />
        )}

        {/* Stop Markers drawn DIRECTLY ON TOP OF Google Maps */}
        {stops.map((stop) => (
          <Marker
            key={stop.id}
            coordinate={{
              latitude: Number(stop.latitude),
              longitude: Number(stop.longitude),
            }}
            title={`${stop.order_index}. ${stop.place_name}`}
            description={`도착: ${stop.arrival_time} · 터치 시 구글 지도`}
            tracksViewChanges={tracksViewChanges}
            zIndex={10}
            onCalloutPress={() => openInGoogleMaps(stop.place_name, stop.latitude, stop.longitude)}
          >
            <View style={styles.markerBadge}>
              <Text style={styles.markerText}>{stop.order_index}</Text>
            </View>
            <Callout tooltip={false}>
              <View style={styles.calloutBox}>
                <Text style={styles.calloutTitle}>
                  {stop.order_index}. {stop.place_name}
                </Text>
                <Text style={styles.calloutSubtitle}>
                  도착 {stop.arrival_time} · 구글 지도 열기 ↗
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Top Floating Badge */}
      <View style={styles.overlayHeader}>
        <View style={styles.overlayBadge}>
          <Sparkles size={13} color="#FF6B6B" />
          <Text style={styles.overlayText}>
            DAY {selectedDay} 실시간 동선 지도 ({stops.length}개 스팟)
          </Text>
        </View>
      </View>

      {/* Quick Google Maps App Launcher */}
      {stops.length > 0 && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => openMultiStopRouteInGoogleMaps(stops)}
          style={styles.googleMapsButton}
          accessibilityLabel="구글 지도 앱에서 전체 경로 열기"
        >
          <Navigation size={12} color="#FFF" />
          <Text style={styles.googleMapsButtonText}>구글 지도 전체 경로 ↗</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    height: 240,
    width: '100%',
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  map: {
    ...StyleSheet.absoluteFillObject,
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
  overlayHeader: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  overlayBadge: {
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
    zIndex: 20,
  },
  googleMapsButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 5,
  },
});
