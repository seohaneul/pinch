import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../../src/components/common/Header';
import { Button } from '../../src/components/common/Button';
import { usePlaceStore } from '../../src/store/usePlaceStore';
import { useTripStore } from '../../src/store/useTripStore';
import { useWalletStore } from '../../src/store/useWalletStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { AuthModal } from '../../src/components/auth/AuthModal';
import {
  User,
  Shield,
  ChevronRight,
  Heart,
  MapPin,
  Sparkles,
  LogOut,
  RotateCcw,
  Trash2,
  Lock,
  Globe,
  Coins,
  Check,
  X,
  KeyRound,
  Edit3,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [editNicknameModalVisible, setEditNicknameModalVisible] = useState(false);
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);

  // Form states
  const [newNicknameInput, setNewNicknameInput] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');

  const {
    isLoggedIn,
    user,
    defaultBaseCurrency,
    defaultTransportMode,
    logout,
    updatePreferences,
    updateNickname,
    changePassword,
  } = useAuthStore();

  const { places, resetToDefaults: resetPlaces } = usePlaceStore();
  const { trips, resetToDefaults: resetTrips } = useTripStore();
  const { expenses, resetToDefaults: resetWallet } = useWalletStore();

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
      Alert.alert('알림', '새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    const res = changePassword(currentPassword, newPassword);
    if (res.success) {
      setChangePasswordModalVisible(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까? 기기에 저장된 여행 데이터는 유지됩니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '회원 탈퇴 및 데이터 삭제',
      '탈퇴 시 계정 정보 및 로컬 데이터가 영구적으로 삭제됩니다. 계속 진행할까요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '탈퇴하기',
          style: 'destructive',
          onPress: () => {
            logout();
            resetPlaces();
            resetTrips();
            resetWallet();
            Alert.alert('탈퇴 완료', '회원 탈퇴 및 데이터 초기화가 완료되었습니다.');
          },
        },
      ]
    );
  };

  const handleSeedDemoData = () => {
    Alert.alert(
      '도쿄 예시 데이터 다시 불러오기',
      '[도쿄 3박 4일 감성 여행] 공식 추천 핫플, 일정 및 가계부 데이터로 복원하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '불러오기',
          style: 'default',
          onPress: () => {
            resetPlaces();
            resetTrips();
            resetWallet();
            Alert.alert('예시 데이터 복원 완료 🎉', '도쿄 공식 여행 일정과 가계부가 준비되었습니다.');
          },
        },
      ]
    );
  };

  const handleResetAllData = () => {
    Alert.alert(
      '전체 데이터 초기화 (Reset All)',
      '저장된 모든 장소 보관함, 여행 일정, 가계부 지출 내역이 영구히 초기화됩니다. 계속하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '전체 초기화',
          style: 'destructive',
          onPress: () => {
            resetPlaces();
            resetTrips();
            resetWallet();
            Alert.alert('초기화 완료', '모든 여행 데이터가 초기 상태로 리셋되었습니다.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="마이 & 설정 ⚙️"
        subtitle="계정 관리 및 여행 기본 환경 설정"
        showLogo={false}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 }]}
      >
        {/* 1. User Profile Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Image
              source={{
                uri:
                  user?.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop',
              }}
              style={styles.avatarImage}
            />
            <View style={styles.avatarMiniBadge}>
              <Sparkles size={10} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.profileTextWrap}>
            <View style={styles.nameRow}>
              <Text style={styles.userNameText}>
                {user?.nickname || '게스트 여행자'}
              </Text>
              {isLoggedIn && user ? (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedBadgeText}>동기화 회원</Text>
                </View>
              ) : (
                <View style={styles.guestBadge}>
                  <Text style={styles.guestBadgeText}>게스트 모드</Text>
                </View>
              )}
            </View>

            <Text style={styles.userEmailText} numberOfLines={1}>
              {isLoggedIn && user ? user.email : '로컬 기기 전용 모드로 사용 중'}
            </Text>

            {!isLoggedIn && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setAuthModalVisible(true)}
                style={styles.loginCtaBtn}
              >
                <Lock size={12} color="#FFF" style={{ marginRight: 4 }} />
                <Text style={styles.loginCtaText}>로그인하고 데이터 백업하기 🔒</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Quick Stats Pill Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statBox}>
            <MapPin size={18} color="#FF6B6B" />
            <Text style={styles.statCount}>{places.length}</Text>
            <Text style={styles.statLabel}>수집 핫플</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statBox}>
            <Heart size={18} color="#2A9D8F" />
            <Text style={styles.statCount}>{trips.length}</Text>
            <Text style={styles.statLabel}>계획 중 여행</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statBox}>
            <Coins size={18} color="#F77F00" />
            <Text style={styles.statCount}>{expenses.length}</Text>
            <Text style={styles.statLabel}>기록 지출</Text>
          </View>
        </View>

        {/* 2. Account Management Section (Req [6]) */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeaderTitle}>계정 관리</Text>

          <View style={styles.menuCard}>
            {/* Edit Nickname Row */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleOpenEditNickname}
              style={[styles.menuRow, { borderBottomWidth: 1, borderColor: '#F1F5F9' }]}
            >
              <View style={styles.menuLeft}>
                <Edit3 size={18} color="#FF6B6B" style={{ marginRight: 10 }} />
                <View>
                  <Text style={styles.menuTitle}>닉네임 변경</Text>
                  <Text style={styles.menuSubtitle}>현재: {user?.nickname || '여행자'}</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#CBD5E1" />
            </TouchableOpacity>

            {/* Change Password Row */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleOpenChangePassword}
              style={styles.menuRow}
            >
              <View style={styles.menuLeft}>
                <KeyRound size={18} color="#4ECDC4" style={{ marginRight: 10 }} />
                <View>
                  <Text style={styles.menuTitle}>비밀번호 변경</Text>
                  <Text style={styles.menuSubtitle}>계정 보안을 위한 비밀번호 업데이트</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#CBD5E1" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Travel Preferences Section */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeaderTitle}>여행 기본 설정</Text>

          <View style={styles.menuCard}>
            {/* Base Currency Selection */}
            <View style={styles.menuRow}>
              <View style={styles.menuLeft}>
                <Globe size={18} color="#FF6B6B" style={{ marginRight: 10 }} />
                <View>
                  <Text style={styles.menuTitle}>기본 기준 통화</Text>
                  <Text style={styles.menuSubtitle}>가계부 및 예산 산정 기본 통화</Text>
                </View>
              </View>

              <View style={styles.currencyToggleWrap}>
                {(['KRW', 'JPY', 'USD'] as const).map((curr) => {
                  const isSelected = defaultBaseCurrency === curr;
                  return (
                    <TouchableOpacity
                      key={curr}
                      onPress={() => updatePreferences({ defaultBaseCurrency: curr })}
                      style={[
                        styles.togglePill,
                        isSelected && styles.togglePillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.togglePillText,
                          isSelected && styles.togglePillTextActive,
                        ]}
                      >
                        {curr}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Default Transport Mode */}
            <View style={[styles.menuRow, { borderTopWidth: 1, borderColor: '#F1F5F9' }]}>
              <View style={styles.menuLeft}>
                <Coins size={18} color="#2A9D8F" style={{ marginRight: 10 }} />
                <View>
                  <Text style={styles.menuTitle}>기본 이동 수단</Text>
                  <Text style={styles.menuSubtitle}>동선 플래너 자동 시간 계산 기준</Text>
                </View>
              </View>

              <View style={styles.currencyToggleWrap}>
                {(['TRANSIT', 'WALK'] as const).map((mode) => {
                  const isSelected = defaultTransportMode === mode;
                  return (
                    <TouchableOpacity
                      key={mode}
                      onPress={() => updatePreferences({ defaultTransportMode: mode })}
                      style={[
                        styles.togglePill,
                        isSelected && styles.togglePillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.togglePillText,
                          isSelected && styles.togglePillTextActive,
                        ]}
                      >
                        {mode === 'TRANSIT' ? '대중교통' : '도보'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* 4. Data Management Section */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeaderTitle}>데이터 관리</Text>

          <View style={styles.menuCard}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleSeedDemoData}
              style={[styles.menuRow, { borderBottomWidth: 1, borderColor: '#F1F5F9' }]}
            >
              <View style={styles.menuLeft}>
                <RotateCcw size={18} color="#FF6B6B" style={{ marginRight: 10 }} />
                <View>
                  <Text style={styles.menuTitle}>도쿄 예시 데이터 다시 불러오기 (Seed Demo)</Text>
                  <Text style={styles.menuSubtitle}>도쿄 3박 4일 공식 핫플 & 추천 동선 복원</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#CBD5E1" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleResetAllData}
              style={styles.menuRow}
            >
              <View style={styles.menuLeft}>
                <Trash2 size={18} color="#E11D48" style={{ marginRight: 10 }} />
                <View>
                  <Text style={[styles.menuTitle, { color: '#E11D48' }]}>전체 데이터 초기화 (Reset All)</Text>
                  <Text style={styles.menuSubtitle}>보관함, 일정표, 가계부 지출 영구 리셋</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#CBD5E1" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 5. Account Actions Section */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeaderTitle}>계정 & 서비스</Text>

          <View style={styles.menuCard}>
            {isLoggedIn ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleLogout}
                style={[styles.menuRow, { borderBottomWidth: 1, borderColor: '#F1F5F9' }]}
              >
                <View style={styles.menuLeft}>
                  <LogOut size={18} color="#475569" style={{ marginRight: 10 }} />
                  <Text style={styles.menuTitle}>로그아웃</Text>
                </View>
                <ChevronRight size={16} color="#CBD5E1" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setAuthModalVisible(true)}
                style={[styles.menuRow, { borderBottomWidth: 1, borderColor: '#F1F5F9' }]}
              >
                <View style={styles.menuLeft}>
                  <User size={18} color="#FF6B6B" style={{ marginRight: 10 }} />
                  <Text style={[styles.menuTitle, { color: '#FF6B6B' }]}>로그인 / 간편 회원가입</Text>
                </View>
                <ChevronRight size={16} color="#CBD5E1" />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleDeleteAccount}
              style={styles.menuRow}
            >
              <View style={styles.menuLeft}>
                <Shield size={18} color="#94A3B8" style={{ marginRight: 10 }} />
                <Text style={[styles.menuTitle, { color: '#64748B' }]}>회원 탈퇴</Text>
              </View>
              <ChevronRight size={16} color="#CBD5E1" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 6. App Info Footer */}
        <View style={styles.appInfoFooter}>
          <Text style={styles.versionText}>Pinch (핀치) v1.0.0-mvp</Text>
          <Text style={styles.copyrightText}>
            © 2026 Pinch Team. Pre-Trip Planning Companion. All rights reserved.
          </Text>
        </View>
      </ScrollView>

      {/* Auth Modal */}
      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
      />

      {/* [Req 6] Edit Nickname Modal (Zero Bottom Gap with SafeAreaInsets) */}
      <Modal
        visible={editNicknameModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditNicknameModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <View style={styles.iconCircle}>
                    <Edit3 size={18} color="#FF6B6B" />
                  </View>
                  <Text style={styles.modalTitle}>닉네임 변경</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setEditNicknameModalVisible(false)}
                  style={styles.modalCloseBtn}
                >
                  <X size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                핀치에서 사용할 새로운 닉네임을 입력해 주세요.
              </Text>

              <View style={styles.inputWrap}>
                <TextInput
                  value={newNicknameInput}
                  onChangeText={setNewNicknameInput}
                  placeholder="새 닉네임 입력"
                  placeholderTextColor="#9CA3AF"
                  style={styles.textInput}
                  maxLength={20}
                  autoFocus={true}
                />
              </View>

              <View style={styles.modalBtnRow}>
                <Button
                  title="취소"
                  variant="outline"
                  size="md"
                  onPress={() => setEditNicknameModalVisible(false)}
                  style={{ flex: 1, marginRight: 8 }}
                />
                <Button
                  title="저장하기 ✨"
                  variant="primary"
                  size="md"
                  onPress={handleSaveNickname}
                  style={{ flex: 1.5 }}
                />
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* [Req 6] Change Password Modal (Zero Bottom Gap with SafeAreaInsets) */}
      <Modal
        visible={changePasswordModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setChangePasswordModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: 'rgba(78, 205, 196, 0.12)' }]}>
                    <KeyRound size={18} color="#4ECDC4" />
                  </View>
                  <Text style={styles.modalTitle}>비밀번호 변경 🔒</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setChangePasswordModalVisible(false)}
                  style={styles.modalCloseBtn}
                >
                  <X size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                계정 보안을 위해 6자리 이상의 새 비밀번호를 입력해 주세요.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>현재 비밀번호</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="현재 비밀번호 입력"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={true}
                    style={styles.textInput}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>새 비밀번호 (6자 이상)</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="새 비밀번호 입력"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={true}
                    style={styles.textInput}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>새 비밀번호 확인</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    value={newPasswordConfirm}
                    onChangeText={setNewPasswordConfirm}
                    placeholder="새 비밀번호 다시 입력"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={true}
                    style={styles.textInput}
                  />
                </View>
              </View>

              <View style={styles.modalBtnRow}>
                <Button
                  title="취소"
                  variant="outline"
                  size="md"
                  onPress={() => setChangePasswordModalVisible(false)}
                  style={{ flex: 1, marginRight: 8 }}
                />
                <Button
                  title="변경하기 🔒"
                  variant="primary"
                  size="md"
                  onPress={handleSavePassword}
                  style={{ flex: 1.5 }}
                />
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 16,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E2E8F0',
  },
  avatarMiniBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileTextWrap: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  userNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginRight: 8,
  },
  verifiedBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  guestBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  guestBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  userEmailText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 6,
  },
  loginCtaBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 2,
  },
  loginCtaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statCount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
    marginBottom: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#F1F5F9',
  },
  sectionWrap: {
    marginBottom: 20,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  menuSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 2,
  },
  currencyToggleWrap: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 3,
    borderRadius: 12,
  },
  togglePill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
  },
  togglePillActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  togglePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  togglePillTextActive: {
    color: '#FF6B6B',
  },
  appInfoFooter: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 10,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 14,
  },
  // Modal Styles (Zero bottom gap + Safe Area)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalHeaderLeft: {
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  inputWrap: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  textInput: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    padding: 0,
  },
  modalBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
});
