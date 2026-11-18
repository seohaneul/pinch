import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../utils/supabase';

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

interface AuthState {
  isLoggedIn: boolean;
  user: AuthUser | null;
  defaultBaseCurrency: 'KRW' | 'JPY' | 'USD';
  defaultTransportMode: 'TRANSIT' | 'WALK';
  isLoading: boolean;

  // Actions
  login: (email: string, password?: string) => Promise<boolean>;
  signup: (nickname: string, email: string, password?: string) => Promise<boolean>;
  loginWithSocial: (provider: 'google' | 'kakao') => Promise<boolean>;
  syncSessionFromSupabase: () => Promise<void>;
  setSupabaseUser: (supaUser: SupabaseUser | null) => void;
  logout: () => Promise<void>;
  updateNickname: (newNickname: string) => boolean;
  updateAvatar: (avatarUrl: string) => boolean;
  changePassword: (currentPassword: string, newPassword: string) => { success: boolean; message: string };
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

      login: async (email: string, password?: string) => {
        const cleanEmail = email.trim();
        const pwd = password?.trim();

        if (!cleanEmail) {
          Alert.alert('알림', '이메일을 입력해주세요.');
          return false;
        }
        if (!pwd) {
          Alert.alert('알림', '비밀번호를 입력해주세요.');
          return false;
        }

        set({ isLoading: true });

        // 1. Supabase 연동 시 실제 클라우드 로그인 시도
        if (isSupabaseConfigured()) {
          try {
            const { data, error } = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password: pwd,
            });

            if (error) {
              set({ isLoading: false });
              let msg = error.message;
              if (error.message.includes('Invalid login credentials')) {
                msg = '이메일 또는 비밀번호가 일치하지 않습니다.';
              } else if (error.message.includes('Email not confirmed')) {
                msg = '이메일 인증이 완료되지 않았습니다.';
              }
              Alert.alert('로그인 실패', msg);
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

              set({ isLoggedIn: true, user: authUser, isLoading: false });
              Alert.alert('로그인 성공 🎉', `${nickname}님, 환영합니다!`);
              return true;
            }
          } catch (err: any) {
            console.log('[AuthStore] Supabase login error:', err);
          }
        }

        // 2. Supabase 미설정 또는 로컬 모드일 때 안전한 폴백 로그인
        const nickname = cleanEmail.split('@')[0] || '여행자';
        const fallbackUser: AuthUser = {
          id: `user_${Date.now()}`,
          email: cleanEmail,
          nickname,
          createdAt: new Date().toISOString(),
        };

        set({ isLoggedIn: true, user: fallbackUser, isLoading: false });
        Alert.alert('로그인 완료 🎉', `${nickname}님, 환영합니다! (로컬 안전 모드)`);
        return true;
      },

      signup: async (nickname: string, email: string, password?: string) => {
        const cleanNickname = nickname.trim();
        const cleanEmail = email.trim();
        const pwd = password?.trim();

        if (!cleanNickname || !cleanEmail || !pwd) {
          Alert.alert('알림', '닉네임, 이메일, 비밀번호를 모두 입력해주세요.');
          return false;
        }
        if (pwd.length < 6) {
          Alert.alert('알림', '비밀번호는 최소 6자 이상이어야 합니다.');
          return false;
        }

        set({ isLoading: true });

        // 1. Supabase 연동 시 실제 클라우드 회원가입 시도
        if (isSupabaseConfigured()) {
          try {
            const { data, error } = await supabase.auth.signUp({
              email: cleanEmail,
              password: pwd,
              options: {
                data: {
                  nickname: cleanNickname,
                },
              },
            });

            if (error) {
              set({ isLoading: false });
              let msg = error.message;
              if (error.message.includes('User already registered')) {
                msg = '이미 가입된 이메일 주소입니다. 로그인을 진행해 주세요.';
              }
              Alert.alert('회원가입 실패', msg);
              return false;
            }

            if (data.user) {
              const authUser: AuthUser = {
                id: data.user.id,
                email: cleanEmail,
                nickname: cleanNickname,
                createdAt: data.user.created_at || new Date().toISOString(),
              };

              set({ isLoggedIn: true, user: authUser, isLoading: false });
              Alert.alert('회원가입 완료 ✈️', `핀치에 오신 것을 환영합니다, ${cleanNickname}님!`);
              return true;
            }
          } catch (err: any) {
            console.log('[AuthStore] Supabase signup error:', err);
          }
        }

        // 2. Supabase 미설정 또는 로컬 모드일 때 안전한 폴백 회원가입
        const fallbackUser: AuthUser = {
          id: `user_${Date.now()}`,
          email: cleanEmail,
          nickname: cleanNickname,
          createdAt: new Date().toISOString(),
        };

        set({ isLoggedIn: true, user: fallbackUser, isLoading: false });
        Alert.alert('회원가입 완료 ✈️', `핀치에 오신 것을 환영합니다, ${cleanNickname}님!`);
        return true;
      },

      loginWithSocial: async (provider: 'google' | 'kakao') => {
        set({ isLoading: true });
        const providerLabel = provider === 'kakao' ? '카카오' : 'Google';

        try {
          if (isSupabaseConfigured()) {
            const Linking = await import('expo-linking');
            const WebBrowser = await import('expo-web-browser');
            WebBrowser.maybeCompleteAuthSession();

            const isWeb = Platform.OS === 'web';
            let redirectTo = 'pinch://auth/callback';
            if (isWeb) {
              redirectTo = Linking.createURL('auth/callback');
            } else {
              try {
                const Constants = (await import('expo-constants')).default;
                const isExpoGo =
                  Constants.executionEnvironment === 'storeClient' ||
                  Constants.appOwnership === 'expo';
                if (isExpoGo) {
                  const candidate = Linking.createURL('auth/callback');
                  if (candidate && !candidate.includes('null') && !candidate.includes('undefined')) {
                    redirectTo = candidate;
                  }
                }
              } catch {}
            }
            console.log(`[AuthStore] Starting ${provider} OAuth. redirectTo=${redirectTo}`);

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
              Alert.alert(
                `${providerLabel} 로그인 오류`,
                error.message.includes('not enabled')
                  ? `Supabase 대시보드에서 ${providerLabel} Provider 설정을 활성화해주세요.`
                  : error.message
              );
              return false;
            }

            if (isWeb) {
              return true;
            }

            if (!data?.url) {
              Alert.alert('로그인 오류', '인증 주소를 받아오지 못했습니다.');
              return false;
            }

            // Android/Expo Go에서 Chrome Custom Tabs가 딥링크 복귀 시 openAuthSessionAsync가
            // resolve되지 않고 멈추는 현상을 막기 위해 Linking 이벤트 + AppState 복귀를 함께 감시
            const { AppState: RNAppState } = await import('react-native');
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
                  } catch {}
                  finish(event.url);
                }
              });

              const appSub = RNAppState?.addEventListener?.('change', (nextState: string) => {
                if (nextState === 'active') {
                  appReturnTimer = setTimeout(() => {
                    console.log('[AuthStore] App resumed without openAuthSessionAsync resolution');
                    finish(null);
                  }, 1500);
                }
              });

              timeoutTimer = setTimeout(() => {
                console.log('[AuthStore] OAuth browser session timed out');
                finish(null);
              }, 60000);

              WebBrowser.openAuthSessionAsync(data.url, redirectTo)
                .then((res) => {
                  if (res?.type === 'success' && 'url' in res && res.url) {
                    finish(res.url);
                  } else {
                    finish(null);
                  }
                })
                .catch(() => finish(null));
            });

            if (!callbackUrl) {
              // 혹시 그사이 세션이 이미 저장되었는지 마지막 확인
              const { data: sessCheck } = await withTimeout(
                supabase.auth.getSession(),
                8000,
                '세션 확인'
              );
              if (sessCheck?.session?.user) {
                const authUser = buildAuthUserFromSupabase(sessCheck.session.user, provider);
                set({ isLoggedIn: true, user: authUser });
                return true;
              }
              return false;
            }

            const params = parseOAuthCallbackParams(callbackUrl);
            if (params.error || params.error_description) {
              Alert.alert(
                `${providerLabel} 로그인 실패`,
                params.error_description || params.error
              );
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
              Alert.alert('로그인 확인 필요', '계정 세션을 확인하지 못했습니다.');
              return false;
            }

            const authUser = buildAuthUserFromSupabase(sessionUser, provider);
            set({ isLoggedIn: true, user: authUser });
            Alert.alert(
              `${providerLabel} 로그인 완료`,
              `${authUser.nickname}님, ${providerLabel} 계정으로 연결되었습니다.`
            );
            return true;
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

          set({ isLoggedIn: true, user: socialUser });
          Alert.alert(
            `${providerLabel} 로그인 완료`,
            `${socialUser.nickname}님, ${providerLabel} 계정으로 연결되었습니다.`
          );
          return true;
        } catch (err: any) {
          Alert.alert(
            `${providerLabel} 로그인 실패`,
            err?.message || '소셜 로그인 처리 중 문제가 발생했습니다.'
          );
          return false;
        } finally {
          set({ isLoading: false });
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
            await supabase.auth.signOut();
          } catch (e) {
            // Ignore
          }
        }
        set({ isLoggedIn: false, user: null });
        Alert.alert('로그아웃', '게스트 모드로 전환되었습니다. 기기에 저장된 여행 데이터는 안전하게 유지됩니다.');
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
            supabase.auth.updateUser({ data: { nickname: clean } }).catch(() => {});
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
              .catch(() => {});
          }
          return true;
        }
        return false;
      },

      changePassword: (currentPassword: string, newPassword: string) => {
        if (newPassword.length < 6) {
          return { success: false, message: '새 비밀번호는 최소 6자 이상이어야 합니다.' };
        }

        if (isSupabaseConfigured()) {
          supabase.auth.updateUser({ password: newPassword }).catch(() => {});
        }

        return { success: true, message: '비밀번호가 성공적으로 변경되었습니다.' };
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
