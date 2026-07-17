import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useQuery } from '@tanstack/react-query';
import { Avatar } from '../../../components/ui/Avatar';
import { AvatarPicker } from '../../../components/ui/AvatarPicker';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { DatePickerInput } from '../../../components/ui/DatePickerInput';
import { useAuth } from '../../../hooks/useAuth';
import { useAuthStore } from '../../../store/auth.store';
import { useTheme } from '../../../hooks/useTheme';
import { useMember, useUpdateOwnProfile } from '../../members/hooks/useMembers';
import { fontSize, fontWeight } from '../../../theme/typography';
import { spacing, radius } from '../../../theme/spacing';
import { getClubApi } from '../../club/api/club.api';
import { format } from 'date-fns';
import { ChangePasswordModal } from '../components/ChangePasswordModal';

interface ProfileScreenProps {
  onBack: () => void;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

const editSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().min(10).max(15),
  email: z.string().email().or(z.literal('')).optional(),
  avatarUrl: z.string().url().or(z.literal('')).optional(),
  dateOfBirth: z.string().optional(),
  bloodGroup: z.enum(BLOOD_GROUPS).or(z.literal('')).optional(),
  emergencyContact: z.string().min(10).max(15).or(z.literal('')).optional(),
  newPassword: z.string().min(6).or(z.literal('')).optional(),
  confirmPassword: z.string().or(z.literal('')).optional(),
}).refine(
  (d) => !d.newPassword || d.newPassword === d.confirmPassword,
  { message: 'Passwords do not match', path: ['confirmPassword'] },
);
type EditForm = z.infer<typeof editSchema>;

function InfoRow({ icon, label, value }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  const { theme } = useTheme();
  return (
    <View style={[styles.infoRow, { borderBottomColor: theme.borderSubtle }]}>
      <View style={[styles.infoIcon, { backgroundColor: theme.borderSubtle }]}>
        <Ionicons name={icon} size={16} color={theme.text.secondary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: theme.text.tertiary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: theme.text.primary }]}>{value}</Text>
      </View>
    </View>
  );
}

function BloodGroupPicker({ value, onChange, theme }: { value: string; onChange: (v: string) => void; theme: any }) {
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

export function ProfileScreen({ onBack }: ProfileScreenProps) {
  const { theme } = useTheme();
  const { user, isAdmin } = useAuth();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [editMode, setEditMode] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  const { data: memberProfile, refetch: refetchProfile } = useMember(user?.id ?? '');
  const updateProfile = useUpdateOwnProfile();

  const { data: club, refetch: refetchClub } = useQuery({
    queryKey: ['club'],
    queryFn: getClubApi,
  });

  const handleRefresh = () => { refetchProfile(); refetchClub(); };

  const profileCompletion = memberProfile?.profileCompletion ?? 0;
  const pctColor = profileCompletion === 100 ? theme.success : profileCompletion >= 60 ? theme.warning : theme.danger;

  const { control, handleSubmit, formState: { errors }, reset } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    values: memberProfile
      ? {
          name: memberProfile.name,
          phone: memberProfile.phone,
          email: memberProfile.email ?? '',
          avatarUrl: memberProfile.avatarUrl ?? '',
          dateOfBirth: memberProfile.dateOfBirth
            ? new Date(memberProfile.dateOfBirth).toISOString().slice(0, 10)
            : '',
          bloodGroup: (memberProfile.bloodGroup as typeof BLOOD_GROUPS[number]) ?? '',
          emergencyContact: memberProfile.emergencyContact ?? '',
        }
      : undefined,
  });

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: clearAuth },
    ]);
  };

  const onSubmit = (data: EditForm) => {
    updateProfile.mutate(
      {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        avatarUrl: data.avatarUrl || null,
        dateOfBirth: data.dateOfBirth || null,
        bloodGroup: (data.bloodGroup as typeof BLOOD_GROUPS[number]) || null,
        emergencyContact: data.emergencyContact || null,
        ...(data.newPassword ? { password: data.newPassword } : {}),
      },
      {
        onSuccess: () => {
          Toast.show({ type: 'success', text1: 'Profile updated' });
          refetchProfile();
          setEditMode(false);
        },
        onError: () => Toast.show({ type: 'error', text1: 'Failed to update profile' }),
      },
    );
  };

  const dob = memberProfile?.dateOfBirth
    ? new Date(memberProfile.dateOfBirth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>My Profile</Text>
        <TouchableOpacity
          onPress={() => {
            if (editMode) {
              reset();
            }
            setEditMode((v) => !v);
          }}
          style={styles.backBtn}
        >
          <Ionicons
            name={editMode ? 'close-outline' : 'create-outline'}
            size={22}
            color={editMode ? theme.danger : theme.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={handleRefresh} />}
      >
        {/* Avatar hero */}
        <View style={[styles.hero, { backgroundColor: theme.surface }]}>
          <Avatar name={user?.name ?? '?'} uri={memberProfile?.avatarUrl} size={80} />
          <Text style={[styles.heroName, { color: theme.text.primary }]}>{user?.name}</Text>
          <View style={styles.heroMeta}>
            <Badge
              label={isAdmin ? 'Club Admin' : 'Member'}
              variant={isAdmin ? 'primary' : 'neutral'}
            />
          </View>
          {/* Profile completion bar */}
          {profileCompletion < 100 && (
            <View style={styles.completionWrap}>
              <View style={styles.completionHeader}>
                <Text style={[styles.completionLabel, { color: theme.text.secondary }]}>Profile completion</Text>
                <Text style={[styles.completionPct, { color: pctColor }]}>{profileCompletion}%</Text>
              </View>
              <View style={[styles.completionTrack, { backgroundColor: theme.borderSubtle }]}>
                <View style={[styles.completionFill, { backgroundColor: pctColor, width: `${profileCompletion}%` as any }]} />
              </View>
            </View>
          )}
        </View>

        {editMode ? (
          /* ── EDIT MODE ─────────────────────────────────────────── */
          <View style={styles.editSection}>
            {/* Avatar picker */}
            <Controller
              control={control}
              name="avatarUrl"
              render={({ field: { value, onChange } }) => (
                <View style={{ alignItems: 'center' }}>
                  <AvatarPicker
                    name={memberProfile?.name ?? user?.name ?? '?'}
                    currentUri={value || memberProfile?.avatarUrl}
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
                <Input label="Full Name" value={value} onChangeText={onChange} onBlur={onBlur}
                  error={errors.name?.message} leftIcon="person-outline" />
              )}
            />
            <Controller
              control={control}
              name="phone"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Phone" value={value} onChangeText={onChange} onBlur={onBlur}
                  keyboardType="phone-pad" error={errors.phone?.message} leftIcon="call-outline" />
              )}
            />
            <Controller
              control={control}
              name="email"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Email (optional)" value={value} onChangeText={onChange} onBlur={onBlur}
                  keyboardType="email-address" autoCapitalize="none"
                  error={errors.email?.message} leftIcon="mail-outline" />
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
                  <BloodGroupPicker value={value ?? ''} onChange={onChange} theme={theme} />
                )}
              />
            </View>

            <Controller
              control={control}
              name="emergencyContact"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Emergency Contact (optional)" value={value} onChangeText={onChange}
                  onBlur={onBlur} keyboardType="phone-pad"
                  error={errors.emergencyContact?.message} leftIcon="alert-circle-outline" />
              )}
            />

            <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Change Password</Text>
            <Controller
              control={control}
              name="newPassword"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="New Password (optional)" value={value} onChangeText={onChange} onBlur={onBlur}
                  isPassword leftIcon="lock-closed-outline" placeholder="Leave blank to keep current"
                  error={errors.newPassword?.message} />
              )}
            />
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Confirm Password" value={value} onChangeText={onChange} onBlur={onBlur}
                  isPassword leftIcon="lock-closed-outline" placeholder="Repeat new password"
                  error={errors.confirmPassword?.message} />
              )}
            />

            <Button
              title="Save Changes"
              onPress={handleSubmit(onSubmit)}
              loading={updateProfile.isPending}
              style={{ marginTop: spacing[2] }}
            />
          </View>
        ) : (
          /* ── VIEW MODE ─────────────────────────────────────────── */
          <>
            <Card padding={0}>
              <Text style={[styles.cardTitle, { color: theme.text.secondary }]}>Personal Details</Text>
              <InfoRow icon="person-outline" label="Full Name" value={memberProfile?.name ?? user?.name ?? '—'} />
              <InfoRow icon="call-outline" label="Phone" value={memberProfile?.phone ?? user?.phone ?? '—'} />
              {memberProfile?.email && <InfoRow icon="mail-outline" label="Email" value={memberProfile.email} />}
              {dob && <InfoRow icon="calendar-outline" label="Date of Birth" value={dob} />}
              {memberProfile?.bloodGroup && <InfoRow icon="water-outline" label="Blood Group" value={memberProfile.bloodGroup} />}
              {memberProfile?.emergencyContact && (
                <InfoRow icon="alert-circle-outline" label="Emergency Contact" value={memberProfile.emergencyContact} />
              )}
              <InfoRow icon="shield-outline" label="Role" value={isAdmin ? 'Club Administrator' : 'Club Member'} />
            </Card>

            <TouchableOpacity
              onPress={() => setShowChangePasswordModal(true)}
              style={[styles.securityCard, { backgroundColor: theme.dangerLight, borderColor: theme.danger }]}
              activeOpacity={0.8}
            >
              <View style={[styles.securityIcon, { backgroundColor: theme.danger }]}>
                <Ionicons name="lock-closed-outline" size={20} color="white" />
              </View>
              <View style={styles.securityContent}>
                <Text style={[styles.securityTitle, { color: theme.danger }]}>Change Password</Text>
                <Text style={[styles.securitySubtitle, { color: theme.danger }]}>Update your password for security</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color={theme.danger} />
            </TouchableOpacity>

            {club && (
              <Card padding={0}>
                <Text style={[styles.cardTitle, { color: theme.text.secondary }]}>Club Details</Text>
                <InfoRow icon="football-outline" label="Club Name" value={club.name} />
                {club.description && (
                  <InfoRow icon="document-text-outline" label="About" value={club.description} />
                )}
                <InfoRow icon="people-outline" label="Total Members" value={String(club._count.memberships)} />
                <InfoRow icon="calendar-outline" label="Member Since" value={format(new Date(club.createdAt), 'MMMM yyyy')} />
              </Card>
            )}

            <TouchableOpacity
              style={[styles.signOutBtn, { backgroundColor: theme.dangerLight, borderColor: theme.danger }]}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={18} color={theme.danger} />
              <Text style={[styles.signOutText, { color: theme.danger }]}>Sign Out</Text>
            </TouchableOpacity>

            <Text style={[styles.version, { color: theme.text.tertiary }]}>ClubFlow v1.0.0</Text>
          </>
        )}
      </ScrollView>

      <ChangePasswordModal
        visible={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
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
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  body: { gap: spacing[4], padding: spacing[5], paddingBottom: spacing[8] },
  hero: {
    alignItems: 'center',
    paddingVertical: spacing[6],
    borderRadius: radius['2xl'],
    gap: spacing[2],
    paddingHorizontal: spacing[5],
  },
  heroName: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, marginTop: spacing[2] },
  heroMeta: { flexDirection: 'row', gap: spacing[2] },
  completionWrap: { width: '100%', gap: spacing[2], marginTop: spacing[2] },
  completionHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  completionLabel: { fontSize: fontSize.xs },
  completionPct: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  completionTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  completionFill: { height: '100%', borderRadius: 3 },
  cardTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
  },
  infoIcon: { width: 34, height: 34, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: fontSize.xs, marginBottom: 2 },
  infoValue: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  editSection: { gap: spacing[4] },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing[2],
  },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, marginBottom: spacing[2] },
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
  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing[3],
  },
  securityIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityContent: { flex: 1 },
  securityTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  securitySubtitle: { fontSize: fontSize.xs, marginTop: spacing[1] },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    borderRadius: radius.xl,
    borderWidth: 1.5,
  },
  signOutText: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  version: { textAlign: 'center', fontSize: fontSize.xs },
});
