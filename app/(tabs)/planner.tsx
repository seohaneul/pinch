import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Header } from '../../src/components/common/Header';
import { Card, Badge, EmptyState } from '../../src/components/common/Card';
import { Button } from '../../src/components/common/Button';
import { useTripStore } from '../../src/store/useTripStore';
import { usePlaceStore } from '../../src/store/usePlaceStore';
import {
  MapPin,
  Calendar,
  Navigation,
  Clock,
  Plus,
  Sparkles,
  ChevronRight,
  MoveDown,
} from 'lucide-react-native';

export default function PlannerScreen() {
  const { getActiveTrip } = useTripStore();
  const { places } = usePlaceStore();
  const [selectedDay, setSelectedDay] = useState(1);

  const activeTrip = getActiveTrip();
  const currentSchedule = activeTrip?.schedules.find((s) => s.dayNumber === selectedDay);

  // Get scheduled places for current day
  const scheduledPlaces = currentSchedule
    ? currentSchedule.placeIds
        .map((id) => places.find((p) => p.id === id) || activeTrip?.places.find((p) => p.id === id))
        .filter(Boolean)
    : [];

  return (
    <View className="flex-1 bg-background">
      <Header
        title="일정 & 동선 플래너 🗺️"
        subtitle={activeTrip ? activeTrip.title : '여행을 선택해주세요'}
        rightAction={
          <TouchableOpacity className="w-10 h-10 rounded-full bg-secondary/15 items-center justify-center">
            <Navigation size={20} color="#3BB3AA" />
          </TouchableOpacity>
        }
      />

      {/* Day selector tabs */}
      {activeTrip && (
        <View className="bg-surface border-b border-borderLine py-3 px-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {activeTrip.schedules.map((schedule) => {
              const isSelected = selectedDay === schedule.dayNumber;
              return (
                <TouchableOpacity
                  key={schedule.dayNumber}
                  onPress={() => setSelectedDay(schedule.dayNumber)}
                  activeOpacity={0.8}
                  className={`mr-3 px-4 py-2 rounded-2xl border ${
                    isSelected
                      ? 'bg-primary border-primary shadow-sm'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      isSelected ? 'text-white' : 'text-gray-500'
                    }`}
                  >
                    DAY {schedule.dayNumber}
                  </Text>
                  <Text
                    className={`text-[10px] mt-0.5 font-medium ${
                      isSelected ? 'text-white/80' : 'text-gray-400'
                    }`}
                  >
                    {schedule.date.slice(5)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Map Route Visual Placeholder */}
        <View className="mx-4 mt-4 overflow-hidden rounded-3xl border border-borderLine shadow-sm bg-surface">
          <View className="h-44 bg-emerald-50 items-center justify-center relative p-4">
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&auto=format&fit=crop' }}
              className="absolute inset-0 w-full h-full opacity-30"
              resizeMode="cover"
            />
            <View className="bg-surface/90 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/40 items-center">
              <View className="flex-row items-center mb-1">
                <Sparkles size={14} color="#FF6B6B" className="mr-1" />
                <Text className="text-xs font-bold text-darkText">AI 동선 스마트 최적화</Text>
              </View>
              <Text className="text-[11px] text-mutedText text-center">
                최단 이동 경로로 장소 순서를 자동 정렬해요!
              </Text>
            </View>
          </View>
        </View>

        {/* Schedule Timeline */}
        <View className="px-4 mt-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-darkText">
              DAY {selectedDay} 코스 ({scheduledPlaces.length}곳)
            </Text>

            <TouchableOpacity className="flex-row items-center bg-primary/10 px-3 py-1.5 rounded-full">
              <Plus size={14} color="#FF6B6B" />
              <Text className="text-xs font-bold color-primary ml-1">장소 추가</Text>
            </TouchableOpacity>
          </View>

          {scheduledPlaces.length > 0 ? (
            <View className="pl-3">
              {scheduledPlaces.map((place, index) => {
                if (!place) return null;
                return (
                  <View key={`${place.id}_${index}`} className="relative mb-4 pl-6 border-l-2 border-primary/30">
                    {/* Number pin marker */}
                    <View className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-primary items-center justify-center border-2 border-white shadow-sm">
                      <Text className="text-xs font-bold text-white">{index + 1}</Text>
                    </View>

                    <Card className="p-3">
                      <View className="flex-row items-center justify-between mb-1">
                        <Badge label={place.category === 'cafe' ? '카페' : '맛집'} variant="secondary" />
                        <Text className="text-[11px] text-mutedText">예상 1시간 소요</Text>
                      </View>
                      <Text className="text-base font-bold text-darkText mb-0.5">{place.name}</Text>
                      <Text className="text-xs text-mutedText" numberOfLines={1}>{place.address}</Text>
                    </Card>

                    {/* Distance / travel time connector */}
                    {index < scheduledPlaces.length - 1 && (
                      <View className="my-2 py-1 px-3 bg-secondary/10 border border-secondary/20 rounded-full self-start flex-row items-center">
                        <Clock size={12} color="#3BB3AA" className="mr-1" />
                        <Text className="text-[11px] font-bold color-secondary-dark">
                          차량 12분 · 3.4km 이동
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <EmptyState
              icon={<MapPin size={28} color="#FF6B6B" />}
              title="DAY 1 일정이 비어있습니다"
              description="보관함에 수집한 핫플을 이 날짜에 배치하여 알찬 동선을 만들어보세요."
              actionButton={<Button title="보관함에서 선택하기" onPress={() => {}} size="sm" />}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
