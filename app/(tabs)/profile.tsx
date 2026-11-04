import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlaceStore } from '../../src/store/usePlaceStore';
import { useTripStore } from '../../src/store/useTripStore';
import { useWalletStore } from '../../src/store/useWalletStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { TripSwitcherModal } from '../../src/components/trip/TripSwitcherModal';
import { CreateTripModal } from '../../src/components/trip/CreateTripModal';
import {
  isSupabaseConfigured,
  getSupabaseCredentials,
  saveSupabaseCredentials,
} from '../../src/utils/supabase';
import {
  syncToCloud,
  syncFromCloud,
  getLastSyncTime,
} from '../../src/services/cloudSyncService';
import {
  User,
  ChevronRight,
  Bookmark,
  LogOut,
  Trash2,
  X,
  Edit3,
  Cloud,
  UploadCloud,
  DownloadCloud,
  Database,
} from '@/components/common/CustomIcons';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [tripSwitcherVisible, setTripSwitcherVisible] = useState(false);
  const [editTripModalVisible, setEditTripModalVisible] = useState(false);
  const [editNicknameModalVisible, setEditNicknameModalVisible] = useState(false);
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [appSettingsModalVisible, setAppSettingsModalVisible] = useState(false);
  const [cloudModalVisible, setCloudModalVisible] = useState(false);
  const [accountSheetVisible, setAccountSheetVisible] = useState(false);

  // Cloud Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [lastSyncText, setLastSyncText] = useState('동기화 기록 없음');
  const [isConfigured, setIsConfigured] = useState(false);

  // Supabase Config form
  const [supabaseUrlInput, setSupabaseUrlInput] = useState('');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState('');

  // Form states
  const [newNicknameInput, setNewNicknameInput] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');

  const {
    user,
    defaultBaseCurrency,
    defaultTransportMode,
    logout,
    updatePreferences,
    updateNickname,
    changePassword,
  } = useAuthStore();

  const { places, resetToDefaults: resetPlaces, restorePlaces } = usePlaceStore();
  const {
    trips,
    currentTrip,
    scheduleItems,
    resetToDefaults: resetTrips,
    restoreTripsData,
  } = useTripStore();
  const { expenses, resetToDefaults: resetWallet, restoreExpenses } = useWalletStore();

  const refreshSyncInfo = async () => {
    const time = await getLastSyncTime();
    setLastSyncText(time);
    setIsConfigured(isSupabaseConfigured());
  };

  useEffect(() => {
    refreshSyncInfo();
  }, []);

  const handleSyncToCloud = async () => {
    setIsSyncing(true);
    try {
      const result = await syncToCloud({
        userId: user?.id,
        trips,
        places,
        scheduleItems: scheduleItems || [],
        expenses: expenses || [],
      });
      await refreshSyncInfo();
      Alert.alert(
        result.isRemote ? '클라우드 백업 완료' : '로컬 스냅샷 저장 완료',
        result.message
      );
    } catch (err: any) {
      Alert.alert('동기화 실패', err?.message || '클라우드 백업 중 오류가 발생했습니다.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestoreFromCloud = () => {
    Alert.alert(
      '클라우드 데이터 복원',
      '클라우드에 백업된 최신 여행 일정, 보관함 장소, 가계부 지출을 복원하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '복원하기',
          style: 'default',
          onPress: async () => {
            setIsRestoring(true);
            try {
              const result = await syncFromCloud(user?.id);
              if (result.success && result.data) {
                if (result.data.trips) {
                  restoreTripsData(result.data.trips, result.data.scheduleItems);
                }
                if (result.data.places) {
                  restorePlaces(result.data.places);
                }
                if (result.data.expenses) {
                  restoreExpenses(result.data.expenses);
                }
                await refreshSyncInfo();
                Alert.alert('복원 완료', result.message);
              } else {
                Alert.alert('복원 실패', result.message);
              }
            } catch (err: any) {
              Alert.alert('복원 오류', err?.message || '데이터 복원 중 문제가 발생했습니다.');
            } finally {
              setIsRestoring(false);
            }
          },
        },
      ]
    );
  };

  const handleOpenCloudModal = () => {
    const creds = getSupabaseCredentials();
    setSupabaseUrlInput(creds.url.includes('placeholder') ? '' : creds.url);
    setSupabaseKeyInput(creds.anonKey.includes('placeholder') ? '' : creds.anonKey);
    setCloudModalVisible(true);
  };

  const handleSaveSupabaseConfig = async () => {
    if (!supabaseUrlInput.trim().startsWith('http')) {
      Alert.alert('입력 확인', '유효한 Supabase Project URL을 입력해 주세요.');
      return;
    }
    if (supabaseKeyInput.trim().length < 20) {
      Alert.alert('입력 확인', '유효한 Supabase anon public key를 입력해 주세요.');
      return;
    }

    const success = await saveSupabaseCredentials(supabaseUrlInput, supabaseKeyInput);
    if (success) {
      setIsConfigured(isSupabaseConfigured());
      Alert.alert('연결 완료', 'Supabase 프로젝트가 연결되었습니다.');
    } else {
      Alert.alert('오류', '설정을 저장하지 못했습니다.');
    }
  };

  const handleOpenEditNickname = () => {
    setNewNicknameInput(user?.nickname || '여행자');
    setEditNicknameModalVisible(true);
  };

  const handleSaveNickname = () => {
    if (!newNicknameInput.trim()) {
      Alert.alert('알림', '변경할 닉네임을 입력해 주세요.');
      return;
    }
    const success = updateNickname(newNicknameInput.trim());
    if (success) {
      setEditNicknameModalVisible(false);
    }
  };

  const handleOpenChangePassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setNewPasswordConfirm('');
    setChangePasswordModalVisible(true);
  };

  const handleSavePassword = () => {
    if (!currentPassword) {
      Alert.alert('알림', '현재 비밀번호를 입력해 주세요.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('알림', '새 비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      Alert.alert('알림', '새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
      return;
    }

    const res = changePassword(currentPassword, newPassword);
    if (res.success) {
      setChangePasswordModalVisible(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: () => {
          setAccountSheetVisible(false);
          logout();
        },
      },
    ]);
  };

  const handleResetAllData = () => {
    Alert.alert(
      '전체 데이터 초기화',
      '저장된 모든 장소 보관함, 여행 일정, 가계부 지출 내역이 초기화됩니다. 계속하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '초기화',
          style: 'destructive',
          onPress: () => {
            resetPlaces();
            resetTrips();
            resetWallet();
            setAccountSheetVisible(false);
            Alert.alert('초기화 완료', '모든 데이터가 초기 상태로 정리되었습니다.');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: Math.max(insets.top, 16) + 12 }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top-Left Bold Title (Reference Image 1: PROFILE) */}
        <Text style={styles.pageTitle}>PROFILE</Text>

        {/* Centered Circular Avatar + Nickname + Email (Reference Image 1) */}
        <View style={styles.profileCenterBox}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleOpenEditNickname}
            style={styles.avatarRing}
          >
            <User size={44} color="#D1D5DB" fill="#D1D5DB" />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleOpenEditNickname}
            style={styles.nicknameRow}
          >
            <Text style={styles.nicknameText}>{user?.nickname || '여행자'}</Text>
            <ChevronRight size={18} color="#111827" strokeWidth={2.4} />
          </TouchableOpacity>

          <Text style={styles.emailText}>{user?.email || 'user@pinchi.app'}</Text>
        </View>

        {/* 3-Column Icon Quick Bar (Reference Image 1: 북마크 | 이벤트 | 공지사항) */}
        <View style={styles.quickActionRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/places')}
            style={styles.quickActionCol}
          >
            <Bookmark size={24} color="#6B7280" strokeWidth={1.7} />
            <Text style={styles.quickActionLabel}>보관함</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setEditTripModalVisible(true)}
            style={styles.quickActionCol}
          >
            <Edit3 size={24} color="#6B7280" strokeWidth={1.7} />
            <Text style={styles.quickActionLabel}>여행 수정</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleOpenCloudModal}
            style={styles.quickActionCol}
          >
            <Cloud size={24} color="#6B7280" strokeWidth={1.7} />
            <Text style={styles.quickActionLabel}>클라우드 백업</Text>
          </TouchableOpacity>
        </View>

        {/* Clean Divider Menu Rows (Reference Image 1: APP설정 / 고객센터 / 약관 확인) */}
        <View style={styles.menuListContainer}>
          <TouchableOpacity
            activeOpacity={0.65}
            onPress={() => setEditTripModalVisible(true)}
            style={styles.menuRow}
          >
            <Text style={styles.menuRowTitle}>현재 여행 정보 수정</Text>
            <ChevronRight size={18} color="#374151" strokeWidth={1.8} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.65}
            onPress={() => setTripSwitcherVisible(true)}
            style={styles.menuRow}
          >
            <Text style={styles.menuRowTitle}>내 여행 목록 · 새 여행 추가</Text>
            <ChevronRight size={18} color="#374151" strokeWidth={1.8} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.65}
            onPress={() => setAppSettingsModalVisible(true)}
            style={styles.menuRow}
          >
            <Text style={styles.menuRowTitle}>APP 설정</Text>
            <ChevronRight size={18} color="#374151" strokeWidth={1.8} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.65}
            onPress={handleOpenCloudModal}
            style={styles.menuRow}
          >
            <Text style={styles.menuRowTitle}>클라우드 동기화 및 복원</Text>
            <ChevronRight size={18} color="#374151" strokeWidth={1.8} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.65}
            onPress={handleOpenChangePassword}
            style={styles.menuRow}
          >
            <Text style={styles.menuRowTitle}>비밀번호 변경</Text>
            <ChevronRight size={18} color="#374151" strokeWidth={1.8} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.65}
            onPress={() => setAccountSheetVisible(true)}
            style={[styles.menuRow, { borderBottomWidth: 0 }]}
          >
            <Text style={styles.menuRowTitle}>계정 및 데이터 관리</Text>
            <ChevronRight size={18} color="#374151" strokeWidth={1.8} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 내 여행 목록 모달 */}
      <TripSwitcherModal
        visible={tripSwitcherVisible}
        onClose={() => setTripSwitcherVisible(false)}
      />

      {/* 현재 여행 정보 수정 위저드 모달 */}
      <CreateTripModal
        visible={editTripModalVisible}
        editTrip={currentTrip}
        onClose={() => setEditTripModalVisible(false)}
        onCreated={() => setEditTripModalVisible(false)}
      />

      {/* 닉네임 변경 모달 */}
      <Modal visible={editNicknameModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>프로필 닉네임 변경</Text>
                <TouchableOpacity onPress={() => setEditNicknameModalVisible(false)}>
                  <X size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <TextInput
                value={newNicknameInput}
                onChangeText={setNewNicknameInput}
                placeholder="새 닉네임 입력"
                placeholderTextColor="#9CA3AF"
                style={styles.modalInput}
                autoFocus
              />
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSaveNickname}
                style={styles.modalPrimaryBtn}
              >
                <Text style={styles.modalPrimaryBtnText}>저장하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 비밀번호 변경 모달 */}
      <Modal visible={changePasswordModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>비밀번호 변경</Text>
                <TouchableOpacity onPress={() => setChangePasswordModalVisible(false)}>
                  <X size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="현재 비밀번호"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                style={styles.modalInput}
              />
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="새 비밀번호 (6자 이상)"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                style={styles.modalInput}
              />
              <TextInput
                value={newPasswordConfirm}
                onChangeText={setNewPasswordConfirm}
                placeholder="새 비밀번호 확인"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                style={styles.modalInput}
              />
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSavePassword}
                style={styles.modalPrimaryBtn}
              >
                <Text style={styles.modalPrimaryBtnText}>비밀번호 변경하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* APP 설정 모달 */}
      <Modal visible={appSettingsModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>APP 설정</Text>
              <TouchableOpacity onPress={() => setAppSettingsModalVisible(false)}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.settingLabel}>기본 기준 통화</Text>
            <View style={styles.settingSegmentRow}>
              {(['KRW', 'JPY', 'USD'] as const).map((curr) => {
                const active = defaultBaseCurrency === curr;
                return (
                  <TouchableOpacity
                    key={curr}
                    onPress={() => updatePreferences({ defaultBaseCurrency: curr })}
                    style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                  >
                    <Text style={[styles.segmentBtnText, active && styles.segmentBtnTextActive]}>
                      {curr}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.settingLabel, { marginTop: 16 }]}>기본 이동수단</Text>
            <View style={styles.settingSegmentRow}>
              {[
                { key: 'TRANSIT' as const, label: '대중교통' },
                { key: 'WALK' as const, label: '도보' },
              ].map((m) => {
                const active = defaultTransportMode === m.key;
                return (
                  <TouchableOpacity
                    key={m.key}
                    onPress={() => updatePreferences({ defaultTransportMode: m.key })}
                    style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                  >
                    <Text style={[styles.segmentBtnText, active && styles.segmentBtnTextActive]}>
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setAppSettingsModalVisible(false)}
              style={[styles.modalPrimaryBtn, { marginTop: 22 }]}
            >
              <Text style={styles.modalPrimaryBtnText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 클라우드 동기화 모달 */}
      <Modal visible={cloudModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>클라우드 백업 및 복원</Text>
                <TouchableOpacity onPress={() => setCloudModalVisible(false)}>
                  <X size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <Text style={styles.cloudStatusText}>
                최근 동기화: {lastSyncText} ({isConfigured ? 'Supabase 연결됨' : '로컬 스냅샷'})
              </Text>

              <View style={styles.cloudBtnRow}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={isSyncing}
                  onPress={handleSyncToCloud}
                  style={[styles.modalPrimaryBtn, { flex: 1, marginTop: 0 }]}
                >
                  {isSyncing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <UploadCloud size={16} color="#FFFFFF" />
                      <Text style={styles.modalPrimaryBtnText}>백업하기</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={isRestoring}
                  onPress={handleRestoreFromCloud}
                  style={styles.modalOutlineBtn}
                >
                  {isRestoring ? (
                    <ActivityIndicator size="small" color="#1B2A4A" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <DownloadCloud size={16} color="#1B2A4A" />
                      <Text style={styles.modalOutlineBtnText}>복원하기</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Database size={15} color="#1B2A4A" />
                <Text style={styles.settingLabel}>Supabase 클라우드 연동 (선택)</Text>
              </View>
              <TextInput
                value={supabaseUrlInput}
                onChangeText={setSupabaseUrlInput}
                placeholder="https://your-project.supabase.co"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                style={styles.modalInput}
              />
              <TextInput
                value={supabaseKeyInput}
                onChangeText={setSupabaseKeyInput}
                placeholder="Supabase anon public key"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                style={styles.modalInput}
              />
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSaveSupabaseConfig}
                style={styles.modalOutlineFullBtn}
              >
                <Text style={styles.modalOutlineBtnText}>연동 정보 저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 계정 및 데이터 관리 모달 */}
      <Modal visible={accountSheetVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>계정 및 데이터 관리</Text>
              <TouchableOpacity onPress={() => setAccountSheetVisible(false)}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleResetAllData}
              style={styles.sheetActionRow}
            >
              <Trash2 size={18} color="#4B5563" />
              <Text style={styles.sheetActionText}>전체 여행·장소 데이터 초기화</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleLogout}
              style={[styles.sheetActionRow, { borderBottomWidth: 0 }]}
            >
              <LogOut size={18} color="#EF4444" />
              <Text style={[styles.sheetActionText, { color: '#EF4444' }]}>로그아웃</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: 0.4,
    marginBottom: 28,
  },
  profileCenterBox: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  nicknameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  nicknameText: {
    fontSize: 21,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  emailText: {
    fontSize: 13.5,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  quickActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 14,
    marginBottom: 18,
  },
  quickActionCol: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minWidth: 80,
  },
  quickActionLabel: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#1F2937',
  },
  menuListContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  menuRowTitle: {
    fontSize: 15.5,
    fontWeight: '500',
    color: '#1F2937',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 14,
    color: '#111827',
    marginBottom: 10,
  },
  modalPrimaryBtn: {
    backgroundColor: '#1B2A4A',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
  modalOutlineBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1B2A4A',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  modalOutlineFullBtn: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1B2A4A',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },
  modalOutlineBtnText: {
    color: '#1B2A4A',
    fontSize: 14,
    fontWeight: '700',
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  settingSegmentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  segmentBtnActive: {
    backgroundColor: '#1B2A4A',
    borderColor: '#1B2A4A',
  },
  segmentBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
  },
  cloudStatusText: {
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 14,
  },
  cloudBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 18,
  },
  sheetActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sheetActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
});
