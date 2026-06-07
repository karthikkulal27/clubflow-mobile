import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { SectionHeader } from '../../../components/layout/SectionHeader';
import { Card } from '../../../components/ui/Card';
import { SkeletonCard } from '../../../components/ui/Skeleton';
import { BalanceCard } from '../components/BalanceCard';
import { PaymentStatusCard } from '../components/PaymentStatusCard';
import { useDashboard } from '../hooks/useDashboard';
import { useMember } from '../../members/hooks/useMembers';
import { usePayNow } from '../../payments/hooks/usePayments';
import { useAuth } from '../../../hooks/useAuth';
import { useTheme } from '../../../hooks/useTheme';
import { useAuthStore } from '../../../store/auth.store';
import { fontSize, fontWeight } from '../../../theme/typography';
import { spacing, radius } from '../../../theme/spacing';
import { format } from 'date-fns';
import type { MemberDashboard } from '../../../types';

let nudgeDismissedThisSession = false;

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function MemberDashboardScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { data, isLoading, refetch, isRefetching } = useDashboard();
  const { data: memberProfile } = useMember(user?.id ?? '');
  const payNow = usePayNow();
  const [showNudge, setShowNudge] = useState(!nudgeDismissedThisSession);

  const profileCompletion = memberProfile?.profileCompletion ?? 0;

  const dismissNudge = () => {
    nudgeDismissedThisSession = true;
    setShowNudge(false);
  };

  const dashboard = data as MemberDashboard | undefined;

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: clearAuth },
    ]);
  };

  const handlePayNow = () => {
    const paymentId = (data as MemberDashboard | undefined)?.currentDue?.id;
    if (paymentId) payNow.mutate(paymentId);
  };

  return (
    <ScreenWrapper refreshing={isRefetching} onRefresh={refetch}>
      {/* Header */}
      <View style={styles.topBar}>
        <View>
          <Text style={[styles.greeting, { color: theme.text.secondary }]}>Hello,</Text>
          <Text style={[styles.name, { color: theme.text.primary }]}>{user?.name}</Text>
        </View>
        <Ionicons
          name="log-out-outline"
          size={22}
          color={theme.text.secondary}
          onPress={handleLogout}
        />
      </View>

      {isLoading ? (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      ) : dashboard ? (
        <>
          {/* Profile completion bar (permanent until 100%) */}
          {profileCompletion < 100 && (
            <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.profileCardHeader}>
                <View style={styles.profileCardLeft}>
                  <Ionicons name="person-circle-outline" size={22} color={theme.primary} />
                  <View>
                    <Text style={[styles.profileCardTitle, { color: theme.text.primary }]}>Profile completion</Text>
                    <Text style={[styles.profileCardPct, {
                      color: profileCompletion >= 60 ? theme.warning : theme.danger,
                    }]}>{profileCompletion}% complete</Text>
                  </View>
                </View>
                {showNudge && (
                  <TouchableOpacity onPress={dismissNudge} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                    <Ionicons name="close" size={18} color={theme.text.tertiary} />
                  </TouchableOpacity>
                )}
              </View>
              <View style={[styles.profileTrack, { backgroundColor: theme.borderSubtle }]}>
                <View style={[styles.profileFill, {
                  backgroundColor: profileCompletion >= 60 ? theme.warning : theme.danger,
                  width: `${profileCompletion}%` as any,
                }]} />
              </View>
              {showNudge && (
                <Text style={[styles.profileNudge, { color: theme.text.tertiary }]}>
                  Add your photo, email, date of birth, blood group and emergency contact to reach 100%.
                </Text>
              )}
            </View>
          )}

          {/* Payment Status */}
          <PaymentStatusCard currentDue={dashboard.currentDue} onPayNow={handlePayNow} />

          {/* Balance */}
          <BalanceCard
            totalCollection={dashboard.finance.totalCollection}
            totalExpenses={dashboard.finance.totalExpenses}
            availableBalance={dashboard.finance.availableBalance}
          />

          {/* Latest Announcement */}
          {dashboard.latestAnnouncement && (
            <View style={styles.section}>
              <SectionHeader title="Latest Announcement" />
              <Card>
                <View style={styles.announcementRow}>
                  <View style={[styles.announcementIcon, { backgroundColor: theme.warningLight }]}>
                    <Ionicons name="megaphone-outline" size={18} color={theme.warning} />
                  </View>
                  <View style={styles.announcementContent}>
                    <Text style={[styles.announcementTitle, { color: theme.text.primary }]}>
                      {dashboard.latestAnnouncement.title}
                    </Text>
                    <Text
                      style={[styles.announcementBody, { color: theme.text.secondary }]}
                      numberOfLines={2}
                    >
                      {dashboard.latestAnnouncement.body}
                    </Text>
                    <Text style={[styles.announcementDate, { color: theme.text.tertiary }]}>
                      {format(new Date(dashboard.latestAnnouncement.publishedAt), 'MMM d, yyyy')}
                    </Text>
                  </View>
                </View>
              </Card>
            </View>
          )}

          {/* Upcoming Events */}
          {dashboard.upcomingEvents.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="Upcoming Events" />
              {dashboard.upcomingEvents.map((event) => (
                <Card key={event.id} style={styles.eventCard}>
                  <View style={styles.eventRow}>
                    <View style={[styles.eventDot, { backgroundColor: theme.primaryLight }]}>
                      <Ionicons name="calendar-outline" size={16} color={theme.primary} />
                    </View>
                    <View style={styles.eventInfo}>
                      <Text style={[styles.eventTitle, { color: theme.text.primary }]}>
                        {event.title}
                      </Text>
                      <Text style={[styles.eventMeta, { color: theme.text.secondary }]}>
                        {format(new Date(event.startAt), 'EEE, MMM d • h:mm a')}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          )}

          {/* Payment History */}
          {dashboard.myPaymentHistory.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="Payment History" />
              {dashboard.myPaymentHistory.map((payment) => (
                <View
                  key={payment.id}
                  style={[styles.payRow, { borderBottomColor: theme.borderSubtle }]}
                >
                  <View
                    style={[
                      styles.payStatusDot,
                      {
                        backgroundColor:
                          payment.status === 'PAID' ? theme.successLight : theme.warningLight,
                      },
                    ]}
                  >
                    <Ionicons
                      name={payment.status === 'PAID' ? 'checkmark' : 'time-outline'}
                      size={12}
                      color={payment.status === 'PAID' ? theme.success : theme.warning}
                    />
                  </View>
                  <View style={styles.payInfo}>
                    <Text style={[styles.payMonth, { color: theme.text.primary }]}>
                      {MONTHS[payment.month - 1]} {payment.year}
                    </Text>
                    <Text style={[styles.payStatus, { color: payment.status === 'PAID' ? theme.success : theme.warning }]}>
                      {payment.status}
                    </Text>
                  </View>
                  <Text style={[styles.payAmount, { color: theme.text.primary }]}>
                    ₹{Number(payment.amount).toLocaleString('en-IN')}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      ) : null}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[5],
    paddingTop: spacing[2],
  },
  greeting: { fontSize: fontSize.sm },
  name: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  section: { marginTop: spacing[5] },
  announcementRow: { flexDirection: 'row', gap: spacing[3] },
  announcementIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  announcementContent: { flex: 1, gap: 3 },
  announcementTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  announcementBody: { fontSize: fontSize.xs, lineHeight: 18 },
  announcementDate: { fontSize: fontSize.xs },
  eventCard: { marginBottom: spacing[3] },
  eventRow: { flexDirection: 'row', gap: spacing[3], alignItems: 'center' },
  eventDot: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  eventMeta: { fontSize: fontSize.xs, marginTop: 2 },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
  },
  payStatusDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payInfo: { flex: 1 },
  payMonth: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  payStatus: { fontSize: fontSize.xs, fontWeight: fontWeight.medium, marginTop: 1 },
  payAmount: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  profileCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing[4],
    gap: spacing[3],
    marginBottom: spacing[1],
  },
  profileCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  profileCardLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  profileCardTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  profileCardPct: { fontSize: fontSize.xs, marginTop: 2 },
  profileTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  profileFill: { height: '100%', borderRadius: 3 },
  profileNudge: { fontSize: fontSize.xs, lineHeight: 16 },
});
