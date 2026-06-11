import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useTheme } from '../../../hooks/useTheme';
import { fontSize, fontWeight } from '../../../theme/typography';
import { spacing, radius } from '../../../theme/spacing';
import { useCreateDuesPlan } from '../hooks/usePayments';
import type { DuesPlanPeriod } from '../../../types';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const schema = z.object({
  label: z.string().max(100).optional(),
  amount: z.string().min(1, 'Amount is required').refine(
    (v) => !isNaN(Number(v)) && Number(v) > 0 && Number(v) <= 100000,
    'Enter a valid amount (1–1,00,000)',
  ),
});

type FormData = z.infer<typeof schema>;

function periodKey(month: number, year: number): string {
  return `${year}-${month}`;
}

interface CreateDuesPlanScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function CreateDuesPlanScreen({ onBack, onSuccess }: CreateDuesPlanScreenProps) {
  const { theme } = useTheme();
  const createPlan = useCreateDuesPlan();
  const [year, setYear] = useState(new Date().getFullYear());
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { label: '', amount: '' },
  });

  const toggleMonth = (month: number) => {
    const key = periodKey(month, year);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const removePeriod = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  // Bulk-select shortcuts — since every billed month now needs an explicit period,
  // picking 12 months one tap at a time would be tedious for a regular monthly club.
  const selectNextMonths = (count: number) => {
    const now = new Date();
    let m = now.getMonth() + 1;
    let y = now.getFullYear();
    const keys: string[] = [];
    for (let i = 0; i < count; i++) {
      keys.push(periodKey(m, y));
      m += 1;
      if (m > 12) { m = 1; y += 1; }
    }
    setSelected((prev) => new Set([...prev, ...keys]));
  };

  const selectFullYear = (y: number) => {
    const keys = Array.from({ length: 12 }, (_, i) => periodKey(i + 1, y));
    setSelected((prev) => new Set([...prev, ...keys]));
  };

  const clearSelection = () => setSelected(new Set());

  const sortedPeriods = useMemo(() => {
    return Array.from(selected)
      .map((key) => {
        const [y, m] = key.split('-').map(Number);
        return { key, month: m, year: y };
      })
      .sort((a, b) => a.year - b.year || a.month - b.month);
  }, [selected]);

  const hasPastMonths = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;
    return sortedPeriods.some(
      (p) => p.year < curYear || (p.year === curYear && p.month < curMonth),
    );
  }, [sortedPeriods]);

  const onSubmit = (data: FormData) => {
    if (sortedPeriods.length === 0) {
      Toast.show({ type: 'error', text1: 'Pick at least one month', text2: 'Select the months this price applies to' });
      return;
    }

    const periods: DuesPlanPeriod[] = sortedPeriods.map(({ month, year: y }) => ({ month, year: y }));

    createPlan.mutate(
      { label: data.label || undefined, amount: Number(data.amount), periods },
      {
        onSuccess: () => {
          Toast.show({
            type: 'success',
            text1: 'Plan created',
            text2: `₹${data.amount} for ${periods.length} month${periods.length > 1 ? 's' : ''}`,
          });
          onSuccess();
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message ?? 'Failed to create plan';
          Toast.show({ type: 'error', text1: 'Could not create plan', text2: msg });
        },
      },
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>New Dues Plan</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Controller
          control={control}
          name="label"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Label (optional)"
              placeholder="e.g. Off-season pricing"
              leftIcon="pricetag-outline"
              autoCapitalize="sentences"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.label?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="amount"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Amount (₹) per month"
              placeholder="0.00"
              leftIcon="logo-usd"
              keyboardType="decimal-pad"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.amount?.message}
            />
          )}
        />

        <View style={styles.fieldGroup}>
          <Text style={[styles.groupLabel, { color: theme.text.secondary }]}>Apply to months</Text>

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickChip, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => selectNextMonths(12)}
              activeOpacity={0.75}
            >
              <Text style={[styles.quickChipText, { color: theme.text.secondary }]}>Next 12 months</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickChip, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => selectFullYear(year)}
              activeOpacity={0.75}
            >
              <Text style={[styles.quickChipText, { color: theme.text.secondary }]}>All of {year}</Text>
            </TouchableOpacity>
            {selected.size > 0 && (
              <TouchableOpacity
                style={[styles.quickChip, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={clearSelection}
                activeOpacity={0.75}
              >
                <Ionicons name="close" size={13} color={theme.danger} />
                <Text style={[styles.quickChipText, { color: theme.danger }]}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.yearSwitcher}>
            <TouchableOpacity onPress={() => setYear((y) => y - 1)} style={styles.yearArrow} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={20} color={theme.text.secondary} />
            </TouchableOpacity>
            <Text style={[styles.yearLabel, { color: theme.text.primary }]}>{year}</Text>
            <TouchableOpacity onPress={() => setYear((y) => y + 1)} style={styles.yearArrow} activeOpacity={0.7}>
              <Ionicons name="chevron-forward" size={20} color={theme.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.monthGrid}>
            {MONTHS.map((label, i) => {
              const month = i + 1;
              const active = selected.has(periodKey(month, year));
              return (
                <TouchableOpacity
                  key={month}
                  style={[
                    styles.monthChip,
                    {
                      backgroundColor: active ? theme.primary : theme.surface,
                      borderColor: active ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => toggleMonth(month)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.monthChipText, { color: active ? '#fff' : theme.text.secondary }]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={[styles.hint, { color: theme.text.tertiary }]}>
            Switch years with the arrows — your selection carries across years.
          </Text>
        </View>

        {sortedPeriods.length > 0 && (
          <View style={styles.fieldGroup}>
            <Text style={[styles.groupLabel, { color: theme.text.secondary }]}>
              Selected — {sortedPeriods.length} month{sortedPeriods.length > 1 ? 's' : ''} (tap to remove)
            </Text>
            <View style={styles.chipsGrid}>
              {sortedPeriods.map(({ key, month, year: y }) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.periodChip, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}
                  onPress={() => removePeriod(key)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.periodChipText, { color: theme.primary }]}>
                    {MONTHS[month - 1]} {y}
                  </Text>
                  <Ionicons name="close" size={12} color={theme.primary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {hasPastMonths && (
          <View style={[styles.pastWarning, { backgroundColor: '#fef3c7', borderColor: '#f59e0b' }]}>
            <Ionicons name="warning-outline" size={16} color="#f59e0b" />
            <Text style={styles.pastWarningText}>
              Past months selected — dues will be generated immediately for all active members.
            </Text>
          </View>
        )}

        <Button
          title="Create Plan"
          fullWidth
          loading={createPlan.isPending}
          onPress={handleSubmit(onSubmit)}
          style={styles.submitBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
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
  headerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing[5], gap: spacing[5], paddingBottom: spacing[8] },
  fieldGroup: { gap: spacing[3] },
  groupLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingVertical: spacing[1] + 2,
    paddingHorizontal: spacing[3],
    borderRadius: radius.full,
    borderWidth: 1,
  },
  quickChipText: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  yearSwitcher: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[4] },
  yearArrow: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  yearLabel: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, minWidth: 64, textAlign: 'center' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  monthChip: {
    width: '22%',
    paddingVertical: spacing[2] + 2,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  monthChipText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  hint: { fontSize: fontSize.xs, lineHeight: 16 },
  chipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  periodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1] + 2,
    paddingVertical: spacing[1] + 2,
    paddingHorizontal: spacing[3],
    borderRadius: radius.full,
    borderWidth: 1,
  },
  periodChipText: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  submitBtn: { marginTop: spacing[2] },
  pastWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  pastWarningText: { flex: 1, fontSize: fontSize.xs, color: '#92400e', lineHeight: 18 },
});
