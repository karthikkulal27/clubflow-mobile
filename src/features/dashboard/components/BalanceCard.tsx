import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../hooks/useTheme';
import { fontSize, fontWeight } from '../../../theme/typography';
import { radius, spacing } from '../../../theme/spacing';

interface BalanceCardProps {
  totalCollection: number;
  totalExpenses: number;
  availableBalance: number;
}

export function BalanceCard({ totalCollection, totalExpenses, availableBalance }: BalanceCardProps) {
  const { theme } = useTheme();
  const isNegative = availableBalance < 0;

  return (
    <LinearGradient
      colors={isNegative ? ['#b91c1c', '#dc2626', '#ef4444'] : ['#1d4ed8', '#2563eb', '#3b82f6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <View>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>
            ₹{(availableBalance ?? 0).toLocaleString('en-IN')}
          </Text>
          {isNegative && (
            <View style={styles.warningRow}>
              <Ionicons name="warning-outline" size={12} color="rgba(255,255,255,0.9)" />
              <Text style={styles.warningText}>Expenses exceed collections</Text>
            </View>
          )}
        </View>
        <View style={styles.iconWrapper}>
          <Ionicons name="wallet" size={24} color="rgba(255,255,255,0.9)" />
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />

      <View style={styles.bottomRow}>
        <View style={styles.statBlock}>
          <View style={styles.statLabel}>
            <Ionicons name="arrow-down-circle-outline" size={14} color="rgba(255,255,255,0.7)" />
            <Text style={styles.statLabelText}>Collection</Text>
          </View>
          <Text style={styles.statValue}>₹{(totalCollection ?? 0).toLocaleString('en-IN')}</Text>
        </View>

        <View style={[styles.statDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />

        <View style={styles.statBlock}>
          <View style={styles.statLabel}>
            <Ionicons name="arrow-up-circle-outline" size={14} color="rgba(255,255,255,0.7)" />
            <Text style={styles.statLabelText}>Expenses</Text>
          </View>
          <Text style={styles.statValue}>₹{(totalExpenses ?? 0).toLocaleString('en-IN')}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius['2xl'],
    padding: spacing[5],
    marginBottom: spacing[5],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[4],
  },
  balanceLabel: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.75)', marginBottom: spacing[1] },
  balanceAmount: { fontSize: 36, fontWeight: fontWeight.bold, color: '#ffffff' },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: 1, marginBottom: spacing[4] },
  bottomRow: { flexDirection: 'row', alignItems: 'center' },
  statBlock: { flex: 1, gap: spacing[1] },
  statLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  statLabelText: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.7)' },
  statValue: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: '#ffffff' },
  statDivider: { width: 1, height: 36, marginHorizontal: spacing[4] },
  warningRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing[1] },
  warningText: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.9)' },
});
