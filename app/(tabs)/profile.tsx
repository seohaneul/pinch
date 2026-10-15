import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Header } from '../../src/components/common/Header';
import { Card, Badge } from '../../src/components/common/Card';
import { usePlaceStore } from '../../src/store/usePlaceStore';
import { useTripStore } from '../../src/store/useTripStore';
import { useWalletStore } from '../../src/store/useWalletStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { AuthModal } from '../../src/components/auth/AuthModal';
import {
  User,
  Settings,
  Bell,
  Shield,
  Smartphone,
  Cloud,
  ChevronRight,
  Heart,
  MapPin,
  Sparkles,
  LogOut,
  RotateCcw,
  Trash2,
  Lock,
  Globe,
  Footprints,
  Bus,
  Coins,
  Check,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);

  const { isLoggedIn, user, defaultBaseCurrency, defaultTransportMode, logout, updatePreferences } =
    useAuthStore();
  const { places, resetToDefaults: resetPlaces } = usePlaceStore();
  const { trips, resetToDefaults: resetTrips } = useTripStore();
  const { expenses, resetToDefaults: resetWallet } = useWalletStore();

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
        contentContainerStyle={styles.scrollContent}
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
                {isLoggedIn && user ? user.nickname : '게스트 여행자'}
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

        {/* 2. Travel Preferences Section */}
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

            {/* Default Transport Mode Selection */}
            <View style={[styles.menuRow, { borderBottomWidth: 0 }]}>
              <View style={styles.menuLeft}>
                <Bus size={18} color="#2A9D8F" style={{ marginRight: 10 }} />
                <View>
                  <Text style={styles.menuTitle}>기본 이동 수단</Text>
                  <Text style={styles.menuSubtitle}>일정 추가 시 기본 이동 모델</Text>
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

        {/* 3. Data Management Section */}
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

        {/* 4. Account Actions Section */}
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

        {/* 5. App Info Footer */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 48,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    marginBottom: 14,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  avatarImage: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: '#FF6B6B',
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
    borderWidth: 1.5,
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
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginRight: 8,
  },
  verifiedBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '700',
  },
  guestBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  guestBadgeText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  userEmailText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 6,
  },
  loginCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  loginCtaText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 20,
    elevation: 1,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statCount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: '65%',
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },
  sectionWrap: {
    marginBottom: 20,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingLeft: 4,
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
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  currencyToggleWrap: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
  },
  togglePill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
  },
  togglePillActive: {
    backgroundColor: '#FF6B6B',
  },
  togglePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  togglePillTextActive: {
    color: '#FFFFFF',
  },
  appInfoFooter: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#CBD5E1',
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 16,
  },
});
