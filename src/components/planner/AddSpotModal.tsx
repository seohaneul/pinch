import React, { useState, useMemo, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlaceStore } from '../../store/usePlaceStore';
import { useSavedLinkStore } from '../../store/useSavedLinkStore';
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
  Hotel,
  Tag,
  Star,
  Compass,
} from 'lucide-react-native';
import { searchPlaces, SearchPlaceResult } from '../../services/placeSearchService';

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
  const { currentTrip, getDayLodging } = useTripStore();
  const { places, addPlace } = usePlaceStore();
  const { savedLinks } = useSavedLinkStore();

  const [tab, setTab] = useState<'pocket' | 'search' | 'manual'>('pocket');
  const [pocketScope, setPocketScope] = useState<'trip' | 'all'>('trip');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [failedImageIds, setFailedImageIds] = useState<Record<string, boolean>>({});

  // Online Place Search State
  const [searchQueryOnline, setSearchQueryOnline] = useState('');
  const [searchResultsOnline, setSearchResultsOnline] = useState<SearchPlaceResult[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);

  // Manual Form
  const [manualName, setManualName] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [manualCategory, setManualCategory] = useState<PlaceCategory>('CAFE');

  const dayLodging = getDayLodging(dayNumber);

  // Synchronize ALL saved pocket places: both usePlaceStore and useSavedLinkStore extractedPlaces
  const allPocketPlaces = useMemo(() => {
    const combined: Place[] = [...places];

    savedLinks.forEach((link) => {
      link.extractedPlaces.forEach((ep) => {
        const alreadyExists = combined.some(
          (p) =>
            p.id === ep.id ||
            p.name.trim().toLowerCase() === ep.name.trim().toLowerCase()
        );
        if (!alreadyExists) {
          combined.push({
            id: ep.id,
            trip_id: link.trip_id,
            name: ep.name,
            address: ep.address,
            category: ep.category,
            latitude: ep.latitude,
            longitude: ep.longitude,
            memo: ep.memo || `${link.title}에서 보관된 장소`,
            imageUrl: ep.imageUrl,
            rating: ep.rating || 4.8,
            isPinned: true,
            createdAt: link.createdAt,
            tags: ep.tags,
            sourcePlatform: link.platform,
          });
        }
      });
    });

    return combined;
  }, [places, savedLinks]);

  const activeTripId = currentTrip?.id || 't_tokyo';

  const tripPocketPlaces = useMemo(() => {
    return allPocketPlaces.filter((p) => {
      if (activeTripId === 't_tokyo') {
        return !p.trip_id || p.trip_id === 't_tokyo';
      }
      return p.trip_id === activeTripId;
    });
  }, [allPocketPlaces, activeTripId]);

  // Filter pocket places based on scope, category filter and search query
  const displayedPocketPlaces = useMemo(() => {
    const baseList = pocketScope === 'trip' ? tripPocketPlaces : allPocketPlaces;

    return baseList.filter((p) => {
      // Category filter
      if (selectedCategory !== 'ALL') {
        const pCat = (p.category || '').toUpperCase();
        const filterCat = selectedCategory.toUpperCase();
        if (filterCat === 'LODGING') {
          if (pCat !== 'LODGING' && pCat !== 'STAY') return false;
        } else if (filterCat === 'CAFE') {
          if (pCat !== 'CAFE') return false;
        } else if (filterCat === 'RESTAURANT') {
          if (pCat !== 'RESTAURANT') return false;
        } else if (filterCat === 'ATTRACTION') {
          if (pCat !== 'ATTRACTION' && pCat !== 'SPOT') return false;
        } else if (filterCat === 'SHOPPING') {
          if (pCat !== 'SHOPPING') return false;
        }
      }

      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.address && p.address.toLowerCase().includes(q)) ||
        (p.memo && p.memo.toLowerCase().includes(q)) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
      );
    });
  }, [pocketScope, tripPocketPlaces, allPocketPlaces, selectedCategory, searchQuery]);

  const handleSelectPocketPlace = (place: Place) => {
    onSelectPlace(place);
    onClose();
  };

  // Add current Day's Lodging as spot
  const handleAddDayLodgingAsSpot = () => {
    if (!dayLodging) return;

    const lodgingPlace: Place = {
      id: `lodging_spot_${dayNumber}_${Date.now()}`,
      trip_id: activeTripId,
      name: dayLodging.name,
      address: dayLodging.address || `${currentTrip?.destination || '현지'} 숙소`,
      category: 'LODGING',
      latitude: dayLodging.latitude || (activeTripId === 't_osaka' ? 34.6937 : 35.6858),
      longitude: dayLodging.longitude || (activeTripId === 't_osaka' ? 135.5023 : 139.6908),
      memo: dayLodging.memo || `DAY ${dayNumber} 숙소 체크인 (${dayLodging.checkInTime || '15:00'})`,
      imageUrl: dayLodging.imageUrl,
      isPinned: true,
      createdAt: new Date().toISOString(),
      sourcePlatform: 'manual',
    };

    onSelectPlace(lodgingPlace);
    onClose();
    Alert.alert('숙소 스팟 추가 완료 🏨', `"${dayLodging.name}"가 DAY ${dayNumber} 일정 스팟으로 추가되었습니다.`);
  };

  const handleCreateManualPlace = () => {
    if (!manualName.trim()) {
      Alert.alert('알림', '장소 이름을 입력해주세요.');
      return;
    }

    const isOsaka = activeTripId === 't_osaka';

    const newPlace: Place = {
      id: `p_manual_${Date.now()}`,
      trip_id: activeTripId,
      name: manualName.trim(),
      address: manualAddress.trim() || `${currentTrip?.destination || '현지'} 추천 장소`,
      category: manualCategory,
      latitude: isOsaka ? 34.6937 + (Math.random() - 0.5) * 0.04 : 35.6762 + (Math.random() - 0.5) * 0.04,
      longitude: isOsaka ? 135.5023 + (Math.random() - 0.5) * 0.04 : 139.6503 + (Math.random() - 0.5) * 0.04,
      memo: manualCategory === 'LODGING' ? '호텔/숙소 스팟' : undefined,
      isPinned: true,
      createdAt: new Date().toISOString(),
      sourcePlatform: 'manual',
    };

    // Save to pocket store
    addPlace(newPlace, activeTripId);

    // Add to schedule
    onSelectPlace(newPlace);

    // Reset Form
    setManualName('');
    setManualAddress('');
    onClose();
  };

  // Online search effect
  useEffect(() => {
    if (tab !== 'search') return;
    let isCancelled = false;
    const doSearch = async () => {
      setIsSearchingOnline(true);
      try {
        const res = await searchPlaces(searchQueryOnline);
        if (!isCancelled) setSearchResultsOnline(res);
      } catch {
        if (!isCancelled) setSearchResultsOnline([]);
      } finally {
        if (!isCancelled) setIsSearchingOnline(false);
      }
    };
    const timer = setTimeout(doSearch, 200);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchQueryOnline, tab]);

  const handleSelectOnlinePlace = (item: SearchPlaceResult) => {
    const newPlace: Place = {
      id: `p_search_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      trip_id: activeTripId,
      name: item.name,
      address: item.address,
      category: item.category,
      latitude: item.latitude,
      longitude: item.longitude,
      memo: item.memo || '검색하여 일정에 추가한 장소',
      imageUrl: item.imageUrl,
      rating: item.rating || 4.8,
      isPinned: true,
      createdAt: new Date().toISOString(),
      sourcePlatform: 'manual',
      tags: [item.category, '직접검색'],
    };

    addPlace(newPlace, activeTripId);
    onSelectPlace(newPlace);
    Alert.alert(
      '일정에 추가 완료 🤏',
      `"${item.name}" 장소를 DAY ${dayNumber} 일정 및 보관함에 추가했습니다!`
    );
    onClose();
  };

  const handleSaveOnlinePlaceToPocketOnly = (item: SearchPlaceResult) => {
    const newPlace: Place = {
      id: `p_search_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      trip_id: activeTripId,
      name: item.name,
      address: item.address,
      category: item.category,
      latitude: item.latitude,
      longitude: item.longitude,
      memo: item.memo || '검색하여 보관함에 담은 장소',
      imageUrl: item.imageUrl,
      rating: item.rating || 4.8,
      isPinned: true,
      createdAt: new Date().toISOString(),
      sourcePlatform: 'manual',
      tags: [item.category, '직접검색'],
    };

    const ok = addPlace(newPlace, activeTripId);
    if (ok) {
      Alert.alert('보관함 저장 완료 📌', `"${item.name}" 장소를 보관함에 담았습니다.`);
    }
  };

  const CATEGORY_TABS = [
    { key: 'ALL', label: '전체' },
    { key: 'CAFE', label: '☕ 카페' },
    { key: 'RESTAURANT', label: '🍴 맛집' },
    { key: 'ATTRACTION', label: '📸 명소' },
    { key: 'LODGING', label: '🏨 숙소' },
    { key: 'SHOPPING', label: '🛍️ 쇼핑' },
  ];

  const CATEGORY_CHOICES: { key: PlaceCategory; label: string }[] = [
    { key: 'CAFE', label: '☕ 카페' },
    { key: 'RESTAURANT', label: '🍴 맛집' },
    { key: 'ATTRACTION', label: '📸 명소' },
    { key: 'LODGING', label: '🏨 숙소/호텔' },
    { key: 'SHOPPING', label: '🛍️ 쇼핑' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
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
                  보관함에 저장된 장소 & 숙소를 일정에 핀치하세요
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Segmented Tabs */}
          <View style={styles.tabTrack}>
            <TouchableOpacity
              onPress={() => setTab('pocket')}
              style={[styles.tabBtn, tab === 'pocket' && styles.tabBtnActive]}
            >
              <Bookmark size={13} color={tab === 'pocket' ? '#FF6B6B' : '#6B7280'} style={{ marginRight: 4 }} />
              <Text style={[styles.tabText, tab === 'pocket' && styles.tabTextActive]}>
                보관함 ({displayedPocketPlaces.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setTab('search')}
              style={[styles.tabBtn, tab === 'search' && styles.tabBtnActive]}
            >
              <Search size={13} color={tab === 'search' ? '#FF6B6B' : '#6B7280'} style={{ marginRight: 4 }} />
              <Text style={[styles.tabText, tab === 'search' && styles.tabTextActive]}>
                장소 검색 추가
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setTab('manual')}
              style={[styles.tabBtn, tab === 'manual' && styles.tabBtnActive]}
            >
              <Plus size={13} color={tab === 'manual' ? '#FF6B6B' : '#6B7280'} style={{ marginRight: 4 }} />
              <Text style={[styles.tabText, tab === 'manual' && styles.tabTextActive]}>
                직접 등록
              </Text>
            </TouchableOpacity>
          </View>

          {tab === 'pocket' ? (
            <View style={{ flex: 1 }}>
              {/* Scope Pills: Current Trip vs All */}
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                <TouchableOpacity
                  onPress={() => setPocketScope('trip')}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 5,
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
                    📍 {currentTrip?.title ? currentTrip.title.slice(0, 10) + '...' : '현재 여행'} ({tripPocketPlaces.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setPocketScope('all')}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 5,
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
                    전체 보관함 ({allPocketPlaces.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* QUICK LODGING BUTTON: Add current Day's Lodging as spot if exists */}
              {dayLodging && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleAddDayLodgingAsSpot}
                  style={styles.quickLodgingBanner}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                    <View style={styles.quickLodgingIconWrap}>
                      <Hotel size={15} color="#8B5CF6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.quickLodgingTitle}>
                        🏨 DAY {dayNumber} 숙소: {dayLodging.name}
                      </Text>
                      <Text style={styles.quickLodgingSub}>
                        탭하여 이 숙소를 일정 타임라인 스팟으로 바로 추가
                      </Text>
                    </View>
                  </View>
                  <View style={styles.quickLodgingBadge}>
                    <Plus size={12} color="#FFFFFF" style={{ marginRight: 2 }} />
                    <Text style={styles.quickLodgingBadgeText}>스팟 추가</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Search Bar */}
              <View style={styles.searchBar}>
                <Search size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="보관함 장소 검색 (예: 푸글렌, 빔즈, 시부야)"
                  placeholderTextColor="#9CA3AF"
                  style={styles.searchInput}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={15} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Category Filter Chips (숙소 LODGING 포함!) */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 10, maxHeight: 32 }}
                contentContainerStyle={{ gap: 6 }}
              >
                {CATEGORY_TABS.map((cat) => {
                  const isSelected = selectedCategory === cat.key;
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      onPress={() => setSelectedCategory(cat.key)}
                      style={[
                        styles.catFilterChip,
                        isSelected && styles.catFilterChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.catFilterChipText,
                          isSelected && styles.catFilterChipTextActive,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Places List */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
              >
                {displayedPocketPlaces.length > 0 ? (
                  displayedPocketPlaces.map((place) => {
                    const isAlreadyAdded = existingPlaceIds.includes(place.id);
                    const hasImage = place.imageUrl && !failedImageIds[place.id];
                    const catUpper = (place.category || '').toUpperCase();
                    const isLodging = catUpper === 'LODGING' || catUpper === 'STAY';

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
                                backgroundColor: isLodging ? '#F5F3FF' : '#F1F5F9',
                                alignItems: 'center',
                                justifyContent: 'center',
                              },
                            ]}
                          >
                            {isLodging ? (
                              <Hotel size={20} color="#8B5CF6" />
                            ) : (
                              <MapPin size={20} color="#FF6B6B" />
                            )}
                          </View>
                        )}
                        <View style={styles.placeDetails}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <View
                              style={[
                                styles.categoryBadge,
                                isLodging && { backgroundColor: '#F5F3FF' },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.categoryBadgeText,
                                  isLodging && { color: '#8B5CF6' },
                                ]}
                              >
                                {catUpper === 'CAFE'
                                  ? '☕ 카페'
                                  : catUpper === 'RESTAURANT'
                                  ? '🍴 맛집'
                                  : catUpper === 'SHOPPING'
                                  ? '🛍️ 쇼핑'
                                  : isLodging
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
                        ? `"${searchQuery}" 일치하는 보관함 장소가 없어요.`
                        : '선택한 카테고리에 저장된 장소가 아직 없어요.'}
                    </Text>
                    {searchQuery.trim().length > 0 && (
                      <TouchableOpacity
                        onPress={() => {
                          setSearchQueryOnline(searchQuery);
                          setTab('search');
                        }}
                        style={{
                          marginTop: 12,
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: '#FFF0F0',
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: '#FECDD3',
                        }}
                      >
                        <Search size={14} color="#FF6B6B" style={{ marginRight: 6 }} />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#E11D48' }}>
                          "{searchQuery}" 전체 장소 검색하기 ↗
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </ScrollView>
            </View>
          ) : tab === 'search' ? (
            <View style={{ flex: 1 }}>
              <View style={[styles.searchBar, { marginTop: 4, marginBottom: 8 }]}>
                <Search size={16} color="#FF6B6B" style={{ marginRight: 8 }} />
                <TextInput
                  value={searchQueryOnline}
                  onChangeText={setSearchQueryOnline}
                  placeholder="장소명, 맛집, 카페, 명소 검색 (예: 투몬 비치, 이치란)"
                  placeholderTextColor="#9CA3AF"
                  style={styles.searchInput}
                  returnKeyType="search"
                />
                {searchQueryOnline.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQueryOnline('')} style={{ padding: 4 }}>
                    <X size={14} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Suggestions */}
              {searchQueryOnline.trim().length === 0 && (
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#E11D48', marginBottom: 6 }}>
                    인기 스팟 추천:
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                    {['투몬 비치', '사랑의 절벽', '이치란', '블루보틀', '돈키호테', '도쿄타워'].map((chip) => (
                      <TouchableOpacity
                        key={chip}
                        onPress={() => setSearchQueryOnline(chip)}
                        style={{
                          paddingHorizontal: 9,
                          paddingVertical: 4,
                          borderRadius: 10,
                          backgroundColor: '#FFF1F2',
                        }}
                      >
                        <Text style={{ fontSize: 11, color: '#9F1239', fontWeight: '600' }}>{chip}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>
                  {isSearchingOnline ? '장소 검색 중...' : `검색 결과 ${searchResultsOnline.length}개`}
                </Text>
                {isSearchingOnline && <ActivityIndicator size="small" color="#FF6B6B" />}
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 24, gap: 10 }}
                keyboardShouldPersistTaps="handled"
              >
                {searchResultsOnline.length === 0 && !isSearchingOnline ? (
                  <View style={styles.emptyContainer}>
                    <MapPin size={32} color="#CBD5E1" />
                    <Text style={styles.emptyTitle}>검색 결과가 없습니다</Text>
                    <Text style={styles.emptySubtitle}>다른 장소명이나 키워드로 검색해보세요.</Text>
                  </View>
                ) : (
                  searchResultsOnline.map((item) => (
                    <View
                      key={item.id}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 14,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748B' }}>
                          {item.category}
                        </Text>
                        {item.rating && (
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Star size={10} color="#EAB308" fill="#EAB308" style={{ marginRight: 2 }} />
                            <Text style={{ fontSize: 10, fontWeight: '700', color: '#854D0E' }}>
                              {item.rating.toFixed(1)}
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 3 }}>
                        {item.name}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }} numberOfLines={1}>
                        {item.address}
                      </Text>
                      {item.memo && (
                        <Text style={{ fontSize: 10, color: '#059669', marginBottom: 8 }} numberOfLines={1}>
                          💡 {item.memo}
                        </Text>
                      )}

                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                        <TouchableOpacity
                          onPress={() => handleSelectOnlinePlace(item)}
                          style={{
                            flex: 1.3,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingVertical: 8,
                            borderRadius: 10,
                            backgroundColor: '#FF6B6B',
                          }}
                          activeOpacity={0.8}
                        >
                          <Plus size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                          <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>
                            DAY {dayNumber}에 추가 🤏
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleSaveOnlinePlaceToPocketOnly(item)}
                          style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingVertical: 8,
                            borderRadius: 10,
                            backgroundColor: '#F8FAFC',
                            borderWidth: 1,
                            borderColor: '#E2E8F0',
                          }}
                          activeOpacity={0.8}
                        >
                          <Bookmark size={12} color="#64748B" style={{ marginRight: 4 }} />
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B' }}>
                            보관함만 저장
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>장소 또는 숙소 이름 *</Text>
                <TextInput
                  value={manualName}
                  onChangeText={setManualName}
                  placeholder="예: 시부야 스카이 전망대, 신주쿠 프린스 호텔"
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
    maxHeight: '90%',
    minHeight: 480,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
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
    marginBottom: 12,
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
  quickLodgingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
  },
  quickLodgingIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  quickLodgingTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6D28D9',
  },
  quickLodgingSub: {
    fontSize: 10,
    color: '#7C3AED',
    marginTop: 1,
  },
  quickLodgingBadge: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quickLodgingBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    padding: 0,
  },
  catFilterChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  catFilterChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  catFilterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  catFilterChipTextActive: {
    color: '#FFFFFF',
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
