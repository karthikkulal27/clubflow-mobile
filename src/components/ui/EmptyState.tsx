import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { fontSize, fontWeight } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = 'cube-outline', title, subtitle, action }: EmptyStateProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrapper, { backgroundColor: theme.border }]}>
        <Ionicons name={icon} size={32} color={theme.text.tertiary} />
      </View>
      <Text style={[styles.title, { color: theme.text.primary }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: theme.text.secondary }]}>{subtitle}</Text>
      )}
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing[10] },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, textAlign: 'center' },
  subtitle: { fontSize: fontSize.sm, textAlign: 'center', marginTop: spacing[2], paddingHorizontal: spacing[8] },
  action: { marginTop: spacing[5] },
});
