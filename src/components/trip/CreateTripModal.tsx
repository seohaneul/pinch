import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Calendar, MapPin, Sparkles, DollarSign, Users, Check } from 'lucide-react-native';
import { useTripStore } from '../../store/useTripStore';

interface CreateTripModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated?: (tripId: string) => void;
}

interface DestinationPreset {
  id: string;
  name: string;
  country: string;
  flag: string;
  defaultTitle: string;
  coverImage: string;
}

const DESTINATION_PRESETS: DestinationPreset[] = [
  {
    id: 'osaka',
    name: '오사카 / 교토',
    country: '일본',
    flag: '🇯🇵',
    defaultTitle: '오사카 먹방 & 교토 힐링 여행 🏯',
    coverImage: 'https://images.unsplash.com/photo-1590559899731-a3f376dd4558?w=800&auto=format&fit=crop',
  },
  {
    id: 'fukuoka',
    name: '후쿠오카 / 유후인',
    country: '일본',
    flag: '🇯🇵',
    defaultTitle: '후쿠오카 온천 & 라멘 투어 🍜',
    coverImage: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&auto=format&fit=crop',
  },
  {
    id: 'jeju',
    name: '제주도',
    country: '대한민국',
    flag: '🇰🇷',
    defaultTitle: '푸른 바다 제주 드라이브 🍊',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
  },
  {
    id: 'tokyo',
    name: '도쿄 / 시부야',
    country: '일본',
    flag: '🇯🇵',
    defaultTitle: '도쿄 쇼핑 & 감성 카페 투어 🗼',
    coverImage: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop',
  },
  {
    id: 'bangkok',
    name: '방콕',
    country: '태국',
    flag: '🇹🇭',
    defaultTitle: '방콕 야시장 & 루프탑 바 🌴',
    coverImage: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&auto=format&fit=crop',
  },
  {
    id: 'paris',
    name: '파리',
    country: '프랑스',
    flag: '🇫🇷',
    defaultTitle: '로맨틱 파리 예술 기행 🥐',
    coverImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop',
  },
];

export const CreateTripModal: React.FC<CreateTripModalProps> = ({
  visible,
  onClose,
  onCreated,
}) => {
  const { createTrip } = useTripStore();

  const [selectedPreset, setSelectedPreset] = useState<DestinationPreset>(DESTINATION_PRESETS[0]);
  const [title, setTitle] = useState(DESTINATION_PRESETS[0].defaultTitle);
  const [destination, setDestination] = useState(DESTINATION_PRESETS[0].name);
  const [startDate, setStartDate] = useState('2026-12-01');
  const [endDate, setEndDate] = useState('2026-12-04');
  const [budgetStr, setBudgetStr] = useState('1000000');
  const [memberInput, setMemberInput] = useState('나, 지은, 민혁');

  const handleSelectPreset = (preset: DestinationPreset) => {
    setSelectedPreset(preset);
    setDestination(preset.name);
    setTitle(preset.defaultTitle);
  };

  const handleCreate = () => {
    if (!title.trim()) {
      Alert.alert('알림', '여행 제목을 입력해 주세요.');
      return;
    }
    if (!destination.trim()) {
      Alert.alert('알림', '여행지를 입력해 주세요.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      Alert.alert('알림', '종료일은 시작일보다 빠를 수 없습니다.');
      return;
    }

    const members = memberInput
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);

    const newTrip = createTrip({
      title: title.trim(),
      destination: destination.trim(),
      startDate,
      endDate,
      budget: Number(budgetStr.replace(/[^0-9]/g, '')) || 1000000,
      coverImage: selectedPreset.coverImage,
      memberNames: members.length > 0 ? members : ['나 (민지)', '수현'],
    });

    Alert.alert('새 여행 생성 완료! ✈️', `"${newTrip.title}" 일정이 추가되었습니다.`);
    onClose();
    if (onCreated) onCreated(newTrip.id);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/50"
      >
        <View className="bg-white rounded-t-[32px] max-h-[90%] pb-8 pt-4 px-5">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-gray-100">
            <View>
              <Text className="text-xl font-extrabold text-darkText">새로운 여행 만들기 ✈️</Text>
              <Text className="text-xs text-mutedText mt-0.5">
                새로운 일정과 가계부를 함께 시작해 보세요
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
            >
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="mt-4">
            {/* Destination Presets */}
            <Text className="text-xs font-bold text-darkText mb-2">인기 여행지 선택</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-4">
              {DESTINATION_PRESETS.map((preset) => {
                const isSelected = selectedPreset.id === preset.id;
                return (
                  <TouchableOpacity
                    key={preset.id}
                    activeOpacity={0.8}
                    onPress={() => handleSelectPreset(preset)}
                    className={`mr-3 p-2.5 rounded-2xl border items-center w-28 ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-borderLine bg-surface'
                    }`}
                  >
                    <Image
                      source={{ uri: preset.coverImage }}
                      className="w-20 h-14 rounded-xl mb-1.5"
                      resizeMode="cover"
                    />
                    <Text className="text-xs font-bold text-darkText text-center" numberOfLines={1}>
                      {preset.flag} {preset.name.split('/')[0]}
                    </Text>
                    {isSelected && (
                      <View className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary items-center justify-center">
                        <Check size={11} color="#FFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Travel Title Input */}
            <View className="mb-3.5">
              <Text className="text-xs font-bold text-darkText mb-1.5">여행 제목</Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-3">
                <Sparkles size={16} color="#FF6B6B" className="mr-2" />
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="예: 도쿄 3박 4일 감성 여행"
                  className="flex-1 text-sm text-darkText font-medium"
                />
              </View>
            </View>

            {/* Dates Input */}
            <View className="flex-row space-x-3 mb-3.5">
              <View className="flex-1 mr-2">
                <Text className="text-xs font-bold text-darkText mb-1.5">출발일 (YYYY-MM-DD)</Text>
                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-3">
                  <Calendar size={15} color="#64748B" className="mr-2" />
                  <TextInput
                    value={startDate}
                    onChangeText={setStartDate}
                    placeholder="2026-12-01"
                    className="flex-1 text-sm text-darkText font-medium"
                  />
                </View>
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-darkText mb-1.5">도착일 (YYYY-MM-DD)</Text>
                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-3">
                  <Calendar size={15} color="#64748B" className="mr-2" />
                  <TextInput
                    value={endDate}
                    onChangeText={setEndDate}
                    placeholder="2026-12-04"
                    className="flex-1 text-sm text-darkText font-medium"
                  />
                </View>
              </View>
            </View>

            {/* Budget Input */}
            <View className="mb-3.5">
              <Text className="text-xs font-bold text-darkText mb-1.5">총 예산 (KRW)</Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-3">
                <DollarSign size={16} color="#059669" className="mr-2" />
                <TextInput
                  value={budgetStr}
                  onChangeText={setBudgetStr}
                  keyboardType="numeric"
                  placeholder="1000000"
                  className="flex-1 text-sm text-darkText font-medium"
                />
                <Text className="text-xs font-bold text-mutedText">원</Text>
              </View>
            </View>

            {/* Members Input */}
            <View className="mb-5">
              <Text className="text-xs font-bold text-darkText mb-1.5">
                동행 멤버 (쉼표로 구분)
              </Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-3">
                <Users size={16} color="#64748B" className="mr-2" />
                <TextInput
                  value={memberInput}
                  onChangeText={setMemberInput}
                  placeholder="나, 민지, 수현"
                  className="flex-1 text-sm text-darkText font-medium"
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleCreate}
              className="bg-primary py-4 rounded-2xl items-center justify-center shadow-md mb-2"
            >
              <Text className="text-base font-bold text-white">이 여행으로 일정 시작하기 🚀</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
