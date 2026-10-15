import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export interface AuthUser {
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
