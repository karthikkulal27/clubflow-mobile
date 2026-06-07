import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { fontSize, fontWeight } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'primary' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export function Badge({ label, variant = 'neutral', style }: BadgeProps) {
  const { theme } = useTheme();

  const configs: Record<BadgeVariant, { bg: string; text: string }> = {
    success: { bg: theme.successLight, text: theme.success },
    warning: { bg: theme.warningLight, text: theme.warning },
    danger: { bg: theme.dangerLight, text: theme.danger },
    primary: { bg: theme.primaryLight, text: theme.primary },
    neutral: { bg: theme.border, text: theme.text.secondary },
  };

  const config = configs[variant];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, style]}>
      <Text style={[styles.text, { color: config.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing[2] + 2,
    paddingVertical: spacing[1],
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  text: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
});
