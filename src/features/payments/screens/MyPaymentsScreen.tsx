import React, { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useMyPayments, usePayNow } from '../hooks/usePayments';
import { useTheme } from '../../../hooks/useTheme';
import { fontSize, fontWeight } from '../../../theme/typography';
import { spacing, radius } from '../../../theme/spacing';
import type { Payment } from '../../../types';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

type RowState = 'paid' | 'dueNow' | 'overdue' | 'upcoming' | 'notDue';

interface MonthRow {
  month: number;
  year: number;
  payment?: Payment;
  state: RowState;
}

function rowState(month: number, year: number, payment: Payment | undefined, currentMonth: number, currentYear: number): RowState {
  if (!payment) return 'notDue';
  if (payment.status === 'PAID') return 'paid';
  if (month === currentMonth && year === currentYear) return 'dueNow';
  return year < currentYear || (year === currentYear && month < currentMonth) ? 'overdue' : 'upcoming';
}

function buildYearRows(year: number, currentMonth: number, currentYear: number, payments: Payment[]): MonthRow[] {
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const payment = payments.find((p) => p.month === month && p.year === year);
    return { month, year, payment, state: rowState(month, year, payment, currentMonth, currentYear) };
  });
}

const STATE_LABELS: Record<RowState, { label: string; variant: 'success' | 'warning' | 'danger' | 'primary' | 'neutral' }> = {
  paid: { label: 'Paid', variant: 'success' },
  dueNow: { label: 'Due now', variant: 'warning' },
  overdue: { label: 'Overdue', variant: 'danger' },
  upcoming: { label: 'Upcoming', variant: 'primary' },
  notDue: { label: 'Not due yet', variant: 'neutral' },
};

function MonthCard({ row, blockedByCurrent, onPay, isPaying }: { row: MonthRow; blockedByCurrent: boolean; onPay: (id: string) => void; isPaying?: boolean }) {
  const { theme } = useTheme();
  const { month, year, payment, state } = row;
  const { label, variant } = STATE_LABELS[state];

  const isLocked = state === 'upcoming' && blockedByCurrent;
  const showPayBtn = (state === 'dueNow' || state === 'overdue' || state === 'upcoming') && !!payment && !isLocked;

  const badgeColors: Record<RowState, { bg: string; text: string }> = {
    paid: { bg: theme.successLight, text: theme.success },
    dueNow: { bg: theme.warningLight, text: theme.warning },
    overdue: { bg: theme.dangerLight, text: theme.danger },
    upcoming: { bg: theme.primaryLight, text: theme.primary },
    notDue: { bg: theme.border, text: theme.text.tertiary },
  };
  const { bg: badgeBg, text: badgeColor } = badgeColors[state];

  return (
    <Card
      style={[styles.monthCard, state === 'dueNow' && { borderWidth: 1.5, borderColor: theme.warning }]}
      padding={spacing[4]}
    >
      <View style={styles.row}>
        <View style={[styles.monthBadge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.monthText, { color: badgeColor }]}>{MONTHS[month - 1]}</Text>
          <Text style={[styles.yearText, { color: badgeColor }]}>{year}</Text>
        </View>

        <View style={styles.info}>
          <Text style={[styles.amount, { color: payment ? theme.text.primary : theme.text.tertiary }]}>
            {payment ? `₹${Number(payment.amount).toLocaleString('en-IN')}` : '—'}
          </Text>
          {payment?.paidAt ? (
            <Text style={[styles.date, { color: theme.text.tertiary }]}>
              Paid {new Date(payment.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          ) : state === 'notDue' ? (
            <Text style={[styles.date, { color: theme.text.tertiary }]}>Dues not generated yet</Text>
          ) : isLocked ? (
            <Text style={[styles.date, { color: theme.text.tertiary }]}>Clear current month's due first</Text>
          ) : null}
        </View>

        <View style={styles.right}>
          <Badge label={label} variant={variant} />
          {showPayBtn && payment && (
            <TouchableOpacity
              style={[styles.payBtn, { backgroundColor: isPaying ? theme.primaryLight : theme.primary }]}
              onPress={() => !isPaying && onPay(payment.id)}
              activeOpacity={0.85}
              disabled={isPaying}
            >
              {isPaying
                ? <ActivityIndicator size="small" color={theme.primary} />
                : <><Text style={styles.payBtnText}>Pay</Text><Ionicons name="arrow-forward" size={12} color="#fff" /></>}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Card>
  );
}

function SpecialChargeCard({ payment, onPay, isPaying }: { payment: Payment; onPay: (id: string) => void; isPaying?: boolean }) {
  const { theme } = useTheme();
  const isPaid = payment.status === 'PAID';

  return (
    <Card style={styles.monthCard} padding={spacing[4]}>
      <View style={styles.row}>
        <View style={[styles.monthBadge, { backgroundColor: theme.warningLight }]}>
          <Ionicons name="gift" size={20} color={theme.warning} />
        </View>

        <View style={styles.info}>
          <Text style={[styles.specialLabel, { color: theme.text.primary }]} numberOfLines={1}>
            {payment.specialCollection?.label ?? 'Special collection'}
          </Text>
          <Text style={[styles.amount, { color: theme.text.primary }]}>
            ₹{Number(payment.amount).toLocaleString('en-IN')}
          </Text>
          {isPaid && payment.paidAt ? (
            <Text style={[styles.date, { color: theme.text.tertiary }]}>
              Paid {new Date(payment.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          ) : payment.dueDate ? (
            <Text style={[styles.date, { color: theme.text.tertiary }]}>
              Due {new Date(payment.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          ) : null}
        </View>

        <View style={styles.right}>
          <Badge label={isPaid ? 'Paid' : 'Pending'} variant={isPaid ? 'success' : 'warning'} />
          {!isPaid && (
            <TouchableOpacity
              style={[styles.payBtn, { backgroundColor: isPaying ? theme.primaryLight : theme.primary }]}
              onPress={() => !isPaying && onPay(payment.id)}
              activeOpacity={0.85}
              disabled={isPaying}
            >
              {isPaying
                ? <ActivityIndicator size="small" color={theme.primary} />
                : <><Text style={styles.payBtnText}>Pay</Text><Ionicons name="arrow-forward" size={12} color="#fff" /></>}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Card>
  );
}

export function MyPaymentsScreen() {
  const { theme } = useTheme();
  const { data: payments, isLoading, refetch, isRefetching } = useMyPayments();
  const payNow = usePayNow();

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const regularDues = useMemo(() => (payments ?? []).filter((p) => !p.specialCollectionId), [payments]);
  const specialCharges = useMemo(() => (payments ?? []).filter((p) => !!p.specialCollectionId), [payments]);

  const rows = useMemo(
    () => buildYearRows(currentYear, currentMonth, currentYear, regularDues),
    [regularDues, currentMonth, currentYear],
  );

  const currentDue = rows.find((r) => r.month === currentMonth && r.year === currentYear)?.payment;
  const currentCleared = !currentDue || currentDue.status === 'PAID';

  const handlePay = (paymentId: string) => {
    payNow.mutate(paymentId);
  };

  return (
    <ScreenWrapper scrollable={false} padded={false}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text.primary }]}>My Payments</Text>
      </View>

      {currentDue?.status === 'PENDING' && (
        <View style={[styles.banner, { backgroundColor: theme.warningLight, borderColor: theme.warning }]}>
          <Ionicons name="alert-circle" size={18} color={theme.warning} />
          <Text style={[styles.bannerText, { color: theme.warning }]} numberOfLines={2}>
            {MONTHS[currentMonth - 1]} {currentYear} due of ₹{Number(currentDue.amount).toLocaleString('en-IN')} is pending — clear it to unlock paying ahead.
          </Text>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => `${item.year}-${item.month}`}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListHeaderComponent={
            specialCharges.length > 0 ? (
              <View style={styles.specialSection}>
                <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Special Collections</Text>
                {specialCharges.map((p) => (
                  <SpecialChargeCard key={p.id} payment={p} onPay={handlePay} isPaying={payNow.isPending && payNow.variables === p.id} />
                ))}
                <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Monthly Dues</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="card-outline"
              title="No payment records"
              subtitle="Your monthly dues will appear here"
            />
          }
          renderItem={({ item }) => (
            <MonthCard row={item} blockedByCurrent={!currentCleared} onPay={handlePay} isPaying={payNow.isPending && payNow.variables === item.payment?.id} />
          )}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
  },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginHorizontal: spacing[5],
    marginTop: spacing[4],
    padding: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  bannerText: { flex: 1, fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  loadingWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing[5], gap: spacing[3] },
  specialSection: { gap: spacing[3], marginBottom: spacing[1] },
  sectionTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  specialLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  monthCard: { borderRadius: radius.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  monthBadge: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  yearText: { fontSize: fontSize.xs },
  info: { flex: 1, gap: 2 },
  amount: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  date: { fontSize: fontSize.xs },
  right: { alignItems: 'flex-end', gap: spacing[2] },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1] + 2,
    borderRadius: radius.full,
  },
  payBtnText: { color: '#fff', fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
});
