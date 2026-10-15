import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check, Plus, Trash2, Calendar, MapPin } from 'lucide-react-native';
import { useTripStore } from '../../store/useTripStore';
import { CreateTripModal } from './CreateTripModal';

interface TripSwitcherModalProps {
  visible: boolean;
  onClose: () => void;
}

export const TripSwitcherModal: React.FC<TripSwitcherModalProps> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
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
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.4)' }]}>
          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>내 여행 목록 🧳</Text>
                <Text style={styles.headerSubtitle}>
                  총 {trips.length}개의 여행이 등록되어 있습니다
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

            {/* Trip List */}
            <ScrollView showsVerticalScrollIndicator={false} style={styles.tripListScroll}>
              {trips.map((trip) => {
                const isActive = trip.id === activeTripId;
                const dayCount = trip.schedules ? trip.schedules.length : 1;
                return (
                  <TouchableOpacity
                    key={trip.id}
                    activeOpacity={0.85}
                    onPress={() => handleSelectTrip(trip.id)}
                    style={[
                      styles.tripCard,
                      isActive && styles.tripCardActive,
                    ]}
                  >
                    <Image
                      source={{
                        uri:
                          trip.coverImage ||
                          'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop',
                      }}
                      style={styles.tripCover}
                      resizeMode="cover"
                    />

                    <View style={styles.tripInfo}>
                      <View style={styles.titleRow}>
                        <Text style={styles.tripTitle} numberOfLines={1}>
                          {trip.title}
                        </Text>
                        {isActive && (
                          <View style={styles.activePill}>
                            <Text style={styles.activePillText}>진행중</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.metaRow}>
                        <MapPin size={11} color="#64748B" style={{ marginRight: 4 }} />
                        <Text style={styles.metaText} numberOfLines={1}>
                          {trip.destination}
                        </Text>
                      </View>

                      <View style={styles.metaRow}>
                        <Calendar size={11} color="#64748B" style={{ marginRight: 4 }} />
                        <Text style={styles.metaSubText}>
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
                        activeOpacity={0.7}
                        style={styles.deleteBtn}
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
              style={styles.createBtn}
            >
              <Plus size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.createBtnText}>새로운 여행 만들기 ✈️</Text>
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

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '85%',
    paddingBottom: 28,
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
  tripListScroll: {
    marginTop: 14,
    maxHeight: 380,
  },
  tripCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 10,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  tripCardActive: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  tripCover: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
  },
  tripInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  tripTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  activePill: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  activePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  metaText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  metaSubText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  deleteBtn: {
    padding: 8,
    marginLeft: 4,
  },
  createBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  createBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
