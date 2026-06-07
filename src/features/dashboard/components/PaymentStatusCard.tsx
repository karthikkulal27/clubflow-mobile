import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { radius, shadow, spacing } from '../../../theme/spacing';
import { fontSize, fontWeight } from '../../../theme/typography';
import type { MemberDashboard } from '../../../types';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

interface PaymentStatusCardProps {
  currentDue: MemberDashboard['currentDue'];
  onPayNow: () => void;
}

export function PaymentStatusCard({ currentDue, onPayNow }: PaymentStatusCardProps) {
  const { theme } = useTheme();
  const isPaid = currentDue?.status === 'PAID';
  const isPending = currentDue?.status === 'PENDING';

  if (!currentDue) {
    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.successLight }]}>
        <Ionicons name="checkmark-circle" size={24} color={theme.success} />
        <Text style={[styles.allGoodText, { color: theme.success }]}>All dues cleared!</Text>
      </View>
    );
  }

  const monthLabel = `${MONTHS[currentDue.month - 1]} ${currentDue.year}`;

  return (
    <View
      style={[
        styles.card,
        shadow.sm,
        {
          backgroundColor: isPaid ? theme.successLight : theme.dangerLight,
          borderColor: isPaid ? theme.success : theme.danger,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={[styles.month, { color: isPaid ? theme.success : theme.danger }]}>
            {monthLabel} Due
          </Text>
          <Text style={[styles.amount, { color: theme.text.primary }]}>
            ₹{Number(currentDue.amount).toLocaleString('en-IN')}
          </Text>
          <View style={styles.statusRow}>
            <Ionicons
              name={isPaid ? 'checkmark-circle' : 'time-outline'}
              size={14}
              color={isPaid ? theme.success : theme.warning}
            />
            <Text style={[styles.status, { color: isPaid ? theme.success : theme.warning }]}>
              {isPaid ? `Paid on ${new Date(currentDue.paidAt!).toLocaleDateString('en-IN')}` : 'Payment Pending'}
            </Text>
          </View>
        </View>

        {isPending && (
          <TouchableOpacity
            style={[styles.payBtn, { backgroundColor: theme.primary }]}
            onPress={onPayNow}
            activeOpacity={0.85}
          >
            <Text style={styles.payBtnText}>Pay Now</Text>
            <Ionicons name="arrow-forward" size={14} color="#fff" />
          </TouchableOpacity>
        )}

        {isPaid && (
          <View style={[styles.paidBadge, { backgroundColor: theme.success }]}>
            <Ionicons name="checkmark" size={18} color="#fff" />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1.5,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  info: { gap: spacing[1] },
  month: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  amount: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  status: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2] + 2,
    borderRadius: radius.lg,
  },
  payBtnText: { color: '#fff', fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  paidBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allGoodText: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
});
