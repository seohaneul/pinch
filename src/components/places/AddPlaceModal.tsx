import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Image,
  Alert,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import {
  Sparkles,
  Link as LinkIcon,
  X,
  Clipboard as ClipboardIcon,
  Check,
  MapPin,
  Search,
  Star,
  Bookmark,
  Plus,
} from 'lucide-react-native';
import { usePlaceStore } from '../../store/usePlaceStore';
import { useTripStore } from '../../store/useTripStore';
import { searchPlaces, SearchPlaceResult } from '../../services/placeSearchService';
import type { Place, PlaceCategory } from '../../types';

interface AddPlaceModalProps {
  visible: boolean;
  onClose: () => void;
  onExtract: (url: string) => Promise<void>;
  loading: boolean;
  defaultTab?: 'search' | 'link';
}

const CATEGORIES: { label: string; value: PlaceCategory | 'ALL' }[] = [
  { label: '전체', value: 'ALL' },
  { label: '☕ 카페', value: 'CAFE' },
  { label: '🍴 맛집', value: 'RESTAURANT' },
  { label: '📸 명소', value: 'ATTRACTION' },
  { label: '🏨 숙소', value: 'LODGING' },
  { label: '🛍️ 쇼핑', value: 'SHOPPING' },
];

const SAMPLE_LINKS = [
  { label: '📸 인스타 도쿄 핫플', url: 'https://www.instagram.com/p/fuglen_tokyo_coffee' },
  { label: '🎥 숏츠 교토 신사', url: 'https://youtube.com/shorts/kyoto_fushimi_inari' },
  { label: '🍜 네이버 하카타 라멘', url: 'https://blog.naver.com/ichiran_ramen_fukuoka' },
];

const POPULAR_SEARCH_CHIPS = [
  '투몬 비치',
  '사랑의 절벽',
  '괌 프리미어 아울렛',
  '두짓타니 괌',
  '이치란 라멘',
  '블루보틀',
  '도쿄 타워',
  '돈키호테',
];

export const AddPlaceModal: React.FC<AddPlaceModalProps> = ({
  visible,
  onClose,
  onExtract,
  loading,
  defaultTab = 'search',
}) => {
  const insets = useSafeAreaInsets();
  const { currentTrip, addPlaceToSchedule } = useTripStore();
  const { places, addPlace } = usePlaceStore();

  const [activeTab, setActiveTab] = useState<'search' | 'link'>(defaultTab);

  // Link Mode State
  const [urlInput, setUrlInput] = useState('');

  // Search Mode State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory | 'ALL'>('ALL');
  const [searchResults, setSearchResults] = useState<SearchPlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [savedPlaceNames, setSavedPlaceNames] = useState<Record<string, boolean>>({});
  const [failedImageIds, setFailedImageIds] = useState<Record<string, boolean>>({});

  const activeTripId = currentTrip?.id || 't_tokyo';
  const activeTripTitle = currentTrip?.title || '여행';

  useEffect(() => {
    if (visible) {
      setActiveTab(defaultTab);
      setUrlInput('');
      setSearchQuery('');
    }
  }, [visible, defaultTab]);

  // Sync saved place names for current trip
  useEffect(() => {
    const map: Record<string, boolean> = {};
    places.forEach((p) => {
      if (p.trip_id === activeTripId || !p.trip_id) {
        map[p.name.trim().toLowerCase()] = true;
      }
    });
    setSavedPlaceNames(map);
  }, [places, activeTripId, visible]);

  // Live search execution
  useEffect(() => {
    if (!visible || activeTab !== 'search') return;

    let isCancelled = false;
    const executeSearch = async () => {
      setIsSearching(true);
      try {
        const catFilter = selectedCategory === 'ALL' ? undefined : selectedCategory;
        const res = await searchPlaces(searchQuery, catFilter);
        if (!isCancelled) {
          setSearchResults(res);
        }
      } catch {
        if (!isCancelled) setSearchResults([]);
      } finally {
        if (!isCancelled) setIsSearching(false);
      }
    };

    const timer = setTimeout(executeSearch, 200);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedCategory, activeTab, visible]);

  const handlePasteClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setUrlInput(text.trim());
      }
    } catch (e) {}
  };

  const handleSubmitLink = async () => {
    if (!urlInput.trim() || loading) return;
    await onExtract(urlInput.trim());
    setUrlInput('');
    onClose();
  };

  const handleSaveSearchPlace = (item: SearchPlaceResult) => {
    const newPlace: Place = {
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

    const ok = addPlace(newPlace, activeTripId);
    if (ok) {
      setSavedPlaceNames((prev) => ({
        ...prev,
        [item.name.trim().toLowerCase()]: true,
      }));
      Alert.alert(
        '보관함에 저장 완료 📌',
        `"${item.name}" 장소를 "${activeTripTitle}" 보관함에 담았습니다!\n일정 플래너 및 지도에서 바로 확인하실 수 있습니다.`
      );
    }
  };

  const handleQuickAddDay1 = (item: SearchPlaceResult) => {
    const newPlace: Place = {
      id: `p_search_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      trip_id: activeTripId,
      name: item.name,
      address: item.address,
      category: item.category,
      latitude: item.latitude,
      longitude: item.longitude,
      memo: item.memo || '직접 검색하여 일정에 추가한 장소',
      imageUrl: item.imageUrl,
      rating: item.rating || 4.8,
      isPinned: true,
      createdAt: new Date().toISOString(),
      tags: [item.category, '검색추가'],
    };

    addPlace(newPlace, activeTripId);
    addPlaceToSchedule(1, newPlace);
    setSavedPlaceNames((prev) => ({
      ...prev,
      [item.name.trim().toLowerCase()]: true,
    }));
    Alert.alert(
      'DAY 1 일정에 추가 완료 ✈️',
      `"${item.name}" 장소를 보관함 및 DAY 1 일정에 등록했습니다!`
    );
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

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.backdrop}>
          <View
            style={[
              styles.sheetContainer,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.iconCircle}>
                  <Sparkles size={18} color="#FF6B6B" />
                </View>
                <Text style={styles.headerTitle}>새 장소 보관하기</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                <X size={18} color="#8D99AE" />
              </TouchableOpacity>
            </View>

            {/* 2단 세그먼트 탭: [ 🔍 장소 이름 검색 ] vs [ 🔗 SNS 링크 분석 ] */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                onPress={() => setActiveTab('search')}
                style={[styles.tabBtn, activeTab === 'search' && styles.tabBtnActive]}
                activeOpacity={0.8}
              >
                <Search
                  size={14}
                  color={activeTab === 'search' ? '#FF6B6B' : '#64748B'}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.tabBtnText, activeTab === 'search' && styles.tabBtnTextActive]}>
                  장소 이름 검색
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab('link')}
                style={[styles.tabBtn, activeTab === 'link' && styles.tabBtnActive]}
                activeOpacity={0.8}
              >
                <LinkIcon
                  size={14}
                  color={activeTab === 'link' ? '#FF6B6B' : '#64748B'}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.tabBtnText, activeTab === 'link' && styles.tabBtnTextActive]}>
                  SNS 링크 붙여넣기
                </Text>
              </TouchableOpacity>
            </View>

            {/* TAB 1: 장소 이름 직접 검색 */}
            {activeTab === 'search' && (
              <View style={{ flex: 1 }}>
                <Text style={styles.subtitle}>
                  원하는 핫플, 맛집, 숙소 이름을 검색하면 위치와 주소가 자동으로 조회되어 보관함에 바로 담깁니다.
                </Text>

                {/* Search Bar */}
                <View style={styles.searchBar}>
                  <Search size={16} color="#FF6B6B" style={{ marginRight: 8 }} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="장소명, 맛집, 카페, 명소 검색 (예: 투몬 비치)"
                    placeholderTextColor="#94A3B8"
                    style={styles.searchInput}
                    returnKeyType="search"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                      <X size={14} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Category Chips */}
                <View style={{ marginBottom: 8 }}>
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
                          style={[styles.catChip, selected && styles.catChipActive]}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.catChipText, selected && styles.catChipTextActive]}>
                            {cat.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Popular Keywords when empty */}
                {searchQuery.trim().length === 0 && (
                  <View style={styles.popularRow}>
                    <Text style={styles.popularLabel}>인기 검색어:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                      {POPULAR_SEARCH_CHIPS.map((chip) => (
                        <TouchableOpacity
                          key={chip}
                          onPress={() => setSearchQuery(chip)}
                          style={styles.popularChip}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.popularChipText}>{chip}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Status */}
                <View style={styles.statusRow}>
                  <Text style={styles.statusText}>
                    {isSearching ? '장소 검색 중...' : `검색 결과 ${searchResults.length}개`}
                  </Text>
                  {isSearching && <ActivityIndicator size="small" color="#FF6B6B" />}
                </View>

                {/* Results ScrollView */}
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={styles.resultsContent}
                  keyboardShouldPersistTaps="handled"
                >
                  {searchResults.length === 0 && !isSearching ? (
                    <View style={styles.emptyResults}>
                      <MapPin size={32} color="#CBD5E1" style={{ marginBottom: 8 }} />
                      <Text style={styles.emptyResultsText}>
                        {searchQuery.trim()
                          ? `"${searchQuery}" 관련 장소를 찾지 못했습니다.`
                          : '장소명을 입력하여 원하는 스팟을 찾아보세요.'}
                      </Text>
                    </View>
                  ) : (
                    searchResults.map((item) => {
                      const isSaved = Boolean(savedPlaceNames[item.name.trim().toLowerCase()]);
                      const hasImg = item.imageUrl && !failedImageIds[item.id];

                      return (
                        <View key={item.id} style={styles.card}>
                          {hasImg ? (
                            <Image
                              source={{ uri: item.imageUrl }}
                              style={styles.cardImage}
                              onError={() => setFailedImageIds((p) => ({ ...p, [item.id]: true }))}
                            />
                          ) : (
                            <View style={styles.cardImagePlaceholder}>
                              <MapPin size={22} color="#FF6B6B" />
                            </View>
                          )}

                          <View style={styles.cardBody}>
                            <View style={styles.cardHeader}>
                              <View style={styles.categoryBadge}>
                                <Text style={styles.categoryBadgeText}>
                                  {getCategoryBadgeLabel(item.category)}
                                </Text>
                              </View>
                              {item.rating && (
                                <View style={styles.ratingBadge}>
                                  <Star size={10} color="#EAB308" fill="#EAB308" style={{ marginRight: 2 }} />
                                  <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                                </View>
                              )}
                            </View>

                            <Text style={styles.cardName} numberOfLines={1}>
                              {item.name}
                            </Text>

                            <Text style={styles.cardAddress} numberOfLines={1}>
                              {item.address}
                            </Text>

                            {item.memo && (
                              <Text style={styles.cardMemo} numberOfLines={1}>
                                💡 {item.memo}
                              </Text>
                            )}

                            <View style={styles.cardActionRow}>
                              <TouchableOpacity
                                onPress={() => handleSaveSearchPlace(item)}
                                style={[styles.cardSaveBtn, isSaved && styles.cardSaveBtnActive]}
                                activeOpacity={0.8}
                              >
                                {isSaved ? (
                                  <>
                                    <Check size={12} color="#059669" style={{ marginRight: 3 }} />
                                    <Text style={styles.cardSaveBtnTextActive}>보관함 저장됨</Text>
                                  </>
                                ) : (
                                  <>
                                    <Bookmark size={12} color="#FF6B6B" style={{ marginRight: 3 }} />
                                    <Text style={styles.cardSaveBtnText}>보관함에 저장</Text>
                                  </>
                                )}
                              </TouchableOpacity>

                              <TouchableOpacity
                                onPress={() => handleQuickAddDay1(item)}
                                style={styles.cardDayBtn}
                                activeOpacity={0.8}
                              >
                                <Plus size={12} color="#FFFFFF" style={{ marginRight: 3 }} />
                                <Text style={styles.cardDayBtnText}>일정 추가</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            )}

            {/* TAB 2: SNS 링크 분석 */}
            {activeTab === 'link' && (
              <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 16 }}>
                <Text style={styles.subtitle}>
                  인스타그램 릴스, 유튜브 숏츠, 네이버 지도/블로그 링크를 붙여넣으면 AI가 장소명, 주소, 위치 좌표를 자동으로 추출합니다.
                </Text>

                {/* Quick Sample Chips */}
                <View style={styles.sampleChipsRow}>
                  <Text style={styles.sampleLabel}>추천 예시:</Text>
                  {SAMPLE_LINKS.map((sample) => (
                    <TouchableOpacity
                      key={sample.label}
                      activeOpacity={0.7}
                      onPress={() => setUrlInput(sample.url)}
                      style={[
                        styles.sampleChip,
                        urlInput === sample.url && styles.sampleChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.sampleChipText,
                          urlInput === sample.url && styles.sampleChipTextActive,
                        ]}
                      >
                        {sample.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* URL Input Box */}
                <View style={styles.inputContainer}>
                  <LinkIcon size={16} color="#8D99AE" style={{ marginRight: 8 }} />
                  <TextInput
                    value={urlInput}
                    onChangeText={setUrlInput}
                    placeholder="https://www.instagram.com/p/..."
                    placeholderTextColor="#A0AEC0"
                    style={styles.textInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                  />
                  <TouchableOpacity
                    onPress={handlePasteClipboard}
                    activeOpacity={0.7}
                    style={styles.pasteBtn}
                  >
                    <ClipboardIcon size={12} color="#1E293B" style={{ marginRight: 4 }} />
                    <Text style={styles.pasteBtnText}>붙여넣기</Text>
                  </TouchableOpacity>
                </View>

                {/* Loading Indicator or Buttons */}
                {loading ? (
                  <View style={styles.loadingBox}>
                    <ActivityIndicator size="small" color="#FF6B6B" style={{ marginRight: 8 }} />
                    <Text style={styles.loadingText}>
                      AI가 링크에서 메타데이터와 위치 좌표를 분석 중입니다...
                    </Text>
                  </View>
                ) : null}

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    onPress={onClose}
                    activeOpacity={0.7}
                    style={styles.cancelBtn}
                    disabled={loading}
                  >
                    <Text style={styles.cancelBtnText}>취소</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSubmitLink}
                    disabled={!urlInput.trim() || loading}
                    activeOpacity={0.85}
                    style={[
                      styles.submitBtn,
                      (!urlInput.trim() || loading) && styles.submitBtnDisabled,
                    ]}
                  >
                    <Sparkles size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.submitBtnText}>
                      {loading ? '장소 추출 중...' : '핫플 핀치하기 🤏'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    minHeight: '75%',
    paddingTop: 18,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 3,
    marginTop: 12,
    marginBottom: 10,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 11,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#FF6B6B',
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1.5,
    borderColor: '#FFE4E6',
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    padding: 0,
  },
  categoryScroll: {
    gap: 6,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  catChipActive: {
    backgroundColor: '#FF6B6B',
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  catChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  popularRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  popularLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E11D48',
    marginRight: 6,
  },
  popularChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#FFF1F2',
  },
  popularChipText: {
    fontSize: 11,
    color: '#9F1239',
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  resultsContent: {
    paddingBottom: 20,
    gap: 8,
  },
  emptyResults: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyResultsText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardImage: {
    width: 76,
    height: 84,
    borderRadius: 10,
    marginRight: 10,
  },
  cardImagePlaceholder: {
    width: 76,
    height: 84,
    borderRadius: 10,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardBody: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#854D0E',
  },
  cardName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  cardAddress: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  cardMemo: {
    fontSize: 10,
    color: '#059669',
    marginBottom: 4,
  },
  cardActionRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  cardSaveBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  cardSaveBtnActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  cardSaveBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E11D48',
  },
  cardSaveBtnTextActive: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  cardDayBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#1E293B',
  },
  cardDayBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sampleChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  sampleLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  sampleChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sampleChipActive: {
    backgroundColor: '#FFF0F0',
    borderColor: '#FF6B6B',
  },
  sampleChipText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  sampleChipTextActive: {
    color: '#FF6B6B',
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    padding: 0,
  },
  pasteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    marginLeft: 8,
  },
  pasteBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    padding: 10,
    borderRadius: 12,
    marginBottom: 14,
  },
  loadingText: {
    fontSize: 11,
    color: '#FF6B6B',
    fontWeight: '600',
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
  },
  submitBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
