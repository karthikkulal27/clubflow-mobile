import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { useMember, useDeactivateMember, useReactivateMember, useDeleteMember } from '../hooks/useMembers';
import { useTheme } from '../../../hooks/useTheme';
import { fontSize, fontWeight } from '../../../theme/typography';
import { spacing, radius } from '../../../theme/spacing';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.infoRow, { borderBottomColor: theme.borderSubtle }]}>
      <View style={[styles.infoIcon, { backgroundColor: theme.borderSubtle }]}>
        <Ionicons name={icon} size={15} color={theme.text.secondary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: theme.text.tertiary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: theme.text.primary }]}>{value}</Text>
      </View>
    </View>
  );
}

function CompletionBar({ pct }: { pct: number }) {
  const { theme } = useTheme();
  const color = pct === 100 ? theme.success : pct >= 60 ? theme.warning : theme.danger;
  return (
    <View style={styles.completionWrap}>
      <View style={styles.completionHeader}>
        <Text style={[styles.completionLabel, { color: theme.text.secondary }]}>Profile completion</Text>
        <Text style={[styles.completionPct, { color }]}>{pct}%</Text>
      </View>
      <View style={[styles.completionTrack, { backgroundColor: theme.borderSubtle }]}>
        <View style={[styles.completionFill, { backgroundColor: color, width: `${pct}%` as any }]} />
      </View>
    </View>
  );
}

interface MemberDetailScreenProps {
  userId: string;
  onBack: () => void;
  onEdit: (userId: string) => void;
  onViewPayments: (userId: string, name: string) => void;
}

export function MemberDetailScreen({ userId, onBack, onEdit, onViewPayments }: MemberDetailScreenProps) {
  const { theme } = useTheme();
  const { data: member, isLoading, refetch, isRefetching } = useMember(userId);
  const deactivate = useDeactivateMember();
  const reactivate = useReactivateMember();
  const deleteMember = useDeleteMember();

  const handleDeactivate = () => {
    Alert.alert(
      'Deactivate Member',
      `${member?.name} will be marked inactive. They won't receive new dues but their history is kept. You can reactivate them anytime.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: () => deactivate.mutate(userId, {
            onSuccess: () => { Toast.show({ type: 'success', text1: 'Member deactivated' }); refetch(); },
            onError: () => Toast.show({ type: 'error', text1: 'Failed to deactivate' }),
          }),
        },
      ],
    );
  };

  const handleReactivate = () => {
    Alert.alert(
      'Reactivate Member',
      `${member?.name} will be marked active again and will receive future dues.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reactivate',
          onPress: () => reactivate.mutate(userId, {
            onSuccess: () => { Toast.show({ type: 'success', text1: 'Member reactivated' }); refetch(); },
            onError: () => Toast.show({ type: 'error', text1: 'Failed to reactivate' }),
          }),
        },
      ],
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Remove from Club',
      `${member?.name} will be removed from the club. Their payment history is preserved but they will no longer appear in the members list. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => deleteMember.mutate(userId, {
            onSuccess: () => { Toast.show({ type: 'success', text1: 'Member removed' }); onBack(); },
            onError: () => Toast.show({ type: 'error', text1: 'Failed to remove member' }),
          }),
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={theme.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Member</Text>
          <View style={styles.backBtn} />
        </View>
        <ActivityIndicator style={{ marginTop: 60 }} size="large" color={theme.primary} />
      </View>
    );
  }

  if (!member) return null;

  const dob = member.dateOfBirth
    ? new Date(member.dateOfBirth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const joined = new Date(member.joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Member Details</Text>
        <TouchableOpacity onPress={() => onEdit(userId)} style={styles.backBtn}>
          <Ionicons name="create-outline" size={22} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: theme.surface }]}>
          <Avatar name={member.name} uri={member.avatarUrl} size={80} />
          <Text style={[styles.heroName, { color: theme.text.primary }]}>{member.name}</Text>
          <View style={styles.heroBadges}>
            <Badge label={member.role} variant={member.role === 'ADMIN' ? 'primary' : 'neutral'} />
            {!member.isActive && <Badge label="Inactive" variant="warning" />}
          </View>
          <CompletionBar pct={member.profileCompletion} />
        </View>

        {/* Payment summary */}
        {member.paymentSummary && (
          <Card padding={spacing[4]}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryStat}>
                <Text style={[styles.summaryNum, { color: theme.success }]}>{member.paymentSummary.paidCount}</Text>
                <Text style={[styles.summaryLbl, { color: theme.text.secondary }]}>Payments paid</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: theme.borderSubtle }]} />
              <View style={styles.summaryStat}>
                <Text style={[styles.summaryNum, { color: theme.warning }]}>{member.paymentSummary.pendingCount}</Text>
                <Text style={[styles.summaryLbl, { color: theme.text.secondary }]}>Pending</Text>
              </View>
              <TouchableOpacity
                style={[styles.viewPaymentsBtn, { backgroundColor: theme.primaryLight }]}
                onPress={() => onViewPayments(userId, member.name)}
                activeOpacity={0.8}
              >
                <Text style={[styles.viewPaymentsBtnText, { color: theme.primary }]}>View payments</Text>
                <Ionicons name="arrow-forward" size={13} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Personal info */}
        <Card padding={0}>
          <Text style={[styles.cardTitle, { color: theme.text.secondary }]}>Personal Details</Text>
          <InfoRow icon="person-outline" label="Full Name" value={member.name} />
          <InfoRow icon="call-outline" label="Phone" value={member.phone} />
          {member.email && <InfoRow icon="mail-outline" label="Email" value={member.email} />}
          {dob && <InfoRow icon="calendar-outline" label="Date of Birth" value={dob} />}
          {member.bloodGroup && <InfoRow icon="water-outline" label="Blood Group" value={member.bloodGroup} />}
          {member.emergencyContact && <InfoRow icon="alert-circle-outline" label="Emergency Contact" value={member.emergencyContact} />}
        </Card>

        {/* Club info */}
        <Card padding={0}>
          <Text style={[styles.cardTitle, { color: theme.text.secondary }]}>Club Info</Text>
          <InfoRow icon="shield-outline" label="Role" value={member.role === 'ADMIN' ? 'Club Administrator' : 'Club Member'} />
          <InfoRow icon="radio-button-on-outline" label="Status" value={member.isActive ? 'Active' : 'Inactive'} />
          <InfoRow icon="time-outline" label="Joined" value={joined} />
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          {member.isActive ? (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.warningLight, borderColor: theme.warning }]}
              onPress={handleDeactivate}
              activeOpacity={0.8}
            >
              <Ionicons name="pause-circle-outline" size={18} color={theme.warning} />
              <Text style={[styles.actionBtnText, { color: theme.warning }]}>Deactivate</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.successLight, borderColor: theme.success }]}
              onPress={handleReactivate}
              activeOpacity={0.8}
            >
              <Ionicons name="play-circle-outline" size={18} color={theme.success} />
              <Text style={[styles.actionBtnText, { color: theme.success }]}>Reactivate</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.dangerLight, borderColor: theme.danger }]}
            onPress={handleDelete}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={18} color={theme.danger} />
            <Text style={[styles.actionBtnText, { color: theme.danger }]}>Remove from Club</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
  heroBadges: { flexDirection: 'row', gap: spacing[2] },
  completionWrap: { width: '100%', gap: spacing[2], marginTop: spacing[2] },
  completionHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  completionLabel: { fontSize: fontSize.xs },
  completionPct: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  completionTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  completionFill: { height: '100%', borderRadius: 3 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  summaryStat: { alignItems: 'center', gap: 2 },
  summaryNum: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  summaryLbl: { fontSize: fontSize.xs },
  summaryDivider: { width: 1, height: 32, marginHorizontal: spacing[2] },
  viewPaymentsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    paddingVertical: spacing[2],
    borderRadius: radius.lg,
    marginLeft: spacing[2],
  },
  viewPaymentsBtnText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
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
  infoIcon: { width: 32, height: 32, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: fontSize.xs, marginBottom: 2 },
  infoValue: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  actions: { gap: spacing[3] },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    borderRadius: radius.xl,
    borderWidth: 1.5,
  },
  actionBtnText: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
});
