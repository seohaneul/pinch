import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Header } from '../../src/components/common/Header';
import { Card, Badge } from '../../src/components/common/Card';
import { Button } from '../../src/components/common/Button';
import { useTripStore } from '../../src/store/useTripStore';
import { usePlaceStore } from '../../src/store/usePlaceStore';
import {
  Link as LinkIcon,
  Sparkles,
  MapPin,
  Calendar,
  Plus,
  ArrowRight,
  TrendingUp,
  Bookmark,
  Users,
} from 'lucide-react-native';

export default function HomeScreen() {
  const [urlInput, setUrlInput] = useState('');
  const { getActiveTrip, trips } = useTripStore();
  const { places, isExtracting, extractFromUrl, togglePin } = usePlaceStore();

  const activeTrip = getActiveTrip();
  const pinnedPlaces = places.filter((p) => p.isPinned);

  const handleExtract = async () => {
    if (!urlInput.trim()) {
      Alert.alert('알림', '인스타그램, 유튜브 등 SNS 링크를 입력해주세요.');
      return;
    }

    const newPlace = await extractFromUrl(urlInput);
    if (newPlace) {
      Alert.alert('핀치 완료! 🎉', `"${newPlace.name}" 장소가 보관함에 추가되었습니다.`);
      setUrlInput('');
    }
  };

  return (
    <View className="flex-1 bg-background">
      <Header
        title="Pinch"
        subtitle="링크만 던지면 핫플만 핀치!"
        rightAction={
          <TouchableOpacity className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
            <Sparkles size={20} color="#FF6B6B" />
          </TouchableOpacity>
        }
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* 1. Quick Link Extractor Card */}
        <View className="p-4 mx-4 mt-4 bg-gradient-to-r bg-surface rounded-3xl border border-primary/30 shadow-md">
          <View className="flex-row items-center mb-2">
            <View className="w-8 h-8 rounded-full bg-primary/15 items-center justify-center mr-2">
              <LinkIcon size={16} color="#FF6B6B" />
            </View>
            <Text className="text-base font-bold text-darkText">SNS 링크에서 핫플 핀치</Text>
            <View className="ml-auto bg-secondary/20 px-2 py-0.5 rounded-md">
              <Text className="text-[10px] font-bold color-secondary-dark">AI 파싱</Text>
            </View>
          </View>
          <Text className="text-xs text-mutedText mb-3">
            인스타릴스, 유튜브, 블로그 링크를 넣으면 장소명과 위치를 자동 추출해요!
          </Text>

          <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl p-2 mb-3">
            <TextInput
              value={urlInput}
              onChangeText={setUrlInput}
              placeholder="https://www.instagram.com/p/..."
              placeholderTextColor="#A0AEC0"
              className="flex-1 px-2 py-1 text-sm text-darkText"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {urlInput.length > 0 && (
              <TouchableOpacity onPress={() => setUrlInput('')} className="px-2">
                <Text className="text-xs text-gray-400 font-bold">✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <Button
            title={isExtracting ? 'AI 핫플 분석 중...' : '핫플 핀치하기'}
            onPress={handleExtract}
            loading={isExtracting}
            icon={<Sparkles size={16} color="#FFFFFF" />}
            size="md"
          />
        </View>

        {/* 2. Active Trip Section */}
        <View className="px-4 mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-darkText">진행 중인 여행 ✈️</Text>
            <Text className="text-xs font-semibold color-primary">전체 보기</Text>
          </View>

          {activeTrip ? (
            <Card className="p-0 overflow-hidden">
              {activeTrip.coverImage && (
                <Image
                  source={{ uri: activeTrip.coverImage }}
                  className="w-full h-36"
                  resizeMode="cover"
                />
              )}
              <View className="p-4">
                <View className="flex-row items-center justify-between mb-1">
                  <Badge label="진행 중" variant="secondary" />
                  <Text className="text-xs font-semibold text-mutedText">
                    {activeTrip.startDate} ~ {activeTrip.endDate}
                  </Text>
                </View>

                <Text className="text-lg font-bold text-darkText mb-1">{activeTrip.title}</Text>
                <Text className="text-xs text-mutedText mb-3">{activeTrip.destination}</Text>

                <View className="flex-row items-center justify-between pt-3 border-t border-borderLine">
                  <View className="flex-row items-center">
                    <Users size={14} color="#8D99AE" />
                    <Text className="text-xs text-mutedText ml-1 font-medium">
                      멤버 {activeTrip.members.length}명
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <MapPin size={14} color="#FF6B6B" />
                    <Text className="text-xs font-bold color-primary ml-1">
                      {activeTrip.places.length}개 장소 등록됨
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          ) : (
            <Card className="items-center py-6">
              <Calendar size={32} color="#8D99AE" />
              <Text className="text-sm font-bold text-darkText mt-2">새로운 여행을 계획해보세요!</Text>
              <Text className="text-xs text-mutedText mt-1 mb-3">친구들과 핫플을 공유하고 동선을 만드세요.</Text>
              <Button title="새 여행 만들기" onPress={() => {}} size="sm" icon={<Plus size={14} color="#FFF" />} />
            </Card>
          )}
        </View>

        {/* 3. Pinned Pocket Preview */}
        <View className="px-4 mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Bookmark size={18} color="#FF6B6B" fill="#FF6B6B" className="mr-1" />
              <Text className="text-lg font-bold text-darkText ml-1">내 보관함 핫플 🔥</Text>
            </View>
            <Text className="text-xs font-semibold text-mutedText">총 {places.length}개</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4">
            {places.slice(0, 4).map((place) => (
              <TouchableOpacity
                key={place.id}
                activeOpacity={0.8}
                className="w-44 mr-3 bg-surface rounded-2xl border border-borderLine p-2.5 shadow-sm"
              >
                {place.imageUrl && (
                  <Image
                    source={{ uri: place.imageUrl }}
                    className="w-full h-24 rounded-xl mb-2"
                    resizeMode="cover"
                  />
                )}
                <View className="flex-row items-center mb-1">
                  <Badge label={place.category === 'cafe' ? '카페' : place.category === 'restaurant' ? '맛집' : '명소'} variant="primary" />
                  {place.rating && (
                    <Text className="text-[10px] font-bold text-amber-500 ml-auto">★ {place.rating}</Text>
                  )}
                </View>
                <Text className="text-xs font-bold text-darkText mb-1" numberOfLines={1}>
                  {place.name}
                </Text>
                <Text className="text-[10px] text-mutedText" numberOfLines={1}>
                  {place.address}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}
