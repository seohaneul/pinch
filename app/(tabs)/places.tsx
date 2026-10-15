import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  Linking,
  StyleSheet,
} from 'react-native';
import { Header } from '../../src/components/common/Header';
import { Card, Badge, EmptyState } from '../../src/components/common/Card';
import { Button } from '../../src/components/common/Button';
import { usePlaceStore, CategoryFilter } from '../../src/store/usePlaceStore';
import { useSavedLinkStore } from '../../src/store/useSavedLinkStore';
import { useClipboardListener } from '../../src/hooks/useClipboardListener';
import { ClipboardToast } from '../../src/components/places/ClipboardToast';
import { AddPlaceModal } from '../../src/components/places/AddPlaceModal';
import { LinkPlacesModal } from '../../src/components/places/LinkPlacesModal';
import { useTripStore } from '../../src/store/useTripStore';
import type { Place, SavedLink } from '../../src/types';
import { openInGoogleMaps } from '../../src/utils/mapUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TripSwitcherModal } from '../../src/components/trip/TripSwitcherModal';
import {
  Search,
  Bookmark,
  MapPin,
  Star,
  Plus,
  Trash2,
  ExternalLink,
  Sparkles,
  Calendar,
  X,
  Check,
  Navigation,
  ChevronDown,
  Layers,
  Link as LinkIcon,
} from 'lucide-react-native';

const CATEGORIES: { label: string; value: CategoryFilter }[] = [
  { label: '전체', value: 'ALL' },
  { label: '☕ 카페', value: 'CAFE' },
  { label: '🍴 맛집', value: 'RESTAURANT' },
  { label: '📸 명소', value: 'ATTRACTION' },
  { label: '🏨 숙소', value: 'LODGING' },
  { label: '🛍️ 쇼핑', value: 'SHOPPING' },
];

export default function PlacesScreen() {
  const insets = useSafeAreaInsets();

  // 1. 장소 스토어
  const {
    places,
    selectedCategory,
    searchQuery,
    isParsing,
    setCategory,
    setSearchQuery,
    togglePin,
    removePlace,
    extractFromUrl,
  } = usePlaceStore();

  // 2. 링크 보관함 스토어 (여행별 릴스/블로그 링크)
  const {
    savedLinks,
    isExtractingLink,
    addLinkFromUrl,
    removeSavedLink,
  } = useSavedLinkStore();

  const { currentTrip, addPlaceToSchedule } = useTripStore();

  // 세그먼트 탭: 'PLACES' (저장한 장소) vs 'LINKS' (링크 보관함)
  const [activeTab, setActiveTab] = useState<'PLACES' | 'LINKS'>('PLACES');

  const [modalVisible, setModalVisible] = useState(false);
  const [plannerModalVisible, setPlannerModalVisible] = useState(false);
  const [tripSwitcherVisible, setTripSwitcherVisible] = useState(false);

  // 링크 속 장소 확인 모달 상태
  const [selectedLinkForPlaces, setSelectedLinkForPlaces] = useState<SavedLink | null>(null);

  const [selectedPlaceForPlanner, setSelectedPlaceForPlanner] = useState<Place | null>(null);
  const [targetDay, setTargetDay] = useState<number>(1);
  const { detectedUrl, dismissDetectedUrl } = useClipboardListener();

  const handleOpenPlannerModal = (place: Place) => {
    setSelectedPlaceForPlanner(place);
    setTargetDay(1);
    setPlannerModalVisible(true);
  };

  const handleConfirmAddToPlanner = () => {
    if (!selectedPlaceForPlanner) return;
    addPlaceToSchedule(targetDay, selectedPlaceForPlanner);
    setPlannerModalVisible(false);
    Alert.alert(
      '일정에 핀치 완료! 🤏',
      `"${selectedPlaceForPlanner.name}" 장소를 Day ${targetDay} 일정에 핀치했어요!\n동선 플래너 탭에서 최단 경로를 확인해보세요.`
    );
    setSelectedPlaceForPlanner(null);
  };

  // 링크 핀치 핸들러: 링크 보관함에 먼저 추가하고, 장소 선택 모달을 띄움
  const handleExtractUrl = async (url: string) => {
    const activeTripId = currentTrip?.id || 't_tokyo';
    const newSavedLink = await addLinkFromUrl(url, activeTripId);

    if (newSavedLink) {
      dismissDetectedUrl();
      // 링크 속 장소 모달을 즉시 열어줌!
      setSelectedLinkForPlaces(newSavedLink);
      Alert.alert(
        '링크 핀치 성공! ✈️',
        `"${newSavedLink.title}" 링크가 보관함에 저장되었습니다.\n포함된 장소 ${newSavedLink.extractedPlaces.length}곳 중 원하는 장소를 담아보세요!`
      );
    } else {
      Alert.alert('오류', '링크를 분석하지 못했습니다. 다시 시도해 주세요.');
    }
  };

  // 원본 링크 브라우저/앱 열기
  const handleOpenExternalUrl = async (url: string) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('알림', '링크를 열 수 없습니다.');
    }
  };

  // 여행별 필터링
  const tripPlaces = places.filter(
    (place) => !place.trip_id || place.trip_id === currentTrip?.id
  );

  const tripLinks = savedLinks.filter(
    (link) => !link.trip_id || link.trip_id === currentTrip?.id
  );

  const filteredPlaces = tripPlaces.filter((place) => {
    const matchesCategory =
      selectedCategory === 'ALL' ||
      place.category === selectedCategory ||
      place.category.toUpperCase() === selectedCategory;

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      place.name.toLowerCase().includes(query) ||
      place.address.toLowerCase().includes(query) ||
      (place.memo && place.memo.toLowerCase().includes(query)) ||
      (place.tags && place.tags.some((t) => t.toLowerCase().includes(query)));

    return matchesCategory && matchesSearch;
  });

  const getCategoryBadgeLabel = (cat: string) => {
    const upper = cat.toUpperCase();
    switch (upper) {
      case 'CAFE':
        return '☕ 카페';
      case 'RESTAURANT':
        return '🍴 맛집';
      case 'ATTRACTION':
      case 'SPOT':
        return '📸 명소';
      case 'LODGING':
      case 'STAY':
        return '🏨 숙소';
      case 'SHOPPING':
        return '🛍️ 쇼핑';
      default:
        return '📍 장소';
    }
  };

  const getPlatformChipText = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return '📸 Instagram';
      case 'youtube':
        return '🎥 YouTube';
      case 'naver':
        return '📗 Naver';
      default:
        return '🔗 Link';
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="장소 & 링크 보관함 📌"
        subtitle={`수집한 핫플 ${tripPlaces.length}개 · 저장된 링크 ${tripLinks.length}개`}
        rightAction={
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            style={styles.addHeaderBtn}
            activeOpacity={0.8}
          >
            <Plus size={20} color="#FF6B6B" />
          </TouchableOpacity>
        }
      />

      {/* 여행 전환 바 */}
      <View style={styles.tripBar}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setTripSwitcherVisible(true)}
          style={styles.tripBadge}
        >
          <Text style={styles.tripBadgeText}>
            📍 현재 여행: <Text style={styles.tripTitleHighlight}>{currentTrip?.title || '도쿄 3박 4일 감성 여행'}</Text>
          </Text>
          <ChevronDown size={14} color="#6B7280" />
        </TouchableOpacity>

        <Text style={styles.tripSummaryText}>
          {activeTab === 'PLACES' ? `${tripPlaces.length}개 장소` : `${tripLinks.length}개 링크`}
        </Text>
      </View>

      {/* 2단 세그먼트 탭: [📍 저장한 장소] vs [🔗 여행 링크 보관함] */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('PLACES')}
          style={[styles.segmentBtn, activeTab === 'PLACES' && styles.segmentBtnActive]}
        >
          <MapPin
            size={14}
            color={activeTab === 'PLACES' ? '#FF6B6B' : '#64748B'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.segmentText, activeTab === 'PLACES' && styles.segmentTextActive]}>
            저장한 장소 ({tripPlaces.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('LINKS')}
          style={[styles.segmentBtn, activeTab === 'LINKS' && styles.segmentBtnActive]}
        >
          <LinkIcon
            size={14}
            color={activeTab === 'LINKS' ? '#FF6B6B' : '#64748B'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.segmentText, activeTab === 'LINKS' && styles.segmentTextActive]}>
            여행 링크 보관함 ({tripLinks.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Clipboard Toast Banner */}
      {detectedUrl && (
        <View style={{ paddingTop: 8 }}>
          <ClipboardToast
            url={detectedUrl}
            onPinch={handleExtractUrl}
            onDismiss={dismissDetectedUrl}
          />
        </View>
      )}

      {/* 1. 저장한 장소 뷰 (PLACES) */}
      {activeTab === 'PLACES' ? (
        <>
          {/* 검색 및 카테고리 필터 */}
          <View style={styles.filterSection}>
            <View style={styles.searchBar}>
              <Search size={16} color="#8D99AE" style={{ marginRight: 8 }} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="장소명, 지역, 태그, 메모 검색..."
                placeholderTextColor="#A0AEC0"
                style={styles.searchInput}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={{ fontSize: 12, color: '#A0AEC0', fontWeight: 'bold' }}>✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.value;
                const count =
                  cat.value === 'ALL'
                    ? tripPlaces.length
                    : tripPlaces.filter(
                        (p) => p.category === cat.value || p.category.toUpperCase() === cat.value
                      ).length;

                return (
                  <TouchableOpacity
                    key={cat.value}
                    onPress={() => setCategory(cat.value)}
                    activeOpacity={0.75}
                    style={[
                      styles.categoryChip,
                      isSelected && styles.categoryChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        isSelected && styles.categoryChipTextSelected,
                      ]}
                    >
                      {cat.label}
                    </Text>
                    <Text
                      style={[
                        styles.categoryCount,
                        isSelected && styles.categoryCountSelected,
                      ]}
                    >
                      {count}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* 장소 목록 */}
          {filteredPlaces.length > 0 ? (
            <ScrollView
              style={{ flex: 1, paddingHorizontal: 16, paddingTop: 10 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 36 }}
            >
              {filteredPlaces.map((place) => (
                <Card key={place.id} className="mb-3.5 p-3">
                  <View className="flex-row">
                    {place.imageUrl && (
                      <Image
                        source={{ uri: place.imageUrl }}
                        className="w-24 h-28 rounded-2xl mr-3"
                        resizeMode="cover"
                      />
                    )}
                    <View className="flex-1 justify-between py-0.5">
                      <View>
                        <View className="flex-row items-center justify-between mb-1">
                          <Badge
                            label={getCategoryBadgeLabel(place.category)}
                            variant={place.category === 'CAFE' || place.category === 'cafe' ? 'secondary' : 'primary'}
                          />
                          <TouchableOpacity onPress={() => togglePin(place.id)} className="p-1">
                            <Bookmark
                              size={18}
                              color={place.isPinned ? '#FF6B6B' : '#8D99AE'}
                              fill={place.isPinned ? '#FF6B6B' : 'none'}
                            />
                          </TouchableOpacity>
                        </View>

                        <Text className="text-base font-bold text-darkText mb-0.5" numberOfLines={1}>
                          {place.name}
                        </Text>

                        <View className="flex-row items-center mb-1.5">
                          <MapPin size={12} color="#8D99AE" />
                          <Text className="text-xs text-mutedText ml-1 flex-1" numberOfLines={1}>
                            {place.address}
                          </Text>
                        </View>

                        {place.memo && (
                          <Text className="text-xs text-gray-600 bg-gray-50 p-2 rounded-xl mb-1.5 leading-4" numberOfLines={2}>
                            💬 {place.memo}
                          </Text>
                        )}

                        {place.tags && place.tags.length > 0 && (
                          <View className="flex-row flex-wrap mb-1">
                            {place.tags.map((t, idx) => (
                              <Text key={idx} className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md mr-1 mb-1">
                                #{t}
                              </Text>
                            ))}
                          </View>
                        )}
                      </View>

                      <View className="flex-row items-center justify-between pt-2 border-t border-gray-100 mt-1.5">
                        {place.rating ? (
                          <View className="flex-row items-center">
                            <Star size={12} color="#FF9F1C" fill="#FF9F1C" />
                            <Text className="text-xs font-bold text-gray-700 ml-1">
                              {place.rating}
                            </Text>
                          </View>
                        ) : (
                          <View />
                        )}

                        <View className="flex-row items-center gap-1.5">
                          <TouchableOpacity
                            onPress={() => openInGoogleMaps(place.name, place.latitude, place.longitude)}
                            className="bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full flex-row items-center"
                            accessibilityLabel="구글 지도 열기"
                          >
                            <Navigation size={11} color="#059669" />
                            <Text className="text-[11px] font-bold text-emerald-700 ml-1">
                              지도
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => handleOpenPlannerModal(place)}
                            className="bg-primary/10 px-2.5 py-1 rounded-full flex-row items-center"
                          >
                            <Plus size={12} color="#FF6B6B" />
                            <Text className="text-[11px] font-extrabold text-primary ml-1">
                              일정 담기
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity onPress={() => removePlace(place.id)} className="p-1">
                            <Trash2 size={13} color="#CBD5E0" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                </Card>
              ))}
            </ScrollView>
          ) : (
            <EmptyState
              icon={<Bookmark size={28} color="#FF6B6B" />}
              title="보관함에 담긴 장소가 없습니다"
              description="릴스나 블로그 링크를 핀치하여 마음에 드는 핫플들을 보관함에 쏙 담아보세요."
              actionButton={
                <Button
                  title="새 링크 핀치하기"
                  onPress={() => setModalVisible(true)}
                  size="sm"
                  icon={<Sparkles size={14} color="#FFF" />}
                />
              }
            />
          )}
        </>
      ) : (
        /* 2. 여행 링크 보관함 뷰 (LINKS) */
        <ScrollView
          style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 36 }}
        >
          <View style={styles.linksIntroBox}>
            <Sparkles size={16} color="#FF6B6B" style={{ marginRight: 6 }} />
            <Text style={styles.linksIntroText}>
              수집한 릴스/블로그를 터치하면 <Text style={{ fontWeight: '800' }}>링크 속 장소들을 골라서 보관함에 담을 수 있어요!</Text>
            </Text>
          </View>

          {tripLinks.length > 0 ? (
            tripLinks.map((link) => (
              <TouchableOpacity
                key={link.id}
                activeOpacity={0.9}
                onPress={() => setSelectedLinkForPlaces(link)}
                style={styles.linkCard}
              >
                <Image
                  source={{ uri: link.thumbnailUrl }}
                  style={styles.linkThumb}
                  resizeMode="cover"
                />
                <View style={styles.linkContent}>
                  <View style={styles.linkHeaderRow}>
                    <View style={styles.linkPlatformBadge}>
                      <Text style={styles.linkPlatformBadgeText}>
                        {getPlatformChipText(link.platform)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeSavedLink(link.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 size={14} color="#CBD5E1" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.linkTitle} numberOfLines={2}>
                    {link.title}
                  </Text>

                  <Text style={styles.linkSummary} numberOfLines={2}>
                    {link.summary}
                  </Text>

                  <View style={styles.linkFooterRow}>
                    <View style={styles.placesCountBadge}>
                      <MapPin size={11} color="#FF6B6B" style={{ marginRight: 3 }} />
                      <Text style={styles.placesCountBadgeText}>
                        장소 {link.extractedPlaces.length}곳 포함
                      </Text>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleOpenExternalUrl(link.url);
                      }}
                      style={styles.openUrlBtn}
                    >
                      <ExternalLink size={11} color="#0284C7" style={{ marginRight: 3 }} />
                      <Text style={styles.openUrlBtnText}>원본 열기</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <EmptyState
              icon={<LinkIcon size={28} color="#FF6B6B" />}
              title="저장된 링크가 없습니다"
              description="인스타그램 릴스나 유튜브 숏츠, 블로그 링크를 붙여넣어 여행별 링크 보관함을 만들어보세요."
              actionButton={
                <Button
                  title="첫 링크 핀치하기"
                  onPress={() => setModalVisible(true)}
                  size="sm"
                  icon={<Sparkles size={14} color="#FFF" />}
                />
              }
            />
          )}
        </ScrollView>
      )}

      {/* 링크 추가 모달 (AddPlaceModal) */}
      <AddPlaceModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onExtract={handleExtractUrl}
        loading={isExtractingLink}
      />

      {/* 링크 속 장소 확인 및 골라 담기 모달 (LinkPlacesModal) */}
      <LinkPlacesModal
        visible={Boolean(selectedLinkForPlaces)}
        savedLink={selectedLinkForPlaces}
        onClose={() => setSelectedLinkForPlaces(null)}
      />

      {/* Add To Planner Mini-Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={plannerModalVisible}
        onRequestClose={() => setPlannerModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View
            className="w-full bg-surface rounded-t-3xl p-5"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          >
            <View className="flex-row items-center justify-between pb-3 border-b border-gray-100">
              <View className="flex-row items-center">
                <Calendar size={18} color="#FF6B6B" />
                <Text className="text-base font-extrabold text-darkText ml-1.5">
                  동선 플래너에 일정 담기
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setPlannerModalVisible(false)}
                className="w-7 h-7 rounded-full bg-gray-100 items-center justify-center"
              >
                <X size={15} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedPlaceForPlanner && (
              <View className="py-3">
                <View className="p-3 bg-gray-50 rounded-2xl mb-4 border border-borderLine">
                  <Text className="text-xs font-bold text-primary mb-0.5">
                    {getCategoryBadgeLabel(selectedPlaceForPlanner.category)}
                  </Text>
                  <Text className="text-base font-extrabold text-darkText mb-1">
                    {selectedPlaceForPlanner.name}
                  </Text>
                  <Text className="text-xs text-mutedText" numberOfLines={1}>
                    {selectedPlaceForPlanner.address}
                  </Text>
                </View>

                <Text className="text-xs font-bold text-mutedText mb-2">
                  담을 일차 선택 ({currentTrip?.title || '도쿄 여행'})
                </Text>
                <View className="flex-row gap-2 mb-6">
                  {(currentTrip?.schedules || [
                    { dayNumber: 1, date: '11.10' },
                    { dayNumber: 2, date: '11.11' },
                    { dayNumber: 3, date: '11.12' },
                    { dayNumber: 4, date: '11.13' },
                  ]).map((sch) => {
                    const isSelected = targetDay === sch.dayNumber;
                    return (
                      <TouchableOpacity
                        key={sch.dayNumber}
                        onPress={() => setTargetDay(sch.dayNumber)}
                        className={`flex-1 py-3 px-2 rounded-2xl border items-center justify-center ${
                          isSelected
                            ? 'bg-primary border-primary'
                            : 'bg-white border-borderLine'
                        }`}
                      >
                        <Text
                          className={`text-xs font-extrabold ${
                            isSelected ? 'text-white' : 'text-darkText'
                          }`}
                        >
                          DAY {sch.dayNumber}
                        </Text>
                        <Text
                          className={`text-[10px] mt-0.5 font-bold ${
                            isSelected ? 'text-white/80' : 'text-mutedText'
                          }`}
                        >
                          {sch.date ? sch.date.split('-').slice(1).join('.') : ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Button
                  title={`Day ${targetDay} 일정에 핀치하기 🤏`}
                  onPress={handleConfirmAddToPlanner}
                  variant="primary"
                  size="lg"
                  className="w-full"
                />
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Trip Switcher Modal */}
      <TripSwitcherModal
        visible={tripSwitcherVisible}
        onClose={() => setTripSwitcherVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  addHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  tripBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tripBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  tripBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginRight: 4,
  },
  tripTitleHighlight: {
    color: '#FF6B6B',
    fontWeight: '800',
  },
  tripSummaryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  segmentBtnActive: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1.5,
    borderColor: '#FFE4E6',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#FF6B6B',
    fontWeight: '800',
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    padding: 0,
  },
  categoryChip: {
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryChipSelected: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  categoryCount: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    marginLeft: 4,
  },
  categoryCountSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  linksIntroBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFE4E6',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  linksIntroText: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
    lineHeight: 16,
  },
  linkCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    borderRadius: 20,
    padding: 12,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  linkThumb: {
    width: 96,
    height: 110,
    borderRadius: 14,
    marginRight: 12,
  },
  linkContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  linkHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkPlatformBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  linkPlatformBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 2,
  },
  linkSummary: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15,
  },
  linkFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  placesCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  placesCountBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF6B6B',
  },
  openUrlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  openUrlBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
});
