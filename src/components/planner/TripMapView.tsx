import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import type { ScheduleItem } from '../../types';
import {
  Sparkles,
  Navigation,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from 'lucide-react-native';
import { openInGoogleMaps, openMultiStopRouteInGoogleMaps } from '../../utils/mapUtils';

interface TripMapViewProps {
  stops: ScheduleItem[];
  selectedDay: number;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  activeStopIndex?: number;
  onSelectStopIndex?: (index: number) => void;
}

export const TripMapView: React.FC<TripMapViewProps> = ({
  stops,
  selectedDay,
  isExpanded = false,
  onToggleExpand,
  activeStopIndex = 0,
  onSelectStopIndex,
}) => {
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
    return stops.map((s, idx) => ({
      id: s.id,
      index: idx,
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #E2E8F0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    #map { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #E2E8F0; }
    .custom-pin {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: #FF6B6B;
      color: #FFFFFF;
      font-size: 13px;
      font-weight: 800;
      border: 2.5px solid #FFFFFF;
      box-shadow: 0 4px 10px rgba(0,0,0,0.35);
      cursor: pointer;
    }
    .custom-pin.active {
      background-color: #059669;
      transform: scale(1.15);
      z-index: 9999 !important;
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
      opacity: 0.7;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var stops = ${JSON.stringify(stopsData)};
    var defaultLat = ${defaultLat};
    var defaultLng = ${defaultLng};
    var activeIdx = ${activeStopIndex};

    var map = L.map('map', {
      center: [defaultLat, defaultLng],
      zoom: 14,
      zoomControl: true,
      attributionControl: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; CartoDB &copy; OpenStreetMap'
    }).addTo(map);

    var markers = [];
    var latlngs = [];

    stops.forEach(function(stop, idx) {
      latlngs.push([stop.latitude, stop.longitude]);

      var isActive = idx === activeIdx;
      var pinHtml = '<div class="custom-pin' + (isActive ? ' active' : '') + '">' + stop.order_index + '</div>';

      var customIcon = L.divIcon({
        className: 'leaflet-custom-div',
        html: pinHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18]
      });

      var marker = L.marker([stop.latitude, stop.longitude], { icon: customIcon }).addTo(map);

      var popupHtml =
        '<div class="popup-box">' +
          '<div class="popup-title">#' + stop.order_index + ' ' + stop.place_name + '</div>' +
          '<div class="popup-time">' + (stop.arrival_time ? '도착 ' + stop.arrival_time : '') + '</div>' +
          '<a href="javascript:void(0)" class="popup-btn" onclick="sendNavMessage(' + stop.latitude + ',' + stop.longitude + ',\\'' + encodeURIComponent(stop.place_name) + '\\')">길찾기 ↗</a>' +
        '</div>';

      marker.bindPopup(popupHtml);
      marker.on('click', function() {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SELECT_STOP', index: idx }));
        }
      });
      markers.push(marker);
    });

    if (latlngs.length > 1) {
      var polyline = L.polyline(latlngs, {
        color: '#FF6B6B',
        weight: 4,
        opacity: 0.85,
        dashArray: '8, 8',
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      var bounds = L.latLngBounds(latlngs);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    } else if (latlngs.length === 1) {
      map.setView(latlngs[0], 15);
    }

    function sendNavMessage(lat, lng, name) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'NAVIGATE',
          lat: lat,
          lng: lng,
          placeName: decodeURIComponent(name)
        }));
      }
    }
  </script>
</body>
</html>
    `;
  }, [stopsData, defaultLat, defaultLng, activeStopIndex]);

  // Handle messages sent from inside WebView
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'NAVIGATE') {
        openInGoogleMaps(data.placeName, data.lat, data.lng);
      } else if (data.type === 'SELECT_STOP' && onSelectStopIndex) {
        onSelectStopIndex(data.index);
      }
    } catch (e) {
      // Ignore
    }
  };

  const currentActiveStop = stops[activeStopIndex] || stops[0];

  const handlePrevStop = () => {
    if (activeStopIndex > 0 && onSelectStopIndex) {
      onSelectStopIndex(activeStopIndex - 1);
    }
  };

  const handleNextStop = () => {
    if (activeStopIndex < stops.length - 1 && onSelectStopIndex) {
      onSelectStopIndex(activeStopIndex + 1);
    }
  };

  return (
    <View style={[styles.mapContainer, isExpanded ? styles.mapExpanded : styles.mapNormal]}>
      <WebView
        originWhitelist={['*']}
        source={{ html: mapHtml, baseUrl: 'https://www.google.com' }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        cacheEnabled={true}
        mixedContentMode="always"
        onMessage={handleWebViewMessage}
        scrollEnabled={isExpanded}
        overScrollMode="never"
      />

      {/* Top Floating Badge & Expand Button */}
      <View style={styles.overlayHeader} pointerEvents="box-none">
        <View style={styles.overlayBadge}>
          <Sparkles size={13} color="#FF6B6B" />
          <Text style={styles.overlayText}>
            DAY {selectedDay} 실시간 동선 ({stops.length}스팟)
          </Text>
        </View>

        {onToggleExpand && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onToggleExpand}
            style={styles.expandButton}
            accessibilityLabel={isExpanded ? '지도 축소' : '지도 전체화면 확대'}
          >
            {isExpanded ? (
              <Minimize2 size={16} color="#1E293B" />
            ) : (
              <Maximize2 size={16} color="#1E293B" />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Expanded View: Floating Stop Navigation Pills */}
      {isExpanded && stops.length > 0 && currentActiveStop && (
        <View style={styles.floatingNavPillContainer} pointerEvents="box-none">
          <View style={styles.floatingNavPill}>
            <TouchableOpacity
              onPress={handlePrevStop}
              disabled={activeStopIndex <= 0}
              style={[styles.navArrowBtn, activeStopIndex <= 0 && styles.navBtnDisabled]}
            >
              <ChevronLeft size={16} color={activeStopIndex <= 0 ? '#CBD5E1' : '#1E293B'} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navStopInfo}
              onPress={() =>
                openInGoogleMaps(
                  currentActiveStop.place_name,
                  currentActiveStop.latitude,
                  currentActiveStop.longitude
                )
              }
            >
              <View style={styles.navIndexCircle}>
                <Text style={styles.navIndexText}>{currentActiveStop.order_index}</Text>
              </View>
              <Text style={styles.navPlaceName} numberOfLines={1}>
                {currentActiveStop.place_name}
              </Text>
              <Text style={styles.navTimeText}>
                {currentActiveStop.arrival_time ? ` · ${currentActiveStop.arrival_time}` : ''}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNextStop}
              disabled={activeStopIndex >= stops.length - 1}
              style={[styles.navArrowBtn, activeStopIndex >= stops.length - 1 && styles.navBtnDisabled]}
            >
              <ChevronRight
                size={16}
                color={activeStopIndex >= stops.length - 1 ? '#CBD5E1' : '#1E293B'}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Quick Google Maps App Launcher */}
      {stops.length > 0 && !isExpanded && (
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
    width: '100%',
    borderRadius: 24,
    backgroundColor: '#E2E8F0',
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  mapNormal: {
    height: 250,
  },
  mapExpanded: {
    height: 520,
  },
  webview: {
    flex: 1,
    backgroundColor: '#E2E8F0',
  },
  overlayHeader: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 30,
  },
  overlayBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  overlayText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E293B',
    marginLeft: 6,
  },
  expandButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  floatingNavPillContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 30,
  },
  floatingNavPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    maxWidth: '96%',
  },
  navArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  navStopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    flexShrink: 1,
  },
  navIndexCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  navIndexText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  navPlaceName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    maxWidth: 140,
  },
  navTimeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
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
