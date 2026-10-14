import React from 'react';
import { View, Text, StyleSheet, Platform, Image } from 'react-native';
import { ScheduleItem } from '../../types';
import { MapPin, Navigation, Sparkles } from 'lucide-react-native';

// Safely attempt react-native-maps import for native mobile, fallback gracefully
let NativeMapView: any = null;
let NativeMarker: any = null;
let NativePolyline: any = null;

try {
  const Maps = require('react-native-maps');
  NativeMapView = Maps.default || Maps.MapView;
  NativeMarker = Maps.Marker;
  NativePolyline = Maps.Polyline;
} catch (e) {
  // Graceful fallback on web or unlinked environments
}

interface TripMapViewProps {
  stops: ScheduleItem[];
  selectedDay: number;
}

export const TripMapView: React.FC<TripMapViewProps> = ({ stops, selectedDay }) => {
  // Default center Tokyo or average of stops
  const initialRegion = {
    latitude: stops.length > 0 ? stops[0].latitude : 35.6762,
    longitude: stops.length > 0 ? stops[0].longitude : 139.6503,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const polylineCoords = stops.map((s) => ({
    latitude: s.latitude,
    longitude: s.longitude,
  }));

  // If native map is supported and available
  if (NativeMapView && Platform.OS !== 'web') {
    return (
      <View style={styles.mapContainer}>
        <NativeMapView
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={false}
        >
          {stops.map((stop) => (
            <NativeMarker
              key={stop.id}
              coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
              title={`${stop.order_index}. ${stop.place_name}`}
              description={`도착시간: ${stop.arrival_time}`}
            >
              <View style={styles.markerBadge}>
                <Text style={styles.markerText}>{stop.order_index}</Text>
              </View>
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
      </View>
    );
  }

  // Fallback rich interactive map visualization (Web & Expo preview)
  return (
    <View style={styles.mapContainer}>
      <View className="w-full h-full bg-slate-900 relative overflow-hidden items-center justify-center p-4">
        {/* Background Map Graphic Pattern */}
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&auto=format&fit=crop' }}
          className="absolute inset-0 w-full h-full opacity-35"
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-slate-950/40" />

        {/* Interactive Stops overlay nodes */}
        <View className="flex-row items-center justify-around w-full max-w-sm px-4 z-10">
          {stops.map((stop, index) => (
            <React.Fragment key={stop.id}>
              <View className="items-center">
                <View className="w-10 h-10 rounded-full bg-primary items-center justify-center border-2 border-white shadow-lg">
                  <Text className="text-white font-extrabold text-sm">{stop.order_index}</Text>
                </View>
                <View className="bg-surface/90 px-2.5 py-1 rounded-xl mt-1.5 border border-white/30 backdrop-blur-md items-center">
                  <Text className="text-[11px] font-bold text-darkText" numberOfLines={1}>
                    {stop.place_name}
                  </Text>
                  <Text className="text-[9px] text-mutedText font-semibold">
                    {stop.arrival_time}
                  </Text>
                </View>
              </View>

              {index < stops.length - 1 && (
                <View className="flex-1 h-0.5 bg-primary/80 border-dashed border-t-2 border-primary mx-1 relative bottom-4">
                  <View className="absolute -top-1.5 left-1/2 -ml-2 bg-secondary p-0.5 rounded-full">
                    <Navigation size={10} color="#FFF" />
                  </View>
                </View>
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Top Floating Badge */}
        <View className="absolute top-3 left-4 bg-surface/90 px-3 py-1.5 rounded-2xl flex-row items-center border border-white/50 backdrop-blur-md shadow-sm">
          <MapPin size={14} color="#FF6B6B" fill="#FF6B6B" className="mr-1" />
          <Text className="text-xs font-bold text-darkText ml-1">
            DAY {selectedDay} 스마트 동선 경로 ({stops.length}개 스팟)
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    height: 220,
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
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
  },
  markerText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  overlayBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  overlayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2B2D42',
    marginLeft: 6,
  },
});
