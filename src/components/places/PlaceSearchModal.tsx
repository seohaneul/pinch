import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  X,
  MapPin,
  Star,
  Bookmark,
  Check,
  Plus,
} from '@/components/common/CustomIcons';
import { usePlaceStore } from '../../store/usePlaceStore';
import { useTripStore } from '../../store/useTripStore';
import { searchPlaces, SearchPlaceResult } from '../../services/placeSearchService';
import type { Place, PlaceCategory } from '../../types';

interface PlaceSearchModalProps {
  visible: boolean;
  onClose: () => void;
  tripId?: string;
  tripTitle?: string;
  onPlaceSaved?: (place: Place) => void;
  onAddToSchedule?: (dayNumber: number, place: Place) => void;
}

const CATEGORIES: { label: string; value: PlaceCategory | 'ALL' }[] = [
  { label: '전체', value: 'ALL' },
  { label: '카페', value: 'CAFE' },
  { label: '맛집', value: 'RESTAURANT' },
  { label: '명소', value: 'ATTRACTION' },
  { label: '숙소', value: 'LODGING' },
  { label: '쇼핑', value: 'SHOPPING' },
];

export const PlaceSearchModal: React.FC<PlaceSearchModalProps> = ({
  visible,
  onClose,
  tripId,
  tripTitle,
  onPlaceSaved,
  onAddToSchedule,
}) => {
  const insets = useSafeAreaInsets();
  const { currentTrip, addPlaceToSchedule } = useTripStore();
  const { places, addPlace } = usePlaceStore();

  const activeTripId = tripId || currentTrip?.id || 't_first';
  const activeTripTitle = tripTitle || currentTrip?.title || '여행';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory | 'ALL'>('ALL');
  const [results, setResults] = useState<SearchPlaceResult[]>([]);
  const [selectedItem, setSelectedItem] = useState<SearchPlaceResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [savedPlaceIds, setSavedPlaceIds] = useState<Record<string, boolean>>({});
  const [selectedPlaceForSchedule, setSelectedPlaceForSchedule] = useState<SearchPlaceResult | null>(null);

  useEffect(() => {
    const map: Record<string, boolean> = {};
    places.forEach((p) => {
      if (p.trip_id === activeTripId || !p.trip_id) {
        map[p.name.trim().toLowerCase()] = true;
      }
    });
    setSavedPlaceIds(map);
  }, [places, activeTripId, visible]);

  useEffect(() => {
    if (!visible) return;

    let isCancelled = false;
    const executeSearch = async () => {
      setIsSearching(true);
      try {
        const catFilter = selectedCategory === 'ALL' ? undefined : selectedCategory;
        const searchRes = await searchPlaces(searchQuery, catFilter);
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

    const timer = setTimeout(executeSearch, 200);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedCategory, visible]);

  const convertToPlace = (item: SearchPlaceResult): Place => ({
    id: `p_search_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    trip_id: activeTripId,
    name: item.name,
    address: item.address,
    category: item.category,
    latitude: item.latitude,
    longitude: item.longitude,
    memo: item.memo || '검색하여 추가한 장소',
    imageUrl: item.imageUrl,
    rating: item.rating || 4.8,
    isPinned: true,
    createdAt: new Date().toISOString(),
    tags: [item.category],
  });

  const handleSaveToPocket = (item: SearchPlaceResult) => {
    const place = convertToPlace(item);
    const success = addPlace(place, activeTripId);
    if (success) {
      setSavedPlaceIds((prev) => ({
        ...prev,
        [item.name.trim().toLowerCase()]: true,
      }));
      if (onPlaceSaved) {
        onPlaceSaved(place);
      }
      Alert.alert(
        '위치 추가 완료',
        `"${item.name}" 장소를 "${activeTripTitle}" 보관함에 추가했습니다.`
      );
    }
  };

  const handleConfirmAddToSchedule = (dayNumber: number) => {
    if (!selectedPlaceForSchedule) return;
    const place = convertToPlace(selectedPlaceForSchedule);

    addPlace(place, activeTripId);
    setSavedPlaceIds((prev) => ({
      ...prev,
      [selectedPlaceForSchedule.name.trim().toLowerCase()]: true,
    }));

    if (onAddToSchedule) {
      onAddToSchedule(dayNumber, place);
    } else {
      addPlaceToSchedule(dayNumber, place);
    }

    Alert.alert(
      '일정에 추가 완료',
      `"${selectedPlaceForSchedule.name}" 장소를 DAY ${dayNumber} 일정에 추가했습니다.`
    );
    setSelectedPlaceForSchedule(null);
  };

  const getCategoryBadgeLabel = (cat?: PlaceCategory) => {
    switch (cat) {
      case 'CAFE':
        return '카페';
      case 'RESTAURANT':
        return '맛집';
      case 'ATTRACTION':
        return '명소';
      case 'LODGING':
        return '숙소';
      case 'SHOPPING':
        return '쇼핑';
      default:
        return '장소';
    }
  };

  const schedulesCount = currentTrip?.schedules?.length || 3;
  const scheduleDays = Array.from({ length: schedulesCount }, (_, i) => i + 1);

  const activePlace = selectedItem || results[0] || null;
  const mapLat = activePlace?.latitude || currentTrip?.centerLat || 35.6762;
  const mapLng = activePlace?.longitude || currentTrip?.centerLng || 139.6503;

  const leafletHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #E5E7EB; }
        .leaflet-control-attribution, .leaflet-control-zoom { display: none !important; }
        .navy-pin {
          width: 44px; height: 44px;
          background: #1B2A4A;
          border: 3px solid #FFFFFF;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 6px 16px rgba(27,42,74,0.38);
          display: flex; align-items: center; justify-content: center;
        }
        .navy-pin-inner {
          width: 14px; height: 14px;
          background: #FFFFFF;
          border-radius: 50%;
          transform: rotate(45deg);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false }).setView([${mapLat}, ${mapLng}], 15);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 19
        }).addTo(map);
        var icon = L.divIcon({
          className: '',
          html: '<div class="navy-pin"><div class="navy-pin-inner"></div></div>',
          iconSize: [44, 44],
          iconAnchor: [22, 44]
        });
        L.marker([${mapLat}, ${mapLng}], { icon: icon }).addTo(map);
      </script>
    </body>
    </html>
  `;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: Math.max(insets.top, 14) }]}>
        {/* ==================== 1. 상단 검색 바 (레퍼런스 5 스타일: X + 둥근 검색 필 + ⊗) ==================== */}
        <View style={styles.topSearchRow}>
          <TouchableOpacity onPress={onClose} style={styles.closeXBtn} activeOpacity={0.7}>
            <X size={24} color="#111827" />
          </TouchableOpacity>

          <View style={styles.searchPillBar}>
            <Search size={18} color="#6B7280" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="장소, 맛집, 카페, 주소 검색"
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearCircleBtn}
                activeOpacity={0.75}
              >
                <X size={12} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 카테고리 칩 바 */}
        <View style={styles.categoryWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.map((cat) => {
              const selected = selectedCategory === cat.value;
              return (
                <TouchableOpacity
                  key={cat.value}
                  onPress={() => setSelectedCategory(cat.value)}
                  style={[styles.categoryChip, selected && styles.categoryChipActive]}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[styles.categoryChipText, selected && styles.categoryChipTextActive]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ==================== 2. 풀스크린 지도 + 플로팅 하단 카드 (레퍼런스 5 스타일) ==================== */}
        <View style={styles.mapAreaContainer}>
          {Platform.OS === 'web' ? (
            <iframe
              title="Place Search Map"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapLng - 0.015}%2C${mapLat - 0.012}%2C${mapLng + 0.015}%2C${mapLat + 0.012}&layer=mapnik&marker=${mapLat}%2C${mapLng}`}
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          ) : (
            <WebView
              key={`${mapLat}_${mapLng}`}
              originWhitelist={['*']}
              source={{ html: leafletHtml }}
              style={{ flex: 1 }}
              scrollEnabled={false}
            />
          )}

          {/* 검색 결과 가로 선택 칩 (여러 결과가 있을 때 빠르게 핀 이동) */}
          {results.length > 1 && (
            <View style={styles.floatingResultsStrip}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
              >
                {results.slice(0, 12).map((item) => {
                  const isSelected = activePlace?.id === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.85}
                      onPress={() => setSelectedItem(item)}
                      style={[
                        styles.resultMiniPill,
                        isSelected && styles.resultMiniPillActive,
                      ]}
                    >
                      <MapPin
                        size={13}
                        color={isSelected ? '#FFFFFF' : '#1B2A4A'}
                        fill={isSelected ? '#FFFFFF' : 'none'}
                      />
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

          {/* 하단 플로팅 화이트 카드 (레퍼런스 5 스타일: 장소명 / 주소 / [도로명] 상세 / [이 위치 추가하기]) */}
          <View
            style={[
              styles.floatingBottomCard,
              { marginBottom: Math.max(insets.bottom, 16) + 8 },
            ]}
          >
            {isSearching ? (
              <View style={styles.cardLoadingBox}>
                <ActivityIndicator size="small" color="#1B2A4A" />
                <Text style={styles.cardLoadingText}>장소 위치를 찾는 중...</Text>
              </View>
            ) : activePlace ? (
              <>
                <View style={styles.cardTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardPlaceTitle} numberOfLines={1}>
                      {activePlace.name}
                    </Text>
                    <Text style={styles.cardPrimaryAddress} numberOfLines={1}>
                      {activePlace.address}
                    </Text>
                  </View>
                  {activePlace.imageUrl ? (
                    <Image
                      source={{ uri: activePlace.imageUrl }}
                      style={styles.cardPlaceThumb}
                    />
                  ) : null}
                </View>

                <View style={styles.cardSecondaryRow}>
                  <View style={styles.boxedTag}>
                    <Text style={styles.boxedTagText}>
                      {getCategoryBadgeLabel(activePlace.category)}
                    </Text>
                  </View>
                  <Text style={styles.cardSecondaryText} numberOfLines={1}>
                    {activePlace.memo || `${activeTripTitle} 추천 스팟`}
                  </Text>
                  {activePlace.rating ? (
                    <View style={styles.ratingInline}>
                      <Star size={12} color="#F59E0B" fill="#F59E0B" />
                      <Text style={styles.ratingInlineText}>
                        {activePlace.rating.toFixed(1)}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.cardCtaRow}>
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={() => handleSaveToPocket(activePlace)}
                    style={[
                      styles.addLocationBtn,
                      savedPlaceIds[activePlace.name.trim().toLowerCase()] &&
                        styles.addLocationBtnSaved,
                    ]}
                  >
                    <Text style={styles.addLocationBtnText}>
                      {savedPlaceIds[activePlace.name.trim().toLowerCase()]
                        ? '보관함에 추가됨'
                        : '이 위치 추가하기'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setSelectedPlaceForSchedule(activePlace)}
                    style={styles.scheduleOutlineBtn}
                  >
                    <Plus size={16} color="#1B2A4A" />
                    <Text style={styles.scheduleOutlineBtnText}>일정 넣기</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.cardLoadingBox}>
                <Text style={styles.cardLoadingText}>
                  검색어를 입력해 원하는 위치를 찾아보세요.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 일정 날짜 선택 서브 모달 */}
        {selectedPlaceForSchedule && (
          <View style={styles.dayPickerOverlay}>
            <View style={styles.dayPickerCard}>
              <Text style={styles.dayPickerTitle}>{selectedPlaceForSchedule.name}</Text>
              <Text style={styles.dayPickerSubtitle}>어느 날짜 일정에 추가할까요?</Text>

              <View style={styles.dayPickerGrid}>
                {scheduleDays.map((day) => (
                  <TouchableOpacity
                    key={day}
                    onPress={() => handleConfirmAddToSchedule(day)}
                    style={styles.dayChoiceBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.dayChoiceBtnText}>DAY {day}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => setSelectedPlaceForSchedule(null)}
                style={styles.dayCancelBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.dayCancelBtnText}>닫기</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  clearCircleBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryWrap: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
    paddingBottom: 10,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  categoryChipActive: {
    backgroundColor: '#1B2A4A',
  },
  categoryChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#4B5563',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  mapAreaContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#E5E7EB',
  },
  floatingResultsStrip: {
    position: 'absolute',
    top: 14,
    left: 0,
    right: 0,
  },
  resultMiniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: 180,
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
    borderRadius: 16,
    padding: 20,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  cardLoadingBox: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cardLoadingText: {
    fontSize: 13.5,
    color: '#6B7280',
    fontWeight: '500',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardPlaceTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  cardPrimaryAddress: {
    fontSize: 14.5,
    fontWeight: '500',
    color: '#374151',
  },
  cardPlaceThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    marginLeft: 12,
    backgroundColor: '#F3F4F6',
  },
  cardSecondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 8,
  },
  boxedTag: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  boxedTagText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  cardSecondaryText: {
    fontSize: 13,
    color: '#9CA3AF',
    flex: 1,
  },
  ratingInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingInlineText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#4B5563',
  },
  cardCtaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  addLocationBtn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#1B2A4A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLocationBtnSaved: {
    backgroundColor: '#334155',
  },
  addLocationBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '700',
  },
  scheduleOutlineBtn: {
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1B2A4A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
  },
  scheduleOutlineBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1B2A4A',
  },
  dayPickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(17, 24, 39, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  dayPickerCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
  },
  dayPickerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  dayPickerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 16,
  },
  dayPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  dayChoiceBtn: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#1B2A4A',
  },
  dayChoiceBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  dayCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  dayCancelBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#6B7280',
  },
});
