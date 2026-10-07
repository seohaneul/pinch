import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MapPin, Sparkles } from 'lucide-react-native';

interface HeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  showLogo?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  rightAction,
  showLogo = true,
}) => {
  return (
    <View className="px-5 pt-3 pb-4 bg-surface border-b border-borderLine flex-row items-center justify-between">
      <View className="flex-row items-center flex-1">
        {showLogo && (
          <View className="w-10 h-10 rounded-2xl bg-primary/10 items-center justify-center mr-3 border border-primary/20">
            <MapPin size={22} color="#FF6B6B" fill="#FF6B6B" />
          </View>
        )}
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-xl font-bold text-darkText tracking-tight mr-2">
              {title}
            </Text>
            {showLogo && (
              <View className="bg-primary/15 px-2 py-0.5 rounded-full flex-row items-center">
                <Sparkles size={11} color="#FF6B6B" />
                <Text className="text-[10px] font-bold color-primary ml-1">Pinch</Text>
              </View>
            )}
          </View>
          {subtitle && (
            <Text className="text-xs text-mutedText mt-0.5 font-medium" numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightAction && <View className="ml-3">{rightAction}</View>}
    </View>
  );
};
