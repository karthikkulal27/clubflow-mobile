import React from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { getExpensesApi, deleteExpenseApi } from '../api/expenses.api';
import { useAuth } from '../../../hooks/useAuth';
import { useTheme } from '../../../hooks/useTheme';
import { fontSize, fontWeight } from '../../../theme/typography';
import { spacing, radius } from '../../../theme/spacing';
import { format } from 'date-fns';
import type { Expense } from '../../../types';

const CATEGORY_COLORS: Record<string, string> = {
  food: '#f59e0b',
  ground: '#10b981',
  equipment: '#3b82f6',
  travel: '#8b5cf6',
  trophy: '#ec4899',
  event: '#f97316',
};

function getCategoryColor(category: string | null): string {
  if (!category) return '#94a3b8';
  return CATEGORY_COLORS[category.toLowerCase()] ?? '#6366f1';
}

function ExpenseCard({
  item,
  isAdmin,
  onDelete,
}: {
  item: Expense;
  isAdmin: boolean;
  onDelete: (id: string) => void;
}) {
  const { theme } = useTheme();
  const categoryColor = getCategoryColor(item.category);

  return (
    <Card style={styles.card} padding={spacing[4]}>
      <View style={styles.row}>
        <View style={[styles.categoryDot, { backgroundColor: categoryColor + '20' }]}>
          <Ionicons name="receipt-outline" size={18} color={categoryColor} />
        </View>

        <View style={styles.info}>
          <Text style={[styles.expenseTitle, { color: theme.text.primary }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.expenseDate, { color: theme.text.tertiary }]}>
            {format(new Date(item.expenseDate), 'MMM d, yyyy')} · by {item.addedBy.name}
          </Text>
          {item.category && (
            <Badge label={item.category} variant="neutral" style={styles.badge} />
          )}
        </View>

        <View style={styles.amountBlock}>
          <Text style={[styles.amount, { color: theme.danger }]}>
            −₹{Number(item.amount).toLocaleString('en-IN')}
          </Text>
          {isAdmin && (
            <TouchableOpacity
              onPress={() => onDelete(item.id)}
              style={styles.deleteBtn}
            >
              <Ionicons name="trash-outline" size={16} color={theme.danger} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {item.description && (
        <View style={styles.reasonRow}>
          <Text style={[styles.reasonLabel, { color: theme.text.tertiary }]}>Reason: </Text>
          <Text style={[styles.reasonText, { color: theme.text.secondary }]} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
      )}
    </Card>
  );
}

interface ExpensesListScreenProps {
  onAdd?: () => void;
}

export function ExpensesListScreen({ onAdd }: ExpensesListScreenProps) {
  const { theme } = useTheme();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => getExpensesApi(),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExpenseApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  });

  const handleDelete = (expenseId: string) => {
    Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(expenseId),
      },
    ]);
  };

  const expenses = data?.data?.expenses ?? [];
  const totalAmount = data?.data?.totalAmount ?? 0;

  return (
    <ScreenWrapper scrollable={false} padded={false}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text.primary }]}>Expenses</Text>
        {isAdmin && (
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.primary }]} onPress={onAdd}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Total Banner */}
      <View style={[styles.totalBanner, { backgroundColor: theme.dangerLight }]}>
        <Ionicons name="trending-down" size={16} color={theme.danger} />
        <Text style={[styles.totalText, { color: theme.danger }]}>
          Total Expenses: ₹{Number(totalAmount).toLocaleString('en-IN')}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title="No expenses recorded"
              subtitle="Club expenses will appear here"
            />
          }
          renderItem={({ item }) => (
            <ExpenseCard item={item} isAdmin={isAdmin} onDelete={handleDelete} />
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
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  totalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
  },
  totalText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  loadingWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing[5], gap: spacing[3], paddingBottom: spacing[8] },
  card: {},
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  categoryDot: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info: { flex: 1, gap: 3 },
  expenseTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  expenseDate: { fontSize: fontSize.xs },
  badge: { marginTop: 2 },
  amountBlock: { alignItems: 'flex-end', gap: spacing[2] },
  amount: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
  deleteBtn: { padding: spacing[1] },
  reasonRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing[2] },
  reasonLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.medium, flexShrink: 0 },
  reasonText: { fontSize: fontSize.xs, flex: 1, lineHeight: 18 },
});
