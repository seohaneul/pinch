import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Header } from '../../src/components/common/Header';
import { Card, Badge, EmptyState } from '../../src/components/common/Card';
import { Button } from '../../src/components/common/Button';
import { usePlaceStore, CategoryFilter } from '../../src/store/usePlaceStore';
import { useClipboardListener } from '../../src/hooks/useClipboardListener';
import { ClipboardToast } from '../../src/components/places/ClipboardToast';
import { AddPlaceModal } from '../../src/components/places/AddPlaceModal';
import {
  Search,
  Bookmark,
  MapPin,
  Star,
  Plus,
  Trash2,
  ExternalLink,
  Sparkles,
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

  const [modalVisible, setModalVisible] = useState(false);
  const { detectedUrl, dismissDetectedUrl } = useClipboardListener();

  const handleExtractUrl = async (url: string) => {
    const newPlace = await extractFromUrl(url);
    if (newPlace) {
      Alert.alert('핀치 성공! 🎉', `"${newPlace.name}" 장소가 보관함에 추가되었습니다.`);
      dismissDetectedUrl();
    } else {
      Alert.alert('오류', '링크를 분석하지 못했습니다. 다시 시도해 주세요.');
    }
  };

  const filteredPlaces = places.filter((place) => {
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

  return (
    <View className="flex-1 bg-background">
      <Header
        title="장소 보관함 📌"
        subtitle={`수집한 핫플 총 ${places.length}개`}
        rightAction={
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            className="w-10 h-10 rounded-2xl bg-primary/10 items-center justify-center border border-primary/20"
          >
            <Plus size={20} color="#FF6B6B" />
          </TouchableOpacity>
        }
      />

      {/* Search & Category Filter Pills */}
      <View className="p-4 bg-surface border-b border-borderLine">
        <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2.5 mb-3">
          <Search size={18} color="#8D99AE" className="mr-2" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="장소명, 지역, 태그, 메모 검색..."
            placeholderTextColor="#A0AEC0"
            className="flex-1 text-sm text-darkText"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text className="text-xs text-gray-400 font-bold">✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.value;
            const count =
              cat.value === 'ALL'
                ? places.length
                : places.filter(
                    (p) =>
                      p.category === cat.value ||
                      p.category.toUpperCase() === cat.value
                  ).length;

            return (
              <TouchableOpacity
                key={cat.value}
                onPress={() => setCategory(cat.value)}
                activeOpacity={0.75}
                className={`mr-2 px-3.5 py-2 rounded-2xl border flex-row items-center ${
                  isSelected
                    ? 'bg-primary border-primary shadow-sm'
                    : 'bg-surface border-gray-200'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    isSelected ? 'text-white' : 'text-darkText'
                  }`}
                >
                  {cat.label}
                </Text>
                <Text
                  className={`text-[10px] ml-1.5 font-extrabold ${
                    isSelected ? 'text-white/80' : 'text-mutedText'
                  }`}
                >
                  {count}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Clipboard Toast Banner */}
      {detectedUrl && (
        <View className="pt-3">
          <ClipboardToast
            url={detectedUrl}
            onPinch={handleExtractUrl}
            onDismiss={dismissDetectedUrl}
          />
        </View>
      )}

      {/* Places List */}
      {filteredPlaces.length > 0 ? (
        <ScrollView className="flex-1 px-4 pt-3" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
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

                  <View className="flex-row items-center justify-between pt-1.5 border-t border-gray-100 mt-1">
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

                    <TouchableOpacity onPress={() => removePlace(place.id)} className="p-1">
                      <Trash2 size={14} color="#CBD5E0" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Card>
          ))}
        </ScrollView>
      ) : (
        <EmptyState
          icon={<Bookmark size={28} color="#FF6B6B" />}
          title="검색 결과가 없습니다"
          description="입력하신 키워드에 해당하는 핫플이 보관함에 없습니다. 새 SNS 링크를 핀치해 보세요."
          actionButton={
            <Button
              title="새 핫플 핀치하기"
              onPress={() => setModalVisible(true)}
              size="sm"
              icon={<Sparkles size={14} color="#FFF" />}
            />
          }
        />
      )}

      {/* Manual Input Modal */}
      <AddPlaceModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onExtract={handleExtractUrl}
        loading={isParsing}
      />
    </View>
  );
}
