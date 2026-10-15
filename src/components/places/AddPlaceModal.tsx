import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { Sparkles, Link as LinkIcon, X, Clipboard as ClipboardIcon, Check, MapPin } from 'lucide-react-native';

interface AddPlaceModalProps {
  visible: boolean;
  onClose: () => void;
  onExtract: (url: string) => Promise<void>;
  loading: boolean;
}

const SAMPLE_LINKS = [
  { label: '📸 인스타 도쿄 핫플', url: 'https://www.instagram.com/p/fuglen_tokyo_coffee' },
  { label: '🎥 숏츠 교토 신사', url: 'https://youtube.com/shorts/kyoto_fushimi_inari' },
  { label: '🍜 네이버 하카타 라멘', url: 'https://blog.naver.com/ichiran_ramen_fukuoka' },
];

export const AddPlaceModal: React.FC<AddPlaceModalProps> = ({
  visible,
  onClose,
  onExtract,
  loading,
}) => {
  const insets = useSafeAreaInsets();
  const [urlInput, setUrlInput] = useState('');

  const handlePasteClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text && text.trim().startsWith('http')) {
        setUrlInput(text.trim());
      } else if (text) {
        setUrlInput(text.trim());
      }
    } catch (e) {}
  };

  const handleSelectSample = (sampleUrl: string) => {
    setUrlInput(sampleUrl);
  };

  const handleSubmit = async () => {
    if (!urlInput.trim() || loading) return;
    await onExtract(urlInput.trim());
    setUrlInput('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.backdrop}>
          <View
            style={[
              styles.sheetContainer,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.iconCircle}>
                  <Sparkles size={18} color="#FF6B6B" />
                </View>
                <Text style={styles.headerTitle}>SNS 링크에서 장소 핀치</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                <X size={18} color="#8D99AE" />
              </TouchableOpacity>
            </View>

            <Text style={styles.subtitle}>
              인스타그램 릴스, 유튜브 숏츠, 네이버 지도/블로그 링크를 붙여넣으면 AI가 장소명, 주소, 위치 좌표를 자동으로 추출합니다.
            </Text>

            {/* Quick Sample Chips */}
            <View style={styles.sampleChipsRow}>
              <Text style={styles.sampleLabel}>추천 예시:</Text>
              {SAMPLE_LINKS.map((sample) => (
                <TouchableOpacity
                  key={sample.label}
                  activeOpacity={0.7}
                  onPress={() => handleSelectSample(sample.url)}
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

            {/* URL Input Box */}
            <View style={styles.inputContainer}>
              <LinkIcon size={16} color="#8D99AE" style={{ marginRight: 8 }} />
              <TextInput
                value={urlInput}
                onChangeText={setUrlInput}
                placeholder="https://www.instagram.com/p/..."
                placeholderTextColor="#A0AEC0"
                style={styles.textInput}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <TouchableOpacity
                onPress={handlePasteClipboard}
                activeOpacity={0.7}
                style={styles.pasteBtn}
              >
                <ClipboardIcon size={12} color="#1E293B" style={{ marginRight: 4 }} />
                <Text style={styles.pasteBtnText}>붙여넣기</Text>
              </TouchableOpacity>
            </View>

            {/* Loading Indicator or Buttons */}
            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#FF6B6B" style={{ marginRight: 8 }} />
                <Text style={styles.loadingText}>
                  AI가 링크에서 메타데이터와 위치 좌표를 분석 중입니다...
                </Text>
              </View>
            ) : null}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                style={styles.cancelBtn}
                disabled={loading}
              >
                <Text style={styles.cancelBtnText}>취소</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!urlInput.trim() || loading}
                activeOpacity={0.85}
                style={[
                  styles.submitBtn,
                  (!urlInput.trim() || loading) && styles.submitBtnDisabled,
                ]}
              >
                <Sparkles size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.submitBtnText}>
                  {loading ? '장소 추출 중...' : '핫플 핀치하기 🤏'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
  },
  sampleChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  sampleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  sampleChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  sampleChipActive: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FF6B6B',
  },
  sampleChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  sampleChipTextActive: {
    color: '#FF6B6B',
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '500',
    padding: 0,
  },
  pasteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: 6,
  },
  pasteBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  submitBtnDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
