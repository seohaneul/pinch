import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  textClassName?: string;
  fullWidth?: boolean;
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
  style,
  textStyle,
  textClassName = '',
  fullWidth = false,
}) => {
  // Pure reliable styles matching design specification:
  // variant="primary": Pinch Coral (#FF6B6B active: #FA5252, white text)
  // variant="secondary": Fresh Mint (#4ECDC4 active: #38B2AC, white text)
  // variant="outline": Transparent border (#E5E7EB, text #374151, bg-white)
  // size="md": py-3.5 px-5 rounded-2xl text-base font-semibold
  // size="sm": py-2 px-3.5 rounded-xl text-sm font-medium
  // size="lg": py-4 px-6 rounded-2xl text-lg font-bold

  const buttonStyle: ViewStyle = {
    ...styles.baseButton,
    ...(variant === 'primary' ? styles.primaryButton : {}),
    ...(variant === 'secondary' ? styles.secondaryButton : {}),
    ...(variant === 'outline' ? styles.outlineButton : {}),
    ...(variant === 'ghost' ? styles.ghostButton : {}),
    ...(size === 'sm' ? styles.smButton : {}),
    ...(size === 'md' ? styles.mdButton : {}),
    ...(size === 'lg' ? styles.lgButton : {}),
    ...(disabled ? styles.disabledButton : {}),
    ...(fullWidth ? styles.fullWidth : {}),
  };

  const labelStyle: TextStyle = {
    ...styles.baseText,
    ...(variant === 'primary' || variant === 'secondary' ? styles.lightText : {}),
    ...(variant === 'outline' ? styles.outlineText : {}),
    ...(variant === 'ghost' ? styles.ghostText : {}),
    ...(size === 'sm' ? styles.smText : {}),
    ...(size === 'md' ? styles.mdText : {}),
    ...(size === 'lg' ? styles.lgText : {}),
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
      style={[buttonStyle, style]}
      className={className}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? '#FF6B6B' : '#FFFFFF'}
          size="small"
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text style={[labelStyle, textStyle]} className={textClassName}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    marginRight: 6,
  },
  fullWidth: {
    width: '100%',
  },
  // Variants
  primaryButton: {
    backgroundColor: '#FF6B6B', // Pinch Coral
    borderWidth: 0,
    elevation: 2,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
  },
  secondaryButton: {
    backgroundColor: '#4ECDC4', // Fresh Mint
    borderWidth: 0,
    elevation: 2,
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
  },
  outlineButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ghostButton: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  // Sizes
  smButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  mdButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  lgButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 18,
  },
  disabledButton: {
    opacity: 0.5,
  },
  // Text Styles
  baseText: {
    textAlign: 'center',
  },
  lightText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  outlineText: {
    color: '#374151',
    fontWeight: '600',
  },
  ghostText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  smText: {
    fontSize: 13,
    fontWeight: '600',
  },
  mdText: {
    fontSize: 15,
    fontWeight: '700',
  },
  lgText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
