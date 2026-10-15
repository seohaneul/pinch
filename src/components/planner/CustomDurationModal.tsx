import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Clock, Check, Plus, Sparkles } from 'lucide-react-native';

interface CustomDurationModalProps {
  visible: boolean;
  onClose: () => void;
  placeName: string;
  currentDurationMinutes: number;
  onSave: (minutes: number) => void;
}

export const CustomDurationModal: React.FC<CustomDurationModalProps> = ({
  visible,
  onClose,
  placeName,
  currentDurationMinutes,
  onSave,
}) => {
  const insets = useSafeAreaInsets();
  const [durationStr, setDurationStr] = useState(String(currentDurationMinutes || 60));

  useEffect(() => {
    if (visible) {
      setDurationStr(String(currentDurationMinutes || 60));
    }
  }, [currentDurationMinutes, visible]);

  const handleSave = () => {
    const mins = parseInt(durationStr.replace(/[^0-9]/g, ''), 10);
    if (isNaN(mins) || mins <= 0) {
      Alert.alert('알림', '체류 시간을 1분 이상의 숫자로 입력해주세요.');
      return;
    }
    if (mins > 720) {
      Alert.alert('알림', '체류 시간은 최대 720분(12시간)까지 설정 가능합니다.');
      return;
    }
    onSave(mins);
    onClose();
  };

  const handleQuickAdd = (delta: number) => {
    const current = parseInt(durationStr.replace(/[^0-9]/g, ''), 10) || 0;
    setDurationStr(String(Math.max(current + delta, 5)));
  };

  const PRESETS = [15, 30, 45, 60, 75, 90, 120, 150, 180];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
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
                <Text style={styles.title}>체류 시간 직접 입력 ⏱️</Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  [{placeName}] 장소에서 얼마나 머무를 예정인가요?
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Duration Input Box */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>머무는 시간 (분 단위 입력)</Text>
            <View style={styles.inputRow}>
              <TextInput
                value={durationStr}
                onChangeText={setDurationStr}
                keyboardType="numeric"
                placeholder="60"
                placeholderTextColor="#94A3B8"
                style={styles.numericInput}
                autoFocus={true}
              />
              <Text style={styles.unitText}>분 동안 체류</Text>
            </View>
          </View>

          {/* Quick Adjustment Chips */}
          <View style={styles.quickSection}>
            <Text style={styles.quickLabel}>빠른 시간 선택</Text>
            <View style={styles.presetWrap}>
              {PRESETS.map((p) => {
                const isSelected = parseInt(durationStr, 10) === p;
                return (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setDurationStr(String(p))}
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
                      {p >= 60 ? `${Math.floor(p / 60)}시간${p % 60 > 0 ? ` ${p % 60}분` : ''}` : `${p}분`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity activeOpacity={0.85} onPress={handleSave} style={styles.submitBtn}>
            <Check size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.submitBtnText}>체류 시간 {durationStr}분으로 적용하기</Text>
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
  inputContainer: {
    marginTop: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  numericInput: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    minWidth: 80,
    padding: 0,
  },
  unitText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 8,
  },
  quickSection: {
    marginTop: 14,
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  presetWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },
  submitBtn: {
    marginTop: 16,
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
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
