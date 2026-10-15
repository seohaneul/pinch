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
  Plane,
  Sparkles,
  Check,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react-native';

interface DayStartTimeModalProps {
  visible: boolean;
  onClose: () => void;
  dayNumber: number;
  currentStartTime: string;
  onSaveStartTime: (newTimeStr: string) => void;
  onApplyFlightTime: (flightTimeStr: string, bufferMinutes: number) => void;
}

export const DayStartTimeModal: React.FC<DayStartTimeModalProps> = ({
  visible,
  onClose,
  dayNumber,
  currentStartTime,
  onSaveStartTime,
  onApplyFlightTime,
}) => {
  const insets = useSafeAreaInsets();
  const [startTimeInput, setStartTimeInput] = useState(currentStartTime || '10:00');
  const [flightTimeInput, setFlightTimeInput] = useState('12:40');
  const [flightBuffer, setFlightBuffer] = useState<number>(90); // default 90 mins (1.5h)

  useEffect(() => {
    if (visible) {
      setStartTimeInput(currentStartTime || '10:00');
    }
  }, [currentStartTime, visible]);

  // Compute live flight-adjusted start time
  const calculateFlightStartTime = (flightStr: string, bufferMins: number) => {
    const parts = flightStr.split(':').map((v) => parseInt(v.trim(), 10));
    const h = isNaN(parts[0]) ? 12 : parts[0];
    const m = isNaN(parts[1]) ? 0 : parts[1];
    const totalMinutes = (h * 60 + m + bufferMins) % (24 * 60);
    const resH = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
    const resM = (totalMinutes % 60).toString().padStart(2, '0');
    return `${resH}:${resM}`;
  };

  const computedFlightStartTime = calculateFlightStartTime(flightTimeInput, flightBuffer);

  const handleSaveDirect = () => {
    // Validate HH:MM
    const regex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (!regex.test(startTimeInput.trim())) {
      Alert.alert('알림', '시간 형식을 09:30 또는 14:00 형태로 입력해주세요.');
      return;
    }
    onSaveStartTime(startTimeInput.trim());
    Alert.alert('일정 시작 시간 변경 완료 ⏰', `DAY ${dayNumber} 일정이 ${startTimeInput.trim()}부터 시작되도록 재계산되었습니다.`);
    onClose();
  };

  const handleApplyFlight = () => {
    const regex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (!regex.test(flightTimeInput.trim())) {
      Alert.alert('알림', '비행기 도착 시간을 12:40 형태로 입력해주세요.');
      return;
    }
    onApplyFlightTime(flightTimeInput.trim(), flightBuffer);
    Alert.alert(
      '비행기 시간 연동 완료 ✈️',
      `비행기 도착(${flightTimeInput}) + ${flightBuffer}분 여유를 고려하여,\nDAY ${dayNumber} 일정이 ${computedFlightStartTime}부터 시작됩니다.`
    );
    onClose();
  };

  const PRESET_TIMES = ['08:30', '09:00', '09:30', '10:00', '11:00', '13:00', '14:00'];
  const BUFFER_CHOICES = [
    { mins: 60, label: '1시간 (빠른 이동)' },
    { mins: 90, label: '1시간 30분 (추천 ⭐️)' },
    { mins: 120, label: '2시간 (여유 입국)' },
    { mins: 150, label: '2시간 30분 (수속+식사)' },
  ];

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
                <Text style={styles.title}>DAY {dayNumber} 시작 시간 & 비행기 연동 ⏰</Text>
                <Text style={styles.subtitle}>시작 시간에 맞춰 모든 방문 장소의 도착 시간이 자동 재계산됩니다</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollBody}>
            {/* Section 1: Direct Time Input */}
            <View style={styles.cardSection}>
              <View style={styles.sectionHeader}>
                <Clock size={15} color="#0F172A" style={{ marginRight: 6 }} />
                <Text style={styles.sectionTitle}>일정 시작 시간 직접 입력</Text>
              </View>

              <View style={styles.timeInputBox}>
                <TextInput
                  value={startTimeInput}
                  onChangeText={setStartTimeInput}
                  placeholder="10:00"
                  placeholderTextColor="#94A3B8"
                  style={styles.timeTextInput}
                  maxLength={5}
                />
                <TouchableOpacity activeOpacity={0.8} onPress={handleSaveDirect} style={styles.inlineApplyBtn}>
                  <Check size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.inlineApplyBtnText}>적용</Text>
                </TouchableOpacity>
              </View>

              {/* Quick Time Presets */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 8 }}>
                {PRESET_TIMES.map((time) => (
                  <TouchableOpacity
                    key={time}
                    onPress={() => setStartTimeInput(time)}
                    style={[
                      styles.timePill,
                      startTimeInput === time && styles.timePillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.timePillText,
                        startTimeInput === time && styles.timePillTextActive,
                      ]}
                    >
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Section 2: Flight Landing Sync */}
            <View style={[styles.cardSection, styles.flightCardSection]}>
              <View style={styles.sectionHeader}>
                <Plane size={16} color="#0284C7" style={{ marginRight: 6 }} />
                <Text style={[styles.sectionTitle, { color: '#0369A1' }]}>
                  비행기 도착 시간에 맞춰 일정 시작 ✈️
                </Text>
              </View>
              <Text style={styles.flightGuideText}>
                비행기 착륙 시간과 공항 입국심사 & 시내 이동 여유 시간을 고려하여 첫 일정을 자동 시작합니다.
              </Text>

              {/* Flight Time Input */}
              <View style={{ marginTop: 10 }}>
                <Text style={styles.fieldLabel}>비행기 착륙(도착) 예정 시간</Text>
                <View style={styles.flightInputWrap}>
                  <Plane size={15} color="#0284C7" style={{ marginRight: 8 }} />
                  <TextInput
                    value={flightTimeInput}
                    onChangeText={setFlightTimeInput}
                    placeholder="12:40"
                    placeholderTextColor="#94A3B8"
                    style={styles.flightTextInput}
                    maxLength={5}
                  />
                </View>
              </View>

              {/* Buffer choices */}
              <View style={{ marginTop: 10 }}>
                <Text style={styles.fieldLabel}>입국심사 & 시내 이동 여유 버퍼</Text>
                <View style={{ gap: 6, marginTop: 4 }}>
                  {BUFFER_CHOICES.map((b) => (
                    <TouchableOpacity
                      key={b.mins}
                      onPress={() => setFlightBuffer(b.mins)}
                      style={[
                        styles.bufferOption,
                        flightBuffer === b.mins && styles.bufferOptionActive,
                      ]}
                    >
                      <View style={[styles.radioCircle, flightBuffer === b.mins && styles.radioCircleActive]}>
                        {flightBuffer === b.mins && <View style={styles.radioInner} />}
                      </View>
                      <Text
                        style={[
                          styles.bufferOptionText,
                          flightBuffer === b.mins && styles.bufferOptionTextActive,
                        ]}
                      >
                        {b.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Calculated Result Banner */}
              <View style={styles.resultBanner}>
                <Sparkles size={14} color="#0284C7" style={{ marginRight: 6 }} />
                <Text style={styles.resultBannerText}>
                  ✈️ {flightTimeInput} 도착 + {flightBuffer}분 여유 = ⏰ <Text style={{ fontWeight: '900', color: '#0369A1' }}>{computedFlightStartTime}</Text> 첫 일정 시작
                </Text>
              </View>

              {/* Apply Flight Button */}
              <TouchableOpacity activeOpacity={0.85} onPress={handleApplyFlight} style={styles.applyFlightBtn}>
                <Plane size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.applyFlightBtnText}>비행기 시간({computedFlightStartTime})으로 적용하기</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    maxHeight: '90%',
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
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 10.5,
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
    maxHeight: 460,
  },
  cardSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
  },
  flightCardSection: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  flightGuideText: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '600',
    lineHeight: 16,
    marginTop: 2,
  },
  timeInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 8,
  },
  timeTextInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    padding: 0,
  },
  inlineApplyBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineApplyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  timePill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  timePillActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  timePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  timePillTextActive: {
    color: '#FFFFFF',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
    marginBottom: 4,
  },
  flightInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#7DD3FC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  flightTextInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#0369A1',
    padding: 0,
  },
  bufferOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  bufferOptionActive: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  radioCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioCircleActive: {
    borderColor: '#0284C7',
  },
  radioInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0284C7',
  },
  bufferOptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  bufferOptionTextActive: {
    fontWeight: '800',
    color: '#0369A1',
  },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    padding: 10,
    borderRadius: 12,
    marginTop: 10,
  },
  resultBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
    flex: 1,
  },
  applyFlightBtn: {
    marginTop: 10,
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  applyFlightBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
