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
  StyleSheet,
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
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
        style={[styles.keyboardContainer, { backgroundColor: 'rgba(0, 0, 0, 0.4)' }]}
      >
        <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>새로운 여행 만들기 ✈️</Text>
              <Text style={styles.headerSubtitle}>
                새로운 일정과 가계부를 함께 시작해 보세요
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              style={styles.closeBtn}
            >
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollBody}>
            {/* Destination Presets */}
            <Text style={styles.sectionLabel}>인기 여행지 선택</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
              {DESTINATION_PRESETS.map((preset) => {
                const isSelected = selectedPreset.id === preset.id;
                return (
                  <TouchableOpacity
                    key={preset.id}
                    activeOpacity={0.8}
                    onPress={() => handleSelectPreset(preset)}
                    style={[
                      styles.presetItem,
                      isSelected && styles.presetItemSelected,
                    ]}
                  >
                    <Image
                      source={{ uri: preset.coverImage }}
                      style={styles.presetImage}
                      resizeMode="cover"
                    />
                    <Text style={styles.presetText} numberOfLines={1}>
                      {preset.flag} {preset.name.split('/')[0]}
                    </Text>
                    {isSelected && (
                      <View style={styles.checkBadge}>
                        <Check size={11} color="#FFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Travel Title Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>여행 제목</Text>
              <View style={styles.inputRow}>
                <Sparkles size={16} color="#FF6B6B" style={{ marginRight: 8 }} />
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="예: 도쿄 3박 4일 감성 여행"
                  style={styles.textInput}
                />
              </View>
            </View>

            {/* Dates Input */}
            <View style={styles.datesRow}>
              <View style={styles.dateCol}>
                <Text style={styles.inputLabel}>출발일 (YYYY-MM-DD)</Text>
                <View style={styles.inputRow}>
                  <Calendar size={15} color="#64748B" style={{ marginRight: 6 }} />
                  <TextInput
                    value={startDate}
                    onChangeText={setStartDate}
                    placeholder="2026-12-01"
                    style={styles.textInput}
                  />
                </View>
              </View>
              <View style={styles.dateCol}>
                <Text style={styles.inputLabel}>도착일 (YYYY-MM-DD)</Text>
                <View style={styles.inputRow}>
                  <Calendar size={15} color="#64748B" style={{ marginRight: 6 }} />
                  <TextInput
                    value={endDate}
                    onChangeText={setEndDate}
                    placeholder="2026-12-04"
                    style={styles.textInput}
                  />
                </View>
              </View>
            </View>

            {/* Budget Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>총 예산 (KRW)</Text>
              <View style={styles.inputRow}>
                <DollarSign size={16} color="#059669" style={{ marginRight: 8 }} />
                <TextInput
                  value={budgetStr}
                  onChangeText={setBudgetStr}
                  keyboardType="numeric"
                  placeholder="1000000"
                  style={styles.textInput}
                />
                <Text style={styles.currencySuffix}>원</Text>
              </View>
            </View>

            {/* Members Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                동행 멤버 (쉼표로 구분)
              </Text>
              <View style={styles.inputRow}>
                <Users size={16} color="#64748B" style={{ marginRight: 8 }} />
                <TextInput
                  value={memberInput}
                  onChangeText={setMemberInput}
                  placeholder="나, 민지, 수현"
                  style={styles.textInput}
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleCreate}
              style={styles.submitBtn}
            >
              <Text style={styles.submitBtnText}>이 여행으로 일정 시작하기 🚀</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
    paddingBottom: 24,
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    marginTop: 14,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  presetScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  presetItem: {
    marginRight: 12,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    width: 108,
    position: 'relative',
  },
  presetItemSelected: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  presetImage: {
    width: 84,
    height: 56,
    borderRadius: 10,
    marginBottom: 6,
  },
  presetText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '500',
    padding: 0,
  },
  currencySuffix: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 4,
  },
  datesRow: {
    flexDirection: 'row',
    marginBottom: 14,
    gap: 10,
  },
  dateCol: {
    flex: 1,
  },
  submitBtn: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
