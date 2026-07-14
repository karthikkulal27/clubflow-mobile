import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useNotificationCount } from '../../../hooks/useNotificationCount';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { SectionHeader } from '../../../components/layout/SectionHeader';
import { Card } from '../../../components/ui/Card';
import { SkeletonCard } from '../../../components/ui/Skeleton';
import { BalanceCard } from '../components/BalanceCard';
import { PaymentStatusCard } from '../components/PaymentStatusCard';
import { useQuery } from '@tanstack/react-query';
import { useDashboard } from '../hooks/useDashboard';
import { useMember } from '../../members/hooks/useMembers';
import { usePayNow } from '../../payments/hooks/usePayments';
import { useAuth } from '../../../hooks/useAuth';
import { useTheme } from '../../../hooks/useTheme';
import { useAuthStore } from '../../../store/auth.store';
import { useClubBrandingStore } from '../../../store/club-branding.store';
import { getClubBrandingApi } from '../../club/api/club.api';
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
  const storedBranding = useClubBrandingStore((s) => s.branding);
  const setBranding = useClubBrandingStore((s) => s.setBranding);
  const { data: brandingData } = useQuery({
    queryKey: ['club-branding'],
    queryFn: getClubBrandingApi,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  const branding = brandingData || storedBranding;
  const { data, isLoading, refetch, isRefetching } = useDashboard();
  const { data: memberProfile } = useMember(user?.id ?? '');
  const payNow = usePayNow();
  const navigation = useNavigation<any>();
  const [showNudge, setShowNudge] = useState(!nudgeDismissedThisSession);
  const unreadCount = useNotificationCount();

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
        <View style={styles.topActions}>
          <TouchableOpacity onPress={() => navigation.navigate('More', { screen: 'Notifications' })} style={styles.bellBtn}>
            <Ionicons name="notifications-outline" size={22} color={theme.text.secondary} />
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: theme.danger }]}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <Ionicons
            name="log-out-outline"
            size={22}
            color={theme.text.secondary}
            onPress={handleLogout}
          />
        </View>
      </View>

      {isLoading ? (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      ) : dashboard ? (
        <>
          {/* Club Branding Section */}
          {branding && branding.name && (
            <View style={[styles.brandingCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.brandingContent}>
                {branding.logoUrl && (
                  <View style={[styles.logoContainer, { backgroundColor: theme.primaryLight }]}>
                    <Image
                      source={{ uri: branding.logoUrl }}
                      style={styles.clubLogo}
                      resizeMode="contain"
                    />
                    <View style={[styles.logoBadge, { backgroundColor: theme.primary }]} />
                  </View>
                )}
                <View style={styles.brandingTextContainer}>
                  <Text style={[styles.clubName, { color: theme.text.primary }]}>{branding.name}</Text>
                  {branding.slogan && (
                    <Text style={[styles.clubSlogan, { color: theme.text.secondary }]}>{branding.slogan}</Text>
                  )}
                  <View style={styles.accentBars}>
                    <View style={[styles.accentBar, { backgroundColor: theme.primary }]} />
                    <View style={[styles.accentBar, { backgroundColor: theme.primary, opacity: 0.5 }]} />
                  </View>
                </View>
              </View>
            </View>
          )}

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
  topActions: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  bellBtn: { position: 'relative' },
  badge: { position: 'absolute', top: -4, right: -6, minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
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
  brandingCard: {
    borderRadius: radius['2xl'],
    padding: spacing[4],
    marginBottom: spacing[5],
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  brandingContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[2],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  clubLogo: {
    width: '100%',
    height: '100%',
  },
  logoBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandingTextContainer: {
    flex: 1,
  },
  clubName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  clubSlogan: {
    fontSize: fontSize.sm,
    marginTop: spacing[1],
    fontStyle: 'italic',
  },
  accentBars: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  accentBar: {
    height: 3,
    borderRadius: 2,
  },
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
