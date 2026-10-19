import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Clock,
  Sparkles,
  Check,
  Plane,
  ArrowRight,
} from 'lucide-react-native';

interface DayStartTimeModalProps {
  visible: boolean;
  onClose: () => void;
  dayNumber: number;
  currentStartTime: string;
  onSaveStartTime: (newTimeStr: string) => void;
  onOpenFlightModal?: () => void;
}

export const DayStartTimeModal: React.FC<DayStartTimeModalProps> = ({
  visible,
  onClose,
  dayNumber,
  currentStartTime,
  onSaveStartTime,
  onOpenFlightModal,
}) => {
  const insets = useSafeAreaInsets();
  const [startTimeInput, setStartTimeInput] = useState(currentStartTime || '10:00');

  useEffect(() => {
    if (visible) {
      setStartTimeInput(currentStartTime || '10:00');
    }
  }, [currentStartTime, visible]);

  const handleSave = () => {
    const trimmed = startTimeInput.trim();
    const regex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (!regex.test(trimmed)) {
      Alert.alert('알림', '시간 형식을 09:30 또는 14:00 형태로 입력해주세요.');
      return;
    }

    onSaveStartTime(trimmed);
    Alert.alert(
      '일정 시작 시간 변경 완료 ⏰',
      `DAY ${dayNumber} 일정이 ${trimmed}부터 시작되도록 모든 방문 스팟의 도착 시간이 자동 재계산되었습니다.`
    );
    onClose();
  };

  const PRESET_TIMES = [
    '08:00',
    '08:30',
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={[styles.sheet, { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Clock size={18} color="#FF6B6B" />
              </View>
              <View>
                <Text style={styles.title}>DAY {dayNumber} 시작 시간 수정 ⏰</Text>
                <Text style={styles.subtitle}>
                  시작 시간에 맞춰 모든 일정 장소의 도착 시간이 자동 재계산됩니다
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollBody}>
            {/* Main Time Input Display */}
            <View style={styles.mainBox}>
              <Text style={styles.mainLabel}>DAY {dayNumber} 일정 시작 시간 설정</Text>
              <View style={styles.timeInputRow}>
                <Clock size={20} color="#FF6B6B" style={{ marginRight: 8 }} />
                <TextInput
                  value={startTimeInput}
                  onChangeText={setStartTimeInput}
                  placeholder="10:00"
                  placeholderTextColor="#94A3B8"
                  style={styles.timeInput}
                  maxLength={5}
                />
              </View>
              <Text style={styles.helperText}>
                예: 오전 9시 30분 시작은 09:30, 오후 1시 시작은 13:00
              </Text>
            </View>

            {/* Quick Time Preset Pills */}
            <Text style={styles.sectionSubTitle}>빠른 시간 선택</Text>
            <View style={styles.presetGrid}>
              {PRESET_TIMES.map((time) => {
                const isSelected = startTimeInput === time;
                return (
                  <TouchableOpacity
                    key={time}
                    onPress={() => setStartTimeInput(time)}
                    style={[
                      styles.presetChip,
                      isSelected && styles.presetChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        isSelected && styles.presetChipTextActive,
                      ]}
                    >
                      {time}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Link to Flight Modal if available */}
            {onOpenFlightModal && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  onClose();
                  onOpenFlightModal();
                }}
                style={styles.flightLinkBox}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Plane size={15} color="#0284C7" style={{ marginRight: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.flightLinkTitle}>비행기 도착 시간에 맞추고 싶으신가요?</Text>
                    <Text style={styles.flightLinkSub}>
                      항공편 착륙 시간과 공항 수속 여유를 고려해 시작 시간을 자동 연동하세요
                    </Text>
                  </View>
                </View>
                <ArrowRight size={14} color="#0284C7" />
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Save Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSave}
            style={styles.saveBtn}
          >
            <Check size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.saveBtnText}>
              {startTimeInput} 시작으로 시간 적용하기
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingTop: 18,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    marginTop: 12,
    maxHeight: 380,
  },
  mainBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 14,
    alignItems: 'center',
  },
  mainLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FF6B6B',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  timeInput: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    minWidth: 90,
    padding: 0,
  },
  helperText: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 8,
  },
  sectionSubTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  presetChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  presetChipActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },
  flightLinkBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  flightLinkTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0369A1',
  },
  flightLinkSub: {
    fontSize: 10,
    color: '#0284C7',
    marginTop: 2,
  },
  saveBtn: {
    marginTop: 10,
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
