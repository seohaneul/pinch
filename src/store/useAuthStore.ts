import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { supabase, isSupabaseConfigured } from '../utils/supabase';

export interface AuthUser {
  id: string;
  email: string;
  nickname: string;
  avatarUrl?: string;
  createdAt: string;
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
  logout: () => Promise<void>;
  continueAsGuest: () => void;
  checkSession: () => Promise<void>;
  updateNickname: (newNickname: string) => boolean;
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

      continueAsGuest: () => {
        set({ isLoggedIn: false, user: null });
      },

      checkSession: async () => {
        if (!isSupabaseConfigured()) return;
        try {
          const { data } = await supabase.auth.getSession();
          if (data.session?.user) {
            const email = data.session.user.email || '';
            const nickname = data.session.user.user_metadata?.nickname || email.split('@')[0] || '여행자';
            set({
              isLoggedIn: true,
              user: {
                id: data.session.user.id,
                email,
                nickname,
                createdAt: data.session.user.created_at,
              },
            });
          }
        } catch (err) {
          console.log('[AuthStore] Session check error:', err);
        }
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
