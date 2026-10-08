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
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Button } from '../common/Button';
import { Sparkles, Link as LinkIcon, X, Clipboard as ClipboardIcon } from 'lucide-react-native';

interface AddPlaceModalProps {
  visible: boolean;
  onClose: () => void;
  onExtract: (url: string) => Promise<void>;
  loading: boolean;
}

export const AddPlaceModal: React.FC<AddPlaceModalProps> = ({
  visible,
  onClose,
  onExtract,
  loading,
}) => {
  const [urlInput, setUrlInput] = useState('');

  const handlePasteClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setUrlInput(text.trim());
      }
    } catch (e) {}
  };

  const handleSubmit = async () => {
    if (!urlInput.trim()) return;
    await onExtract(urlInput.trim());
    setUrlInput('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-surface rounded-t-3xl p-5 border-t border-borderLine">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-2xl bg-primary/10 items-center justify-center mr-2 border border-primary/20">
                  <Sparkles size={18} color="#FF6B6B" />
                </View>
                <Text className="text-lg font-bold text-darkText">SNS 링크에서 장소 핀치</Text>
              </View>
              <TouchableOpacity onPress={onClose} className="p-1">
                <X size={20} color="#8D99AE" />
              </TouchableOpacity>
            </View>

            <Text className="text-xs text-mutedText mb-3">
              인스타그램 릴스, 유튜브 숏츠, 블로그 링크를 입력하면 AI가 장소명, 주소, 카테고리를 자동 추출합니다.
            </Text>

            <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl p-2 mb-3">
              <LinkIcon size={16} color="#8D99AE" className="ml-2 mr-1" />
              <TextInput
                value={urlInput}
                onChangeText={setUrlInput}
                placeholder="https://www.instagram.com/p/..."
                placeholderTextColor="#A0AEC0"
                className="flex-1 px-2 py-1.5 text-sm text-darkText"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={handlePasteClipboard}
                className="bg-gray-200 px-2.5 py-1.5 rounded-xl flex-row items-center"
              >
                <ClipboardIcon size={12} color="#2B2D42" className="mr-1" />
                <Text className="text-xs font-bold text-darkText">붙여넣기</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row mt-2">
              <Button
                title="취소"
                onPress={onClose}
                variant="ghost"
                className="flex-1 mr-2"
              />
              <Button
                title={loading ? 'AI 분석 중...' : '핫플 핀치하기'}
                onPress={handleSubmit}
                loading={loading}
                disabled={!urlInput.trim()}
                icon={<Sparkles size={16} color="#FFF" />}
                className="flex-1 ml-2"
              />
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
