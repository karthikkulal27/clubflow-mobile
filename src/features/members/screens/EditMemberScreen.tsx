import React from 'react';
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
import { AvatarPicker } from '../../../components/ui/AvatarPicker';
import { DatePickerInput } from '../../../components/ui/DatePickerInput';
import { useMember, useUpdateMember } from '../hooks/useMembers';
import { useTheme } from '../../../hooks/useTheme';
import { fontSize, fontWeight } from '../../../theme/typography';
import { spacing, radius } from '../../../theme/spacing';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().min(10, 'Enter a valid phone number').max(15),
  email: z.string().email('Enter a valid email').or(z.literal('')).optional(),
  avatarUrl: z.string().url('Enter a valid URL').or(z.literal('')).optional(),
  dateOfBirth: z.string().optional(),
  bloodGroup: z.enum(BLOOD_GROUPS).or(z.literal('')).optional(),
  emergencyContact: z.string().min(10).max(15).or(z.literal('')).optional(),
  role: z.enum(['ADMIN', 'MEMBER']),
  newPassword: z.string().min(6, 'Password must be at least 6 characters').or(z.literal('')).optional(),
});

type FormData = z.infer<typeof schema>;

interface EditMemberScreenProps {
  userId: string;
  onBack: () => void;
  onSuccess: () => void;
}

function RolePicker({ value, onChange }: { value: string; onChange: (v: 'ADMIN' | 'MEMBER') => void }) {
  const { theme } = useTheme();
  const options: Array<{ value: 'ADMIN' | 'MEMBER'; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
    { value: 'MEMBER', label: 'Member', icon: 'person-outline' },
    { value: 'ADMIN', label: 'Admin', icon: 'shield-outline' },
  ];
  return (
    <View style={styles.roleRow}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.roleChip,
              {
                borderColor: selected ? theme.primary : theme.border,
                backgroundColor: selected ? theme.primaryLight : theme.surface,
              },
            ]}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.8}
          >
            <Ionicons name={opt.icon} size={15} color={selected ? theme.primary : theme.text.secondary} />
            <Text style={[styles.roleChipText, { color: selected ? theme.primary : theme.text.secondary }]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function BloodGroupPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { theme } = useTheme();
  return (
    <View style={styles.bgGrid}>
      {[...BLOOD_GROUPS, ''].map((bg) => {
        const label = bg || 'Clear';
        const selected = value === bg;
        return (
          <TouchableOpacity
            key={label}
            style={[
              styles.bgChip,
              {
                borderColor: selected ? theme.primary : theme.border,
                backgroundColor: selected ? theme.primaryLight : theme.surface,
              },
            ]}
            onPress={() => onChange(bg)}
            activeOpacity={0.8}
          >
            <Text style={[styles.bgChipText, { color: selected ? theme.primary : theme.text.secondary }]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function EditMemberScreen({ userId, onBack, onSuccess }: EditMemberScreenProps) {
  const { theme } = useTheme();
  const { data: member, isLoading } = useMember(userId);
  const updateMember = useUpdateMember(userId);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: member
      ? {
          name: member.name,
          phone: member.phone,
          email: member.email ?? '',
          avatarUrl: member.avatarUrl ?? '',
          dateOfBirth: member.dateOfBirth
            ? new Date(member.dateOfBirth).toISOString().slice(0, 10)
            : '',
          bloodGroup: (member.bloodGroup as typeof BLOOD_GROUPS[number]) ?? '',
          emergencyContact: member.emergencyContact ?? '',
          role: member.role,
        }
      : undefined,
  });

  const onSubmit = (data: FormData) => {
    const payload = {
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      avatarUrl: data.avatarUrl || null,
      dateOfBirth: data.dateOfBirth || null,
      bloodGroup: (data.bloodGroup as typeof BLOOD_GROUPS[number]) || null,
      emergencyContact: data.emergencyContact || null,
      role: data.role,
      ...(data.newPassword ? { password: data.newPassword } : {}),
    };

    updateMember.mutate(payload, {
      onSuccess: () => {
        Toast.show({ type: 'success', text1: 'Member updated' });
        onSuccess();
      },
      onError: () => Toast.show({ type: 'error', text1: 'Failed to update member' }),
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Edit Member</Text>
        <View style={styles.headerBtn} />
      </View>

      {isLoading ? null : (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {/* Avatar picker */}
          <Controller
            control={control}
            name="avatarUrl"
            render={({ field: { value, onChange } }) => (
              <View style={{ alignItems: 'center', marginBottom: spacing[2] }}>
                <AvatarPicker
                  name={member?.name ?? '?'}
                  currentUri={value || member?.avatarUrl}
                  size={80}
                  onUploaded={onChange}
                />
              </View>
            )}
          />

          <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Basic Info</Text>

          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Full Name"
                placeholder="e.g. Rajesh Kumar"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.name?.message}
                leftIcon="person-outline"
              />
            )}
          />

          <Controller
            control={control}
            name="phone"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Phone Number"
                placeholder="e.g. 9876543210"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="phone-pad"
                error={errors.phone?.message}
                leftIcon="call-outline"
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Email (optional)"
                placeholder="e.g. member@email.com"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email?.message}
                leftIcon="mail-outline"
              />
            )}
          />

          <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Personal Details</Text>

          <Controller
            control={control}
            name="dateOfBirth"
            render={({ field: { value, onChange } }) => (
              <DatePickerInput
                label="Date of Birth (optional)"
                value={value ?? ''}
                onChangeText={onChange}
                error={errors.dateOfBirth?.message}
              />
            )}
          />

          <View>
            <Text style={[styles.fieldLabel, { color: theme.text.secondary }]}>Blood Group (optional)</Text>
            <Controller
              control={control}
              name="bloodGroup"
              render={({ field: { value, onChange } }) => (
                <BloodGroupPicker value={value ?? ''} onChange={onChange} />
              )}
            />
          </View>

          <Controller
            control={control}
            name="emergencyContact"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Emergency Contact (optional)"
                placeholder="e.g. 9876543210"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="phone-pad"
                error={errors.emergencyContact?.message}
                leftIcon="alert-circle-outline"
              />
            )}
          />

          <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Club Role</Text>

          <View>
            <Text style={[styles.fieldLabel, { color: theme.text.secondary }]}>Role</Text>
            <Controller
              control={control}
              name="role"
              render={({ field: { value, onChange } }) => (
                <RolePicker value={value} onChange={onChange} />
              )}
            />
            <Text style={[styles.roleHint, { color: theme.text.tertiary }]}>
              Admins can manage members, dues, expenses and events.
            </Text>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Reset Password</Text>

          <Controller
            control={control}
            name="newPassword"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="New Password (optional)"
                placeholder="Leave blank to keep current password"
                isPassword
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.newPassword?.message}
                leftIcon="lock-closed-outline"
                hint="Only fill this if you want to change the member's password"
              />
            )}
          />

          <Button
            title="Save Changes"
            onPress={handleSubmit(onSubmit)}
            loading={updateMember.isPending}
            style={{ marginTop: spacing[4] }}
          />
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing[5], gap: spacing[4], paddingBottom: spacing[10] },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing[2],
    marginBottom: -spacing[1],
  },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, marginBottom: spacing[2] },
  roleRow: { flexDirection: 'row', gap: spacing[3] },
  roleChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: radius.xl,
    borderWidth: 1.5,
  },
  roleChipText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  roleHint: { fontSize: fontSize.xs, marginTop: spacing[2] },
  bgGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  bgChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.lg,
    borderWidth: 1.5,
    minWidth: 52,
    alignItems: 'center',
  },
  bgChipText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
});
