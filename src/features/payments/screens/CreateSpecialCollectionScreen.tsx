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
import { useCreateSpecialCollection } from '../hooks/usePayments';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const schema = z.object({
  label: z.string().min(1, 'Give this collection a name').max(100),
  amount: z.string().min(1, 'Amount is required').refine(
    (v) => !isNaN(Number(v)) && Number(v) > 0 && Number(v) <= 100000,
    'Enter a valid amount (1–1,00,000)',
  ),
  dueDay: z.string().min(1, 'Pick a due date').refine(
    (v) => !isNaN(Number(v)) && Number(v) >= 1 && Number(v) <= 31,
    'Enter a day between 1 and 31',
  ),
});

type FormData = z.infer<typeof schema>;

function daysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

interface CreateSpecialCollectionScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function CreateSpecialCollectionScreen({ onBack, onSuccess }: CreateSpecialCollectionScreenProps) {
  const { theme } = useTheme();
  const createCollection = useCreateSpecialCollection();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { label: '', amount: '', dueDay: '' },
  });

  const dueDayValue = watch('dueDay');
  const maxDay = useMemo(() => daysInMonth(month, year), [month, year]);
  const dueDayNum = Number(dueDayValue);
  const showDuePreview = dueDayValue.length > 0 && dueDayNum >= 1 && dueDayNum <= maxDay;

  const onSubmit = (data: FormData) => {
    const day = Number(data.dueDay);
    if (day > maxDay) {
      Toast.show({
        type: 'error',
        text1: 'Invalid due date',
        text2: `${MONTHS[month - 1]} ${year} has only ${maxDay} days`,
      });
      return;
    }

    const dueDate = new Date(year, month - 1, day, 12, 0, 0);

    createCollection.mutate(
      { label: data.label, amount: Number(data.amount), month, year, dueDate: dueDate.toISOString() },
      {
        onSuccess: (created) => {
          Toast.show({
            type: 'success',
            text1: 'Collection created',
            text2: `₹${data.amount} billed to ${created.stats.total} member${created.stats.total !== 1 ? 's' : ''}`,
          });
          onSuccess();
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message ?? 'Failed to create collection';
          Toast.show({ type: 'error', text1: 'Could not create collection', text2: msg });
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
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>New Special Collection</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.banner, { backgroundColor: theme.surfaceElevated, borderColor: theme.borderSubtle }]}>
          <Ionicons name="alert-circle-outline" size={16} color={theme.warning} />
          <Text style={[styles.bannerText, { color: theme.text.tertiary }]}>
            Every active member is billed this amount immediately on creation, in addition to their regular dues. This can't be undone — double-check the details first.
          </Text>
        </View>

        <Controller
          control={control}
          name="label"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Label"
              placeholder="e.g. Diwali Celebration"
              leftIcon="gift-outline"
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
              label="Amount (₹) per member"
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
          <Text style={[styles.groupLabel, { color: theme.text.secondary }]}>Billing month</Text>

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
              const m = i + 1;
              const active = m === month;
              return (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.monthChip,
                    {
                      backgroundColor: active ? theme.primary : theme.surface,
                      borderColor: active ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => setMonth(m)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.monthChipText, { color: active ? '#fff' : theme.text.secondary }]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Controller
          control={control}
          name="dueDay"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label={`Due date — day of ${MONTHS[month - 1]} (1–${maxDay})`}
              placeholder="e.g. 25"
              leftIcon="calendar-outline"
              keyboardType="number-pad"
              maxLength={2}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.dueDay?.message}
            />
          )}
        />
        {showDuePreview && (
          <Text style={[styles.hint, { color: theme.text.tertiary }]}>
            Members will see this as due by {dueDayNum} {MONTHS[month - 1]} {year}.
          </Text>
        )}

        <Button
          title="Create & Bill Members"
          fullWidth
          loading={createCollection.isPending}
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
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  bannerText: { flex: 1, fontSize: fontSize.xs, lineHeight: 16 },
  fieldGroup: { gap: spacing[3] },
  groupLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
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
  hint: { fontSize: fontSize.xs, lineHeight: 16, marginTop: -spacing[3] },
  submitBtn: {},
});
