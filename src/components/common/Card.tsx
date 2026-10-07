import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, onPress, className = '' }) => {
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        className={`bg-surface rounded-3xl p-4 border border-borderLine shadow-sm ${className}`}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View className={`bg-surface rounded-3xl p-4 border border-borderLine shadow-sm ${className}`}>
      {children}
    </View>
  );
};

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'gray';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'primary', icon }) => {
  const getStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'secondary':
        return 'bg-secondary/15 text-secondary-dark border-secondary/30';
      case 'accent':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'gray':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  return (
    <View className={`px-2.5 py-1 rounded-full border flex-row items-center ${getStyles()}`}>
      {icon && <View className="mr-1">{icon}</View>}
      <Text className="text-[11px] font-semibold">{label}</Text>
    </View>
  );
};

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionButton?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionButton,
}) => {
  return (
    <View className="items-center justify-center py-12 px-6">
      <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4 border border-primary/20">
        {icon}
      </View>
      <Text className="text-lg font-bold text-darkText mb-1 text-center">{title}</Text>
      <Text className="text-sm text-mutedText text-center mb-6 max-w-[260px] leading-5">
        {description}
      </Text>
      {actionButton}
    </View>
  );
};
