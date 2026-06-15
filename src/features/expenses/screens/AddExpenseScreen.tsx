import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { DatePickerInput } from '../../../components/ui/DatePickerInput';
import { useTheme } from '../../../hooks/useTheme';
import { fontSize, fontWeight } from '../../../theme/typography';
import { spacing, radius } from '../../../theme/spacing';
import { createExpenseApi, updateExpenseApi } from '../api/expenses.api';
import { format } from 'date-fns';

const CATEGORIES = [
  { key: 'food', label: 'Food', icon: 'fast-food-outline' },
  { key: 'ground', label: 'Ground', icon: 'football-outline' },
  { key: 'equipment', label: 'Equipment', icon: 'construct-outline' },
  { key: 'travel', label: 'Travel', icon: 'car-outline' },
  { key: 'trophy', label: 'Trophy', icon: 'trophy-outline' },
  { key: 'event', label: 'Event', icon: 'calendar-outline' },
  { key: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
] as const;

type Category = typeof CATEGORIES[number]['key'];

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  amount: z.string().min(1, 'Amount is required').refine(
    (v) => !isNaN(Number(v)) && Number(v) > 0,
    'Enter a valid amount',
  ),
  category: z.string().optional(),
  expenseDate: z.string().min(1, 'Select a date'),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface AddExpenseScreenProps {
  onBack: () => void;
  onSuccess: () => void;
  expenseId?: string;
  initialValues?: { title: string; amount: string; category?: string; expenseDate: string; description?: string };
}

export function AddExpenseScreen({ onBack, onSuccess, expenseId, initialValues }: AddExpenseScreenProps) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const isEditing = !!expenseId;
  const [selectedCategory, setSelectedCategory] = React.useState<Category | null>(
    (initialValues?.category as Category) ?? null,
  );

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialValues?.title ?? '',
      amount: initialValues?.amount ?? '',
      category: initialValues?.category ?? '',
      expenseDate: initialValues?.expenseDate ?? format(new Date(), 'yyyy-MM-dd'),
      description: initialValues?.description ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        title: data.title,
        amount: Number(data.amount),
        category: selectedCategory ?? undefined,
        expenseDate: data.expenseDate + 'T00:00:00.000Z',
        description: data.description || undefined,
      };
      return isEditing ? updateExpenseApi(expenseId, payload) : createExpenseApi(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      Toast.show({ type: 'success', text1: isEditing ? 'Expense updated' : 'Expense added', text2: isEditing ? '' : 'Club expense has been recorded' });
      onSuccess();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? (isEditing ? 'Failed to update expense' : 'Failed to add expense');
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    },
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>{isEditing ? 'Edit Expense' : 'Add Expense'}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Controller
          control={control}
          name="title"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Expense Title"
              placeholder="e.g. Ground booking fee"
              leftIcon="receipt-outline"
              autoCapitalize="sentences"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.title?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="amount"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Amount (₹)"
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

        {/* Category chips */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.groupLabel, { color: theme.text.secondary }]}>Category (optional)</Text>
          <View style={styles.chipsGrid}>
            {CATEGORIES.map(({ key, label, icon }) => {
              const active = selectedCategory === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? theme.primary : theme.surface,
                      borderColor: active ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => setSelectedCategory(active ? null : key)}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={icon as any}
                    size={14}
                    color={active ? '#fff' : theme.text.secondary}
                  />
                  <Text style={[styles.chipText, { color: active ? '#fff' : theme.text.secondary }]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Controller
          control={control}
          name="expenseDate"
          render={({ field: { value, onChange } }) => (
            <DatePickerInput
              label="Date"
              value={value}
              onChangeText={onChange}
              error={errors.expenseDate?.message}
              minYear={2020}
            />
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Reason (optional)"
              placeholder="e.g. Monthly ground rent payment"
              leftIcon="document-text-outline"
              autoCapitalize="sentences"
              multiline
              numberOfLines={3}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.description?.message}
            />
          )}
        />

        <Button
          title={isEditing ? 'Save Changes' : 'Add Expense'}
          fullWidth
          loading={mutation.isPending}
          onPress={handleSubmit((data) => mutation.mutate(data))}
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
  body: { padding: spacing[5], gap: spacing[5] },
  fieldGroup: { gap: spacing[3] },
  groupLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  chipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1] + 2,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radius.full,
    borderWidth: 1.5,
  },
  chipText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  submitBtn: { marginTop: spacing[2] },
});
