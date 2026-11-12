import React, { useState } from 'react';
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
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlaceStore } from '../../src/store/usePlaceStore';
import { useTripStore } from '../../src/store/useTripStore';
import { useWalletStore } from '../../src/store/useWalletStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import {
  User,
  ChevronRight,
  Bookmark,
  LogOut,
  Trash2,
  X,
  Edit3,
  Check,
  Plane,
  Globe,
  Sparkles,
  Camera,
} from '@/components/common/CustomIcons';

const AVATAR_PRESETS = [
  { id: 'preset:navy', bg: '#1B2A4A', color: '#FFFFFF', label: '네이비' },
  { id: 'preset:sky', bg: '#E0F2FE', color: '#0369A1', label: '스카이' },
  { id: 'preset:mint', bg: '#CCFBF1', color: '#0F766E', label: '민트' },
  { id: 'preset:rose', bg: '#FFE4E6', color: '#BE123C', label: '로즈' },
  { id: 'preset:amber', bg: '#FEF3C7', color: '#B45309', label: '앰버' },
  { id: 'preset:slate', bg: '#F1F5F9', color: '#334155', label: '슬레이트' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [editNicknameModalVisible, setEditNicknameModalVisible] = useState(false);
  const [editPhotoModalVisible, setEditPhotoModalVisible] = useState(false);
  const [socialConnectModalVisible, setSocialConnectModalVisible] = useState(false);
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [appSettingsModalVisible, setAppSettingsModalVisible] = useState(false);
  const [accountSheetVisible, setAccountSheetVisible] = useState(false);

  // Form states
  const [newNicknameInput, setNewNicknameInput] = useState('');
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');

  const {
    user,
    defaultBaseCurrency,
    defaultTransportMode,
    logout,
    loginWithSocial,
    updatePreferences,
    updateNickname,
    updateAvatar,
    changePassword,
  } = useAuthStore();

  const { resetToDefaults: resetPlaces } = usePlaceStore();
  const { resetToDefaults: resetTrips } = useTripStore();
  const { resetToDefaults: resetWallet } = useWalletStore();

  const handleOpenEditPhoto = () => {
    const currentAvatar = user?.avatarUrl || '';
    if (currentAvatar.startsWith('preset:')) {
      setSelectedPreset(currentAvatar);
      setAvatarUrlInput('');
    } else {
      setSelectedPreset('');
      setAvatarUrlInput(currentAvatar);
    }
    setEditPhotoModalVisible(true);
  };

  const handlePickWebFile = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e?.target?.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            updateAvatar(reader.result);
            setEditPhotoModalVisible(false);
            Alert.alert('완료', '프로필 사진이 변경되었습니다.');
          }
        };
        reader.readAsDataURL(file);
      };
      input.click();
    }
  };

  const handleSaveAvatar = () => {
    const targetAvatar = selectedPreset || avatarUrlInput.trim();
    updateAvatar(targetAvatar);
    setEditPhotoModalVisible(false);
    Alert.alert('완료', '프로필 사진이 업데이트되었습니다.');
  };

  const handleResetAvatar = () => {
    updateAvatar('');
    setSelectedPreset('');
    setAvatarUrlInput('');
    setEditPhotoModalVisible(false);
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
      Alert.alert('완료', res.message);
      setChangePasswordModalVisible(false);
    } else {
      Alert.alert('알림', res.message);
    }
  };

  const handleConnectSocial = async (provider: 'google' | 'kakao') => {
    const ok = await loginWithSocial(provider);
    if (ok) {
      setSocialConnectModalVisible(false);
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

  const renderAvatarContent = () => {
    const avatarUrl = user?.avatarUrl;
    if (avatarUrl && avatarUrl.startsWith('preset:')) {
      const preset = AVATAR_PRESETS.find((p) => p.id === avatarUrl) || AVATAR_PRESETS[0];
      const initial = (user?.nickname || '여').trim().charAt(0).toUpperCase();
      return (
        <View style={[styles.presetAvatarFill, { backgroundColor: preset.bg }]}>
          <Text style={[styles.presetAvatarInitial, { color: preset.color }]}>{initial}</Text>
        </View>
      );
    }
    if (avatarUrl) {
      return <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />;
    }
    return <User size={44} color="#D1D5DB" fill="#D1D5DB" />;
  };

  const providerLabel =
    user?.provider === 'kakao'
      ? '카카오 로그인 연동됨'
      : user?.provider === 'google'
        ? 'Google 로그인 연동됨'
        : '이메일 계정';

  return (
    <View style={[styles.screen, { paddingTop: Math.max(insets.top, 16) + 12 }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top-Left Bold Title */}
        <Text style={styles.pageTitle}>PROFILE</Text>

        {/* Centered Circular Avatar + Photo Edit + Nickname + Email */}
        <View style={styles.profileCenterBox}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleOpenEditPhoto}
            style={styles.avatarRing}
          >
            {renderAvatarContent()}
            <View style={styles.avatarEditBadge}>
              <Camera size={13} color="#FFFFFF" />
            </View>
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

          <View style={styles.providerPill}>
            <Text style={styles.providerPillText}>{providerLabel}</Text>
          </View>
        </View>

        {/* Quick Bar (여행 수정 & 클라우드 백업 삭제됨) */}
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
            onPress={handleOpenEditPhoto}
            style={styles.quickActionCol}
          >
            <Edit3 size={24} color="#6B7280" strokeWidth={1.7} />
            <Text style={styles.quickActionLabel}>프로필 사진</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setSocialConnectModalVisible(true)}
            style={styles.quickActionCol}
          >
            <Globe size={24} color="#6B7280" strokeWidth={1.7} />
            <Text style={styles.quickActionLabel}>소셜 연동</Text>
          </TouchableOpacity>
        </View>

        {/* Clean Divider Menu Rows (여행정보 수정, 여행추가, 클라우드 백업 삭제됨) */}
        <View style={styles.menuListContainer}>
          <TouchableOpacity
            activeOpacity={0.65}
            onPress={handleOpenEditPhoto}
            style={styles.menuRow}
          >
            <Text style={styles.menuRowTitle}>프로필 사진 수정</Text>
            <ChevronRight size={18} color="#374151" strokeWidth={1.8} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.65}
            onPress={() => setSocialConnectModalVisible(true)}
            style={styles.menuRow}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.menuRowTitle}>Google · 카카오 로그인 연동</Text>
              {user?.provider && user.provider !== 'email' && (
                <View style={styles.connectedMiniTag}>
                  <Text style={styles.connectedMiniTagText}>
                    {user.provider === 'kakao' ? 'KAKAO' : 'GOOGLE'}
                  </Text>
                </View>
              )}
            </View>
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

      {/* 프로필 사진 수정 모달 */}
      <Modal visible={editPhotoModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>프로필 사진 수정</Text>
                <TouchableOpacity onPress={() => setEditPhotoModalVisible(false)}>
                  <X size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <Text style={styles.settingLabel}>컬러 아바타 선택</Text>
              <View style={styles.presetGrid}>
                {AVATAR_PRESETS.map((preset) => {
                  const isSelected = selectedPreset === preset.id;
                  const initial = (user?.nickname || '여').trim().charAt(0).toUpperCase();
                  return (
                    <TouchableOpacity
                      key={preset.id}
                      activeOpacity={0.8}
                      onPress={() => {
                        setSelectedPreset(preset.id);
                        setAvatarUrlInput('');
                      }}
                      style={[
                        styles.presetCircle,
                        { backgroundColor: preset.bg },
                        isSelected && styles.presetCircleActive,
                      ]}
                    >
                      <Text style={[styles.presetCircleText, { color: preset.color }]}>
                        {initial}
                      </Text>
                      {isSelected && (
                        <View style={styles.presetCheckBadge}>
                          <Check size={10} color="#FFFFFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {Platform.OS === 'web' && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handlePickWebFile}
                  style={styles.uploadPhotoBtn}
                >
                  <Camera size={16} color="#1B2A4A" />
                  <Text style={styles.uploadPhotoBtnText}>기기에서 이미지 파일 선택하기</Text>
                </TouchableOpacity>
              )}

              <Text style={[styles.settingLabel, { marginTop: 12 }]}>이미지 URL 직접 입력</Text>
              <TextInput
                value={avatarUrlInput}
                onChangeText={(val) => {
                  setAvatarUrlInput(val);
                  if (val.trim()) setSelectedPreset('');
                }}
                placeholder="https://example.com/my-photo.jpg"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                style={styles.modalInput}
              />

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleResetAvatar}
                  style={[styles.modalOutlineBtn, { marginTop: 0 }]}
                >
                  <Text style={styles.modalOutlineBtnText}>기본 이미지로</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleSaveAvatar}
                  style={[styles.modalPrimaryBtn, { flex: 1, marginTop: 0 }]}
                >
                  <Text style={styles.modalPrimaryBtnText}>저장하기</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 구글 & 카카오 소셜 로그인 연동 모달 */}
      <Modal visible={socialConnectModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>소셜 로그인 계정 연동</Text>
              <TouchableOpacity onPress={() => setSocialConnectModalVisible(false)}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.socialDescText}>
              카카오 또는 Google 계정을 연동하면 기기를 변경해도 간편하게 로그인할 수 있습니다.
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleConnectSocial('kakao')}
              style={styles.kakaoConnectBtn}
            >
              <View style={styles.kakaoCircle}>
                <Text style={styles.kakaoCircleText}>K</Text>
              </View>
              <Text style={styles.kakaoConnectText}>
                {user?.provider === 'kakao' ? '카카오 계정 연동됨' : '카카오 계정으로 연동하기'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleConnectSocial('google')}
              style={styles.googleConnectBtn}
            >
              <View style={styles.googleCircle}>
                <Text style={styles.googleCircleText}>G</Text>
              </View>
              <Text style={styles.googleConnectText}>
                {user?.provider === 'google' ? 'Google 계정 연동됨' : 'Google 계정으로 연동하기'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

            <Text style={styles.settingLabel}>기본 이동수단</Text>
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
    position: 'relative',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  presetAvatarFill: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetAvatarInitial: {
    fontSize: 36,
    fontWeight: '900',
  },
  avatarEditBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1B2A4A',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
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
  providerPill: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#EEF2F8',
  },
  providerPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1B2A4A',
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
  connectedMiniTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#EEF2F8',
  },
  connectedMiniTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1B2A4A',
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
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  modalOutlineBtnText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '700',
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  presetCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  presetCircleActive: {
    borderWidth: 2.5,
    borderColor: '#1B2A4A',
  },
  presetCircleText: {
    fontSize: 17,
    fontWeight: '800',
  },
  presetCheckBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#1B2A4A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  uploadPhotoBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1B2A4A',
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadPhotoBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1B2A4A',
  },
  socialDescText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 19,
    marginBottom: 16,
  },
  kakaoConnectBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FEE500',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  kakaoCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#191919',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kakaoCircleText: {
    color: '#FEE500',
    fontSize: 11,
    fontWeight: '900',
  },
  kakaoConnectText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#191919',
  },
  googleConnectBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  googleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EEF2F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleCircleText: {
    color: '#1B2A4A',
    fontSize: 11,
    fontWeight: '900',
  },
  googleConnectText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#374151',
  },
  settingLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 8,
  },
  settingSegmentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    borderColor: '#1B2A4A',
    backgroundColor: '#EEF2F8',
  },
  segmentBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#6B7280',
  },
  segmentBtnTextActive: {
    color: '#1B2A4A',
  },
  sheetActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sheetActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
});
