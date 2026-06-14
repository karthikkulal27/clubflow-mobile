import React from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useDuesPlans, useDeleteDuesPlan } from '../hooks/usePayments';
import { useTheme } from '../../../hooks/useTheme';
import { fontSize, fontWeight } from '../../../theme/typography';
import { spacing, radius } from '../../../theme/spacing';
import type { DuesPlan } from '../../../types';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Groups sorted (month, year) periods into readable ranges, e.g. "Jun – Dec 2026, Jan 2027"
function summarizePeriods(periods: DuesPlan['periods']): string {
  if (periods.length === 0) return 'No months selected';

  const sorted = [...periods].sort((a, b) => a.year - b.year || a.month - b.month);
  const ranges: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];

  const flush = () => {
    if (start.month === prev.month && start.year === prev.year) {
      ranges.push(`${MONTHS[start.month - 1]} ${start.year}`);
    } else if (start.year === prev.year) {
      ranges.push(`${MONTHS[start.month - 1]} – ${MONTHS[prev.month - 1]} ${start.year}`);
    } else {
      ranges.push(`${MONTHS[start.month - 1]} ${start.year} – ${MONTHS[prev.month - 1]} ${prev.year}`);
    }
  };

  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i];
    const consecutive =
      (cur.year === prev.year && cur.month === prev.month + 1) ||
      (cur.year === prev.year + 1 && prev.month === 12 && cur.month === 1);
    if (!consecutive) {
      flush();
      start = cur;
    }
    prev = cur;
  }
  flush();

  return ranges.join(', ');
}

function PlanCard({ plan, onDelete }: { plan: DuesPlan; onDelete: (plan: DuesPlan) => void }) {
  const { theme } = useTheme();

  return (
    <Card style={styles.card} padding={spacing[4]}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: theme.primaryLight }]}>
          <Ionicons name="pricetag" size={18} color={theme.primary} />
        </View>

        <View style={styles.info}>
          <Text style={[styles.label, { color: theme.text.primary }]} numberOfLines={1}>
            {plan.label || 'Custom pricing'}
          </Text>
          <Text style={[styles.amount, { color: theme.primary }]}>
            ₹{Number(plan.amount).toLocaleString('en-IN')}
            <Text style={[styles.amountSuffix, { color: theme.text.tertiary }]}> / month</Text>
          </Text>
          <Text style={[styles.periods, { color: theme.text.tertiary }]} numberOfLines={2}>
            {summarizePeriods(plan.periods)} · {plan.periods.length} month{plan.periods.length !== 1 ? 's' : ''}
          </Text>
          {(plan.paidCount > 0 || plan.pendingCount > 0) && (
            <Text style={[styles.counts, { color: theme.text.tertiary }]}>
              {plan.paidCount} paid · {plan.pendingCount} pending
            </Text>
          )}
        </View>

        <TouchableOpacity onPress={() => onDelete(plan)} style={styles.deleteBtn} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={18} color={theme.danger} />
        </TouchableOpacity>
      </View>
    </Card>
  );
}

interface DuesPlansScreenProps {
  onAdd: () => void;
  onBack?: () => void;
}

export function DuesPlansScreen({ onAdd, onBack }: DuesPlansScreenProps) {
  const { theme } = useTheme();
  const { data: plans, isLoading, refetch, isRefetching } = useDuesPlans();
  const deletePlan = useDeleteDuesPlan();

  const handleDelete = (plan: DuesPlan) => {
    const lines: string[] = [];

    if (plan.pendingCount > 0) {
      lines.push(
        `${plan.pendingCount} unpaid due${plan.pendingCount !== 1 ? 's' : ''} will be cancelled immediately.`,
      );
    }

    if (plan.paidCount > 0) {
      lines.push(
        `${plan.paidCount} member${plan.paidCount !== 1 ? 's' : ''} who already paid ${plan.paidCount !== 1 ? 'are' : 'is'} unaffected — their records are kept.`,
      );
    }

    if (plan.pendingCount === 0 && plan.paidCount === 0) {
      lines.push('No dues have been generated yet for these months — nothing to cancel.');
    }

    lines.push('Future months with no plan will not generate dues unless you create a new one.');

    Alert.alert('Delete Plan', lines.join('\n\n'), [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePlan.mutate(plan.id) },
    ]);
  };

  return (
    <ScreenWrapper scrollable={false} padded={false}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Ionicons name="arrow-back" size={22} color={theme.text.primary} />
            </TouchableOpacity>
          )}
          <Text style={[styles.title, { color: theme.text.primary }]}>Dues Schedule</Text>
        </View>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.primary }]} onPress={onAdd} activeOpacity={0.85}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={[styles.banner, { backgroundColor: theme.surfaceElevated, borderColor: theme.borderSubtle }]}>
        <Ionicons name="information-circle-outline" size={16} color={theme.text.tertiary} />
        <Text style={[styles.bannerText, { color: theme.text.tertiary }]}>
          This is your club's complete billing calendar — only the months listed below will generate dues. Months with no plan are billed nothing.
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={plans ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title="No billing schedule yet"
              subtitle="Add a plan to start charging members — until you do, no dues will be generated for any month"
            />
          }
          renderItem={({ item }) => <PlanCard plan={item} onDelete={handleDelete} />}
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
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
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
  bannerText: { flex: 1, fontSize: fontSize.xs, lineHeight: 16 },
  loadingWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing[5], gap: spacing[3], paddingBottom: spacing[8] },
  card: {},
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info: { flex: 1, gap: 3 },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  amount: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  amountSuffix: { fontSize: fontSize.xs, fontWeight: fontWeight.regular },
  periods: { fontSize: fontSize.xs, lineHeight: 16 },
  counts: { fontSize: fontSize.xs, lineHeight: 16, marginTop: 2 },
  deleteBtn: { padding: spacing[1] },
});
