import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useAuthStore } from '../../src/store/useAuthStore';
import { supabase, isSupabaseConfigured } from '../../src/utils/supabase';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const url = Linking.useURL();
  const { syncSessionFromSupabase, setSupabaseUser } = useAuthStore();

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
            const [withoutHash, hash] = targetUrl.split('#');
            const query = withoutHash?.split('?')[1];
            const params: Record<string, string> = {};
            [query, hash].forEach((part) => {
              if (!part) return;
              part.split('&').forEach((kv) => {
                const idx = kv.indexOf('=');
                if (idx === -1) return;
                params[decodeURIComponent(kv.slice(0, idx))] = decodeURIComponent(kv.slice(idx + 1));
              });
            });

            if (params.code) {
              const { data } = await supabase.auth.exchangeCodeForSession(params.code);
              if (data?.user && active) setSupabaseUser(data.user);
            } else if (params.access_token && params.refresh_token) {
              const { data } = await supabase.auth.setSession({
                access_token: params.access_token,
                refresh_token: params.refresh_token,
              });
              if (data?.user && active) setSupabaseUser(data.user);
            }
          }
          await syncSessionFromSupabase();
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
  }, [url, router, syncSessionFromSupabase, setSupabaseUser]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
      <ActivityIndicator size="large" color="#1B2A4A" />
      <Text style={{ marginTop: 12, fontSize: 14, fontWeight: '600', color: '#4B5563' }}>
        로그인 연결 중...
      </Text>
    </View>
  );
}

