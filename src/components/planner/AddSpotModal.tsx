import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlaceStore } from '../../store/usePlaceStore';
import { useTripStore } from '../../store/useTripStore';
import type { Place, PlaceCategory } from '../../types';
import {
  Bookmark,
  Plus,
  Search,
  X,
  MapPin,
  Sparkles,
  Check,
  Building,
} from 'lucide-react-native';

interface AddSpotModalProps {
  visible: boolean;
  onClose: () => void;
  dayNumber: number;
  existingPlaceIds: string[];
  onSelectPlace: (place: Place) => void;
}

export const AddSpotModal: React.FC<AddSpotModalProps> = ({
  visible,
  onClose,
  dayNumber,
  existingPlaceIds,
  onSelectPlace,
}) => {
  const insets = useSafeAreaInsets();
  const { currentTrip } = useTripStore();
  const [tab, setTab] = useState<'pocket' | 'manual'>('pocket');
  const [pocketScope, setPocketScope] = useState<'trip' | 'all'>('trip');
  const [searchQuery, setSearchQuery] = useState('');
  const [failedImageIds, setFailedImageIds] = useState<Record<string, boolean>>({});

  // Manual Form
  const [manualName, setManualName] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [manualCategory, setManualCategory] = useState<PlaceCategory>('CAFE');

  const { places, addPlace } = usePlaceStore();

  const tripPlaces = useMemo(() => {
    return places.filter((p) => !p.trip_id || p.trip_id === currentTrip?.id);
  }, [places, currentTrip?.id]);

  // Filter pocket places based on scope and search
  const displayedPocketPlaces = useMemo(() => {
    const baseList = pocketScope === 'trip' ? tripPlaces : places;
    if (!searchQuery.trim()) return baseList;

    const q = searchQuery.toLowerCase().trim();
    return baseList.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        (p.address && p.address.toLowerCase().includes(q)) ||
        (p.memo && p.memo.toLowerCase().includes(q))
      );
    });
  }, [pocketScope, tripPlaces, places, searchQuery]);

  const handleSelectPocketPlace = (place: Place) => {
    onSelectPlace(place);
    onClose();
  };

  const handleCreateManualPlace = () => {
    if (!manualName.trim()) {
      Alert.alert('알림', '장소 이름을 입력해주세요.');
      return;
    }

    const targetTripId = currentTrip?.id || 't_tokyo';
    const isOsaka = targetTripId === 't_osaka';

    const newPlace: Place = {
      id: `p_manual_${Date.now()}`,
      trip_id: targetTripId,
      name: manualName.trim(),
      address: manualAddress.trim() || `${currentTrip?.destination || '현지'} 추천 스팟`,
      category: manualCategory,
      latitude: isOsaka ? 34.6937 + (Math.random() - 0.5) * 0.04 : 35.6762 + (Math.random() - 0.5) * 0.04,
      longitude: isOsaka ? 135.5023 + (Math.random() - 0.5) * 0.04 : 139.6503 + (Math.random() - 0.5) * 0.04,
      isPinned: true,
      createdAt: new Date().toISOString(),
      sourcePlatform: 'manual',
    };

    // Save to pocket store with current tripId
    addPlace(newPlace, targetTripId);

    // Add to schedule
    onSelectPlace(newPlace);

    // Reset Form
    setManualName('');
    setManualAddress('');
    onClose();
  };

  const CATEGORY_CHOICES: { key: PlaceCategory; label: string }[] = [
    { key: 'CAFE', label: '☕ 카페' },
    { key: 'RESTAURANT', label: '🍴 맛집' },
    { key: 'ATTRACTION', label: '📸 명소' },
    { key: 'SHOPPING', label: '🛍️ 쇼핑' },
    { key: 'LODGING', label: '🏨 숙소' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Backdrop touchable to close */}
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.sheet, { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Plus size={18} color="#FF6B6B" />
              </View>
              <View>
                <Text style={styles.title}>DAY {dayNumber} 스팟 추가</Text>
                <Text style={styles.subtitle}>
                  {currentTrip?.title || '여행'} 보관함에서 핀치하거나 새 장소를 등록하세요
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Segmented Tabs */}
          <View style={styles.tabTrack}>
            <TouchableOpacity
              onPress={() => setTab('pocket')}
              style={[styles.tabBtn, tab === 'pocket' && styles.tabBtnActive]}
            >
              <Bookmark size={14} color={tab === 'pocket' ? '#FF6B6B' : '#6B7280'} style={{ marginRight: 6 }} />
              <Text style={[styles.tabText, tab === 'pocket' && styles.tabTextActive]}>
                보관함에서 선택 ({displayedPocketPlaces.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setTab('manual')}
              style={[styles.tabBtn, tab === 'manual' && styles.tabBtnActive]}
            >
              <Plus size={14} color={tab === 'manual' ? '#FF6B6B' : '#6B7280'} style={{ marginRight: 6 }} />
              <Text style={[styles.tabText, tab === 'manual' && styles.tabTextActive]}>
                새 장소 직접 등록
              </Text>
            </TouchableOpacity>
          </View>

          {tab === 'pocket' ? (
            <View style={{ flex: 1 }}>
              {/* Trip vs All Scope Filter Pills */}
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
                <TouchableOpacity
                  onPress={() => setPocketScope('trip')}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                    backgroundColor: pocketScope === 'trip' ? '#0F172A' : '#F1F5F9',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: pocketScope === 'trip' ? '#FFFFFF' : '#64748B',
                    }}
                  >
                    📍 {currentTrip?.title ? currentTrip.title.slice(0, 10) + '...' : '현재 여행'} ({tripPlaces.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setPocketScope('all')}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                    backgroundColor: pocketScope === 'all' ? '#0F172A' : '#F1F5F9',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: pocketScope === 'all' ? '#FFFFFF' : '#64748B',
                    }}
                  >
                    전체 보관함 ({places.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Search Bar */}
              <View style={styles.searchBar}>
                <Search size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="보관함 장소 검색 (예: 푸글렌, 빔즈)"
                  placeholderTextColor="#9CA3AF"
                  style={styles.searchInput}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={15} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Places List */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
              >
                {displayedPocketPlaces.length > 0 ? (
                  displayedPocketPlaces.map((place) => {
                    const isAlreadyAdded = existingPlaceIds.includes(place.id);
                    const hasImage = place.imageUrl && !failedImageIds[place.id];

                    return (
                      <TouchableOpacity
                        key={place.id}
                        activeOpacity={0.8}
                        onPress={() => handleSelectPocketPlace(place)}
                        style={[
                          styles.placeCard,
                          isAlreadyAdded && { opacity: 0.85, borderColor: '#CBD5E1' },
                        ]}
                      >
                        {hasImage ? (
                          <Image
                            source={{ uri: place.imageUrl }}
                            style={styles.placeImage}
                            resizeMode="cover"
                            onError={() =>
                              setFailedImageIds((prev) => ({ ...prev, [place.id]: true }))
                            }
                          />
                        ) : (
                          <View
                            style={[
                              styles.placeImage,
                              {
                                backgroundColor: '#F1F5F9',
                                alignItems: 'center',
                                justifyContent: 'center',
                              },
                            ]}
                          >
                            <MapPin size={20} color="#FF6B6B" />
                          </View>
                        )}
                        <View style={styles.placeDetails}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <View style={styles.categoryBadge}>
                              <Text style={styles.categoryBadgeText}>
                                {place.category === 'CAFE' || place.category === 'cafe'
                                  ? '☕ 카페'
                                  : place.category === 'RESTAURANT' || place.category === 'restaurant'
                                  ? '🍴 맛집'
                                  : place.category === 'SHOPPING' || place.category === 'shopping'
                                  ? '🛍️ 쇼핑'
                                  : place.category === 'LODGING' || place.category === 'stay'
                                  ? '🏨 숙소'
                                  : '📸 명소'}
                              </Text>
                            </View>
                            {isAlreadyAdded && (
                              <View
                                style={{
                                  backgroundColor: '#E0F2FE',
                                  paddingHorizontal: 6,
                                  paddingVertical: 2,
                                  borderRadius: 6,
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 9,
                                    fontWeight: '800',
                                    color: '#0284C7',
                                  }}
                                >
                                  ✓ 일정에 추가됨
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.placeNameText} numberOfLines={1}>
                            {place.name}
                          </Text>
                          <Text style={styles.placeAddressText} numberOfLines={1}>
                            {place.address}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.addIconCircle,
                            isAlreadyAdded && { backgroundColor: '#F1F5F9' },
                          ]}
                        >
                          {isAlreadyAdded ? (
                            <Check size={16} color="#0284C7" />
                          ) : (
                            <Plus size={16} color="#FF6B6B" />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={styles.emptyContainer}>
                    <Bookmark size={36} color="#CBD5E1" />
                    <Text style={styles.emptyTitle}>추가 가능한 장소가 없습니다</Text>
                    <Text style={styles.emptySubtitle}>
                      {searchQuery
                        ? '검색어와 일치하는 장소가 없어요.'
                        : '선택한 보관함에 장소가 아직 등록되지 않았어요.'}
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>장소 이름 *</Text>
                <TextInput
                  value={manualName}
                  onChangeText={setManualName}
                  placeholder="예: 시부야 스카이 전망대"
                  placeholderTextColor="#9CA3AF"
                  style={styles.formInput}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>주소 또는 위치 메모</Text>
                <TextInput
                  value={manualAddress}
                  onChangeText={setManualAddress}
                  placeholder="예: 도쿄도 시부야구 2-24-12"
                  placeholderTextColor="#9CA3AF"
                  style={styles.formInput}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>카테고리</Text>
                <View style={styles.catGrid}>
                  {CATEGORY_CHOICES.map((c) => {
                    const isSelected = manualCategory === c.key;
                    return (
                      <TouchableOpacity
                        key={c.key}
                        onPress={() => setManualCategory(c.key)}
                        style={[
                          styles.catPill,
                          isSelected && styles.catPillActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.catPillText,
                            isSelected && styles.catPillTextActive,
                          ]}
                        >
                          {c.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleCreateManualPlace}
                style={styles.submitManualBtn}
              >
                <Text style={styles.submitManualBtnText}>일정에 바로 추가하기</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 0,
    maxHeight: '86%',
    minHeight: 440,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  tabTrack: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FF6B6B',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    padding: 0,
  },
  listContent: {
    paddingBottom: 24,
  },
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 10,
    marginBottom: 8,
  },
  placeImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 10,
  },
  placeDetails: {
    flex: 1,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 2,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FF6B6B',
  },
  placeNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 1,
  },
  placeAddressText: {
    fontSize: 11,
    color: '#64748B',
  },
  addIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
    marginTop: 10,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  formGroup: {
    marginBottom: 14,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  catPillActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  catPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  catPillTextActive: {
    color: '#FFFFFF',
  },
  submitManualBtn: {
    backgroundColor: '#FF6B6B',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitManualBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
