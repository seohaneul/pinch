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
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  X,
  MapPin,
  Star,
  Bookmark,
  Check,
  Plus,
  Sparkles,
  Filter,
  Navigation,
  Compass,
} from 'lucide-react-native';
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
  { label: '☕ 카페', value: 'CAFE' },
  { label: '🍴 맛집', value: 'RESTAURANT' },
  { label: '📸 명소', value: 'ATTRACTION' },
  { label: '🏨 숙소', value: 'LODGING' },
  { label: '🛍️ 쇼핑', value: 'SHOPPING' },
];

const POPULAR_SUGGESTIONS = [
  '투몬 비치',
  '사랑의 절벽',
  '괌 프리미어 아울렛',
  '두짓타니 괌',
  '이치란 라멘',
  '블루보틀',
  '도쿄 타워',
  '돈키호테',
  '후시미 이나리',
  '유니버셜 스튜디오',
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

  const activeTripId = tripId || currentTrip?.id || 't_tokyo';
  const activeTripTitle = tripTitle || currentTrip?.title || '여행';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory | 'ALL'>('ALL');
  const [results, setResults] = useState<SearchPlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [savedPlaceIds, setSavedPlaceIds] = useState<Record<string, boolean>>({});
  const [failedImageIds, setFailedImageIds] = useState<Record<string, boolean>>({});

  // Day picker state for adding directly to schedule
  const [selectedPlaceForSchedule, setSelectedPlaceForSchedule] = useState<SearchPlaceResult | null>(null);

  // Sync saved places in this trip
  useEffect(() => {
    const map: Record<string, boolean> = {};
    places.forEach((p) => {
      if (p.trip_id === activeTripId || !p.trip_id) {
        map[p.name.trim().toLowerCase()] = true;
      }
    });
    setSavedPlaceIds(map);
  }, [places, activeTripId, visible]);

  // Execute live search
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
        }
      } catch {
        if (!isCancelled) setResults([]);
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

  // Convert SearchPlaceResult to Place
  const convertToPlace = (item: SearchPlaceResult): Place => {
    return {
      id: `p_search_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      trip_id: activeTripId,
      name: item.name,
      address: item.address,
      category: item.category,
      latitude: item.latitude,
      longitude: item.longitude,
      memo: item.memo || '직접 검색하여 보관함에 저장한 장소',
      imageUrl: item.imageUrl,
      rating: item.rating || 4.8,
      isPinned: true,
      createdAt: new Date().toISOString(),
      tags: [item.category, '검색추가'],
    };
  };

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
        '보관함에 저장 완료 📌',
        `"${item.name}" 장소를 "${activeTripTitle}" 보관함에 담았습니다!\n이제 일정 및 지도에서 자유롭게 확인하실 수 있습니다.`
      );
    }
  };

  const handleOpenDayPicker = (item: SearchPlaceResult) => {
    setSelectedPlaceForSchedule(item);
  };

  const handleConfirmAddToSchedule = (dayNumber: number) => {
    if (!selectedPlaceForSchedule) return;
    const place = convertToPlace(selectedPlaceForSchedule);
    
    // Automatically save to pocket as well
    addPlace(place, activeTripId);
    setSavedPlaceIds((prev) => ({
      ...prev,
      [selectedPlaceForSchedule.name.trim().toLowerCase()]: true,
    }));

    // Add to schedule
    if (onAddToSchedule) {
      onAddToSchedule(dayNumber, place);
    } else {
      addPlaceToSchedule(dayNumber, place);
    }

    Alert.alert(
      '일정에 추가 완료 🤏',
      `"${selectedPlaceForSchedule.name}" 장소를 DAY ${dayNumber} 일정과 보관함에 추가했습니다!`
    );
    setSelectedPlaceForSchedule(null);
  };

  const getCategoryBadgeLabel = (cat: PlaceCategory) => {
    switch (cat) {
      case 'CAFE':
        return '☕ 카페';
      case 'RESTAURANT':
        return '🍴 맛집';
      case 'ATTRACTION':
        return '📸 명소';
      case 'LODGING':
        return '🏨 숙소';
      case 'SHOPPING':
        return '🛍️ 쇼핑';
      default:
        return '📍 장소';
    }
  };

  const schedulesCount = currentTrip?.schedules?.length || 3;
  const scheduleDays = Array.from({ length: schedulesCount }, (_, i) => i + 1);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.iconCircle}>
                  <Compass size={20} color="#FF6B6B" />
                </View>
                <View>
                  <Text style={styles.headerTitle}>장소 검색 & 직접 저장 🔍</Text>
                  <Text style={styles.headerSubtitle}>
                    {activeTripTitle} · 이름만 검색하면 위치와 함께 즉시 저장돼요
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Search Input Bar */}
            <View style={styles.searchBar}>
              <Search size={18} color="#FF6B6B" style={{ marginRight: 8 }} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="장소명, 맛집, 카페, 관광지 검색 (예: 투몬 비치)"
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
                autoFocus={true}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                  <X size={15} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Category Filter Chips */}
            <View style={styles.categoryRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                {CATEGORIES.map((cat) => {
                  const selected = selectedCategory === cat.value;
                  return (
                    <TouchableOpacity
                      key={cat.value}
                      onPress={() => setSelectedCategory(cat.value)}
                      style={[styles.categoryChip, selected && styles.categoryChipActive]}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.categoryChipText, selected && styles.categoryChipTextActive]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Popular Suggestions when query is short */}
            {searchQuery.trim().length === 0 && (
              <View style={styles.suggestionBox}>
                <View style={styles.suggestionTitleRow}>
                  <Sparkles size={14} color="#FF6B6B" style={{ marginRight: 6 }} />
                  <Text style={styles.suggestionTitle}>추천 인기 스팟 검색어:</Text>
                </View>
                <View style={styles.suggestionChips}>
                  {POPULAR_SUGGESTIONS.map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => setSearchQuery(tag)}
                      style={styles.suggestionChip}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.suggestionChipText}>{tag}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Results Status Header */}
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCountText}>
                {isSearching ? '장소 검색 중...' : `검색 결과 ${results.length}개`}
              </Text>
              {isSearching && <ActivityIndicator size="small" color="#FF6B6B" />}
            </View>

            {/* Results List */}
            <ScrollView
              style={styles.resultsList}
              contentContainerStyle={styles.resultsContent}
              keyboardShouldPersistTaps="handled"
            >
              {results.length === 0 && !isSearching ? (
                <View style={styles.emptyContainer}>
                  <MapPin size={36} color="#CBD5E1" style={{ marginBottom: 10 }} />
                  <Text style={styles.emptyTitle}>
                    {searchQuery.trim() ? `"${searchQuery}"에 해당하는 장소를 찾지 못했습니다.` : '검색어를 입력해보세요.'}
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    유명 핫플 이름, 건물명, 또는 도시명을 입력하면 실시간 위치가 조회됩니다.
                  </Text>
                </View>
              ) : (
                results.map((item) => {
                  const isSaved = Boolean(savedPlaceIds[item.name.trim().toLowerCase()]);
                  const hasImg = item.imageUrl && !failedImageIds[item.id];

                  return (
                    <View key={item.id} style={styles.placeCard}>
                      {/* Place Image */}
                      {hasImg ? (
                        <Image
                          source={{ uri: item.imageUrl }}
                          style={styles.placeImage}
                          onError={() => setFailedImageIds((p) => ({ ...p, [item.id]: true }))}
                        />
                      ) : (
                        <View style={styles.placeImagePlaceholder}>
                          <MapPin size={24} color="#FF6B6B" />
                        </View>
                      )}

                      {/* Content */}
                      <View style={styles.placeInfo}>
                        <View style={styles.placeHeaderRow}>
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>{getCategoryBadgeLabel(item.category)}</Text>
                          </View>
                          {item.rating && (
                            <View style={styles.ratingBadge}>
                              <Star size={11} color="#EAB308" fill="#EAB308" style={{ marginRight: 3 }} />
                              <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                            </View>
                          )}
                        </View>

                        <Text style={styles.placeName} numberOfLines={1}>
                          {item.name}
                        </Text>

                        <View style={styles.addressRow}>
                          <MapPin size={12} color="#64748B" style={{ marginRight: 4 }} />
                          <Text style={styles.placeAddress} numberOfLines={2}>
                            {item.address}
                          </Text>
                        </View>

                        {item.memo && (
                          <Text style={styles.placeMemo} numberOfLines={1}>
                            💡 {item.memo}
                          </Text>
                        )}

                        {/* Action Buttons */}
                        <View style={styles.actionRow}>
                          <TouchableOpacity
                            onPress={() => handleSaveToPocket(item)}
                            style={[styles.saveBtn, isSaved && styles.saveBtnActive]}
                            activeOpacity={0.8}
                          >
                            {isSaved ? (
                              <>
                                <Check size={13} color="#059669" style={{ marginRight: 4 }} />
                                <Text style={styles.saveBtnTextActive}>보관함 저장됨</Text>
                              </>
                            ) : (
                              <>
                                <Bookmark size={13} color="#FF6B6B" style={{ marginRight: 4 }} />
                                <Text style={styles.saveBtnText}>보관함에 저장</Text>
                              </>
                            )}
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => handleOpenDayPicker(item)}
                            style={styles.addToScheduleBtn}
                            activeOpacity={0.8}
                          >
                            <Plus size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                            <Text style={styles.addToScheduleBtnText}>일정 추가</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Sub-modal: Quick Day Picker for adding directly to itinerary */}
            {selectedPlaceForSchedule && (
              <View style={styles.dayPickerOverlay}>
                <View style={styles.dayPickerCard}>
                  <Text style={styles.dayPickerTitle}>
                    "{selectedPlaceForSchedule.name}"
                  </Text>
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
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    minHeight: '75%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 18,
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FFE4E6',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    padding: 0,
  },
  clearBtn: {
    padding: 4,
  },
  categoryRow: {
    marginBottom: 8,
  },
  categoryScroll: {
    paddingHorizontal: 18,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  categoryChipActive: {
    backgroundColor: '#FF6B6B',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  suggestionBox: {
    marginHorizontal: 18,
    marginVertical: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FFF7F7',
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  suggestionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E11D48',
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suggestionChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  suggestionChipText: {
    fontSize: 11,
    color: '#9F1239',
    fontWeight: '600',
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  resultsCountText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  resultsList: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: 18,
    paddingBottom: 24,
    gap: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
  placeCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  placeImage: {
    width: 86,
    height: 94,
    borderRadius: 12,
    marginRight: 12,
  },
  placeImagePlaceholder: {
    width: 86,
    height: 94,
    borderRadius: 12,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  placeInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  placeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#854D0E',
  },
  placeName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 3,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  placeAddress: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
    lineHeight: 15,
  },
  placeMemo: {
    fontSize: 10,
    color: '#059669',
    marginBottom: 6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  saveBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  saveBtnActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  saveBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E11D48',
  },
  saveBtnTextActive: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  addToScheduleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#1E293B',
  },
  addToScheduleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dayPickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dayPickerCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  dayPickerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
  },
  dayPickerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
  },
  dayPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    width: '100%',
    marginBottom: 16,
  },
  dayChoiceBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    minWidth: 80,
    alignItems: 'center',
  },
  dayChoiceBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dayCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  dayCancelBtnText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
});
