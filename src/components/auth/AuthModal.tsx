import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';
import { Sparkles, X, Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react-native';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');

  const { login, signup, continueAsGuest } = useAuthStore();

  const handleLogin = async () => {
    const success = await login(email, password);
    if (success) {
      setEmail('');
      setPassword('');
      onClose();
    }
  };

  const handleSignup = async () => {
    const success = await signup(nickname, email, password);
    if (success) {
      setNickname('');
      setEmail('');
      setPassword('');
      onClose();
    }
  };

  const handleGuest = () => {
    continueAsGuest();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.4)' }]}>
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.iconCircle}>
                  <Sparkles size={18} color="#FF6B6B" />
                </View>
                <Text style={styles.headerTitle}>
                  {tab === 'login' ? '핀치 로그인' : '핀치 간편 회원가입'}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Tab Toggle */}
            <View style={styles.tabTrack}>
              <TouchableOpacity
                onPress={() => setTab('login')}
                style={[styles.tabBtn, tab === 'login' && styles.tabBtnActive]}
              >
                <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>
                  로그인
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTab('signup')}
                style={[styles.tabBtn, tab === 'signup' && styles.tabBtnActive]}
              >
                <Text style={[styles.tabText, tab === 'signup' && styles.tabTextActive]}>
                  회원가입
                </Text>
              </TouchableOpacity>
            </View>

            {/* Inputs */}
            {tab === 'signup' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>닉네임</Text>
                <View style={styles.inputWrapper}>
                  <UserIcon size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
                  <TextInput
                    value={nickname}
                    onChangeText={setNickname}
                    placeholder="예: 민지"
                    placeholderTextColor="#9CA3AF"
                    style={styles.textInput}
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>이메일</Text>
              <View style={styles.inputWrapper}>
                <Mail size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@example.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.textInput}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>비밀번호</Text>
              <View style={styles.inputWrapper}>
                <Lock size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="비밀번호 입력"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  style={styles.textInput}
                />
              </View>
            </View>

            {/* Submit Action */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={tab === 'login' ? handleLogin : handleSignup}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnText}>
                {tab === 'login' ? '로그인하기' : '회원가입 완료하기'}
              </Text>
              <ArrowRight size={16} color="#FFF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>

            {/* Guest Mode Action */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleGuest}
              style={styles.guestBtn}
            >
              <Text style={styles.guestBtnText}>게스트로 계속 둘러보기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  tabTrack: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FF6B6B',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    padding: 0,
  },
  primaryBtn: {
    backgroundColor: '#FF6B6B',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  guestBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  guestBtnText: {
    color: '#8D99AE',
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
