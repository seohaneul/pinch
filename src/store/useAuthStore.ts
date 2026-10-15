import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

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

  // Actions
  login: (email: string, password?: string) => Promise<boolean>;
  signup: (nickname: string, email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  continueAsGuest: () => void;
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

      login: async (email: string, password?: string) => {
        const cleanEmail = email.trim();
        if (!cleanEmail) {
          Alert.alert('알림', '이메일을 입력해주세요.');
          return false;
        }

        const nickname = cleanEmail.split('@')[0] || '여행자';
        const user: AuthUser = {
          id: `user_${Date.now()}`,
          email: cleanEmail,
          nickname,
          createdAt: new Date().toISOString(),
        };

        set({ isLoggedIn: true, user });
        Alert.alert('로그인 성공 🎉', `${nickname}님 환영합니다!`);
        return true;
      },

      signup: async (nickname: string, email: string, password?: string) => {
        const cleanNickname = nickname.trim();
        const cleanEmail = email.trim();

        if (!cleanNickname || !cleanEmail) {
          Alert.alert('알림', '닉네임과 이메일을 모두 입력해주세요.');
          return false;
        }

        const user: AuthUser = {
          id: `user_${Date.now()}`,
          email: cleanEmail,
          nickname: cleanNickname,
          createdAt: new Date().toISOString(),
        };

        set({ isLoggedIn: true, user });
        Alert.alert('회원가입 완료 ✈️', `핀치에 오신 것을 환영합니다, ${cleanNickname}님!`);
        return true;
      },

      logout: () => {
        set({ isLoggedIn: false, user: null });
        Alert.alert('로그아웃', '게스트 모드로 전환되었습니다. 기기에 저장된 여행 데이터는 유지됩니다.');
      },

      continueAsGuest: () => {
        set({ isLoggedIn: false, user: null });
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
            user: {
              ...currentUser,
              nickname: clean,
            },
          });
        } else {
          // If guest, create guest user object with custom nickname
          set({
            user: {
              id: 'guest_user',
              email: 'guest@pinch-travel.app',
              nickname: clean,
              createdAt: new Date().toISOString(),
            },
          });
        }

        Alert.alert('알림', '닉네임이 변경되었습니다! ✨');
        return true;
      },

      changePassword: (currentPassword: string, newPassword: string) => {
        if (!currentPassword || !newPassword) {
          return { success: false, message: '모든 비밀번호 항목을 입력해주세요.' };
        }

        if (newPassword.length < 6) {
          return { success: false, message: '새 비밀번호는 최소 6자 이상이어야 합니다.' };
        }

        // Auth simulation: successfully update password
        Alert.alert('비밀번호 변경 완료 🔒', '비밀번호가 안전하게 변경되었습니다.');
        return { success: true, message: '비밀번호가 안전하게 변경되었습니다.' };
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
