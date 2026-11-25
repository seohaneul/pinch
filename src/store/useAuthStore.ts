import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform, AppState } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../utils/supabase';
import { clearScopedData } from './userScopedStorage';
import { flushCloudSync, setActiveCloudSyncUser } from './cloudSync';

export interface AuthUser {
  id: string;
  email: string;
  nickname: string;
  avatarUrl?: string;
  provider?: 'email' | 'google' | 'kakao';
  createdAt: string;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} 응답 시간이 초과되었습니다 (${Math.round(ms / 1000)}초). 네트워크 또는 Supabase Redirect URL 설정을 확인해주세요.`));
    }, ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function parseOAuthCallbackParams(callbackUrl: string): Record<string, string> {
  const params: Record<string, string> = {};
  const extractPairs = (part?: string) => {
    if (!part) return;
    part.split('&').forEach((kv) => {
      const idx = kv.indexOf('=');
      if (idx === -1) return;
      const k = decodeURIComponent(kv.slice(0, idx));
      const v = decodeURIComponent(kv.slice(idx + 1));
      if (k) params[k] = v;
    });
  };
  const [withoutHash, hash] = callbackUrl.split('#');
  const query = withoutHash?.split('?')[1];
  extractPairs(query);
  extractPairs(hash);
  return params;
}

function buildAuthUserFromSupabase(
  supaUser: SupabaseUser,
  providerHint?: 'email' | 'google' | 'kakao'
): AuthUser {
  const meta = supaUser.user_metadata || {};
  const email = supaUser.email || meta.email || '';
  const appProvider = supaUser.app_metadata?.provider;
  const resolvedProvider: 'email' | 'google' | 'kakao' =
    providerHint ||
    (appProvider === 'kakao' || appProvider === 'google' ? appProvider : 'email');

  const nickname =
    meta.nickname ||
    meta.name ||
    meta.full_name ||
    meta.user_name ||
    meta.preferred_username ||
    (email ? email.split('@')[0] : '') ||
    (resolvedProvider === 'kakao' ? '카카오 여행자' : resolvedProvider === 'google' ? '구글 여행자' : '여행자');

  const avatarUrl = meta.avatar_url || meta.picture || meta.profile_image;

  return {
    id: supaUser.id,
    email,
    nickname,
    avatarUrl,
    provider: resolvedProvider,
    createdAt: supaUser.created_at || new Date().toISOString(),
  };
}

let inFlightOAuthUrl: string | null = null;
let lastHandledOAuthUrl: string | null = null;

export interface ActionResult {
  success: boolean;
  message: string;
}

function getAuthRedirectUrl(): string {
  const isWeb = Platform.OS === 'web';
  const rawRedirect = Linking.createURL('auth/callback');
  let redirectTo =
    !isWeb && (!rawRedirect || rawRedirect.includes('null') || rawRedirect.includes('undefined'))
      ? 'pinch://auth/callback'
      : rawRedirect;
  if (!isWeb && redirectTo.startsWith('pinch:///')) {
    redirectTo = redirectTo.replace('pinch:///', 'pinch://');
  }
  if (!isWeb && redirectTo.startsWith('exps://')) {
    redirectTo = redirectTo.replace('exps://', 'exp://');
  }
  return redirectTo;
}

function showAuthNotice(title: string, message: string) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message);
  }
}

interface AuthState {
  isLoggedIn: boolean;
  user: AuthUser | null;
  defaultBaseCurrency: 'KRW' | 'JPY' | 'USD';
  defaultTransportMode: 'TRANSIT' | 'WALK';
  isLoading: boolean;
  authError: string | null;
  authStatus: string | null;
  needsPasswordReset: boolean;

  // Actions
  clearAuthError: () => void;
  cancelAuthLoading: () => void;
  login: (email: string, password?: string) => Promise<boolean>;
  signup: (nickname: string, email: string, password?: string) => Promise<boolean>;
  loginWithSocial: (provider: 'google' | 'kakao') => Promise<boolean>;
  linkSocialAccount: (provider: 'google' | 'kakao') => Promise<ActionResult>;
  handleOAuthCallbackUrl: (url: string, providerHint?: 'google' | 'kakao') => Promise<boolean>;
  syncSessionFromSupabase: () => Promise<void>;
  setSupabaseUser: (supaUser: SupabaseUser | null) => void;
  logout: () => Promise<void>;
  updateNickname: (newNickname: string) => boolean;
  updateAvatar: (avatarUrl: string) => boolean;
  changePassword: (currentPassword: string, newPassword: string) => Promise<ActionResult>;
  resetPassword: (email: string) => Promise<ActionResult>;
  completePasswordRecovery: (newPassword: string) => Promise<ActionResult>;
  markPasswordRecovery: () => void;
  deleteAccount: () => Promise<ActionResult>;
  updatePreferences: (prefs: {
    defaultBaseCurrency?: 'KRW' | 'JPY' | 'USD';
    defaultTransportMode?: 'TRANSIT' | 'WALK';
  }) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      user: null, // Default Guest Mode
      defaultBaseCurrency: 'KRW',
      defaultTransportMode: 'TRANSIT',
      isLoading: false,
      authError: null,
      authStatus: null,
      needsPasswordReset: false,

      clearAuthError: () => set({ authError: null }),
      cancelAuthLoading: () => set({ isLoading: false, authError: null, authStatus: null }),

      login: async (email: string, password?: string) => {
        const cleanEmail = email.trim();
        const pwd = password?.trim();

        if (!cleanEmail) {
          const msg = '이메일을 입력해주세요.';
          set({ authError: msg });
          showAuthNotice('알림', msg);
          return false;
        }
        if (!pwd) {
          const msg = '비밀번호를 입력해주세요.';
          set({ authError: msg });
          showAuthNotice('알림', msg);
          return false;
        }

        set({ isLoading: true, authError: null });

        try {
          // 1. Supabase 연동 시 실제 클라우드 로그인 시도
          if (isSupabaseConfigured()) {
            const { data, error } = await withTimeout(
              supabase.auth.signInWithPassword({
                email: cleanEmail,
                password: pwd,
              }),
              10000,
              '이메일 로그인'
            );

            if (error) {
              let msg = error.message;
              if (error.message.includes('Invalid login credentials')) {
                msg = '이메일 또는 비밀번호가 일치하지 않습니다.';
              } else if (error.message.includes('Email not confirmed')) {
                msg = '이메일 인증이 완료되지 않았습니다. 가입한 메일함에서 인증 링크를 확인해주세요.';
              }
              set({ authError: msg });
              showAuthNotice('로그인 실패', msg);
              return false;
            }

            if (data.user) {
              const nickname =
                data.user.user_metadata?.nickname || cleanEmail.split('@')[0] || '여행자';
              const authUser: AuthUser = {
                id: data.user.id,
                email: cleanEmail,
                nickname,
                createdAt: data.user.created_at || new Date().toISOString(),
              };

              set({ isLoggedIn: true, user: authUser, authError: null });
              showAuthNotice('로그인 성공 🎉', `${nickname}님, 환영합니다!`);
              return true;
            }

            const unknownMsg = '로그인 정보를 확인하지 못했습니다. 다시 시도해주세요.';
            set({ authError: unknownMsg });
            showAuthNotice('로그인 실패', unknownMsg);
            return false;
          }

          // 2. Supabase 미설정 환경(오프라인/테스트) 안전 폴백
          const nickname = cleanEmail.split('@')[0] || '여행자';
          const fallbackUser: AuthUser = {
            id: `user_${Date.now()}`,
            email: cleanEmail,
            nickname,
            createdAt: new Date().toISOString(),
          };

          set({ isLoggedIn: true, user: fallbackUser, authError: null });
          showAuthNotice('로그인 완료 🎉', `${nickname}님, 환영합니다! (로컬 안전 모드)`);
          return true;
        } catch (err: any) {
          console.log('[AuthStore] Supabase login error:', err);
          const msg = err?.message || '로그인 중 네트워크 오류가 발생했습니다.';
          set({ authError: msg });
          showAuthNotice('로그인 실패', msg);
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      signup: async (nickname: string, email: string, password?: string) => {
        const cleanNickname = nickname.trim();
        const cleanEmail = email.trim();
        const pwd = password?.trim();

        if (!cleanNickname || !cleanEmail || !pwd) {
          const msg = '닉네임, 이메일, 비밀번호를 모두 입력해주세요.';
          set({ authError: msg });
          showAuthNotice('알림', msg);
          return false;
        }
        if (pwd.length < 6) {
          const msg = '비밀번호는 최소 6자 이상이어야 합니다.';
          set({ authError: msg });
          showAuthNotice('알림', msg);
          return false;
        }

        set({ isLoading: true, authError: null });

        try {
          // 1. Supabase 연동 시 실제 클라우드 회원가입 시도
          if (isSupabaseConfigured()) {
            const { data, error } = await withTimeout(
              supabase.auth.signUp({
                email: cleanEmail,
                password: pwd,
                options: {
                  data: {
                    nickname: cleanNickname,
                  },
                },
              }),
              12000,
              '회원가입'
            );

            if (error) {
              let msg = error.message;
              if (error.message.includes('User already registered')) {
                msg = '이미 가입된 이메일 주소입니다. 로그인을 진행해 주세요.';
              } else if (error.message.includes('rate limit')) {
                msg = '잠시 후 다시 시도해 주세요 (이메일 요청 제한).';
              } else if (error.message.includes('invalid')) {
                msg = '올바른 이메일 형식을 입력해 주세요.';
              }
              set({ authError: msg });
              showAuthNotice('회원가입 실패', msg);
              return false;
            }

            if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
              const dupMsg = '이미 가입된 이메일 주소입니다. 로그인을 진행해 주세요.';
              set({ authError: dupMsg });
              showAuthNotice('회원가입 실패', dupMsg);
              return false;
            }

            if (data.user) {
              const authUser: AuthUser = {
                id: data.user.id,
                email: cleanEmail,
                nickname: cleanNickname,
                createdAt: data.user.created_at || new Date().toISOString(),
              };

              set({ isLoggedIn: true, user: authUser, authError: null });
              showAuthNotice('회원가입 완료 ✈️', `핀치에 오신 것을 환영합니다, ${cleanNickname}님!`);
              return true;
            }

            const unknownMsg = '회원가입 처리 결과를 확인하지 못했습니다. 다시 시도해주세요.';
            set({ authError: unknownMsg });
            showAuthNotice('회원가입 실패', unknownMsg);
            return false;
          }

          // 2. Supabase 미설정 환경(오프라인/테스트) 안전 폴백
          const fallbackUser: AuthUser = {
            id: `user_${Date.now()}`,
            email: cleanEmail,
            nickname: cleanNickname,
            createdAt: new Date().toISOString(),
          };

          set({ isLoggedIn: true, user: fallbackUser, authError: null });
          showAuthNotice('회원가입 완료 ✈️', `핀치에 오신 것을 환영합니다, ${cleanNickname}님!`);
          return true;
        } catch (err: any) {
          console.log('[AuthStore] Supabase signup error:', err);
          const msg = err?.message || '회원가입 중 네트워크 오류가 발생했습니다.';
          set({ authError: msg });
          showAuthNotice('회원가입 실패', msg);
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      loginWithSocial: async (provider: 'google' | 'kakao') => {
        set({ isLoading: true, authError: null, authStatus: 'OAuth 로그인 주소 요청 중...' });
        const providerLabel = provider === 'kakao' ? '카카오' : 'Google';

        try {
          if (isSupabaseConfigured()) {
            WebBrowser.maybeCompleteAuthSession();

            const isWeb = Platform.OS === 'web';
            const rawRedirect = Linking.createURL('auth/callback');
            let redirectTo =
              !isWeb && (!rawRedirect || rawRedirect.includes('null') || rawRedirect.includes('undefined'))
                ? 'pinch://auth/callback'
                : rawRedirect;
            if (!isWeb && redirectTo.startsWith('pinch:///')) {
              redirectTo = redirectTo.replace('pinch:///', 'pinch://');
            }
            if (!isWeb && redirectTo.startsWith('exps://')) {
              redirectTo = redirectTo.replace('exps://', 'exp://');
            }
            if (typeof __DEV__ !== 'undefined' && __DEV__) {
              console.log(`[AuthStore] Starting ${provider} OAuth. redirectTo=${redirectTo}`);
            }
            set({ authStatus: '인증 화면을 준비하고 있어요...' });

            const { data, error } = await withTimeout(
              supabase.auth.signInWithOAuth({
                provider,
                options: {
                  redirectTo,
                  skipBrowserRedirect: !isWeb,
                },
              }),
              10000,
              `${providerLabel} OAuth 요청`
            );

            if (error) {
              const msg = error.message.includes('not enabled')
                ? `Supabase 대시보드에서 ${providerLabel} Provider 설정을 활성화해주세요.`
                : error.message;
              set({ authError: msg });
              showAuthNotice(`${providerLabel} 로그인 오류`, msg);
              return false;
            }

            if (isWeb) {
              if (data?.url && typeof window !== 'undefined') {
                window.location.assign(data.url);
              }
              return true;
            }

            if (!data?.url) {
              const msg = '인증 주소를 받아오지 못했습니다.';
              set({ authError: msg });
              showAuthNotice('로그인 오류', msg);
              return false;
            }

            // Android/Expo Go에서 Chrome Custom Tabs가 딥링크 복귀 시 openAuthSessionAsync가
            // resolve되지 않고 멈추는 현상을 막기 위해 Linking 이벤트 + AppState 복귀를 함께 감시
            let didTimeout = false;
            const callbackUrl = await new Promise<string | null>((resolve) => {
              let settled = false;
              let appReturnTimer: ReturnType<typeof setTimeout> | null = null;
              let timeoutTimer: ReturnType<typeof setTimeout> | null = null;

              const finish = (url: string | null) => {
                if (settled) return;
                settled = true;
                linkSub?.remove?.();
                appSub?.remove?.();
                if (appReturnTimer) clearTimeout(appReturnTimer);
                if (timeoutTimer) clearTimeout(timeoutTimer);
                resolve(url);
              };

              const linkSub = Linking.addEventListener?.('url', (event: { url?: string }) => {
                if (event?.url && (event.url.includes('auth/callback') || event.url.includes('access_token=') || event.url.includes('code='))) {
                  console.log('[AuthStore] Captured OAuth deep link via Linking');
                  try {
                    WebBrowser.dismissBrowser?.();
                  } catch { }
                  finish(event.url);
                }
              });

              const appSub = AppState?.addEventListener?.('change', (nextState: string) => {
                if (nextState === 'active') {
                  appReturnTimer = setTimeout(() => {
                    console.log('[AuthStore] App resumed without openAuthSessionAsync resolution');
                    finish(null);
                  }, 1500);
                }
              });

              timeoutTimer = setTimeout(() => {
                console.log('[AuthStore] OAuth browser session timed out');
                didTimeout = true;
                finish(null);
              }, 45000);

              if (typeof __DEV__ !== 'undefined' && __DEV__) {
                console.log('[AuthStore] Opening OAuth browser session...');
              }
              set({ authStatus: '브라우저에서 로그인을 완료해 주세요...' });
              WebBrowser.openAuthSessionAsync(data.url, redirectTo)
                .then((res) => {
                  console.log('[AuthStore] openAuthSessionAsync resolved:', res?.type);
                  if (res?.type === 'success' && 'url' in res && res.url) {
                    finish(res.url);
                  } else {
                    // Android에서 Custom Tabs가 닫힌 직후 Linking 이벤트가 수백ms 늦게 도착할 수 있음
                    if (!appReturnTimer) {
                      appReturnTimer = setTimeout(() => finish(null), 500);
                    }
                  }
                })
                .catch((browserErr) => {
                  console.log('[AuthStore] openAuthSessionAsync error:', browserErr);
                  finish(null);
                });
            });

            let resolvedCallbackUrl = callbackUrl;
            if (!resolvedCallbackUrl) {
              const initialUrl = await Linking.getInitialURL?.().catch(() => null);
              if (
                initialUrl &&
                (initialUrl.includes('auth/callback') ||
                  initialUrl.includes('access_token=') ||
                  initialUrl.includes('code='))
              ) {
                resolvedCallbackUrl = initialUrl;
              }
            }

            if (!resolvedCallbackUrl) {
              // 혹시 그사이 세션이 이미 저장되었는지 마지막 확인
              const { data: sessCheck } = await withTimeout(
                supabase.auth.getSession(),
                8000,
                '세션 확인'
              );
              if (sessCheck?.session?.user) {
                const authUser = buildAuthUserFromSupabase(sessCheck.session.user, provider);
                set({ isLoggedIn: true, user: authUser, authError: null });
                return true;
              }
              if (didTimeout) {
                const msg = `${providerLabel} 로그인 응답 시간이 초과되었습니다. 브라우저 또는 Redirect URL 설정을 확인해주세요.`;
                set({ authError: msg });
                showAuthNotice(`${providerLabel} 로그인 지연`, msg);
              }
              return false;
            }

            return await get().handleOAuthCallbackUrl(resolvedCallbackUrl, provider);
          }

          // Supabase 미설정 환경(오프라인/테스트) 안전 폴백
          const currentUser = get().user;
          const socialUser: AuthUser = {
            id: currentUser?.id || `${provider}_${Date.now()}`,
            email:
              currentUser?.email ||
              (provider === 'kakao' ? 'traveler@kakao.com' : 'traveler@gmail.com'),
            nickname:
              currentUser?.nickname ||
              (provider === 'kakao' ? '카카오 여행자' : '구글 여행자'),
            avatarUrl: currentUser?.avatarUrl,
            provider,
            createdAt: currentUser?.createdAt || new Date().toISOString(),
          };

          set({ isLoggedIn: true, user: socialUser, authError: null });
          showAuthNotice(
            `${providerLabel} 로그인 완료`,
            `${socialUser.nickname}님, ${providerLabel} 계정으로 연결되었습니다.`
          );
          return true;
        } catch (err: any) {
          const msg = err?.message || '소셜 로그인 처리 중 문제가 발생했습니다.';
          set({ authError: msg });
          showAuthNotice(`${providerLabel} 로그인 실패`, msg);
          return false;
        } finally {
          set({ isLoading: false, authStatus: null });
        }
      },

      handleOAuthCallbackUrl: async (callbackUrl: string, providerHint?: 'google' | 'kakao') => {
        if (!isSupabaseConfigured() || !callbackUrl) return false;
        if (lastHandledOAuthUrl === callbackUrl) return true;
        if (inFlightOAuthUrl === callbackUrl) return false;
        inFlightOAuthUrl = callbackUrl;

        const providerLabel =
          providerHint === 'kakao' ? '카카오' : providerHint === 'google' ? 'Google' : '소셜';

        set({ isLoading: true, authError: null, authStatus: '콜백 수신 완료! 세션 저장 중...' });
        try {
          const params = parseOAuthCallbackParams(callbackUrl);
          if (params.error || params.error_description) {
            const msg = params.error_description || params.error;
            set({ authError: msg });
            showAuthNotice(`${providerLabel} 로그인 실패`, msg);
            return false;
          }

          let sessionUser: SupabaseUser | null = null;
          if (params.code) {
            console.log('[AuthStore] Exchanging OAuth code for session...');
            const { data: exData, error: exErr } = await withTimeout(
              supabase.auth.exchangeCodeForSession(params.code),
              12000,
              'OAuth 코드 교환'
            );
            if (exErr) throw exErr;
            sessionUser = exData.user || exData.session?.user || null;
          } else if (params.access_token && params.refresh_token) {
            console.log('[AuthStore] Setting OAuth session tokens...');
            const { data: sessData, error: sessErr } = await withTimeout(
              supabase.auth.setSession({
                access_token: params.access_token,
                refresh_token: params.refresh_token,
              }),
              12000,
              'OAuth 세션 저장'
            );
            if (sessErr) throw sessErr;
            sessionUser = sessData.user || sessData.session?.user || null;
          } else {
            console.log('[AuthStore] Fetching current Supabase user...');
            const { data: userData } = await withTimeout(
              supabase.auth.getUser(),
              10000,
              '사용자 정보 조회'
            );
            sessionUser = userData.user || null;
          }

          if (!sessionUser) {
            const msg = '계정 세션을 확인하지 못했습니다.';
            set({ authError: msg });
            showAuthNotice('로그인 확인 필요', msg);
            return false;
          }

          lastHandledOAuthUrl = callbackUrl;
          const authUser = buildAuthUserFromSupabase(sessionUser, providerHint);
          set({ isLoggedIn: true, user: authUser, authError: null });
          showAuthNotice(
            `${providerLabel} 로그인 완료`,
            `${authUser.nickname}님, ${providerLabel} 계정으로 연결되었습니다.`
          );
          return true;
        } catch (err: any) {
          const msg = err?.message || '소셜 로그인 처리 중 문제가 발생했습니다.';
          set({ authError: msg });
          showAuthNotice(`${providerLabel} 로그인 실패`, msg);
          return false;
        } finally {
          inFlightOAuthUrl = null;
          set({ isLoading: false, authStatus: null });
        }
      },

      setSupabaseUser: (supaUser) => {
        if (!supaUser) return;
        const authUser = buildAuthUserFromSupabase(supaUser);
        set({ isLoggedIn: true, user: authUser, isLoading: false });
      },

      syncSessionFromSupabase: async () => {
        if (!isSupabaseConfigured()) return;
        try {
          const { data } = await supabase.auth.getSession();
          if (data.session?.user) {
            const authUser = buildAuthUserFromSupabase(data.session.user);
            set({ isLoggedIn: true, user: authUser });
          }
        } catch (err) {
          console.log('[AuthStore] Session sync error:', err);
        }
      },

      logout: async () => {
        if (isSupabaseConfigured()) {
          try {
            await flushCloudSync();
          } catch {}
          try {
            await supabase.auth.signOut();
          } catch (e) {
            // Ignore
          }
        }
        set({ isLoggedIn: false, user: null, needsPasswordReset: false });
        Alert.alert('로그아웃', '로그아웃되었습니다. 같은 계정으로 다시 로그인하면 여행 데이터가 복원됩니다.');
      },

      updateNickname: (newNickname: string) => {
        const clean = newNickname.trim();
        if (!clean) {
          Alert.alert('알림', '변경할 닉네임을 입력해 주세요.');
          return false;
        }

        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, nickname: clean },
          });

          // Supabase metadata update
          if (isSupabaseConfigured()) {
            supabase.auth.updateUser({ data: { nickname: clean } }).catch(() => { });
          }

          Alert.alert('완료', '닉네임이 성공적으로 변경되었습니다.');
          return true;
        }
        return false;
      },

      updateAvatar: (avatarUrl: string) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, avatarUrl: avatarUrl.trim() || undefined },
          });

          if (isSupabaseConfigured()) {
            supabase.auth
              .updateUser({ data: { avatar_url: avatarUrl.trim() || null } })
              .catch(() => { });
          }
          return true;
        }
        return false;
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        if (newPassword.length < 6) {
          return { success: false, message: '새 비밀번호는 최소 6자 이상이어야 합니다.' };
        }

        if (!isSupabaseConfigured()) {
          return { success: true, message: '비밀번호가 성공적으로 변경되었습니다.' };
        }

        const user = get().user;
        if (user?.provider && user.provider !== 'email') {
          return {
            success: false,
            message: '소셜 로그인 계정은 비밀번호를 변경할 수 없습니다. 해당 서비스에서 관리해 주세요.',
          };
        }
        if (!currentPassword) {
          return { success: false, message: '현재 비밀번호를 입력해 주세요.' };
        }
        if (!user?.email) {
          return { success: false, message: '계정 정보를 확인할 수 없습니다. 다시 로그인해 주세요.' };
        }

        try {
          const { error: verifyError } = await withTimeout(
            supabase.auth.signInWithPassword({ email: user.email, password: currentPassword }),
            10000,
            '현재 비밀번호 확인'
          );
          if (verifyError) {
            return { success: false, message: '현재 비밀번호가 일치하지 않습니다.' };
          }

          const { error } = await withTimeout(
            supabase.auth.updateUser({ password: newPassword }),
            10000,
            '비밀번호 변경'
          );
          if (error) {
            const msg = /different from the old password/i.test(error.message)
              ? '기존과 다른 비밀번호를 입력해 주세요.'
              : error.message;
            return { success: false, message: msg };
          }
          return { success: true, message: '비밀번호가 성공적으로 변경되었습니다.' };
        } catch (err: any) {
          return {
            success: false,
            message: err?.message || '비밀번호 변경 중 네트워크 오류가 발생했습니다.',
          };
        }
      },

      resetPassword: async (email: string) => {
        const clean = email.trim();
        if (!clean || !clean.includes('@')) {
          return { success: false, message: '올바른 이메일 주소를 입력해 주세요.' };
        }
        if (!isSupabaseConfigured()) {
          return { success: false, message: '서버에 연결할 수 없는 상태입니다.' };
        }
        try {
          const { error } = await withTimeout(
            supabase.auth.resetPasswordForEmail(clean, { redirectTo: getAuthRedirectUrl() }),
            12000,
            '비밀번호 재설정 메일 요청'
          );
          if (error) {
            const msg = /rate limit/i.test(error.message)
              ? '요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.'
              : error.message;
            return { success: false, message: msg };
          }
          return {
            success: true,
            message: '입력하신 이메일로 재설정 링크를 보냈습니다. 메일이 보이지 않으면 스팸함도 확인해 주세요.',
          };
        } catch (err: any) {
          return { success: false, message: err?.message || '메일 요청 중 오류가 발생했습니다.' };
        }
      },

      markPasswordRecovery: () => set({ needsPasswordReset: true }),

      completePasswordRecovery: async (newPassword: string) => {
        if (newPassword.length < 6) {
          return { success: false, message: '새 비밀번호는 최소 6자 이상이어야 합니다.' };
        }
        if (!isSupabaseConfigured()) {
          return { success: false, message: '서버에 연결할 수 없는 상태입니다.' };
        }
        try {
          const { error } = await withTimeout(
            supabase.auth.updateUser({ password: newPassword }),
            10000,
            '비밀번호 변경'
          );
          if (error) {
            return { success: false, message: error.message };
          }
          set({ needsPasswordReset: false });
          return { success: true, message: '새 비밀번호로 변경되었습니다.' };
        } catch (err: any) {
          return { success: false, message: err?.message || '비밀번호 변경 중 오류가 발생했습니다.' };
        }
      },

      linkSocialAccount: async (provider: 'google' | 'kakao') => {
        const providerLabel = provider === 'kakao' ? '카카오' : 'Google';
        if (!isSupabaseConfigured()) {
          return { success: false, message: '서버에 연결할 수 없는 상태입니다.' };
        }
        try {
          const redirectTo = getAuthRedirectUrl();
          const { data, error } = await withTimeout(
            supabase.auth.linkIdentity({
              provider,
              options: { redirectTo, skipBrowserRedirect: Platform.OS !== 'web' },
            }),
            10000,
            `${providerLabel} 계정 연동`
          );
          if (error) {
            return {
              success: false,
              message: error.message || `${providerLabel} 계정 연동에 실패했습니다.`,
            };
          }
          if (Platform.OS !== 'web' && data?.url) {
            const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
            if (res.type === 'success' && res.url) {
              const ok = await get().handleOAuthCallbackUrl(res.url, provider);
              if (ok) {
                return { success: true, message: `${providerLabel} 계정이 연동되었습니다.` };
              }
            }
            return { success: false, message: `${providerLabel} 계정 연동이 취소되었거나 완료되지 않았습니다.` };
          }
          return { success: true, message: `${providerLabel} 계정 연동 페이지로 이동합니다.` };
        } catch (err: any) {
          return {
            success: false,
            message: err?.message || `${providerLabel} 계정 연동 중 오류가 발생했습니다.`,
          };
        }
      },

      deleteAccount: async () => {
        const user = get().user;
        if (!user) {
          return { success: false, message: '로그인이 필요합니다.' };
        }

        set({ isLoading: true });
        setActiveCloudSyncUser(null);
        try {
          if (isSupabaseConfigured()) {
            try {
              await supabase.from('user_sync_backups').delete().eq('user_id', user.id);
            } catch {}

            const { error } = await withTimeout(
              Promise.resolve(supabase.rpc('delete_own_account')),
              15000,
              '계정 삭제'
            );
            if (error) {
              console.log('[AuthStore] delete_own_account failed:', error);
              setActiveCloudSyncUser(user.id);
              return {
                success: false,
                message: '계정 삭제에 실패했습니다. 잠시 후 다시 시도해 주세요. 계속되면 문의해 주세요.',
              };
            }
            try {
              await supabase.auth.signOut({ scope: 'local' });
            } catch {}
          }

          set({ isLoggedIn: false, user: null, needsPasswordReset: false });
          await clearScopedData(user.id);
          return { success: true, message: '계정과 저장된 데이터가 삭제되었습니다.' };
        } catch (err: any) {
          return { success: false, message: err?.message || '계정 삭제 중 오류가 발생했습니다.' };
        } finally {
          set({ isLoading: false });
        }
      },

      updatePreferences: (prefs) => {
        set((state) => ({
          ...state,
          ...prefs,
        }));
      },
    }),
    {
      name: 'pinch-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        user: state.user,
        defaultBaseCurrency: state.defaultBaseCurrency,
        defaultTransportMode: state.defaultTransportMode,
      }),
    }
  )
);
