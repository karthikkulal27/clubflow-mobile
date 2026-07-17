import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useTheme } from '../../../hooks/useTheme';
import { fontSize, fontWeight } from '../../../theme/typography';
import { spacing, radius } from '../../../theme/spacing';
import { changePasswordApi } from '../../auth/api/auth.api';

const schema = z.object({
  oldPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ visible, onClose }: Props) {
  const { theme } = useTheme();
  const { control, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => changePasswordApi(data.oldPassword, data.newPassword),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Password changed successfully' });
      reset();
      onClose();
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err?.response?.data?.message ?? 'Failed to change password',
      });
    },
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconBg, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: theme.text.primary }]}>Change Password</Text>
              <Text style={[styles.subtitle, { color: theme.text.tertiary }]}>
                Keep your account secure
              </Text>
            </View>
          </View>

          {/* Form */}
          <ScrollView style={styles.form} scrollEnabled={false}>
            <Controller
              control={control}
              name="oldPassword"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Current Password"
                  placeholder="Enter current password"
                  leftIcon="lock-closed-outline"
                  isPassword
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.oldPassword?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="newPassword"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="New Password"
                  placeholder="Enter new password"
                  leftIcon="lock-closed-outline"
                  isPassword
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.newPassword?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Confirm Password"
                  placeholder="Confirm new password"
                  leftIcon="lock-closed-outline"
                  isPassword
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                />
              )}
            />
          </ScrollView>

          {/* Buttons */}
          <View style={styles.buttons}>
            <Button
              title="Change Password"
              fullWidth
              loading={mutation.isPending}
              onPress={handleSubmit((data) => mutation.mutate(data))}
            />
            <Button
              title="Cancel"
              variant="secondary"
              fullWidth
              disabled={mutation.isPending}
              onPress={onClose}
              style={{ marginTop: spacing[2] }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  modal: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing[4],
    width: '100%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  subtitle: {
    fontSize: fontSize.sm,
    marginTop: spacing[1],
  },
  form: {
    marginBottom: spacing[4],
    gap: spacing[3],
  },
  buttons: {
    gap: spacing[2],
  },
});
