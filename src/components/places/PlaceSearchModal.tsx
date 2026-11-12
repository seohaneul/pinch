import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
  Keyboard,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, X, MapPin } from '@/components/common/CustomIcons';
import { usePlaceStore } from '../../store/usePlaceStore';
import { useTripStore } from '../../store/useTripStore';
import { searchPlaces, SearchPlaceResult } from '../../services/placeSearchService';
import type { Place, PlaceCategory } from '../../types';

export interface PlaceSearchModalProps {
  visible: boolean;
  onClose: () => void;
  tripId?: string;
  tripTitle?: string;
  initialQuery?: string;
  defaultCategory?: PlaceCategory;
  targetDayNumber?: number;
  ctaLabel?: string;
  onPlaceSaved?: (place: Place) => void;
  onAddToSchedule?: (dayNumber: number, place: Place) => void;
  onSelectResult?: (result: SearchPlaceResult) => void;
}

export const PlaceSearchModal: React.FC<PlaceSearchModalProps> = ({
  visible,
  onClose,
  tripId,
  tripTitle,
  initialQuery = '',
  defaultCategory,
  targetDayNumber,
  ctaLabel,
  onPlaceSaved,
  onAddToSchedule,
  onSelectResult,
}) => {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<any>(null);
  const { currentTrip, addPlaceToSchedule } = useTripStore();
  const { places, addPlace } = usePlaceStore();

  const activeTripId = tripId || currentTrip?.id || 't_first';
  const activeTripTitle = tripTitle || currentTrip?.title || '여행';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchPlaceResult[]>([]);
  const [selectedItem, setSelectedItem] = useState<SearchPlaceResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [savedPlaceNames, setSavedPlaceNames] = useState<Record<string, boolean>>({});

  // 모달 열릴 때 초기 검색어 동기화
  useEffect(() => {
    if (visible) {
      setSearchQuery(initialQuery || '');
      setShowDropdown(false);
    }
  }, [visible, initialQuery]);

  // 현재 여행에 이미 저장된 장소 이름+주소 맵 동기화 (다른 여행과 엄격 분리)
  useEffect(() => {
    const map: Record<string, boolean> = {};
    places.forEach((p) => {
      if (p.trip_id === activeTripId) {
        const key = `${p.name.trim().toLowerCase()}__${(p.address || '').trim().toLowerCase()}`;
        map[key] = true;
        map[p.name.trim().toLowerCase()] = true;
      }
    });
    setSavedPlaceNames(map);
  }, [places, activeTripId, visible]);

  // 디바운스 실시간 검색
  useEffect(() => {
    if (!visible) return;

    let isCancelled = false;
    const runSearch = async () => {
      setIsSearching(true);
      try {
        const bias =
          currentTrip?.centerLat && currentTrip?.centerLng
            ? { latitude: currentTrip.centerLat, longitude: currentTrip.centerLng }
            : undefined;
        const searchRes = await searchPlaces(searchQuery, defaultCategory, bias);
        if (!isCancelled) {
          setResults(searchRes);
          if (searchRes.length > 0) {
            setSelectedItem(searchRes[0]);
          } else {
            setSelectedItem(null);
          }
        }
      } catch {
        if (!isCancelled) {
          setResults([]);
          setSelectedItem(null);
        }
      } finally {
        if (!isCancelled) setIsSearching(false);
      }
    };

    const timer = setTimeout(runSearch, 280);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, defaultCategory, visible]);

  const activePlace = selectedItem || results[0] || null;
  const mapLat = activePlace?.latitude || currentTrip?.centerLat || 37.4973307;
  const mapLng = activePlace?.longitude || currentTrip?.centerLng || 127.0551532;

  // 선택된 장소가 바뀔 때 네이티브 WebView 지도 부드럽게 이동 (깜빡임 방지)
  useEffect(() => {
    if (Platform.OS !== 'web' && webViewRef.current && activePlace) {
      const js = `
        if (window.updatePinLocation) {
          window.updatePinLocation(${activePlace.latitude}, ${activePlace.longitude});
        }
        true;
      `;
      webViewRef.current.injectJavaScript(js);
    }
  }, [activePlace?.id, activePlace?.latitude, activePlace?.longitude]);

  const handleSelectDropdownItem = (item: SearchPlaceResult) => {
    setSelectedItem(item);
    setShowDropdown(false);
    Keyboard.dismiss();
  };

  const handleSubmitSearch = async () => {
    setShowDropdown(false);
    Keyboard.dismiss();
    setIsSearching(true);
    try {
      const bias =
        currentTrip?.centerLat && currentTrip?.centerLng
          ? { latitude: currentTrip.centerLat, longitude: currentTrip.centerLng }
          : undefined;
      const searchRes = await searchPlaces(searchQuery, defaultCategory, bias);
      setResults(searchRes);
      if (searchRes.length > 0) {
        setSelectedItem(searchRes[0]);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const convertToPlace = (item: SearchPlaceResult): Place => ({
    id: `p_search_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    trip_id: activeTripId,
    name: item.name,
    address: item.address,
    category: item.category,
    latitude: item.latitude,
    longitude: item.longitude,
    memo: item.roadAddress || item.memo || '검색하여 추가한 장소',
    imageUrl: item.imageUrl,
    rating: item.rating || 4.8,
    isPinned: true,
    createdAt: new Date().toISOString(),
    tags: [item.category],
  });

  const handleAddLocationAction = (item: SearchPlaceResult) => {
    // 1. 외부 커스텀 선택 콜백이 있는 경우 (예: 숙소 설정 등)
    if (onSelectResult) {
      onSelectResult(item);
      onClose();
      return;
    }

    const place = convertToPlace(item);

    // 2. 특정 일차(targetDayNumber) 일정 추가로 열린 경우
    if (targetDayNumber) {
      const normalizedKey = item.name.trim().toLowerCase();
      if (!savedPlaceNames[normalizedKey]) {
        addPlace(place, activeTripId);
        setSavedPlaceNames((prev) => ({
          ...prev,
          [normalizedKey]: true,
        }));
      }
      if (onAddToSchedule) {
        onAddToSchedule(targetDayNumber, place);
      } else {
        addPlaceToSchedule(targetDayNumber, place);
      }
      if (onPlaceSaved) {
        onPlaceSaved(place);
      }
      Alert.alert(
        '위치 추가 완료',
        `"${item.name}" 위치를 DAY ${targetDayNumber} 일정에 추가했습니다.`
      );
      onClose();
      return;
    }

    // 3. 기본 보관함 위치 추가
    const success = addPlace(place, activeTripId);
    if (success) {
      setSavedPlaceNames((prev) => ({
        ...prev,
        [item.name.trim().toLowerCase()]: true,
      }));
      if (onPlaceSaved) {
        onPlaceSaved(place);
      }
      Alert.alert(
        '위치 추가 완료',
        `"${item.name}" 위치를 "${activeTripTitle}" 보관함에 추가했습니다.`
      );
      onClose();
    }
  };

  // 레퍼런스 5번 이미지와 동일한 핀 스타일 (물방울 핀 + 하단 작은 점)
  const leafletHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #ECEBE6; }
        .leaflet-control-attribution, .leaflet-control-zoom { display: none !important; }
        .pin-wrapper {
          position: relative;
          width: 48px;
          height: 62px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .pin-teardrop {
          width: 42px;
          height: 42px;
          background: #1B2A4A;
          border: 2.5px solid #FFFFFF;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 5px 14px rgba(27, 42, 74, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pin-hole {
          width: 15px;
          height: 15px;
          background: #FFFFFF;
          border-radius: 50%;
          transform: rotate(45deg);
        }
        .pin-ground-dot {
          width: 8px;
          height: 8px;
          background: #1B2A4A;
          border: 1.5px solid #FFFFFF;
          border-radius: 50%;
          margin-top: 8px;
          box-shadow: 0 2px 4px rgba(27, 42, 74, 0.3);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        function initPlaceMap() {
          if (typeof L === 'undefined') {
            setTimeout(initPlaceMap, 80);
            return;
          }
          var map = L.map('map', { zoomControl: false }).setView([${mapLat}, ${mapLng}], 16);
          var googleLayer = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=ko', {
            subdomains: '0123',
            maxZoom: 20
          }).addTo(map);
          googleLayer.on('tileerror', function() {
            if (!window.fallbackTileLoaded) {
              window.fallbackTileLoaded = true;
              L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                maxZoom: 19
              }).addTo(map);
            }
          });
          var customIcon = L.divIcon({
            className: '',
            html: '<div class="pin-wrapper"><div class="pin-teardrop"><div class="pin-hole"></div></div><div class="pin-ground-dot"></div></div>',
            iconSize: [48, 62],
            iconAnchor: [24, 56]
          });
          var marker = L.marker([${mapLat}, ${mapLng}], { icon: customIcon }).addTo(map);
          window.updatePinLocation = function(lat, lng) {
            marker.setLatLng([lat, lng]);
            map.flyTo([lat, lng], 16, { duration: 0.45 });
          };
          setTimeout(function() { map.invalidateSize(); }, 150);
          setTimeout(function() { map.invalidateSize(); }, 500);
        }
        initPlaceMap();
      </script>
    </body>
    </html>
  `;

  const isAlreadySaved = activePlace
    ? Boolean(savedPlaceNames[activePlace.name.trim().toLowerCase()])
    : false;

  const buttonText = ctaLabel
    ? ctaLabel
    : targetDayNumber
      ? `이 위치 추가하기 (DAY ${targetDayNumber})`
      : isAlreadySaved && !onSelectResult
        ? '이미 추가된 위치입니다'
        : '이 위치 추가하기';

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: Math.max(insets.top, 12) }]}>
        {/* ==================== 1. 상단 검색 바 (레퍼런스 5번 동일 구조: X + 둥근 회색 검색바 + ⊗) ==================== */}
        <View style={styles.topSearchRow}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeXBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={25} color="#111827" strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.searchPillBar}>
            <Search size={18} color="#8E8E93" />
            <TextInput
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setShowDropdown(true);
              }}
              onFocus={() => {
                if (results.length > 1) setShowDropdown(true);
              }}
              onSubmitEditing={handleSubmitSearch}
              placeholder="장소, 주소 검색 (예: 맥도날드, 시부야 스카이)"
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setShowDropdown(true);
                }}
                style={styles.clearCircleBtn}
                activeOpacity={0.75}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={11} color="#FFFFFF" strokeWidth={2.6} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ==================== 2. 풀스크린 지도 + 플로팅 하단 카드 (레퍼런스 5번 구조) ==================== */}
        <View style={styles.mapAreaContainer}>
          {Platform.OS === 'web' ? (
            <iframe
              key={`${mapLat.toFixed(5)}_${mapLng.toFixed(5)}`}
              title="Pinchi Place Search Map"
              srcDoc={leafletHtml}
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          ) : (
            <WebView
              ref={webViewRef}
              originWhitelist={['*']}
              source={{ html: leafletHtml }}
              style={{ flex: 1 }}
              scrollEnabled={true}
            />
          )}

          {/* 검색어 입력 중 자동완성 결과 드롭다운 (원하는 지점 즉시 선택) */}
          {showDropdown && results.length > 0 && (
            <View style={styles.dropdownOverlay}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 280 }}
              >
                {results.slice(0, 10).map((item) => {
                  const selected = activePlace?.id === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.75}
                      onPress={() => handleSelectDropdownItem(item)}
                      style={[
                        styles.dropdownRow,
                        selected && styles.dropdownRowSelected,
                      ]}
                    >
                      <MapPin
                        size={16}
                        color={selected ? '#1B2A4A' : '#9CA3AF'}
                        style={{ marginTop: 2, marginRight: 10 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.dropdownPlaceName,
                            selected && styles.dropdownPlaceNameSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        <Text style={styles.dropdownPlaceAddr} numberOfLines={1}>
                          {item.address}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* 여러 검색 결과가 있을 때 지도 상단 지점 빠른 전환 칩 */}
          {!showDropdown && results.length > 1 && (
            <View style={styles.floatingResultsStrip}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                keyboardShouldPersistTaps="handled"
              >
                {results.slice(0, 12).map((item) => {
                  const isSelected = activePlace?.id === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.85}
                      onPress={() => {
                        setSelectedItem(item);
                        Keyboard.dismiss();
                      }}
                      style={[
                        styles.resultMiniPill,
                        isSelected && styles.resultMiniPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.resultMiniPillText,
                          isSelected && styles.resultMiniPillTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* ==================== 3. 하단 플로팅 화이트 카드 (레퍼런스 5번 100% 매칭) ==================== */}
          <View
            style={[
              styles.floatingBottomCard,
              { marginBottom: Math.max(insets.bottom, 16) + 6 },
            ]}
          >
            {isSearching && !activePlace ? (
              <View style={styles.cardLoadingBox}>
                <ActivityIndicator size="small" color="#1B2A4A" />
                <Text style={styles.cardLoadingText}>위치를 검색하고 있습니다...</Text>
              </View>
            ) : activePlace ? (
              <>
                {/* 1줄: 장소명 (굵은 타이틀) */}
                <Text style={styles.cardPlaceTitle} numberOfLines={1}>
                  {activePlace.name}
                </Text>

                {/* 2줄: 기본/지번 주소 */}
                <Text style={styles.cardPrimaryAddress} numberOfLines={1}>
                  {activePlace.address}
                </Text>

                {/* 3줄: [도로명] 박스 태그 + 도로명/상세 주소 */}
                <View style={styles.cardRoadAddressRow}>
                  <View style={styles.roadBadgeBox}>
                    <Text style={styles.roadBadgeText}>도로명</Text>
                  </View>
                  <Text style={styles.cardRoadAddressText} numberOfLines={1}>
                    {activePlace.roadAddress || activePlace.address}
                  </Text>
                </View>

                {/* 4줄: 풀폭 솔리드 버튼 "이 위치 추가하기" */}
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => handleAddLocationAction(activePlace)}
                  style={[
                    styles.addLocationBtn,
                    isAlreadySaved && !onSelectResult && !targetDayNumber && styles.addLocationBtnSaved,
                  ]}
                >
                  <Text style={styles.addLocationBtnText}>{buttonText}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.cardLoadingBox}>
                <Text style={styles.cardLoadingText}>
                  상단 검색창에 장소명이나 주소를 입력해보세요.
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
    zIndex: 20,
  },
  closeXBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchPillBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F3F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    paddingVertical: 0,
  },
  clearCircleBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#AEAEB2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapAreaContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#ECEBE6',
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 30,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownRowSelected: {
    backgroundColor: '#F8FAFC',
  },
  dropdownPlaceName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  dropdownPlaceNameSelected: {
    color: '#1B2A4A',
  },
  dropdownPlaceAddr: {
    fontSize: 12.5,
    color: '#6B7280',
  },
  floatingResultsStrip: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  resultMiniPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: 190,
  },
  resultMiniPillActive: {
    backgroundColor: '#1B2A4A',
  },
  resultMiniPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#111827',
  },
  resultMiniPillTextActive: {
    color: '#FFFFFF',
  },
  floatingBottomCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 8,
    zIndex: 15,
  },
  cardLoadingBox: {
    paddingVertical: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cardLoadingText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  cardPlaceTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
    marginBottom: 7,
  },
  cardPrimaryAddress: {
    fontSize: 15,
    fontWeight: '500',
    color: '#222222',
    marginBottom: 7,
  },
  cardRoadAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  roadBadgeBox: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    marginRight: 7,
  },
  roadBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  cardRoadAddressText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  addLocationBtn: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    backgroundColor: '#1B2A4A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLocationBtnSaved: {
    backgroundColor: '#475569',
  },
  addLocationBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
