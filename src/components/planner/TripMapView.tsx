import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import type { ScheduleItem } from '../../types';
import { Sparkles, Navigation } from 'lucide-react-native';
import { openInGoogleMaps, openMultiStopRouteInGoogleMaps } from '../../utils/mapUtils';

interface TripMapViewProps {
  stops: ScheduleItem[];
  selectedDay: number;
}

export const TripMapView: React.FC<TripMapViewProps> = ({ stops, selectedDay }) => {
  // Center coordinates calculation
  const { defaultLat, defaultLng } = useMemo(() => {
    if (stops.length > 0) {
      const avgLat = stops.reduce((acc, s) => acc + Number(s.latitude), 0) / stops.length;
      const avgLng = stops.reduce((acc, s) => acc + Number(s.longitude), 0) / stops.length;
      return { defaultLat: avgLat, defaultLng: avgLng };
    }
    // Default Tokyo Shibuya coordinates
    return { defaultLat: 35.6762, defaultLng: 139.6503 };
  }, [stops]);

  // Clean data for Leaflet injection
  const stopsData = useMemo(() => {
    return stops.map((s) => ({
      id: s.id,
      order_index: s.order_index,
      place_name: s.place_name,
      arrival_time: s.arrival_time,
      latitude: Number(s.latitude),
      longitude: Number(s.longitude),
    }));
  }, [stops]);

  // Generate interactive Leaflet Map HTML
  const mapHtml = useMemo(() => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    html, body, #map { width: 100%; height: 100%; background: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .custom-pin {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background-color: #FF6B6B;
      color: #FFFFFF;
      font-size: 13px;
      font-weight: 800;
      border: 2.5px solid #FFFFFF;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      cursor: pointer;
    }
    .leaflet-popup-content-wrapper {
      border-radius: 14px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.18);
      padding: 2px;
    }
    .popup-box {
      padding: 6px 10px;
      text-align: center;
      min-width: 140px;
    }
    .popup-title {
      font-size: 12px;
      font-weight: 700;
      color: #1E293B;
      margin-bottom: 2px;
    }
    .popup-time {
      font-size: 11px;
      font-weight: 600;
      color: #059669;
      margin-bottom: 6px;
    }
    .popup-btn {
      display: inline-block;
      background: #059669;
      color: #FFF;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 12px;
      text-decoration: none;
      cursor: pointer;
    }
    .leaflet-control-attribution {
      font-size: 8px !important;
      background: rgba(255,255,255,0.7) !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var stops = ${JSON.stringify(stopsData)};
    var defaultCenter = [${defaultLat}, ${defaultLng}];
    
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: true
    }).setView(defaultCenter, 14);

    // High quality CartoDB Voyager Map Tiles (Clean Google-like typography & street lines)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '© OSM, © CARTO'
    }).addTo(map);

    if (stops && stops.length > 0) {
      var latlngs = [];
      stops.forEach(function(s) {
        var pos = [Number(s.latitude), Number(s.longitude)];
        latlngs.push(pos);

        var customIcon = L.divIcon({
          className: '',
          html: '<div class="custom-pin">' + s.order_index + '</div>',
          iconSize: [30, 30],
          iconAnchor: [15, 15],
          popupAnchor: [0, -16]
        });

        var escapedName = (s.place_name || '').replace(/'/g, "\\\\'");
        var popupHtml = '<div class="popup-box">' +
          '<div class="popup-title">' + s.order_index + '. ' + s.place_name + '</div>' +
          '<div class="popup-time">도착: ' + s.arrival_time + '</div>' +
          '<div class="popup-btn" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type:\\'NAVIGATE\\', placeName:\\'' + escapedName + '\\', lat:' + s.latitude + ', lng:' + s.longitude + '}))">구글 지도 길찾기 ↗</div>' +
          '</div>';

        L.marker(pos, { icon: customIcon }).addTo(map).bindPopup(popupHtml);
      });

      // Draw polyline connecting all day stops directly ON the map
      if (latlngs.length > 1) {
        L.polyline(latlngs, {
          color: '#FF6B6B',
          weight: 4,
          opacity: 0.9,
          lineJoin: 'round'
        }).addTo(map);
      }

      // Auto-fit bounds with padding so all markers are visible
      if (latlngs.length === 1) {
        map.setView(latlngs[0], 15);
      } else {
        map.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40], maxZoom: 16 });
      }
    }
  </script>
</body>
</html>
    `;
  }, [stopsData, defaultLat, defaultLng]);

  // Handle messages sent from inside the WebView (e.g. clicking popup button)
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'NAVIGATE') {
        openInGoogleMaps(data.placeName, data.lat, data.lng);
      }
    } catch (e) {
      // Ignore
    }
  };

  return (
    <View style={styles.mapContainer}>
      <WebView
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={handleWebViewMessage}
        scrollEnabled={false}
        overScrollMode="never"
        androidHardwareAccelerationDisabled={false}
      />

      {/* Top Floating Badge */}
      <View style={styles.overlayHeader} pointerEvents="box-none">
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
  webview: {
    flex: 1,
    backgroundColor: '#F1F5F9',
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
