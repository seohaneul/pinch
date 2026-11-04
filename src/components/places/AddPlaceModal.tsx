import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import {
  Sparkles,
  Link as LinkIcon,
  X,
  Clipboard as ClipboardIcon,
  Search,
} from '@/components/common/CustomIcons';
import { PlaceSearchModal } from './PlaceSearchModal';

interface AddPlaceModalProps {
  visible: boolean;
  onClose: () => void;
  onExtract: (url: string) => Promise<void>;
  loading: boolean;
  defaultTab?: 'search' | 'link';
  initialSearchQuery?: string;
}

const SAMPLE_LINKS = [
  { label: '인스타 도쿄 핫플', url: 'https://www.instagram.com/p/fuglen_tokyo_coffee' },
  { label: '숏츠 교토 신사', url: 'https://youtube.com/shorts/kyoto_fushimi_inari' },
  { label: '네이버 하카타 라멘', url: 'https://blog.naver.com/ichiran_ramen_fukuoka' },
];

export const AddPlaceModal: React.FC<AddPlaceModalProps> = ({
  visible,
  onClose,
  onExtract,
  loading,
  defaultTab = 'search',
  initialSearchQuery = '',
}) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'search' | 'link'>(defaultTab);
  const [urlInput, setUrlInput] = useState('');

  useEffect(() => {
    if (visible) {
      setActiveTab(defaultTab);
      setUrlInput('');
    }
  }, [visible, defaultTab]);

  // 장소 검색 탭일 때는 팝업이 아닌 레퍼런스 5번 스타일 풀스크린 지도 검색 화면을 바로 렌더링
  if (activeTab === 'search') {
    return (
      <PlaceSearchModal
        visible={visible}
        onClose={onClose}
        initialQuery={initialSearchQuery}
      />
    );
  }

  const handlePasteClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setUrlInput(text.trim());
      }
    } catch {}
  };

  const handleSubmitLink = async () => {
    if (!urlInput.trim() || loading) return;
    await onExtract(urlInput.trim());
    setUrlInput('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent={false} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: Math.max(insets.top, 14) }]}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <X size={24} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('search')}
            style={styles.switchMapBtn}
            activeOpacity={0.8}
          >
            <Search size={14} color="#1B2A4A" />
            <Text style={styles.switchMapBtnText}>지도에서 위치 검색</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.contentContainer}
        >
          <Text style={styles.title}>SNS 링크로 장소 추가</Text>
          <Text style={styles.subtitle}>
            인스타그램 릴스, 유튜브 숏츠, 네이버 블로그 링크를 붙여넣으면{'\n'}장소명과 주소를 자동으로 추출합니다.
          </Text>

          <View style={styles.inputContainer}>
            <LinkIcon size={18} color="#8D99AE" style={{ marginRight: 10 }} />
            <TextInput
              value={urlInput}
              onChangeText={setUrlInput}
              placeholder="https://www.instagram.com/p/..."
              placeholderTextColor="#9CA3AF"
              style={styles.textInput}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <TouchableOpacity
              onPress={handlePasteClipboard}
              activeOpacity={0.75}
              style={styles.pasteBtn}
            >
              <ClipboardIcon size={13} color="#1B2A4A" style={{ marginRight: 4 }} />
              <Text style={styles.pasteBtnText}>붙여넣기</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sampleSection}>
            <Text style={styles.sampleLabel}>예시 링크 테스트</Text>
            <View style={styles.sampleChipsRow}>
              {SAMPLE_LINKS.map((sample) => (
                <TouchableOpacity
                  key={sample.label}
                  activeOpacity={0.75}
                  onPress={() => setUrlInput(sample.url)}
                  style={[
                    styles.sampleChip,
                    urlInput === sample.url && styles.sampleChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.sampleChipText,
                      urlInput === sample.url && styles.sampleChipTextActive,
                    ]}
                  >
                    {sample.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#1B2A4A" style={{ marginRight: 8 }} />
              <Text style={styles.loadingText}>링크에서 장소 정보를 분석하고 있습니다...</Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={handleSubmitLink}
            disabled={!urlInput.trim() || loading}
            activeOpacity={0.88}
            style={[
              styles.submitBtn,
              (!urlInput.trim() || loading) && styles.submitBtnDisabled,
            ]}
          >
            <Sparkles size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.submitBtnText}>
              {loading ? '장소 추출 중...' : '이 링크에서 장소 추출하기'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EEF2F8',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
  },
  switchMapBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1B2A4A',
  },
  contentContainer: {
    paddingHorizontal: 22,
    paddingTop: 32,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13.5,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 20,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  pasteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pasteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1B2A4A',
  },
  sampleSection: {
    marginBottom: 28,
  },
  sampleLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  sampleChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sampleChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  sampleChipActive: {
    backgroundColor: '#1B2A4A',
  },
  sampleChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  sampleChipTextActive: {
    color: '#FFFFFF',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginBottom: 14,
    backgroundColor: '#EEF2F8',
    borderRadius: 10,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1B2A4A',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 8,
    backgroundColor: '#1B2A4A',
  },
  submitBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
