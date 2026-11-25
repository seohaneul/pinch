import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';

export type LegalTab = 'terms' | 'privacy';

interface Props {
  visible: boolean;
  initialTab?: LegalTab;
  onClose: () => void;
}

const TERMS_SECTIONS = [
  {
    title: '1. 서비스 목적',
    body: 'Pinch는 여행 일정 계획, 장소 보관함, 참고 링크 정리 및 여행 가계부(지출·정산) 관리를 지원하는 개인 여행 플래너 서비스입니다.',
  },
  {
    title: '2. 계정 및 데이터 관리',
    body: '이용자는 본인 계정으로 로그인하여 기기에 데이터를 저장하고 클라우드 자동 동기화 기능을 이용할 수 있습니다. 계정 비밀번호 및 로그인 정보 관리 책임은 이용자 본인에게 있습니다.',
  },
  {
    title: '3. 외부 서비스 및 AI 기능 고지',
    body: '장소 검색·지도 정보는 Google Maps / Places API를 통해 제공되며, AI 추천·일정 생성 기능은 Gemini API를 활용합니다. 외부 서비스의 사정이나 네트워크 환경에 따라 응답이 지연되거나 결과가 실제 현장 정보와 다를 수 있으므로 중요한 방문 전에는 공식 정보를 확인해 주세요.',
  },
  {
    title: '4. 서비스 변경 및 종료',
    body: '서비스 품질 개선을 위해 기능이 추가되거나 변경될 수 있으며, 이용자는 언제든지 프로필 화면의 데이터 내보내기(JSON) 기능을 통해 본인의 여행 데이터를 백업할 수 있습니다.',
  },
  {
    title: '5. 면책 사항',
    body: '이용자가 입력한 정보의 정확성, 환율·예약·영업시간 변동 등 외부 요인으로 인해 발생한 손해에 대해서는 앱 제공자가 책임을 지지 않습니다.',
  },
];

const PRIVACY_SECTIONS = [
  {
    title: '1. 수집 및 처리하는 정보',
    body: '회원가입·로그인 시 이메일 주소, 닉네임, 프로필 아바타 설정, 소셜 로그인 식별자(Google/Kakao 연동 시)를 처리합니다. 또한 서비스 이용 과정에서 이용자가 직접 등록한 여행 일정, 저장 장소, 링크, 지출 내역이 저장됩니다.',
  },
  {
    title: '2. 정보 이용 목적',
    body: '수집된 정보는 본인 확인, 계정별 데이터 분리 저장, 기기 간 클라우드 자동 동기화, 비밀번호 재설정 및 고객 지원 목적에만 사용됩니다.',
  },
  {
    title: '3. 보관 기간 및 파기',
    body: '이용자의 데이터는 계정을 유지하는 동안 보관됩니다. 프로필의 "회원 탈퇴 (계정 삭제)"를 실행하면 계정 정보와 클라우드 백업 데이터, 현재 기기의 로컬 데이터가 즉시 삭제됩니다.',
  },
  {
    title: '4. 제3자 서비스 연동',
    body: '계정 인증 및 클라우드 백업 저장을 위해 Supabase를 사용하며, 장소 검색 및 AI 일정 추천 요청 시 검색어나 프롬프트가 Google Places / Gemini API로 전송될 수 있습니다. 그 외 제3자에게 개인정보를 판매하거나 무단 제공하지 않습니다.',
  },
  {
    title: '5. 이용자의 권리',
    body: '이용자는 언제든지 프로필 화면에서 닉네임·프로필 사진을 수정하고, JSON 형식으로 데이터를 내보내거나 가져올 수 있으며, 전체 데이터 초기화 또는 회원 탈퇴를 진행할 수 있습니다.',
  },
];

export const LegalModal: React.FC<Props> = ({
  visible,
  initialTab = 'terms',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
    }
  }, [visible, initialTab]);

  const sections = activeTab === 'terms' ? TERMS_SECTIONS : PRIVACY_SECTIONS;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>약관 및 정책</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.tabRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setActiveTab('terms')}
              style={[styles.tabBtn, activeTab === 'terms' && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, activeTab === 'terms' && styles.tabTextActive]}>
                이용약관
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setActiveTab('privacy')}
              style={[styles.tabBtn, activeTab === 'privacy' && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, activeTab === 'privacy' && styles.tabTextActive]}>
                개인정보처리방침
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {sections.map((section) => (
              <View key={section.title} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionBody}>{section.body}</Text>
              </View>
            ))}
            <Text style={styles.updatedAt}>시행일: 2026년 11월</Text>
          </ScrollView>

          <TouchableOpacity activeOpacity={0.85} onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>확인</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    maxHeight: '82%',
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    gap: 6,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#1B2A4A',
    fontWeight: '700',
  },
  scroll: {
    maxHeight: 360,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sectionBody: {
    fontSize: 13,
    lineHeight: 19,
    color: '#4B5563',
  },
  updatedAt: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    marginBottom: 8,
  },
  closeBtn: {
    marginTop: 14,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#1B2A4A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
