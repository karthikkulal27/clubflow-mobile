import React from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMemberPayments } from '../hooks/useMembers';
import { useTheme } from '../../../hooks/useTheme';
import { fontSize, fontWeight } from '../../../theme/typography';
import { spacing, radius } from '../../../theme/spacing';
import type { Payment } from '../../../types';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function statusColor(status: string, theme: any) {
  switch (status) {
    case 'PAID': return theme.success;
    case 'PENDING': return theme.warning;
    case 'WAIVED': return theme.primary;
    default: return theme.danger;
  }
}

function PaymentRow({ payment, theme }: { payment: Payment; theme: any }) {
  const isSpecial = !!payment.specialCollectionId;
  const color = statusColor(payment.status, theme);
  const monthLabel = MONTHS[(payment.month - 1) % 12];
  const paidAt = payment.paidAt
    ? new Date(payment.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <View style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.rowIcon, { backgroundColor: isSpecial ? '#fef3c7' : theme.primaryLight }]}>
        <Ionicons
          name={isSpecial ? 'gift-outline' : 'calendar-outline'}
          size={18}
          color={isSpecial ? '#f59e0b' : theme.primary}
        />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, { color: theme.text.primary }]}>
          {isSpecial ? (payment.specialCollection?.label ?? 'Special Charge') : `${monthLabel} ${payment.year}`}
        </Text>
        {paidAt && (
          <Text style={[styles.rowSub, { color: theme.text.tertiary }]}>Paid {paidAt}</Text>
        )}
        {!paidAt && payment.dueDate && (
          <Text style={[styles.rowSub, { color: theme.text.tertiary }]}>
            Due {new Date(payment.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
        )}
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.rowAmount, { color: theme.text.primary }]}>
          ₹{Number(payment.amount).toLocaleString('en-IN')}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: color + '22' }]}>
          <Text style={[styles.statusText, { color }]}>{payment.status}</Text>
        </View>
      </View>
    </View>
  );
}

interface MemberPaymentsScreenProps {
  userId: string;
  memberName: string;
  onBack: () => void;
}

export function MemberPaymentsScreen({ userId, memberName, onBack }: MemberPaymentsScreenProps) {
  const { theme } = useTheme();
  const { data: payments, isLoading } = useMemberPayments(userId);

  const regularDues = (payments ?? []).filter((p) => !p.specialCollectionId);
  const specialCharges = (payments ?? []).filter((p) => !!p.specialCollectionId);

  const paidTotal = (payments ?? [])
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>{memberName}</Text>
          <Text style={[styles.headerSub, { color: theme.text.tertiary }]}>Payment History</Text>
        </View>
        <View style={styles.headerBtn} />
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 60 }} size="large" color={theme.primary} />
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              {/* Summary */}
              <View style={[styles.summary, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryNum, { color: theme.text.primary }]}>{(payments ?? []).length}</Text>
                  <Text style={[styles.summaryLbl, { color: theme.text.secondary }]}>Total</Text>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: theme.borderSubtle }]} />
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryNum, { color: theme.success }]}>
                    {(payments ?? []).filter((p) => p.status === 'PAID').length}
                  </Text>
                  <Text style={[styles.summaryLbl, { color: theme.text.secondary }]}>Paid</Text>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: theme.borderSubtle }]} />
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryNum, { color: theme.warning }]}>
                    {(payments ?? []).filter((p) => p.status === 'PENDING').length}
                  </Text>
                  <Text style={[styles.summaryLbl, { color: theme.text.secondary }]}>Pending</Text>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: theme.borderSubtle }]} />
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryNum, { color: theme.primary }]}>
                    ₹{Number(paidTotal).toLocaleString('en-IN')}
                  </Text>
                  <Text style={[styles.summaryLbl, { color: theme.text.secondary }]}>Collected</Text>
                </View>
              </View>

              {specialCharges.length > 0 && (
                <Text style={[styles.sectionLabel, { color: theme.text.secondary }]}>Special Collections</Text>
              )}
              {specialCharges.map((p) => (
                <PaymentRow key={p.id} payment={p} theme={theme} />
              ))}

              {regularDues.length > 0 && (
                <Text style={[styles.sectionLabel, { color: theme.text.secondary }]}>Monthly Dues</Text>
              )}
            </View>
          }
          renderItem={({ item }) =>
            item.specialCollectionId ? null : <PaymentRow payment={item} theme={theme} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={48} color={theme.border} />
              <Text style={[styles.emptyText, { color: theme.text.tertiary }]}>No payments yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  headerSub: { fontSize: fontSize.xs },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: spacing[4], gap: spacing[3], paddingBottom: spacing[8] },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    borderRadius: radius['2xl'],
    borderWidth: 1,
    marginBottom: spacing[3],
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryNum: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
  summaryLbl: { fontSize: fontSize.xs },
  summaryDivider: { width: 1, height: 28 },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing[2],
    marginTop: spacing[2],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: radius.xl,
    borderWidth: 1,
    marginBottom: spacing[2],
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  rowSub: { fontSize: fontSize.xs, marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  rowAmount: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  statusBadge: { paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: radius.full },
  statusText: { fontSize: 10, fontWeight: fontWeight.bold },
  empty: { alignItems: 'center', gap: spacing[3], marginTop: spacing[10] },
  emptyText: { fontSize: fontSize.base },
});
