import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Header } from '../../src/components/common/Header';
import { Card, Badge, EmptyState } from '../../src/components/common/Card';
import { Button } from '../../src/components/common/Button';
import { useTripStore } from '../../src/store/useTripStore';
import { usePlaceStore } from '../../src/store/usePlaceStore';
import { TripMapView } from '../../src/components/planner/TripMapView';
import { TransportMode, calculateDistance } from '../../src/utils/routeUtils';
import {
  MapPin,
  Calendar,
  Sparkles,
  Clock,
  Footprints,
  Bus,
  Car,
  MoveUp,
  MoveDown,
  Trash2,
  Plus,
  ArrowUpDown,
  Navigation,
} from 'lucide-react-native';

export default function PlannerScreen() {
  const {
    currentTrip,
    selectedDay,
    scheduleItems,
    setSelectedDay,
    reorderSchedule,
    updateTransportMode,
    updateStayDuration,
    optimizeDayRoute,
    recalculateTimes,
    removeScheduleItem,
    addPlaceToSchedule,
  } = useTripStore();

  const { places } = usePlaceStore();

  // Get current day's sorted schedule items
  const dayStops = scheduleItems
    .filter((s) => s.day_number === selectedDay)
    .sort((a, b) => a.order_index - b.order_index);

  useEffect(() => {
    recalculateTimes(selectedDay);
  }, [selectedDay]);

  const handleOptimizeRoute = () => {
    if (dayStops.length <= 1) {
      Alert.alert('알림', '최적화를 위해 최소 2개 이상의 장소가 필요합니다.');
      return;
    }
    optimizeDayRoute(selectedDay);
    Alert.alert('최적화 완료! ✨', '최단 이동 거리 순으로 동선이 자동 배치되었습니다.');
  };

  const handleAddRandomPlace = () => {
    if (places.length === 0) return;
    const randomPlace = places[Math.floor(Math.random() * places.length)];
    addPlaceToSchedule(selectedDay, randomPlace);
  };

  return (
    <View className="flex-1 bg-background">
      <Header
        title="동선 플래너 🗺️"
        subtitle={currentTrip ? currentTrip.title : '도쿄 3박 4일 감성 여행'}
        rightAction={
          <TouchableOpacity
            onPress={handleOptimizeRoute}
            className="flex-row items-center bg-primary px-3 py-2 rounded-2xl shadow-sm"
          >
            <Sparkles size={14} color="#FFFFFF" className="mr-1" />
            <Text className="text-xs font-bold text-white">동선 최적화</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }}>
        {/* Top Interactive Map Section */}
        <View className="p-4">
          <TripMapView stops={dayStops} selectedDay={selectedDay} />
        </View>

        {/* Day Selector Tabs */}
        <View className="bg-surface border-y border-borderLine py-3 px-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {currentTrip.schedules.map((schedule) => {
              const isSelected = selectedDay === schedule.dayNumber;
              const count = scheduleItems.filter((s) => s.day_number === schedule.dayNumber).length;

              return (
                <TouchableOpacity
                  key={schedule.dayNumber}
                  onPress={() => setSelectedDay(schedule.dayNumber)}
                  activeOpacity={0.8}
                  className={`mr-3 px-4 py-2 rounded-2xl border flex-row items-center ${
                    isSelected
                      ? 'bg-primary border-primary shadow-sm'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <View>
                    <Text
                      className={`text-xs font-bold ${
                        isSelected ? 'text-white' : 'text-darkText'
                      }`}
                    >
                      DAY {schedule.dayNumber}
                    </Text>
                    <Text
                      className={`text-[10px] mt-0.5 font-medium ${
                        isSelected ? 'text-white/80' : 'text-mutedText'
                      }`}
                    >
                      {schedule.date.slice(5)}
                    </Text>
                  </View>
                  <View
                    className={`ml-2 px-1.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-white/20' : 'bg-gray-200'
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-extrabold ${
                        isSelected ? 'text-white' : 'text-gray-600'
                      }`}
                    >
                      {count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Day Itinerary Timeline List */}
        <View className="px-4 mt-5">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-lg font-bold text-darkText">
                DAY {selectedDay} 코스 타임라인 📍
              </Text>
              <Text className="text-xs text-mutedText mt-0.5">
                장소 순서를 변경하거나 이동 수단을 설정해 보세요
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleAddRandomPlace}
              className="flex-row items-center bg-primary/10 px-3 py-2 rounded-2xl border border-primary/20"
            >
              <Plus size={14} color="#FF6B6B" />
              <Text className="text-xs font-bold color-primary ml-1">스팟 추가</Text>
            </TouchableOpacity>
          </View>

          {dayStops.length > 0 ? (
            <View className="pl-2">
              {dayStops.map((stop, index) => {
                const isFirst = index === 0;
                const isLast = index === dayStops.length - 1;

                // Calculate distance to next stop
                const nextStop = !isLast ? dayStops[index + 1] : null;
                const nextDist = nextStop
                  ? calculateDistance(
                      stop.latitude,
                      stop.longitude,
                      nextStop.latitude,
                      nextStop.longitude
                    )
                  : 0;

                return (
                  <React.Fragment key={stop.id}>
                    {/* Schedule Stop Card */}
                    <View className="relative pl-7 pb-2 border-l-2 border-primary/30">
                      {/* Numbered Pin Badge */}
                      <View className="absolute -left-[14px] top-0 w-7 h-7 rounded-full bg-primary items-center justify-center border-2 border-white shadow-sm z-10">
                        <Text className="text-xs font-extrabold text-white">
                          {stop.order_index}
                        </Text>
                      </View>

                      <Card className="p-3 bg-surface border border-borderLine">
                        <View className="flex-row items-center justify-between mb-1.5">
                          <View className="flex-row items-center">
                            <View className="bg-primary/10 px-2 py-0.5 rounded-md mr-2 flex-row items-center">
                              <Clock size={11} color="#FF6B6B" />
                              <Text className="text-[11px] font-bold color-primary ml-1">
                                {stop.arrival_time} 도착
                              </Text>
                            </View>
                            <Badge label={stop.category} variant="secondary" />
                          </View>

                          {/* Reorder Up/Down buttons */}
                          <View className="flex-row items-center">
                            {!isFirst && (
                              <TouchableOpacity
                                onPress={() => reorderSchedule(selectedDay, index, index - 1)}
                                className="p-1 mr-1 bg-gray-100 rounded-lg"
                              >
                                <MoveUp size={12} color="#2B2D42" />
                              </TouchableOpacity>
                            )}
                            {!isLast && (
                              <TouchableOpacity
                                onPress={() => reorderSchedule(selectedDay, index, index + 1)}
                                className="p-1 mr-1 bg-gray-100 rounded-lg"
                              >
                                <MoveDown size={12} color="#2B2D42" />
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity
                              onPress={() => removeScheduleItem(stop.id)}
                              className="p-1 bg-rose-50 rounded-lg"
                            >
                              <Trash2 size={12} color="#E05353" />
                            </TouchableOpacity>
                          </View>
                        </View>

                        <Text className="text-base font-bold text-darkText mb-1">
                          {stop.place_name}
                        </Text>
                        {stop.address && (
                          <Text className="text-xs text-mutedText mb-2" numberOfLines={1}>
                            {stop.address}
                          </Text>
                        )}

                        {/* Stay Duration selector pills */}
                        <View className="flex-row items-center pt-2 border-t border-gray-100">
                          <Text className="text-[11px] text-mutedText mr-2 font-medium">체류 시간:</Text>
                          {[30, 60, 90, 120].map((mins) => {
                            const isSelected = stop.stay_duration_minutes === mins;
                            return (
                              <TouchableOpacity
                                key={mins}
                                onPress={() => updateStayDuration(stop.id, mins)}
                                className={`px-2 py-0.5 rounded-md mr-1 ${
                                  isSelected ? 'bg-darkText' : 'bg-gray-100'
                                }`}
                              >
                                <Text
                                  className={`text-[10px] font-bold ${
                                    isSelected ? 'text-white' : 'text-gray-600'
                                  }`}
                                >
                                  {mins}분
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </Card>
                    </View>

                    {/* Transport Connector Mode Selector between consecutive stops */}
                    {!isLast && nextStop && (
                      <View className="pl-7 my-2 relative">
                        <View className="bg-secondary/10 border border-secondary/30 rounded-2xl p-2.5 flex-row items-center justify-between">
                          <View className="flex-row items-center">
                            <Navigation size={14} color="#3BB3AA" className="mr-1.5" />
                            <Text className="text-xs font-bold color-secondary-dark">
                              이동 {nextStop.travel_duration_minutes}분 · {nextDist}km
                            </Text>
                          </View>

                          {/* Transport Mode Toggle Pills */}
                          <View className="flex-row items-center bg-surface p-1 rounded-xl border border-secondary/20">
                            <TouchableOpacity
                              onPress={() => updateTransportMode(nextStop.id, 'WALK')}
                              className={`p-1.5 rounded-lg mr-1 ${
                                nextStop.transport_mode === 'WALK' ? 'bg-secondary' : ''
                              }`}
                            >
                              <Footprints
                                size={13}
                                color={nextStop.transport_mode === 'WALK' ? '#FFF' : '#8D99AE'}
                              />
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => updateTransportMode(nextStop.id, 'TRANSIT')}
                              className={`p-1.5 rounded-lg mr-1 ${
                                nextStop.transport_mode === 'TRANSIT' ? 'bg-secondary' : ''
                              }`}
                            >
                              <Bus
                                size={13}
                                color={nextStop.transport_mode === 'TRANSIT' ? '#FFF' : '#8D99AE'}
                              />
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => updateTransportMode(nextStop.id, 'DRIVE')}
                              className={`p-1.5 rounded-lg ${
                                nextStop.transport_mode === 'DRIVE' ? 'bg-secondary' : ''
                              }`}
                            >
                              <Car
                                size={13}
                                color={nextStop.transport_mode === 'DRIVE' ? '#FFF' : '#8D99AE'}
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          ) : (
            <EmptyState
              icon={<MapPin size={28} color="#FF6B6B" />}
              title="DAY " + selectedDay + " 동선이 비어있습니다"
              description="보관함에서 핫플을 추가하거나 스팟 추가 버튼을 눌러 일정을 채워보세요."
              actionButton={
                <Button
                  title="스팟 추가하기"
                  onPress={handleAddRandomPlace}
                  size="sm"
                  icon={<Plus size={14} color="#FFF" />}
                />
              }
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
