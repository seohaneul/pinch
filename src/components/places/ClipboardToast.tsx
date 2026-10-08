import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Sparkles, X, Link as LinkIcon } from 'lucide-react-native';
import { detectSnsPlatform } from '../../services/parserService';

interface ClipboardToastProps {
  url: string;
  onPinch: (url: string) => void;
  onDismiss: () => void;
}

export const ClipboardToast: React.FC<ClipboardToastProps> = ({
  url,
  onPinch,
  onDismiss,
}) => {
  const platform = detectSnsPlatform(url);
  const platformLabel =
    platform === 'instagram'
      ? '📸 Instagram'
      : platform === 'youtube'
      ? '🔴 YouTube'
      : platform === 'naver'
      ? '🟢 Naver Blog'
      : platform === 'tiktok'
      ? '🎵 TikTok'
      : '🔗 Link';

  return (
    <View className="mx-4 mb-3 bg-darkText p-3.5 rounded-2xl shadow-xl border border-gray-700 flex-row items-center justify-between">
      <View className="flex-row items-center flex-1 mr-3">
        <View className="w-9 h-9 rounded-xl bg-primary/20 items-center justify-center mr-3 border border-primary/40">
          <Sparkles size={18} color="#FF6B6B" />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center mb-0.5">
            <Text className="text-[10px] font-extrabold color-primary mr-1 uppercase">
              클립보드 감지!
            </Text>
            <Text className="text-[10px] text-gray-400 font-medium">({platformLabel})</Text>
          </View>
          <Text className="text-xs text-white font-medium" numberOfLines={1}>
            {url}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center">
        <TouchableOpacity
          onPress={() => onPinch(url)}
          className="bg-primary px-3 py-1.5 rounded-xl mr-2 flex-row items-center"
        >
          <Text className="text-xs font-bold text-white">핀치하기</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onDismiss} className="p-1">
          <X size={16} color="#A0AEC0" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
