import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
} from 'react-native';
import { Header } from '../../src/components/common/Header';
import { Card, Badge, EmptyState } from '../../src/components/common/Card';
import { Button } from '../../src/components/common/Button';
import { usePlaceStore } from '../../src/store/usePlaceStore';
import { PlaceCategory } from '../../src/types';
import {
  Search,
  Bookmark,
  MapPin,
  Star,
  Plus,
  ExternalLink,
  Trash2,
  Filter,
} from 'lucide-react-native';

const CATEGORIES: { label: string; value: PlaceCategory | 'all' }[] = [
  { label: '전체', value: 'all' },
  { label: '☕ 카페', value: 'cafe' },
  { label: '🍴 맛집', value: 'restaurant' },
  { label: '📸 명소', value: 'spot' },
  { label: '🏨 숙소', value: 'stay' },
  { label: '🛍️ 쇼핑', value: 'shopping' },
];

export default function PlacesScreen() {
  const {
    places,
    selectedCategory,
    searchQuery,
    setCategory,
    setSearchQuery,
    togglePin,
    removePlace,
  } = usePlaceStore();

  const filteredPlaces = places.filter((place) => {
    const matchesCategory =
      selectedCategory === 'all' || place.category === selectedCategory;
    const matchesSearch =
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (place.memo && place.memo.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <View className="flex-1 bg-background">
      <Header
        title="장소 보관함 📌"
        subtitle={`수집한 핫플 총 ${places.length}개`}
        rightAction={
          <TouchableOpacity className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
            <Plus size={20} color="#FF6B6B" />
          </TouchableOpacity>
        }
      />

      {/* Search & Category Filter Header */}
      <View className="p-4 bg-surface border-b border-borderLine">
        <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2.5 mb-3">
          <Search size={18} color="#8D99AE" className="mr-2" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="장소명, 지역, 메모 검색..."
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
            return (
              <TouchableOpacity
                key={cat.value}
                onPress={() => setCategory(cat.value)}
                activeOpacity={0.7}
                className={`mr-2 px-3.5 py-1.5 rounded-full border ${
                  isSelected
                    ? 'bg-primary border-primary'
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
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Places List */}
      {filteredPlaces.length > 0 ? (
        <ScrollView className="flex-1 px-4 pt-3" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          {filteredPlaces.map((place) => (
            <Card key={place.id} className="mb-3 p-3">
              <View className="flex-row">
                {place.imageUrl && (
                  <Image
                    source={{ uri: place.imageUrl }}
                    className="w-24 h-24 rounded-2xl mr-3"
                    resizeMode="cover"
                  />
                )}
                <View className="flex-1 justify-between py-0.5">
                  <View>
                    <View className="flex-row items-center justify-between mb-1">
                      <Badge
                        label={
                          place.category === 'cafe'
                            ? '카페'
                            : place.category === 'restaurant'
                            ? '맛집'
                            : place.category === 'spot'
                            ? '명소'
                            : '기타'
                        }
                        variant={place.category === 'cafe' ? 'secondary' : 'primary'}
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

                    <View className="flex-row items-center mb-1">
                      <MapPin size={12} color="#8D99AE" />
                      <Text className="text-xs text-mutedText ml-1 flex-1" numberOfLines={1}>
                        {place.address}
                      </Text>
                    </View>

                    {place.memo && (
                      <Text className="text-xs text-gray-500 bg-gray-50 p-1.5 rounded-lg mb-1" numberOfLines={1}>
                        💬 {place.memo}
                      </Text>
                    )}
                  </View>

                  <View className="flex-row items-center justify-between pt-1 border-t border-gray-100 mt-1">
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

                    <TouchableOpacity
                      onPress={() => removePlace(place.id)}
                      className="p-1"
                    >
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
          title="저장된 장소가 없습니다"
          description="홈 화면에서 SNS 링크를 입력하면 자동으로 핫플이 이곳에 저장됩니다."
          actionButton={<Button title="링크 붙여넣으러 가기" onPress={() => {}} size="sm" />}
        />
      )}
    </View>
  );
}
