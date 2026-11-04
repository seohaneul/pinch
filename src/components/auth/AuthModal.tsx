import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';
import { MapPin, X, Mail, Lock, User as UserIcon, ArrowRight } from '@/components/common/CustomIcons';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * 앱 진입 시 필수 로그인 화면 (Full-Screen Auth Gate)
 */
export const AuthGateScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');

  const { login, signup, isLoading } = useAuthStore();

  const handleSubmit = async () => {
    if (tab === 'login') {
      await login(email, password);
    } else {
      await signup(nickname, email, password);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[
        styles.gateScreen,
        { paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 20) },
      ]}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.gateScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Brand Bar */}
          <View style={styles.gateTopBar}>
            <View style={styles.brandBadge}>
              <MapPin size={18} color="#1B2A4A" fill="#1B2A4A" />
              <Text style={styles.brandBadgeText}>PINCHI</Text>
            </View>
          </View>

          <View style={styles.gateProgressTrack}>
            <View style={[styles.gateProgressFill, { width: tab === 'login' ? '50%' : '100%' }]} />
          </View>

          {/* Center Hero Title (Reference Image 3 Style) */}
          <View style={styles.gateHeroSection}>
            <Text style={styles.gateTitle}>
              {tab === 'login' ? '이메일로 로그인' : '새 계정 만들기'}
            </Text>
            <Text style={styles.gateSubtitle}>
              {tab === 'login'
                ? '로그인하고 나만의 첫 번째 여행 일정과\n흩어진 스팟들을 한곳에서 관리해보세요.'
                : '간단한 정보만 입력하면 바로 첫 여행을\n추가하고 동선 플래너를 시작할 수 있어요.'}
            </Text>
          </View>

          {/* Mode Switcher */}
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

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {tab === 'signup' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>닉네임</Text>
                <View style={styles.inputWrapper}>
                  <UserIcon size={17} color="#64748B" style={{ marginRight: 10 }} />
                  <TextInput
                    value={nickname}
                    onChangeText={setNickname}
                    placeholder="사용하실 닉네임 (예: 민지)"
                    placeholderTextColor="#9CA3AF"
                    style={styles.textInput}
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>이메일 주소</Text>
              <View style={styles.inputWrapper}>
                <Mail size={17} color="#64748B" style={{ marginRight: 10 }} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="example@naver.com"
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
                <Lock size={17} color="#64748B" style={{ marginRight: 10 }} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder={tab === 'signup' ? '비밀번호 (6자 이상)' : '비밀번호 입력'}
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  style={styles.textInput}
                />
              </View>
            </View>
          </View>

          <Text style={styles.legalNotice}>
            로그인 시 서비스 이용약관 및 개인정보 처리방침에 동의하는 것으로 간주합니다.
          </Text>

          <TouchableOpacity
            activeOpacity={0.88}
            disabled={isLoading}
            onPress={handleSubmit}
            style={[styles.primaryBtn, isLoading && { opacity: 0.7 }]}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.primaryBtnText}>
                  {tab === 'login' ? '로그인하고 시작하기' : '회원가입 완료하기'}
                </Text>
                <ArrowRight size={17} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export const AuthModal: React.FC<AuthModalProps> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');

  const { login, signup, isLoading } = useAuthStore();

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

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.overlay, { backgroundColor: 'rgba(17, 24, 39, 0.45)' }]}>
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.iconCircle}>
                  <MapPin size={18} color="#1B2A4A" fill="#1B2A4A" />
                </View>
                <Text style={styles.headerTitle}>
                  {tab === 'login' ? '핀치 로그인' : '핀치 회원가입'}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

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

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={isLoading}
              onPress={tab === 'login' ? handleLogin : handleSignup}
              style={[styles.primaryBtn, isLoading && { opacity: 0.7 }]}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>
                    {tab === 'login' ? '로그인하기' : '회원가입 완료하기'}
                  </Text>
                  <ArrowRight size={16} color="#FFF" style={{ marginLeft: 6 }} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  gateScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gateScrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    flexGrow: 1,
  },
  gateTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandBadgeText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1B2A4A',
    letterSpacing: 1,
  },
  gateProgressTrack: {
    height: 3,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 36,
    overflow: 'hidden',
  },
  gateProgressFill: {
    height: '100%',
    backgroundColor: '#1B2A4A',
  },
  gateHeroSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  gateTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.4,
  },
  gateSubtitle: {
    fontSize: 13.5,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  formContainer: {
    marginTop: 4,
    marginBottom: 18,
  },
  legalNotice: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  overlay: {
    flex: 1,
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
    backgroundColor: '#EEF2F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  tabTrack: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#1B2A4A',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  primaryBtn: {
    backgroundColor: '#1B2A4A',
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
  },
});
