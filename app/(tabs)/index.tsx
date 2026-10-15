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
import { useRouter } from 'expo-router';
import { Header } from '../../src/components/common/Header';
import { Card, Badge } from '../../src/components/common/Card';
import { Button } from '../../src/components/common/Button';
import { useTripStore } from '../../src/store/useTripStore';
import { usePlaceStore } from '../../src/store/usePlaceStore';
import { useWalletStore } from '../../src/store/useWalletStore';
import { useClipboardListener } from '../../src/hooks/useClipboardListener';
import { ClipboardToast } from '../../src/components/places/ClipboardToast';
import { TripSwitcherModal } from '../../src/components/trip/TripSwitcherModal';
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
  Wallet,
  Clock,
  Navigation,
  ChevronRight,
  Receipt,
  Coins,
} from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const [urlInput, setUrlInput] = useState('');
  const [tripSwitcherVisible, setTripSwitcherVisible] = useState(false);
  const { currentTrip, scheduleItems } = useTripStore();
  const { places, isExtracting, extractFromUrl } = usePlaceStore();
  const { getTotalKrw } = useWalletStore();
  const { detectedUrl, dismissDetectedUrl } = useClipboardListener();

  const totalSpentKrw = getTotalKrw();
  const budget = currentTrip?.budget || 1200000;
  const budgetUsagePercent = Math.min(Math.round((totalSpentKrw / budget) * 100), 100);

  // Day 1 scheduled stops
  const day1Stops = scheduleItems
    .filter((s) => s.day_number === 1)
    .sort((a, b) => a.order_index - b.order_index);

  // D-Day calculation
  const calculateDDay = (startDate?: string) => {
    if (!startDate) return 'D-Day';
    const target = new Date(startDate).getTime();
    const now = new Date().getTime();
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'D-Day';
    if (diffDays > 0) return `D-${diffDays}`;
    return `D+${Math.abs(diffDays)}`;
  };

  const handleExtract = async (urlToExtract?: string) => {
    const targetUrl = urlToExtract || urlInput;
    if (!targetUrl.trim()) {
      Alert.alert('알림', '인스타그램, 유튜브 등 SNS 링크를 입력해주세요.');
      return;
    }

    const newPlace = await extractFromUrl(targetUrl);
    if (newPlace) {
      Alert.alert('핀치 완료! 🎉', `"${newPlace.name}" 장소가 보관함에 추가되었습니다.`);
      setUrlInput('');
      dismissDetectedUrl();
    } else {
      Alert.alert('파싱 오류', '링크에서 장소를 추출하지 못했습니다. URL을 확인해 주세요.');
    }
  };

  return (
    <View className="flex-1 bg-background">
      <Header
        title="Pinch"
        subtitle="링크만 던지면 핫플만 핀치! 🤏"
        rightAction={
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/places')}
            className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center"
            accessibilityLabel="핫플 보관함"
          >
            <Sparkles size={20} color="#FF6B6B" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Clipboard Auto-Detection Toast */}
        {detectedUrl && (
          <View className="px-4 pt-3">
            <ClipboardToast
              url={detectedUrl}
              onPinch={() => handleExtract(detectedUrl)}
              onDismiss={dismissDetectedUrl}
            />
          </View>
        )}

        {/* 1. Quick Link Extractor Hero Card */}
        <View className="p-4 mx-4 mt-3 bg-surface rounded-3xl border border-primary/20 shadow-sm">
          <View className="flex-row items-center mb-2">
            <View className="w-8 h-8 rounded-full bg-primary/15 items-center justify-center mr-2">
              <LinkIcon size={16} color="#FF6B6B" />
            </View>
            <Text className="text-base font-bold text-darkText">SNS 링크에서 핫플 핀치</Text>
            <View className="ml-auto bg-secondary/20 px-2 py-0.5 rounded-md">
              <Text className="text-[10px] font-bold text-teal-700">AI 스마트 파싱</Text>
            </View>
          </View>

          <Text className="text-xs text-mutedText mb-3 leading-4">
            릴스, 유튜브 쇼츠, 블로그 링크를 넣으면 장소명과 위치를 자동 추출해요!
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
            onPress={() => handleExtract()}
            loading={isExtracting}
            icon={<Sparkles size={16} color="#FFFFFF" />}
            size="md"
            className="w-full"
          />
        </View>

        {/* 2. Active Trip Banner */}
        <View className="px-4 mt-5">
          <View className="flex-row items-center justify-between mb-2.5">
            <Text className="text-base font-extrabold text-darkText">진행 중인 여행 ✈️</Text>
            <TouchableOpacity
              onPress={() => setTripSwitcherVisible(true)}
              className="flex-row items-center bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20"
            >
              <Text className="text-xs font-bold text-primary mr-1">여행 변경 / 추가</Text>
              <ChevronRight size={13} color="#FF6B6B" />
            </TouchableOpacity>
          </View>

          {currentTrip && (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => router.push('/(tabs)/planner')}
            >
              <Card className="p-0 overflow-hidden">
                {currentTrip.coverImage && (
                  <View className="relative">
                    <Image
                      source={{ uri: currentTrip.coverImage }}
                      className="w-full h-36"
                      resizeMode="cover"
                    />
                    <View className="absolute top-3 left-3 bg-primary/95 px-2.5 py-1 rounded-full shadow-sm">
                      <Text className="text-xs font-extrabold text-white">
                        {calculateDDay(currentTrip.startDate)}
                      </Text>
                    </View>
                  </View>
                )}

                <View className="p-4">
                  <View className="flex-row items-center justify-between mb-1">
                    <Badge label={currentTrip.destination} variant="secondary" />
                    <Text className="text-xs font-semibold text-mutedText">
                      {currentTrip.startDate} ~ {currentTrip.endDate}
                    </Text>
                  </View>

                  <Text className="text-lg font-extrabold text-darkText mb-1">
                    {currentTrip.title}
                  </Text>

                  {/* Trip Progress readout */}
                  <View className="flex-row items-center justify-between pt-3 border-t border-borderLine mt-2">
                    <View className="flex-row items-center">
                      <Bookmark size={13} color="#FF6B6B" />
                      <Text className="text-xs font-bold text-darkText ml-1">
                        저장 장소 {places.length}개
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <MapPin size={13} color="#4ECDC4" />
                      <Text className="text-xs font-bold text-darkText ml-1">
                        계획 일정 {scheduleItems.length}개
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Users size={13} color="#8D99AE" />
                      <Text className="text-xs font-bold text-mutedText ml-1">
                        멤버 {currentTrip.members?.length || 3}명
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          )}
        </View>

        {/* 3. Today's Itinerary Quick Preview (Day 1) */}
        {day1Stops.length > 0 && (
          <View className="px-4 mt-5">
            <View className="flex-row items-center justify-between mb-2.5">
              <View className="flex-row items-center">
                <Clock size={16} color="#FF6B6B" />
                <Text className="text-base font-extrabold text-darkText ml-1.5">
                  오늘의 추천 동선 (DAY 1)
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/planner')}
                className="flex-row items-center"
              >
                <Text className="text-xs font-bold text-primary">전체 동선</Text>
                <ChevronRight size={14} color="#FF6B6B" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)/planner')}
            >
              <Card className="p-3.5 bg-surface">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-xs font-bold text-mutedText">
                    DAY 1 일정 · 총 {day1Stops.length}개 스팟
                  </Text>
                  <View className="bg-primary/10 px-2 py-0.5 rounded-md">
                    <Text className="text-[10px] font-bold text-primary">동선 최적화됨</Text>
                  </View>
                </View>

                {/* Horizontal Sequence Flow */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ alignItems: 'center', paddingVertical: 4 }}
                >
                  {day1Stops.map((stop, idx) => (
                    <React.Fragment key={stop.id}>
                      <View className="items-center bg-gray-50 p-2.5 rounded-2xl border border-gray-100 min-w-[100px]">
                        <View className="w-5 h-5 rounded-full bg-primary items-center justify-center mb-1">
                          <Text className="text-[10px] font-bold text-white">{stop.order_index}</Text>
                        </View>
                        <Text
                          className="text-xs font-bold text-darkText text-center mb-0.5"
                          numberOfLines={1}
                        >
                          {stop.place_name}
                        </Text>
                        <Text className="text-[10px] text-mutedText font-medium">
                          {stop.arrival_time}
                        </Text>
                      </View>

                      {idx < day1Stops.length - 1 && (
                        <View className="px-2 items-center">
                          <ArrowRight size={14} color="#FF6B6B" />
                          <Text className="text-[9px] text-mutedText mt-0.5">이동</Text>
                        </View>
                      )}
                    </React.Fragment>
                  ))}
                </ScrollView>
              </Card>
            </TouchableOpacity>
          </View>
        )}

        {/* 4. Wallet Quick Glance */}
        <View className="px-4 mt-5">
          <View className="flex-row items-center justify-between mb-2.5">
            <View className="flex-row items-center">
              <Wallet size={16} color="#FF6B6B" />
              <Text className="text-base font-extrabold text-darkText ml-1.5">
                여행 가계부 현황 💳
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/wallet')}
              className="flex-row items-center"
            >
              <Text className="text-xs font-bold text-primary">1/N 정산 보기</Text>
              <ChevronRight size={14} color="#FF6B6B" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)/wallet')}
          >
            <Card className="p-4 bg-surface">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs font-bold text-mutedText">총 사용 금액</Text>
                <Badge label={`예산의 ${budgetUsagePercent}% 소진`} variant="secondary" />
              </View>

              <View className="flex-row items-baseline mb-2.5">
                <Text className="text-2xl font-extrabold text-darkText">
                  {totalSpentKrw.toLocaleString()}
                </Text>
                <Text className="text-sm font-bold text-darkText ml-1">원</Text>
                <Text className="text-xs text-mutedText ml-auto">
                  목표 예산: {budget.toLocaleString()}원
                </Text>
              </View>

              {/* Progress bar */}
              <View className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                <View
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${budgetUsagePercent}%` }}
                />
              </View>

              <View className="flex-row items-center justify-between pt-1">
                <Text className="text-xs text-mutedText">
                  남은 예산: {Math.max(budget - totalSpentKrw, 0).toLocaleString()}원
                </Text>
                <View className="flex-row items-center">
                  <Coins size={12} color="#FF6B6B" />
                  <Text className="text-xs font-bold text-primary ml-1">이중 통화 지원</Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        </View>

        {/* 5. Pinned Pocket Preview */}
        <View className="px-4 mt-5">
          <View className="flex-row items-center justify-between mb-2.5">
            <View className="flex-row items-center">
              <Bookmark size={16} color="#FF6B6B" fill="#FF6B6B" />
              <Text className="text-base font-extrabold text-darkText ml-1.5">
                내 보관함 핫플 🔥
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/places')}
              className="flex-row items-center"
            >
              <Text className="text-xs font-bold text-primary">전체 {places.length}개</Text>
              <ChevronRight size={14} color="#FF6B6B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="-mx-4 px-4"
          >
            {places.slice(0, 5).map((place) => (
              <TouchableOpacity
                key={place.id}
                activeOpacity={0.8}
                onPress={() => router.push('/(tabs)/places')}
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
                  <Badge
                    label={
                      place.category === 'CAFE' || place.category === 'cafe'
                        ? '☕ 카페'
                        : place.category === 'RESTAURANT' || place.category === 'restaurant'
                        ? '🍴 맛집'
                        : '📸 명소'
                    }
                    variant="primary"
                  />
                  {place.rating && (
                    <Text className="text-[10px] font-bold text-amber-500 ml-auto">
                      ★ {place.rating}
                    </Text>
                  )}
                </View>
                <Text className="text-xs font-bold text-darkText mb-0.5" numberOfLines={1}>
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

      {/* Trip Switcher & Create Modal */}
      <TripSwitcherModal
        visible={tripSwitcherVisible}
        onClose={() => setTripSwitcherVisible(false)}
      />
    </View>
  );
}
