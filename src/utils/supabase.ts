import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

let currentUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
let currentKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';

// 플레이스홀더 기본값
if (!currentUrl) {
  currentUrl = 'https://pinch-cloud.supabase.co';
}
if (!currentKey) {
  currentKey = 'placeholder-anon-key';
}

const isWebBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

export function isSupabaseConfigured(): boolean {
  return Boolean(
    currentUrl &&
      currentKey &&
      !currentUrl.includes('placeholder') &&
      !currentUrl.includes('xyzcompany') &&
      currentKey !== 'placeholder-anon-key' &&
      currentKey.length > 20
  );
}

export let supabase: SupabaseClient = createClient(currentUrl, currentKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: isWebBrowser,
  },
});

export function recreateSupabaseClient(url: string, anonKey: string): SupabaseClient {
  currentUrl = url.trim();
  currentKey = anonKey.trim();

  supabase = createClient(currentUrl, currentKey, {
    auth: {
      storage: AsyncStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: isWebBrowser,
    },
  });

  return supabase;
}

export async function loadStoredCredentials(): Promise<void> {
  try {
    const savedUrl = await AsyncStorage.getItem('@pinchi_supabase_url');
    const savedKey = await AsyncStorage.getItem('@pinchi_supabase_key');
    if (savedUrl && savedKey) {
      recreateSupabaseClient(savedUrl, savedKey);
    }
  } catch {
    // Ignore
  }
}

// 앱 실행 시 저장된 키 자동 복원
loadStoredCredentials();
