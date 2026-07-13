import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { Card } from '../../../components/ui/Card';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { usePaymentsList, usePaymentStats, useMarkPaymentPaid } from '../hooks/usePayments';
import { useAuth } from '../../../hooks/useAuth';
import { useTheme } from '../../../hooks/useTheme';
import { fontSize, fontWeight } from '../../../theme/typography';
import { spacing, radius, shadow } from '../../../theme/spacing';
import type { Payment } from '../../../types';

type Tab = 'paid' | 'pending';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function MemberPaymentRow({ item, isAdmin, onMarkPaid }: {
  item: Payment;
  isAdmin: boolean;
  onMarkPaid: (payment: Payment) => void;
}) {
  const { theme } = useTheme();
  const isPaid = item.status === 'PAID';
  const isCash = isPaid && !item.razorpayPaymentId;

  return (
    <View style={[styles.memberRow, { borderBottomColor: theme.borderSubtle }]}>
      <Avatar name={item.user?.name ?? '?'} uri={item.user?.avatarUrl} size={38} />
      <View style={styles.memberInfo}>
        <Text style={[styles.memberName, { color: theme.text.primary }]}>
          {item.user?.name}
        </Text>
        <Text style={[styles.memberPhone, { color: theme.text.tertiary }]}>
          {item.user?.phone}
        </Text>
      </View>
      <View style={styles.memberRight}>
        {isPaid ? (
          <>
            <Text style={[styles.paidAmount, { color: theme.success }]}>
              ₹{Number(item.amount).toLocaleString('en-IN')}
            </Text>
            <View style={styles.paidMeta}>
              {item.paidAt && (
                <Text style={[styles.paidDate, { color: theme.text.tertiary }]}>
                  {new Date(item.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </Text>
              )}
              {isCash && <Badge label="Cash" variant="neutral" style={{ marginLeft: spacing[1] }} />}
            </View>
          </>
        ) : isAdmin ? (
          <TouchableOpacity
            style={[styles.markPaidBtn, { backgroundColor: theme.successLight, borderColor: theme.success }]}
            onPress={() => onMarkPaid(item)}
            activeOpacity={0.75}
          >
            <Ionicons name="checkmark" size={13} color={theme.success} />
            <Text style={[styles.markPaidBtnText, { color: theme.success }]}>Mark paid</Text>
          </TouchableOpacity>
        ) : (
          <Badge label="Pending" variant="warning" />
        )}
      </View>
    </View>
  );
}

interface FinanceScreenProps {
  onManagePricing?: () => void;
  onSpecialCollections?: () => void;
  onExpenses?: () => void;
  onIncome?: () => void;
}

export function FinanceScreen({ onManagePricing, onSpecialCollections, onExpenses, onIncome }: FinanceScreenProps) {
  const { theme } = useTheme();
  const { isAdmin } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());
  const [activeTab, setActiveTab] = useState<Tab>('paid');

  const { data: payments, isLoading, isError, refetch, isRefetching } = usePaymentsList(month, year);
  const { data: stats, refetch: refetchStats } = usePaymentStats(month, year);
  const markPaid = useMarkPaymentPaid();

  const handleRefresh = () => { refetch(); refetchStats(); };

  const paid = (payments?.data ?? []).filter((p) => p.status === 'PAID');
  const pending = (payments?.data ?? []).filter((p) => p.status === 'PENDING');
  const displayed = activeTab === 'paid' ? paid : pending;

  const prevMonth = () =>
    setMonth((m) => (m === 1 ? 12 : m - 1));
  const nextMonth = () =>
    setMonth((m) => (m === 12 ? 1 : m + 1));

  const handleMarkPaid = (payment: Payment) => {
    const amountLabel = `₹${Number(payment.amount).toLocaleString('en-IN')}`;
    Alert.alert(
      'Mark as paid?',
      `Record ${amountLabel} from ${payment.user?.name ?? 'this member'} as paid in cash or offline. This is for dues settled outside the app.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Paid',
          onPress: () => markPaid.mutate(payment.id, {
            onSuccess: () => {
              Toast.show({ type: 'success', text1: 'Payment recorded', text2: `${amountLabel} marked as paid` });
            },
            onError: (err: any) => {
              const msg = err?.response?.data?.message ?? 'Could not update this payment';
              Toast.show({ type: 'error', text1: 'Error', text2: msg });
            },
          }),
        },
      ],
    );
  };

  return (
    <ScreenWrapper scrollable={false} padded={false}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text.primary }]}>Club Finance</Text>
        <View style={styles.headerActions}>
          {onSpecialCollections && (
            <TouchableOpacity
              style={[styles.pricingBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
              onPress={onSpecialCollections}
              activeOpacity={0.75}
            >
              <Ionicons name="gift-outline" size={15} color={theme.text.secondary} />
              <Text style={[styles.pricingBtnText, { color: theme.text.secondary }]}>Collections</Text>
            </TouchableOpacity>
          )}
          {onManagePricing && (
            <TouchableOpacity
              style={[styles.pricingBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
              onPress={onManagePricing}
              activeOpacity={0.75}
            >
              <Ionicons name="calendar-outline" size={15} color={theme.text.secondary} />
              <Text style={[styles.pricingBtnText, { color: theme.text.secondary }]}>Schedule</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={displayed}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        maxToRenderPerBatch={15}
        windowSize={5}
        initialNumToRender={15}
        refreshing={isRefetching}
        onRefresh={handleRefresh}
        ListHeaderComponent={
          <>
            {/* Shortcuts row */}
            <View style={styles.shortcutsRow}>
              {/* Income shortcut */}
              {onIncome && isAdmin && (
                <TouchableOpacity
                  style={[styles.shortcutBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                  onPress={onIncome}
                  activeOpacity={0.75}
                >
                  <View style={[styles.shortcutIcon, { backgroundColor: theme.successLight }]}>
                    <Ionicons name="trending-up-outline" size={18} color={theme.success} />
                  </View>
                  <Text style={[styles.shortcutLabel, { color: theme.text.primary }]}>Income</Text>
                </TouchableOpacity>
              )}
              {/* Expenses shortcut */}
              {onExpenses && isAdmin && (
                <TouchableOpacity
                  style={[styles.shortcutBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                  onPress={onExpenses}
                  activeOpacity={0.75}
                >
                  <View style={[styles.shortcutIcon, { backgroundColor: theme.dangerLight }]}>
                    <Ionicons name="receipt-outline" size={18} color={theme.danger} />
                  </View>
                  <Text style={[styles.shortcutLabel, { color: theme.text.primary }]}>Expenses</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Balance Card */}
            {stats && (
              <LinearGradient
                colors={['#1d4ed8', '#2563eb', '#3b82f6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.balanceCard}
              >
                <Text style={styles.balanceLabel}>Available Balance</Text>
                <Text style={styles.balanceAmount}>
                  ₹{(stats.availableBalance ?? stats.collectedAmount ?? 0).toLocaleString('en-IN')}
                </Text>
                <View style={styles.balanceRow}>
                  <View style={styles.balanceStat}>
                    <Text style={styles.balanceStatLabel}>Collected</Text>
                    <Text style={styles.balanceStatValue}>
                      ₹{Number(stats.collectedAmount).toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.balanceDivider} />
                  <View style={styles.balanceStat}>
                    <Text style={styles.balanceStatLabel}>Expenses</Text>
                    <Text style={styles.balanceStatValue}>
                      ₹{(Number(stats.totalExpenses) ?? 0).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            )}

            {/* Month Selector */}
            <View style={[styles.monthSelector, { backgroundColor: theme.surface }]}>
              <TouchableOpacity onPress={prevMonth} style={styles.monthBtn}>
                <Ionicons name="chevron-back" size={20} color={theme.primary} />
              </TouchableOpacity>
              <Text style={[styles.monthLabel, { color: theme.text.primary }]}>
                {MONTHS[month - 1]} {year}
              </Text>
              <TouchableOpacity onPress={nextMonth} style={styles.monthBtn}>
                <Ionicons name="chevron-forward" size={20} color={theme.primary} />
              </TouchableOpacity>
            </View>

            {/* Stats row */}
            {stats && (
              <>
                <View style={styles.statsRow}>
                  <Card style={styles.statCard} padding={spacing[3]}>
                    <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                    <Text style={[styles.statNum, { color: theme.text.primary }]}>{stats.paidCount}</Text>
                    <Text style={[styles.statLbl, { color: theme.text.secondary }]}>Paid</Text>
                  </Card>
                  <Card style={styles.statCard} padding={spacing[3]}>
                    <Ionicons name="time-outline" size={20} color={theme.warning} />
                    <Text style={[styles.statNum, { color: theme.text.primary }]}>{stats.pendingCount}</Text>
                    <Text style={[styles.statLbl, { color: theme.text.secondary }]}>Pending</Text>
                  </Card>
                  <Card style={styles.statCard} padding={spacing[3]}>
                    <Ionicons name="people-outline" size={20} color={theme.primary} />
                    <Text style={[styles.statNum, { color: theme.text.primary }]}>{stats.total}</Text>
                    <Text style={[styles.statLbl, { color: theme.text.secondary }]}>Total</Text>
                  </Card>
                </View>

                {/* Collection progress */}
                <View style={[styles.progressCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <View style={styles.progressHeader}>
                    <Text style={[styles.progressLabel, { color: theme.text.secondary }]}>Collection Rate</Text>
                    <Text style={[styles.progressPct, { color: theme.primary }]}>
                      {stats.total > 0 ? Math.round((stats.paidCount / stats.total) * 100) : 0}%
                    </Text>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: theme.borderSubtle }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: theme.success,
                          width: `${stats.total > 0 ? (stats.paidCount / stats.total) * 100 : 0}%` as any,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.progressLegend}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: theme.success }]} />
                      <Text style={[styles.legendText, { color: theme.text.tertiary }]}>
                        Collected ₹{Number(stats.collectedAmount).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: theme.warning }]} />
                      <Text style={[styles.legendText, { color: theme.text.tertiary }]}>
                        Pending ₹{Number(stats.pendingAmount).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}

            {/* Tabs */}
            <View style={[styles.tabs, { backgroundColor: theme.borderSubtle }]}>
              {(['paid', 'pending'] as Tab[]).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tab,
                    activeTab === tab && { backgroundColor: theme.surface, ...shadow.sm },
                  ]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: activeTab === tab ? theme.primary : theme.text.secondary },
                    ]}
                  >
                    {tab === 'paid' ? `Paid (${paid.length})` : `Pending (${pending.length})`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          isLoading && !isError ? (
            <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: spacing[8] }} />
          ) : (
            <EmptyState
              icon={activeTab === 'paid' ? 'checkmark-circle-outline' : 'time-outline'}
              title={activeTab === 'paid' ? 'No payments yet' : 'No dues scheduled'}
              subtitle={activeTab === 'paid' ? 'Payments will appear here once received' : 'Create a dues schedule to generate payments for this month'}
            />
          )
        }
        renderItem={({ item }) => (
          <MemberPaymentRow item={item} isAdmin={isAdmin} onMarkPaid={handleMarkPaid} />
        )}
      />
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
  headerActions: { flexDirection: 'row', gap: spacing[2] },
  pricingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1] + 2,
    paddingVertical: spacing[1] + 2,
    paddingHorizontal: spacing[3],
    borderRadius: radius.full,
    borderWidth: 1,
  },
  pricingBtnText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  balanceCard: {
    margin: spacing[5],
    borderRadius: radius['2xl'],
    padding: spacing[5],
  },
  balanceLabel: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.75)' },
  balanceAmount: { fontSize: 34, fontWeight: fontWeight.bold, color: '#fff', marginVertical: spacing[2] },
  balanceRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing[2] },
  balanceStat: { flex: 1 },
  balanceStatLabel: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.7)' },
  balanceStatValue: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: '#fff' },
  balanceDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: spacing[4] },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    gap: spacing[4],
  },
  monthBtn: { padding: spacing[2] },
  monthLabel: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, minWidth: 100, textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: spacing[3], paddingHorizontal: spacing[5], marginBottom: spacing[3] },
  progressCard: {
    marginHorizontal: spacing[5],
    marginBottom: spacing[4],
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing[4],
    gap: spacing[3],
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  progressPct: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressLegend: { flexDirection: 'row', gap: spacing[4] },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: fontSize.xs },
  statCard: { flex: 1, alignItems: 'center', gap: spacing[1] },
  statNum: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  statLbl: { fontSize: fontSize.xs },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: spacing[5],
    marginBottom: spacing[3],
    borderRadius: radius.lg,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: spacing[2], borderRadius: radius.md, alignItems: 'center' },
  tabText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  listContent: { paddingBottom: spacing[8] },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
  },
  memberInfo: { flex: 1 },
  memberName: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  memberPhone: { fontSize: fontSize.xs, marginTop: 2 },
  memberRight: { alignItems: 'flex-end' },
  paidAmount: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
  paidDate: { fontSize: fontSize.xs, marginTop: 2 },
  paidMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  markPaidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingVertical: spacing[1] + 2,
    paddingHorizontal: spacing[3],
    borderRadius: radius.full,
    borderWidth: 1,
  },
  markPaidBtnText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  shortcutsRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  shortcutBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  shortcutIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  shortcutLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, textAlign: 'center' },
});
