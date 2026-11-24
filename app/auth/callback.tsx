import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useAuthStore } from '../../src/store/useAuthStore';
import { isSupabaseConfigured } from '../../src/utils/supabase';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const url = Linking.useURL();
  const { syncSessionFromSupabase, handleOAuthCallbackUrl } = useAuthStore();

  useEffect(() => {
    let active = true;

    async function completeCallback() {
      try {
        if (isSupabaseConfigured()) {
          const targetUrl =
            url ||
            (typeof window !== 'undefined' && window.location?.href ? window.location.href : '') ||
            (await Linking.getInitialURL()) ||
            '';

          if (targetUrl) {
            await handleOAuthCallbackUrl(targetUrl);
          } else {
            await syncSessionFromSupabase();
          }
        }
      } catch (err) {
        console.log('[AuthCallback] Error completing OAuth callback:', err);
      } finally {
        if (active) {
          router.replace('/(tabs)');
        }
      }
    }

    completeCallback();
    return () => {
      active = false;
    };
  }, [url, router, syncSessionFromSupabase, handleOAuthCallbackUrl]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
      <ActivityIndicator size="large" color="#1B2A4A" />
      <Text style={{ marginTop: 12, fontSize: 14, fontWeight: '600', color: '#4B5563' }}>
        로그인 연결 중...
      </Text>
    </View>
  );
}

