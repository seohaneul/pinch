import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { X, Check, Plus, Trash2, Calendar, MapPin, ChevronRight } from 'lucide-react-native';
import { useTripStore } from '../../store/useTripStore';
import { CreateTripModal } from './CreateTripModal';

interface TripSwitcherModalProps {
  visible: boolean;
  onClose: () => void;
}

export const TripSwitcherModal: React.FC<TripSwitcherModalProps> = ({ visible, onClose }) => {
  const { trips, activeTripId, setActiveTrip, deleteTrip } = useTripStore();
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const handleSelectTrip = (tripId: string) => {
    setActiveTrip(tripId);
    onClose();
  };

  const handleDeleteTrip = (tripId: string, tripTitle: string) => {
    if (trips.length <= 1) {
      Alert.alert('알림', '최소 1개의 여행은 유지되어야 합니다.');
      return;
    }

    Alert.alert(
      '여행 삭제',
      `"${tripTitle}" 여행을 정말 삭제하시겠습니까? 관련 일정과 데이터가 모두 삭제됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제하기',
          style: 'destructive',
          onPress: () => {
            deleteTrip(tripId);
          },
        },
      ]
    );
  };

  return (
    <>
      <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-[32px] max-h-[85%] pb-8 pt-4 px-5">
            {/* Header */}
            <View className="flex-row items-center justify-between pb-3 border-b border-gray-100">
              <View>
                <Text className="text-xl font-extrabold text-darkText">내 여행 목록 🧳</Text>
                <Text className="text-xs text-mutedText mt-0.5">
                  총 {trips.length}개의 여행이 등록되어 있습니다
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Trip List */}
            <ScrollView showsVerticalScrollIndicator={false} className="mt-4 max-h-[380px]">
              {trips.map((trip) => {
                const isActive = trip.id === activeTripId;
                const dayCount = trip.schedules ? trip.schedules.length : 1;
                return (
                  <TouchableOpacity
                    key={trip.id}
                    activeOpacity={0.85}
                    onPress={() => handleSelectTrip(trip.id)}
                    className={`flex-row items-center p-3.5 mb-3 rounded-2xl border ${
                      isActive
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-borderLine bg-surface'
                    }`}
                  >
                    <Image
                      source={{
                        uri:
                          trip.coverImage ||
                          'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop',
                      }}
                      className="w-16 h-16 rounded-xl mr-3"
                      resizeMode="cover"
                    />

                    <View className="flex-1">
                      <View className="flex-row items-center mb-0.5">
                        <Text className="text-sm font-bold text-darkText flex-1" numberOfLines={1}>
                          {trip.title}
                        </Text>
                        {isActive && (
                          <View className="bg-primary px-2 py-0.5 rounded-full ml-1">
                            <Text className="text-[10px] font-bold text-white">진행중</Text>
                          </View>
                        )}
                      </View>

                      <View className="flex-row items-center mt-1">
                        <MapPin size={11} color="#64748B" className="mr-1" />
                        <Text className="text-xs text-mutedText font-medium" numberOfLines={1}>
                          {trip.destination}
                        </Text>
                      </View>

                      <View className="flex-row items-center mt-0.5">
                        <Calendar size={11} color="#64748B" className="mr-1" />
                        <Text className="text-[11px] text-mutedText">
                          {trip.startDate.slice(5)} ~ {trip.endDate.slice(5)} · {dayCount}일 코스
                        </Text>
                      </View>
                    </View>

                    {/* Delete button (only if more than 1 trip) */}
                    {trips.length > 1 && (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDeleteTrip(trip.id, trip.title);
                        }}
                        className="p-2 ml-1"
                      >
                        <Trash2 size={16} color="#94A3B8" />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Create New Trip Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setCreateModalVisible(true)}
              className="mt-3 flex-row items-center justify-center bg-primary py-3.5 rounded-2xl shadow-md"
            >
              <Plus size={18} color="#FFFFFF" className="mr-1.5" />
              <Text className="text-sm font-bold text-white">새로운 여행 만들기 ✈️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Embedded Create Modal */}
      <CreateTripModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onCreated={() => {
          setCreateModalVisible(false);
          onClose();
        }}
      />
    </>
  );
};
