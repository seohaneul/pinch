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
  Plane,
  Clock,
  Sparkles,
  Check,
  Calendar,
  MapPin,
  Trash2,
  ShieldCheck,
} from 'lucide-react-native';
import type { FlightInfo } from '../../types';

interface FlightModalProps {
  visible: boolean;
  onClose: () => void;
  tripTitle?: string;
  tripId: string;
  initialFlight: FlightInfo | null;
  onSaveFlight: (flight: FlightInfo) => void;
  onDeleteFlight?: () => void;
  onSyncDayStartTime?: (flightArrivalStr: string, bufferMinutes: number) => void;
}

export const FlightModal: React.FC<FlightModalProps> = ({
  visible,
  onClose,
  tripTitle,
  tripId,
  initialFlight,
  onSaveFlight,
  onDeleteFlight,
  onSyncDayStartTime,
}) => {
  const insets = useSafeAreaInsets();

  const [flightNumber, setFlightNumber] = useState('');
  const [airline, setAirline] = useState('');
  const [departureAirport, setDepartureAirport] = useState('');
  const [arrivalAirport, setArrivalAirport] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [terminal, setTerminal] = useState('');
  const [bufferMinutes, setBufferMinutes] = useState<number>(90);
  const [memo, setMemo] = useState('');

  useEffect(() => {
    if (visible) {
      if (initialFlight) {
        setFlightNumber(initialFlight.flightNumber || '');
        setAirline(initialFlight.airline || '');
        setDepartureAirport(initialFlight.departureAirport || '');
        setArrivalAirport(initialFlight.arrivalAirport || '');
        setDepartureTime(initialFlight.departureTime || '');
        setArrivalTime(initialFlight.arrivalTime || '');
        setTerminal(initialFlight.terminal || '');
        setBufferMinutes(initialFlight.bufferMinutes || 90);
        setMemo(initialFlight.memo || '');
      } else {
        setFlightNumber('KE703');
        setAirline('대한항공');
        setDepartureAirport('ICN (인천)');
        setArrivalAirport('NRT (도쿄 나리타)');
        setDepartureTime('09:20');
        setArrivalTime('12:40');
        setTerminal('제2터미널');
        setBufferMinutes(90);
        setMemo('');
      }
    }
  }, [visible, initialFlight]);

  const calculateStartTime = (arrTime: string, buffer: number) => {
    const parts = arrTime.split(':').map((v) => parseInt(v.trim(), 10));
    const h = isNaN(parts[0]) ? 12 : parts[0];
    const m = isNaN(parts[1]) ? 0 : parts[1];
    const totalMinutes = (h * 60 + m + buffer) % (24 * 60);
    const resH = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
    const resM = (totalMinutes % 60).toString().padStart(2, '0');
    return `${resH}:${resM}`;
  };

  const computedStartTime = calculateStartTime(arrivalTime || '12:40', bufferMinutes);

  const handleSave = (autoSyncToDay1: boolean = false) => {
    if (!flightNumber.trim()) {
      Alert.alert('알림', '항공편명을 입력해주세요 (예: KE703).');
      return;
    }
    if (!arrivalTime.trim()) {
      Alert.alert('알림', '도착 예정 시간을 입력해주세요 (예: 12:40).');
      return;
    }

    const flightData: FlightInfo = {
      flightNumber: flightNumber.trim(),
      airline: airline.trim(),
      departureAirport: departureAirport.trim(),
      arrivalAirport: arrivalAirport.trim(),
      departureTime: departureTime.trim(),
      arrivalTime: arrivalTime.trim(),
      terminal: terminal.trim(),
      bufferMinutes,
      memo: memo.trim(),
    };

    onSaveFlight(flightData);

    if (autoSyncToDay1 && onSyncDayStartTime) {
      onSyncDayStartTime(arrivalTime.trim(), bufferMinutes);
    }

    Alert.alert(
      '항공권 등록 완료 ✈️',
      autoSyncToDay1
        ? `항공편(${flightNumber.trim()})이 등록되었으며, 도착 후 여유 시간을 반영하여 DAY 1 시작 시간이 ${computedStartTime}으로 자동 연동되었습니다.`
        : `항공편(${flightNumber.trim()})이 성공적으로 저장되었습니다.`
    );
    onClose();
  };

  const handleDelete = () => {
    Alert.alert('항공권 삭제', '등록된 항공권 정보를 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          if (onDeleteFlight) onDeleteFlight();
          Alert.alert('삭제 완료', '항공권 정보가 삭제되었습니다.');
          onClose();
        },
      },
    ]);
  };

  const BUFFER_PRESETS = [
    { mins: 60, label: '1시간 (빠른 이동)' },
    { mins: 90, label: '1시간 30분 (추천 ⭐)' },
    { mins: 120, label: '2시간 (여유 입국)' },
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
                <Plane size={18} color="#0284C7" />
              </View>
              <View>
                <Text style={styles.title}>항공권 등록 & 관리 ✈️</Text>
                <Text style={styles.subtitle}>
                  {tripTitle ? `[${tripTitle}] ` : ''}출/도착 항공편 정보 및 e-티켓 메모
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollBody}>
            {/* Boarding Pass Preview Box */}
            <View style={styles.passBox}>
              <View style={styles.passHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Plane size={14} color="#0369A1" style={{ marginRight: 6 }} />
                  <Text style={styles.passFlightNum}>{flightNumber || '항공편명'}</Text>
                  {airline ? <Text style={styles.passAirline}> · {airline}</Text> : null}
                </View>
                <View style={styles.passBadge}>
                  <Text style={styles.passBadgeText}>PINCH AIR</Text>
                </View>
              </View>

              <View style={styles.passRouteRow}>
                <View>
                  <Text style={styles.passAirportLabel}>출발</Text>
                  <Text style={styles.passAirportName}>{departureAirport || 'ICN (인천)'}</Text>
                  <Text style={styles.passTime}>{departureTime || '09:20'}</Text>
                </View>

                <View style={{ alignItems: 'center', paddingHorizontal: 12 }}>
                  <Text style={{ fontSize: 10, color: '#94A3B8', fontWeight: '700', marginBottom: 2 }}>
                    직항
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 20, height: 1.5, backgroundColor: '#BAE6FD' }} />
                    <Plane size={13} color="#0284C7" style={{ marginHorizontal: 4 }} />
                    <View style={{ width: 20, height: 1.5, backgroundColor: '#BAE6FD' }} />
                  </View>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.passAirportLabel}>도착</Text>
                  <Text style={styles.passAirportName}>{arrivalAirport || 'NRT (나리타)'}</Text>
                  <Text style={[styles.passTime, { color: '#0369A1' }]}>{arrivalTime || '12:40'}</Text>
                </View>
              </View>
            </View>

            {/* Input Form Fields */}
            <View style={styles.formCard}>
              <View style={styles.row}>
                <View style={[styles.fieldWrap, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.fieldLabel}>항공편명 *</Text>
                  <TextInput
                    value={flightNumber}
                    onChangeText={setFlightNumber}
                    placeholder="예: KE703, OZ102"
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                  />
                </View>
                <View style={[styles.fieldWrap, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>항공사</Text>
                  <TextInput
                    value={airline}
                    onChangeText={setAirline}
                    placeholder="예: 대한항공, 아시아나"
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.fieldWrap, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.fieldLabel}>출발 공항</Text>
                  <TextInput
                    value={departureAirport}
                    onChangeText={setDepartureAirport}
                    placeholder="예: ICN (인천)"
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                  />
                </View>
                <View style={[styles.fieldWrap, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>도착 공항</Text>
                  <TextInput
                    value={arrivalAirport}
                    onChangeText={setArrivalAirport}
                    placeholder="예: NRT (나리타)"
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.fieldWrap, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.fieldLabel}>출발 시간</Text>
                  <TextInput
                    value={departureTime}
                    onChangeText={setDepartureTime}
                    placeholder="09:20"
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                  />
                </View>
                <View style={[styles.fieldWrap, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>도착 시간 *</Text>
                  <TextInput
                    value={arrivalTime}
                    onChangeText={setArrivalTime}
                    placeholder="12:40"
                    placeholderTextColor="#94A3B8"
                    style={[styles.textInput, { fontWeight: '800', color: '#0369A1' }]}
                  />
                </View>
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>터미널 & 게이트 정보</Text>
                <TextInput
                  value={terminal}
                  onChangeText={setTerminal}
                  placeholder="예: 제2터미널 탑승구 242"
                  placeholderTextColor="#94A3B8"
                  style={styles.textInput}
                />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>메모 & 예약번호</Text>
                <TextInput
                  value={memo}
                  onChangeText={setMemo}
                  placeholder="예: 모바일 체크인 완료, 수하물 23kg 포함"
                  placeholderTextColor="#94A3B8"
                  style={styles.textInput}
                />
              </View>

              {/* Day 1 Start Time Sync Option Box */}
              <View style={styles.syncBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Clock size={13} color="#0369A1" style={{ marginRight: 5 }} />
                  <Text style={styles.syncBoxTitle}>DAY 1 일정 시작 시간 자동 연동</Text>
                </View>
                <Text style={styles.syncBoxDesc}>
                  도착({arrivalTime || '12:40'}) + 입국심사/이동 여유({bufferMinutes}분) = ⏰ {computedStartTime}에 첫 일정 시작
                </Text>

                <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                  {BUFFER_PRESETS.map((b) => (
                    <TouchableOpacity
                      key={b.mins}
                      onPress={() => setBufferMinutes(b.mins)}
                      style={[
                        styles.bufferChip,
                        bufferMinutes === b.mins && styles.bufferChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.bufferChipText,
                          bufferMinutes === b.mins && styles.bufferChipTextActive,
                        ]}
                      >
                        {b.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Delete button if already registered */}
            {initialFlight && (
              <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                <Trash2 size={14} color="#EF4444" style={{ marginRight: 5 }} />
                <Text style={styles.deleteBtnText}>항공권 정보 삭제</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleSave(true)}
              style={styles.saveSyncBtn}
            >
              <Sparkles size={15} color="#FFFFFF" style={{ marginRight: 5 }} />
              <Text style={styles.saveSyncBtnText}>저장 & DAY 1 시작 시간({computedStartTime}) 연동</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleSave(false)}
              style={styles.saveDirectBtn}
            >
              <Check size={15} color="#0F172A" style={{ marginRight: 4 }} />
              <Text style={styles.saveDirectBtnText}>항공권만 저장</Text>
            </TouchableOpacity>
          </View>
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
    maxHeight: '92%',
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
    backgroundColor: '#F0F9FF',
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
    maxHeight: 480,
  },
  passBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    padding: 14,
    marginBottom: 12,
  },
  passHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: '#E0F2FE',
    marginBottom: 10,
  },
  passFlightNum: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0369A1',
  },
  passAirline: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  passBadge: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  passBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  passRouteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  passAirportLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 1,
  },
  passAirportName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  passTime: {
    fontSize: 15,
    fontWeight: '900',
    color: '#334155',
    marginTop: 2,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 12,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldWrap: {
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  syncBox: {
    marginTop: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  syncBoxTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  syncBoxDesc: {
    fontSize: 10.5,
    color: '#2563EB',
    fontWeight: '600',
    lineHeight: 15,
  },
  bufferChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bufferChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  bufferChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  bufferChipTextActive: {
    color: '#FFFFFF',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginBottom: 10,
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  actionRow: {
    gap: 8,
    marginTop: 10,
  },
  saveSyncBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 13,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  saveSyncBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  saveDirectBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 11,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveDirectBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
});
