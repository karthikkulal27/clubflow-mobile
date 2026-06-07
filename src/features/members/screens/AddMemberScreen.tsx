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
import { addMemberApi } from '../api/members.api';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().length(10, 'Phone must be exactly 10 digits').regex(/^\d+$/, 'Digits only'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['MEMBER', 'ADMIN']),
});

type FormData = z.infer<typeof schema>;

interface AddMemberScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function AddMemberScreen({ onBack, onSuccess }: AddMemberScreenProps) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', password: '', role: 'MEMBER' },
  });

  const role = watch('role');

  const mutation = useMutation({
    mutationFn: addMemberApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      Toast.show({ type: 'success', text1: 'Member added', text2: 'New member has been added to the club' });
      onSuccess();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Failed to add member';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    },
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Add Member</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Full Name"
              placeholder="e.g. Rahul Sharma"
              leftIcon="person-outline"
              autoCapitalize="words"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.name?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Phone Number"
              placeholder="10-digit mobile number"
              leftIcon="call-outline"
              keyboardType="number-pad"
              maxLength={10}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.phone?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Initial Password"
              placeholder="Member's login password"
              leftIcon="lock-closed-outline"
              isPassword
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
              hint="Member can change this after first login"
            />
          )}
        />

        {/* Role selector */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: theme.text.secondary }]}>Role</Text>
          <View style={styles.roleRow}>
            {(['MEMBER', 'ADMIN'] as const).map((r) => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.roleChip,
                  {
                    backgroundColor: role === r ? theme.primary : theme.surface,
                    borderColor: role === r ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setValue('role', r)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={r === 'ADMIN' ? 'shield-checkmark-outline' : 'person-outline'}
                  size={16}
                  color={role === r ? '#fff' : theme.text.secondary}
                />
                <Text style={[styles.roleChipText, { color: role === r ? '#fff' : theme.text.secondary }]}>
                  {r === 'ADMIN' ? 'Admin' : 'Member'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {role === 'ADMIN' && (
            <View style={[styles.adminWarning, { backgroundColor: theme.warningLight }]}>
              <Ionicons name="warning-outline" size={14} color={theme.warning} />
              <Text style={[styles.adminWarningText, { color: theme.warning }]}>
                Admin can manage all club data
              </Text>
            </View>
          )}
        </View>

        <Button
          title="Add Member"
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
  fieldGroup: { gap: spacing[2] },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  roleRow: { flexDirection: 'row', gap: spacing[3] },
  roleChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  roleChipText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  adminWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.md,
    marginTop: spacing[2],
  },
  adminWarningText: { fontSize: fontSize.xs, flex: 1 },
  submitBtn: { marginTop: spacing[2] },
});
