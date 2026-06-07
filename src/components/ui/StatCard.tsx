import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { radius, shadow, spacing } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: number; label: string };
  style?: ViewStyle;
}

export function StatCard({ label, value, icon, iconColor, iconBg, trend, style }: StatCardProps) {
  const { theme } = useTheme();
  const ic = iconColor ?? theme.primary;
  const ibg = iconBg ?? theme.primaryLight;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.cardBorder },
        shadow.sm,
        style,
      ]}
    >
      <View style={[styles.iconWrapper, { backgroundColor: ibg }]}>
        <Ionicons name={icon} size={20} color={ic} />
      </View>
      <Text style={[styles.value, { color: theme.text.primary }]}>{value}</Text>
      <Text style={[styles.label, { color: theme.text.secondary }]}>{label}</Text>
      {trend && (
        <View style={styles.trend}>
          <Ionicons
            name={trend.value >= 0 ? 'trending-up' : 'trending-down'}
            size={12}
            color={trend.value >= 0 ? theme.success : theme.danger}
          />
          <Text style={[styles.trendText, { color: trend.value >= 0 ? theme.success : theme.danger }]}>
            {trend.label}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: spacing[4],
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing[2],
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[1],
  },
  value: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold },
  label: { fontSize: fontSize.xs },
  trend: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  trendText: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
});
