import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { Card } from '../../../components/ui/Card';
import { Avatar } from '../../../components/ui/Avatar';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Button } from '../../../components/ui/Button';
import { getIncomeApi, deleteIncomeApi, type IncomeEntry } from '../api/income.api';
import { useTheme } from '../../../hooks/useTheme';
import { useAuth } from '../../../hooks/useAuth';
import { fontSize, fontWeight } from '../../../theme/typography';
import { spacing, radius } from '../../../theme/spacing';

interface IncomeListScreenProps {
  onBack: () => void;
  onAdd?: () => void;
}

function IncomeRow({ item, isAdmin, onDelete }: {
  item: IncomeEntry;
  isAdmin: boolean;
  onDelete: (income: IncomeEntry) => void;
}) {
  const { theme } = useTheme();

  return (
    <View style={[styles.row, { borderBottomColor: theme.border }]}>
      <View style={styles.rowLeft}>
        <Avatar name={item.admin.name} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.category, { color: theme.text.primary }]}>
            {item.category}
          </Text>
          <Text style={[styles.admin, { color: theme.text.tertiary }]}>
            By {item.admin.name}
          </Text>
          {item.description && (
            <Text style={[styles.desc, { color: theme.text.secondary }]}>
              {item.description}
            </Text>
          )}
          <Text style={[styles.date, { color: theme.text.tertiary }]}>
            {new Date(item.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
          </Text>
        </View>
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.amount, { color: theme.success }]}>
          +₹{Number(item.amount).toLocaleString('en-IN')}
        </Text>
        {isAdmin && (
          <TouchableOpacity
            onPress={() => onDelete(item)}
            activeOpacity={0.6}
          >
            <Ionicons name="trash-outline" size={18} color={theme.danger} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export function IncomeListScreen({ onBack, onAdd }: IncomeListScreenProps) {
  const { theme } = useTheme();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: incomeEntries = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['income'],
    queryFn: getIncomeApi,
  });

  const deleteMutation = useMutation({
    mutationFn: (incomeId: string) => deleteIncomeApi(incomeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      Toast.show({ type: 'success', text1: 'Income deleted' });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Failed to delete income';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    },
  });

  const handleDelete = (income: IncomeEntry) => {
    Alert.alert('Delete income?', `Remove ₹${Number(income.amount).toLocaleString('en-IN')} from ${income.category}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(income.id),
      },
    ]);
  };

  const totalIncome = incomeEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);

  if (isLoading) {
    return (
      <ScreenWrapper>
        <ActivityIndicator size="large" color={theme.primary} />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scrollable={false} padded={false}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="chevron-back" size={28} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Club Income</Text>
        {isAdmin && onAdd && (
          <TouchableOpacity onPress={onAdd}>
            <Ionicons name="add-outline" size={28} color={theme.primary} />
          </TouchableOpacity>
        )}
        {(!isAdmin || !onAdd) && <View style={{ width: 28 }} />}
      </View>

      <FlatList
        data={incomeEntries}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshing={false}
        onRefresh={refetch}
        ListHeaderComponent={
          <>
            {/* Total Income Card */}
            {totalIncome > 0 && (
              <Card
                style={[styles.totalCard, { backgroundColor: theme.card }]}
                padding={spacing[4]}
              >
                <Text style={[styles.totalLabel, { color: theme.text.secondary }]}>Total Income</Text>
                <Text style={[styles.totalAmount, { color: theme.success }]}>
                  ₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                <Text style={[styles.totalEntries, { color: theme.text.tertiary }]}>
                  {incomeEntries.length} entr{incomeEntries.length === 1 ? 'y' : 'ies'}
                </Text>
              </Card>
            )}
          </>
        }
        ListEmptyComponent={
          <EmptyState
            icon="wallet-outline"
            title="No income yet"
            description="Admin will add income entries here"
          />
        }
        renderItem={({ item }) => (
          <IncomeRow item={item} isAdmin={isAdmin} onDelete={handleDelete} />
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
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  totalCard: {
    margin: spacing[3],
    marginBottom: spacing[2],
    borderRadius: radius.md,
  },
  totalLabel: {
    fontSize: fontSize.sm,
    marginBottom: spacing[1],
  },
  totalAmount: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing[1],
  },
  totalEntries: {
    fontSize: fontSize.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
  },
  rowLeft: {
    flexDirection: 'row',
    gap: spacing[3],
    flex: 1,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: spacing[2],
  },
  category: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  admin: {
    fontSize: fontSize.xs,
    marginTop: spacing[0.5],
  },
  desc: {
    fontSize: fontSize.xs,
    marginTop: spacing[0.5],
  },
  date: {
    fontSize: fontSize.xs,
    marginTop: spacing[1],
  },
  amount: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
