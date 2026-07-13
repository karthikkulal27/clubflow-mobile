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
import { useTheme } from '../../../hooks/useTheme';
import { fontSize, fontWeight } from '../../../theme/typography';
import { spacing, radius } from '../../../theme/spacing';
import { createIncomeApi } from '../api/income.api';

const CATEGORIES = [
  { key: 'opening-balance', label: 'Opening Balance', icon: 'wallet-outline' },
  { key: 'donation', label: 'Donation', icon: 'gift-outline' },
  { key: 'sponsorship', label: 'Sponsorship', icon: 'handshake-outline' },
  { key: 'event-revenue', label: 'Event Revenue', icon: 'ticket-outline' },
  { key: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
] as const;

type Category = typeof CATEGORIES[number]['label'];

const schema = z.object({
  amount: z.string().min(1, 'Amount is required').refine(
    (v) => !isNaN(Number(v)) && Number(v) > 0,
    'Enter a valid amount',
  ),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface AddIncomeScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function AddIncomeScreen({ onBack, onSuccess }: AddIncomeScreenProps) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = React.useState<Category>('Opening Balance');

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: '',
      description: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        category: selectedCategory,
        amount: Number(data.amount),
        description: data.description || undefined,
      };
      return createIncomeApi(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      Toast.show({ type: 'success', text1: 'Income added', text2: 'Club income has been recorded' });
      onSuccess();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Failed to add income';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    },
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="chevron-back" size={28} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Add Income</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding: spacing[4] }}>
          {/* Category Selector */}
          <View style={{ marginBottom: spacing[6] }}>
            <Text style={[styles.label, { color: theme.text.primary }]}>Category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  onPress={() => setSelectedCategory(cat.label)}
                  activeOpacity={0.7}
                  style={[
                    styles.categoryBtn,
                    {
                      backgroundColor: selectedCategory === cat.label ? theme.primary : theme.card,
                      borderColor: theme.cardBorder,
                    },
                  ]}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={20}
                    color={selectedCategory === cat.label ? '#fff' : theme.text.primary}
                  />
                  <Text
                    style={[
                      styles.categoryLabel,
                      { color: selectedCategory === cat.label ? '#fff' : theme.text.secondary },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Amount Input */}
          <View style={{ marginBottom: spacing[5] }}>
            <Text style={[styles.label, { color: theme.text.primary }]}>Amount (₹)</Text>
            <Controller
              control={control}
              name="amount"
              render={({ field: { value, onChange } }) => (
                <Input
                  placeholder="0"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="decimal-pad"
                  error={!!errors.amount}
                />
              )}
            />
            {errors.amount && <Text style={[styles.error, { color: theme.danger }]}>{errors.amount.message}</Text>}
          </View>

          {/* Description Input */}
          <View style={{ marginBottom: spacing[5] }}>
            <Text style={[styles.label, { color: theme.text.primary }]}>Description (Optional)</Text>
            <Controller
              control={control}
              name="description"
              render={({ field: { value, onChange } }) => (
                <Input
                  placeholder="e.g., XYZ Corporation sponsorship"
                  value={value}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={3}
                />
              )}
            />
          </View>

          {/* Info box */}
          <View style={[styles.infoBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Ionicons name="information-circle-outline" size={18} color={theme.text.secondary} />
            <Text style={[styles.infoText, { color: theme.text.secondary }]}>
              All active members will be notified about this income entry.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <Button
          text={mutation.isPending ? 'Adding...' : 'Add Income'}
          disabled={mutation.isPending}
          onPress={handleSubmit((data) => mutation.mutate(data))}
        />
      </View>
    </KeyboardAvoidingView>
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
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: spacing[2],
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    justifyContent: 'space-between',
  },
  categoryBtn: {
    width: '48%',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing[1],
  },
  categoryLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },
  error: {
    fontSize: fontSize.xs,
    marginTop: spacing[1],
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: radius.md,
    borderWidth: 1,
  },
  infoText: {
    fontSize: fontSize.xs,
    flex: 1,
  },
  footer: {
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    borderTopWidth: 1,
  },
});
