import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { useAuthStore } from '../src/store/useAuthStore';
import { useTripStore } from '../src/store/useTripStore';
import { initUserDataScope, useUserDataScope } from '../src/store/userDataScope';
import { flushCloudSync } from '../src/store/cloudSync';
import { AuthGateScreen } from '../src/components/auth/AuthModal';
import { CreateTripModal } from '../src/components/trip/CreateTripModal';
import { supabase, isSupabaseConfigured } from '../src/utils/supabase';
import '../global.css';

export default function RootLayout() {
  const {
    isLoggedIn,
    needsPasswordReset,
    syncSessionFromSupabase,
    setSupabaseUser,
    handleOAuthCallbackUrl,
    markPasswordRecovery,
    completePasswordRecovery,
  } = useAuthStore();
  const { trips, hasCompletedOnboarding, setHasCompletedOnboarding } = useTripStore();
  const isDataReady = useUserDataScope((s) => s.ready);
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [recoveryConfirm, setRecoveryConfirm] = useState('');
  const [recoverySaving, setRecoverySaving] = useState(false);

  useEffect(() => {
    initUserDataScope();
    const appSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background') {
        flushCloudSync().catch(() => {});
      }
    });
    return () => appSub.remove();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    syncSessionFromSupabase();

    const maybeHandleOAuthUrl = (url?: string | null) => {
      if (!url) return;
      if (url.includes('auth/callback') || url.includes('access_token=') || url.includes('code=')) {
        handleOAuthCallbackUrl(url);
      }
    };

    Linking.getInitialURL().then(maybeHandleOAuthUrl).catch(() => {});
    const linkSub = Linking.addEventListener('url', (event) => {
      maybeHandleOAuthUrl(event.url);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        markPasswordRecovery();
      }
      if (session?.user) {
        setSupabaseUser(session.user);
      }
    });
    return () => {
      linkSub.remove();
      authListener.subscription.unsubscribe();
    };
  }, [syncSessionFromSupabase, setSupabaseUser, handleOAuthCallbackUrl, markPasswordRecovery]);

  const handleSaveRecoveryPassword = async () => {
    if (recoveryPassword.length < 6) {
      Alert.alert('알림', '새 비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }
    if (recoveryPassword !== recoveryConfirm) {
      Alert.alert('알림', '비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    setRecoverySaving(true);
    const res = await completePasswordRecovery(recoveryPassword);
    setRecoverySaving(false);
    if (res.success) {
      setRecoveryPassword('');
      setRecoveryConfirm('');
      Alert.alert('완료', res.message);
    } else {
      Alert.alert('변경 실패', res.message);
    }
  };

  const needsFirstTripOnboarding =
    !hasCompletedOnboarding ||
    trips.length === 0 ||
    (trips.length === 1 && trips[0].id === 't_first' && trips[0].destination === '여행지 설정');

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {!isDataReady ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
          <ActivityIndicator size="large" color="#1B2A4A" />
        </View>
      ) : !isLoggedIn ? (
        <AuthGateScreen />
      ) : (
        <>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#F4F5F7' },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" options={{ title: '페이지를 찾을 수 없음' }} />
          </Stack>

          {/* 앱 최초 진입 시 첫 번째 여행 추가 스텝 온보딩 */}
          <CreateTripModal
            visible={needsFirstTripOnboarding}
            isOnboarding={true}
            onClose={() => setHasCompletedOnboarding(true)}
            onCreated={() => setHasCompletedOnboarding(true)}
          />

          {/* 비밀번호 재설정 메일 링크 복귀 시 새 비밀번호 설정 모달 */}
          <Modal visible={needsPasswordReset} transparent animationType="fade">
            <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'center', padding: 24 }}>
              <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 6 }}>
                  새 비밀번호 설정
                </Text>
                <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
                  비밀번호 재설정 링크로 인증되었습니다. 사용하실 새 비밀번호를 입력해 주세요.
                </Text>
                <TextInput
                  value={recoveryPassword}
                  onChangeText={setRecoveryPassword}
                  placeholder="새 비밀번호 (6자 이상)"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  style={{
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    height: 46,
                    marginBottom: 10,
                    color: '#111827',
                  }}
                />
                <TextInput
                  value={recoveryConfirm}
                  onChangeText={setRecoveryConfirm}
                  placeholder="새 비밀번호 확인"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  style={{
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    height: 46,
                    marginBottom: 16,
                    color: '#111827',
                  }}
                />
                <TouchableOpacity
                  onPress={handleSaveRecoveryPassword}
                  disabled={recoverySaving}
                  style={{
                    backgroundColor: '#1B2A4A',
                    borderRadius: 12,
                    height: 48,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: recoverySaving ? 0.7 : 1,
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>
                    {recoverySaving ? '변경 중...' : '새 비밀번호 저장'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}
    </SafeAreaProvider>
  );
}
