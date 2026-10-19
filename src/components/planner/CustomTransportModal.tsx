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
  Navigation,
  Check,
  Sparkles,
  Train,
  Car,
  Ship,
  Bike,
  Clock,
} from 'lucide-react-native';

interface CustomTransportModalProps {
  visible: boolean;
  onClose: () => void;
  fromPlaceName?: string;
  fromName?: string;
  toPlaceName?: string;
  toName?: string;
  initialTransportName?: string;
  initialModeName?: string;
  initialMinutes?: number;
  onSave: (customName: string, minutes: number) => void;
}

const PRESET_MODES = [
  { label: '🚅 신칸센 / 고속열차', name: '신칸센' },
  { label: '🚝 공항 익스프레스 (N\'EX/하루카)', name: '공항 익스프레스' },
  { label: '🚕 택시 / 우버', name: '택시' },
  { label: '⛴️ 페리 / 유람선', name: '페리' },
  { label: '🚲 자전거 / 따릉이', name: '자전거' },
  { label: '🚡 케이블카 / 로프웨이', name: '케이블카' },
  { label: '🚌 공항 리무진 버스', name: '공항 리무진' },
  { label: '🚶‍♂️ 골목 도보 투어', name: '도보 투어' },
];

export const CustomTransportModal: React.FC<CustomTransportModalProps> = ({
  visible,
  onClose,
  fromPlaceName,
  fromName,
  toPlaceName,
  toName,
  initialTransportName,
  initialModeName,
  initialMinutes,
  onSave,
}) => {
  const insets = useSafeAreaInsets();
  const effectiveFromName = fromPlaceName || fromName || '출발지';
  const effectiveToName = toPlaceName || toName || '도착지';
  const defaultMode = initialTransportName || initialModeName || '신칸센';
  const [transportName, setTransportName] = useState(defaultMode);
  const [travelMinutes, setTravelMinutes] = useState(String(initialMinutes || 45));

  useEffect(() => {
    if (visible) {
      setTransportName(defaultMode);
      setTravelMinutes(String(initialMinutes || 45));
    }
  }, [defaultMode, initialMinutes, visible]);

  const handleSave = () => {
    if (!transportName.trim()) {
      Alert.alert('알림', '이동수단 이름을 입력하거나 선택해주세요.');
      return;
    }

    const mins = parseInt(travelMinutes.replace(/[^0-9]/g, ''), 10);
    if (isNaN(mins) || mins <= 0) {
      Alert.alert('알림', '예상 소요 시간을 분 단위 숫자로 입력해주세요.');
      return;
    }

    onSave(transportName.trim(), mins);
    onClose();
  };

  const handleAddMinutes = (delta: number) => {
    const current = parseInt(travelMinutes.replace(/[^0-9]/g, ''), 10) || 0;
    setTravelMinutes(String(Math.max(current + delta, 5)));
  };

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
                <Navigation size={18} color="#4ECDC4" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>이동수단 직접 입력 🚅</Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {effectiveFromName} ➔ {effectiveToName}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollBody}>
            {/* Quick Transport Preset Chips */}
            <Text style={styles.sectionLabel}>추천 이동수단 프리셋 선택</Text>
            <View style={styles.presetWrap}>
              {PRESET_MODES.map((item) => {
                const isSelected = transportName === item.name;
                return (
                  <TouchableOpacity
                    key={item.name}
                    onPress={() => setTransportName(item.name)}
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
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Direct Input Name */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>이동수단 이름 직접 입력</Text>
              <TextInput
                value={transportName}
                onChangeText={setTransportName}
                placeholder="예: 신칸센 노조미호, 도쿄 나리타 익스프레스"
                placeholderTextColor="#94A3B8"
                style={styles.textInput}
              />
            </View>

            {/* Travel Duration Minutes */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>예상 이동 시간 (분 단위)</Text>
              <View style={styles.durationInputWrap}>
                <Clock size={16} color="#64748B" style={{ marginRight: 8 }} />
                <TextInput
                  value={travelMinutes}
                  onChangeText={setTravelMinutes}
                  keyboardType="numeric"
                  placeholder="45"
                  placeholderTextColor="#94A3B8"
                  style={styles.durationInput}
                />
                <Text style={styles.durationUnit}>분 소요</Text>
              </View>

              {/* Quick minute buttons */}
              <View style={styles.quickMinuteRow}>
                <TouchableOpacity onPress={() => handleAddMinutes(10)} style={styles.quickMinuteBtn}>
                  <Text style={styles.quickMinuteText}>+10분</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleAddMinutes(20)} style={styles.quickMinuteBtn}>
                  <Text style={styles.quickMinuteText}>+20분</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleAddMinutes(30)} style={styles.quickMinuteBtn}>
                  <Text style={styles.quickMinuteText}>+30분</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setTravelMinutes('60')} style={styles.quickMinuteBtn}>
                  <Text style={styles.quickMinuteText}>1시간</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Submit Button */}
          <TouchableOpacity activeOpacity={0.85} onPress={handleSave} style={styles.submitBtn}>
            <Check size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.submitBtnText}>
              {transportName} ({travelMinutes}분) 이동수단 적용
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
    maxHeight: '88%',
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
    backgroundColor: 'rgba(78, 205, 196, 0.15)',
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
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  presetWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  presetChip: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
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
  formGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  durationInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  durationInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    padding: 0,
  },
  durationUnit: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  quickMinuteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  quickMinuteBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quickMinuteText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  submitBtn: {
    marginTop: 12,
    backgroundColor: '#4ECDC4',
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4ECDC4',
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
