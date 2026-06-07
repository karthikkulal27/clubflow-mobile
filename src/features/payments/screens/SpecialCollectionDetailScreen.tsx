import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useSpecialCollectionPayments, useMarkPaymentPaid } from '../hooks/usePayments';
import { useAuth } from '../../../hooks/useAuth';
import { useTheme } from '../../../hooks/useTheme';
import { fontSize, fontWeight } from '../../../theme/typography';
import { spacing, radius, shadow } from '../../../theme/spacing';
import type { Payment } from '../../../types';

type Tab = 'pending' | 'paid';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function PaymentRow({ item, isAdmin, onMarkPaid }: {
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

interface SpecialCollectionDetailScreenProps {
  collectionId: string;
  label: string;
  onBack: () => void;
}

export function SpecialCollectionDetailScreen({ collectionId, label, onBack }: SpecialCollectionDetailScreenProps) {
  const { theme } = useTheme();
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('pending');

  const { data, isLoading, refetch, isRefetching } = useSpecialCollectionPayments(collectionId);
  const markPaid = useMarkPaymentPaid();

  const payments = data?.payments ?? [];
  const paid = payments.filter((p) => p.status === 'PAID');
  const pending = payments.filter((p) => p.status === 'PENDING');
  const displayed = activeTab === 'paid' ? paid : pending;

  const collection = data?.collection;
  const totalAmount = collection ? Number(collection.amount) * payments.length : 0;
  const collectedAmount = paid.reduce((sum, p) => sum + Number(p.amount), 0);
  const pct = payments.length > 0 ? Math.round((paid.length / payments.length) * 100) : 0;

  const handleMarkPaid = (payment: Payment) => {
    const amountLabel = `₹${Number(payment.amount).toLocaleString('en-IN')}`;
    Alert.alert(
      'Mark as paid?',
      `Record ${amountLabel} from ${payment.user?.name ?? 'this member'} as paid in cash or offline. This is for charges settled outside the app.`,
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
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]} numberOfLines={1}>
          {label}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <FlatList
        data={displayed}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {collection && (
              <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <View style={styles.summaryTopRow}>
                  <View style={[styles.summaryIconWrap, { backgroundColor: theme.warningLight }]}>
                    <Ionicons name="gift" size={20} color={theme.warning} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.summaryAmount, { color: theme.text.primary }]}>
                      ₹{Number(collection.amount).toLocaleString('en-IN')}
                      <Text style={[styles.summarySuffix, { color: theme.text.tertiary }]}> / member</Text>
                    </Text>
                    <Text style={[styles.summaryMeta, { color: theme.text.tertiary }]}>
                      {MONTHS[collection.month - 1]} {collection.year} · Due{' '}
                      {new Date(collection.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                </View>

                <View style={[styles.progressTrack, { backgroundColor: theme.borderSubtle }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { backgroundColor: theme.success, width: `${pct}%` as any },
                    ]}
                  />
                </View>

                <View style={styles.summaryStatsRow}>
                  <View style={styles.summaryStat}>
                    <Text style={[styles.summaryStatNum, { color: theme.text.primary }]}>
                      {paid.length}/{payments.length}
                    </Text>
                    <Text style={[styles.summaryStatLbl, { color: theme.text.secondary }]}>Members paid</Text>
                  </View>
                  <View style={[styles.summaryDivider, { backgroundColor: theme.borderSubtle }]} />
                  <View style={styles.summaryStat}>
                    <Text style={[styles.summaryStatNum, { color: theme.text.primary }]}>
                      ₹{collectedAmount.toLocaleString('en-IN')}
                    </Text>
                    <Text style={[styles.summaryStatLbl, { color: theme.text.secondary }]}>
                      of ₹{totalAmount.toLocaleString('en-IN')} collected
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View style={[styles.tabs, { backgroundColor: theme.borderSubtle }]}>
              {(['pending', 'paid'] as Tab[]).map((tab) => (
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
                    {tab === 'pending' ? `Pending (${pending.length})` : `Paid (${paid.length})`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: spacing[8] }} />
          ) : (
            <EmptyState
              icon={activeTab === 'paid' ? 'checkmark-circle-outline' : 'time-outline'}
              title={activeTab === 'paid' ? 'No payments yet' : 'Everyone has paid!'}
              subtitle={activeTab === 'paid' ? 'Payments will appear here once received' : 'All billed members have cleared this charge'}
            />
          )
        }
        refreshing={isRefetching}
        onRefresh={refetch}
        renderItem={({ item }) => (
          <PaymentRow item={item} isAdmin={isAdmin} onMarkPaid={handleMarkPaid} />
        )}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: fontSize.lg, fontWeight: fontWeight.semibold },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  summaryCard: {
    margin: spacing[5],
    marginBottom: spacing[3],
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing[4],
    gap: spacing[3],
  },
  summaryTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  summaryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryAmount: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  summarySuffix: { fontSize: fontSize.xs, fontWeight: fontWeight.regular },
  summaryMeta: { fontSize: fontSize.xs, marginTop: 2 },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  summaryStatsRow: { flexDirection: 'row', alignItems: 'center' },
  summaryStat: { flex: 1, alignItems: 'center', gap: 2 },
  summaryStatNum: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  summaryStatLbl: { fontSize: fontSize.xs },
  summaryDivider: { width: 1, height: 32, marginHorizontal: spacing[3] },
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
});
