import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  className = '',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary border-transparent active:bg-primary-dark';
      case 'secondary':
        return 'bg-secondary border-transparent active:bg-secondary-dark';
      case 'outline':
        return 'bg-surface border-2 border-primary active:bg-primary-soft';
      case 'ghost':
        return 'bg-transparent border-transparent active:bg-gray-100';
      default:
        return 'bg-primary';
    }
  };

  const getTextStyles = () => {
    switch (variant) {
      case 'primary':
      case 'secondary':
        return 'text-white font-bold';
      case 'outline':
      case 'ghost':
        return 'text-primary font-bold';
      default:
        return 'text-white font-bold';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'py-2 px-3 rounded-xl';
      case 'md':
        return 'py-3.5 px-5 rounded-2xl';
      case 'lg':
        return 'py-4 px-6 rounded-2xl';
      default:
        return 'py-3.5 px-5 rounded-2xl';
    }
  };

  const getTextSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'md':
        return 'text-sm';
      case 'lg':
        return 'text-base';
      default:
        return 'text-sm';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      className={`flex-row items-center justify-center border shadow-sm ${getVariantStyles()} ${getSizeStyles()} ${
        disabled ? 'opacity-50' : 'opacity-100'
      } ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? '#FF6B6B' : '#FFFFFF'} size="small" />
      ) : (
        <View className="flex-row items-center justify-center">
          {icon && <View className="mr-2">{icon}</View>}
          <Text className={`${getTextStyles()} ${getTextSizeStyles()}`}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
