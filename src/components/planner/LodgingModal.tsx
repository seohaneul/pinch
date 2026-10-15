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
  Hotel,
  Clock,
  MapPin,
  FileText,
  Phone,
  Check,
  Building,
} from 'lucide-react-native';
import type { LodgingInfo } from '../../types';

interface LodgingModalProps {
  visible: boolean;
  onClose: () => void;
  dayNumber: number;
  initialLodging: LodgingInfo | null;
  onSave: (lodging: LodgingInfo) => void;
}

export const LodgingModal: React.FC<LodgingModalProps> = ({
  visible,
  onClose,
  dayNumber,
  initialLodging,
  onSave,
}) => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(initialLodging?.name || '');
  const [address, setAddress] = useState(initialLodging?.address || '');
  const [checkInTime, setCheckInTime] = useState(initialLodging?.checkInTime || '15:00');
  const [checkOutTime, setCheckOutTime] = useState(initialLodging?.checkOutTime || '11:00');
  const [memo, setMemo] = useState(initialLodging?.memo || '');
  const [phoneNumber, setPhoneNumber] = useState(initialLodging?.phoneNumber || '');

  useEffect(() => {
    if (visible) {
      setName(initialLodging?.name || '');
      setAddress(initialLodging?.address || '');
      setCheckInTime(initialLodging?.checkInTime || '15:00');
      setCheckOutTime(initialLodging?.checkOutTime || '11:00');
      setMemo(initialLodging?.memo || '');
      setPhoneNumber(initialLodging?.phoneNumber || '');
    }
  }, [initialLodging, visible]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('알림', '숙소 이름을 입력해주세요.');
      return;
    }

    const lodgingData: LodgingInfo = {
      ...initialLodging,
      name: name.trim(),
      address: address.trim() || undefined,
      checkInTime: checkInTime.trim() || '15:00',
      checkOutTime: checkOutTime.trim() || '11:00',
      memo: memo.trim() || undefined,
      phoneNumber: phoneNumber.trim() || undefined,
      day_number: dayNumber,
    };

    onSave(lodgingData);
    Alert.alert('숙소 등록 완료 🏨', `DAY ${dayNumber} 숙소로 "${name.trim()}"이 등록되었습니다.`);
    onClose();
  };

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
                <Hotel size={18} color="#FF6B6B" />
              </View>
              <View>
                <Text style={styles.title}>DAY {dayNumber} 숙소 등록/수정 🏨</Text>
                <Text style={styles.subtitle}>호텔, 에어비앤비, 료칸 정보를 등록하세요</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollBody}>
            {/* Lodging Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>숙소 이름 *</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="예: 호텔 그레이서리 신주쿠, 교토 료칸"
                placeholderTextColor="#94A3B8"
                style={styles.input}
              />
            </View>

            {/* Address */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>주소 / 위치</Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="예: 도쿄도 신주쿠구 카부키초 1-19-1"
                placeholderTextColor="#94A3B8"
                style={styles.input}
              />
            </View>

            {/* Check-in & Check-out Times */}
            <View style={styles.timeRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>체크인 시간</Text>
                <View style={styles.timeInputWrap}>
                  <Clock size={14} color="#64748B" style={{ marginRight: 6 }} />
                  <TextInput
                    value={checkInTime}
                    onChangeText={setCheckInTime}
                    placeholder="15:00"
                    placeholderTextColor="#94A3B8"
                    style={styles.timeInput}
                  />
                </View>
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>체크아웃 시간</Text>
                <View style={styles.timeInputWrap}>
                  <Clock size={14} color="#64748B" style={{ marginRight: 6 }} />
                  <TextInput
                    value={checkOutTime}
                    onChangeText={setCheckOutTime}
                    placeholder="11:00"
                    placeholderTextColor="#94A3B8"
                    style={styles.timeInput}
                  />
                </View>
              </View>
            </View>

            {/* Phone Number */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>연락처 (선택)</Text>
              <View style={styles.timeInputWrap}>
                <Phone size={14} color="#64748B" style={{ marginRight: 6 }} />
                <TextInput
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="+81 3-6833-1111"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  style={styles.timeInput}
                />
              </View>
            </View>

            {/* Memo & Reservation Note */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>예약 메모 / 예약 번호</Text>
              <TextInput
                value={memo}
                onChangeText={setMemo}
                placeholder="예: 아고다 예약 완료 (번호 #98231), 고층 전망 요청함"
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                style={[styles.input, { height: 75, textAlignVertical: 'top' }]}
              />
            </View>
          </ScrollView>

          {/* Submit Button */}
          <TouchableOpacity activeOpacity={0.85} onPress={handleSave} style={styles.submitBtn}>
            <Check size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.submitBtnText}>DAY {dayNumber} 숙소 저장하기</Text>
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
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  timeInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    padding: 0,
  },
  submitBtn: {
    marginTop: 12,
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
