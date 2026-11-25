import { supabase, isSupabaseConfigured } from '../utils/supabase';

const getDirectGeminiKey = () => (process.env.EXPO_PUBLIC_GEMINI_API_KEY || '').trim();
const getSupabaseUrl = () => (process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim();
const getSupabaseAnonKey = () =>
  (
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    ''
  ).trim();

/**
 * Gemini 호출 가능 여부.
 * - Supabase Edge Function(`gemini-proxy`) 경로가 가능하거나,
 * - 로컬 개발용 `EXPO_PUBLIC_GEMINI_API_KEY`가 설정된 경우 true.
 */
export function isGeminiAvailable(): boolean {
  const key = getDirectGeminiKey();
  if (key && !key.includes('placeholder')) return true;
  return isSupabaseConfigured() && Boolean(getSupabaseUrl());
}

/**
 * Gemini `generateContent` 공통 호출 헬퍼.
 * 1) 로그인된 Supabase 세션이 있으면 서버 프록시(`gemini-proxy`)를 우선 호출해
 *    클라이언트 번들에 API 키를 노출하지 않도록 한다.
 * 2) 프록시 미배포/비로그인 개발 환경에서는 `EXPO_PUBLIC_GEMINI_API_KEY`로 폴백한다.
 */
export async function callGeminiGenerateContent(
  model: string,
  payload: Record<string, unknown>,
  timeoutMs = 10000
): Promise<any | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    if (isSupabaseConfigured() && getSupabaseUrl()) {
      try {
        const { data: sessData } = await supabase.auth.getSession();
        const accessToken = sessData?.session?.access_token;
        if (accessToken) {
          const proxyUrl = `${getSupabaseUrl()}/functions/v1/gemini-proxy`;
          const proxyRes = await fetch(proxyUrl, {
            method: 'POST',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
              apikey: getSupabaseAnonKey(),
            },
            body: JSON.stringify({ model, payload }),
          });
          if (proxyRes.ok) {
            return await proxyRes.json();
          }
        }
      } catch {
        // 프록시 미배포 또는 일시 오류 시 아래 로컬 키 폴백으로 진행
      }
    }

    const directKey = getDirectGeminiKey();
    if (!directKey || directKey.includes('placeholder')) {
      return null;
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const response = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': directKey,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
