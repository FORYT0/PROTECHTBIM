import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import {COLORS, RADIUS, SPACING} from '../utils/theme';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  style?: ViewStyle;
  emoji?: string;
}

export function AppButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
  emoji,
}: Props) {
  const bg = {
    primary:   COLORS.blue,
    secondary: COLORS.card,
    danger:    COLORS.red,
    ghost:     'transparent',
  }[variant];

  const textColor = variant === 'ghost' ? COLORS.blue : '#fff';
  const borderColor = variant === 'secondary' ? COLORS.border : 'transparent';

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        {backgroundColor: bg, borderColor, opacity: disabled || loading ? 0.55 : 1},
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}>
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text style={[styles.text, {color: textColor}]}>
          {emoji ? `${emoji}  ` : ''}{label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius:    RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderWidth:     1,
    alignItems:      'center',
    justifyContent:  'center',
    flexDirection:   'row',
    minHeight:       48,
  },
  text: {fontSize: 15, fontWeight: '600'},
});
