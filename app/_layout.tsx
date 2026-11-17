import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/store/useAuthStore';
import { useTripStore } from '../src/store/useTripStore';
import { AuthGateScreen } from '../src/components/auth/AuthModal';
import { CreateTripModal } from '../src/components/trip/CreateTripModal';
import { supabase, isSupabaseConfigured } from '../src/utils/supabase';
import '../global.css';

export default function RootLayout() {
  const { isLoggedIn, syncSessionFromSupabase, setSupabaseUser } = useAuthStore();
  const { trips, hasCompletedOnboarding, setHasCompletedOnboarding } = useTripStore();

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    syncSessionFromSupabase();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSupabaseUser(session.user);
      }
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [syncSessionFromSupabase, setSupabaseUser]);

  const needsFirstTripOnboarding =
    !hasCompletedOnboarding ||
    trips.length === 0 ||
    (trips.length === 1 && trips[0].id === 't_first' && trips[0].destination === '여행지 설정');

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {!isLoggedIn ? (
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
        </>
      )}
    </SafeAreaProvider>
  );
}
