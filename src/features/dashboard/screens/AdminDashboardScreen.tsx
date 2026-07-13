import React from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationCount } from '../../../hooks/useNotificationCount';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { SectionHeader } from '../../../components/layout/SectionHeader';
import { StatCard } from '../../../components/ui/StatCard';
import { Card } from '../../../components/ui/Card';
import { Avatar } from '../../../components/ui/Avatar';
import { SkeletonCard } from '../../../components/ui/Skeleton';
import { BalanceCard } from '../components/BalanceCard';
import { PaymentStatusCard } from '../components/PaymentStatusCard';
import { useDashboard } from '../hooks/useDashboard';
import { usePayNow } from '../../payments/hooks/usePayments';
import { useAuth } from '../../../hooks/useAuth';
import { useTheme } from '../../../hooks/useTheme';
import { useAuthStore } from '../../../store/auth.store';
import { fontSize, fontWeight } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { format } from 'date-fns';
import type { AdminDashboard } from '../../../types';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function AdminDashboardScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { data, isLoading, refetch, isRefetching } = useDashboard();
  const payNow = usePayNow();
  const navigation = useNavigation<any>();
  const unreadCount = useNotificationCount();

  const dashboard = data as AdminDashboard | undefined;

  const handlePayNow = () => {
    const paymentId = dashboard?.currentDue?.id;
    if (paymentId) payNow.mutate(paymentId);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: clearAuth },
    ]);
  };

  return (
    <ScreenWrapper refreshing={isRefetching} onRefresh={refetch}>
      {/* Header */}
      <View style={styles.topBar}>
        <View>
          <Text style={[styles.greeting, { color: theme.text.secondary }]}>Good day,</Text>
          <Text style={[styles.name, { color: theme.text.primary }]}>{user?.name}</Text>
        </View>
        <View style={styles.topActions}>
          <View style={[styles.adminBadge, { backgroundColor: theme.primaryLight }]}>
            <Text style={[styles.adminBadgeText, { color: theme.primary }]}>Admin</Text>
          </View>
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
          {/* Admin's own due */}
          <PaymentStatusCard currentDue={dashboard.currentDue} onPayNow={handlePayNow} />

          {/* Balance Card */}
          <BalanceCard
            totalCollection={dashboard.stats.totalCollection}
            totalExpenses={dashboard.stats.totalExpenses}
            availableBalance={dashboard.stats.availableBalance}
          />

          {/* Stat Grid */}
          <SectionHeader
            title={`${MONTHS[dashboard.currentMonth.month - 1]} ${dashboard.currentMonth.year}`}
          />
          <View style={styles.statGrid}>
            <StatCard
              label="Total Members"
              value={dashboard.stats.totalMembers}
              icon="people-outline"
              iconColor={theme.primary}
              iconBg={theme.primaryLight}
            />
            <StatCard
              label="Paid"
              value={dashboard.stats.paidCount}
              icon="checkmark-circle-outline"
              iconColor={theme.success}
              iconBg={theme.successLight}
            />
          </View>
          <View style={[styles.statGrid, { marginTop: spacing[3] }]}>
            <StatCard
              label="Pending"
              value={dashboard.stats.pendingCount}
              icon="time-outline"
              iconColor={theme.warning}
              iconBg={theme.warningLight}
            />
            <StatCard
              label="Collected"
              value={`₹${(dashboard.stats.totalCollection ?? 0).toLocaleString('en-IN')}`}
              icon="cash-outline"
              iconColor={theme.success}
              iconBg={theme.successLight}
            />
          </View>

          {/* Upcoming Events */}
          {dashboard.upcomingEvents.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="Upcoming Events" actionLabel="See all" onAction={() => navigation.navigate('Events')} />
              {dashboard.upcomingEvents.map((event) => (
                <Card key={event.id} style={styles.eventCard}>
                  <View style={styles.eventRow}>
                    <View style={[styles.eventIcon, { backgroundColor: theme.primaryLight }]}>
                      <Ionicons name="calendar-outline" size={18} color={theme.primary} />
                    </View>
                    <View style={styles.eventInfo}>
                      <Text style={[styles.eventTitle, { color: theme.text.primary }]}>
                        {event.title}
                      </Text>
                      <Text style={[styles.eventMeta, { color: theme.text.secondary }]}>
                        {format(new Date(event.startAt), 'EEE, MMM d • h:mm a')}
                      </Text>
                      {event.location && (
                        <View style={styles.locationRow}>
                          <Ionicons name="location-outline" size={11} color={theme.text.tertiary} />
                          <Text style={[styles.location, { color: theme.text.tertiary }]}>
                            {event.location}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          )}

          {/* Recent Payments */}
          {dashboard.recentPayments.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="Recent Payments" actionLabel="See all" onAction={() => navigation.navigate('Finance')} />
              {dashboard.recentPayments.map((payment) => (
                <View
                  key={payment.id}
                  style={[styles.paymentRow, { borderBottomColor: theme.borderSubtle }]}
                >
                  <Avatar name={payment.user.name} uri={payment.user.avatarUrl} size={36} />
                  <View style={styles.paymentInfo}>
                    <Text style={[styles.paymentName, { color: theme.text.primary }]}>
                      {payment.user.name}
                    </Text>
                    <Text style={[styles.paymentDate, { color: theme.text.tertiary }]}>
                      {MONTHS[payment.month - 1]} {payment.year}
                    </Text>
                  </View>
                  <Text style={[styles.paymentAmount, { color: theme.success }]}>
                    +₹{Number(payment.amount).toLocaleString('en-IN')}
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
    marginBottom: spacing[6],
    paddingTop: spacing[2],
  },
  greeting: { fontSize: fontSize.sm },
  name: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  adminBadge: { paddingHorizontal: spacing[3], paddingVertical: 4, borderRadius: 100 },
  adminBadgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  bellBtn: { position: 'relative' },
  badge: { position: 'absolute', top: -4, right: -6, minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  statGrid: { flexDirection: 'row', gap: spacing[3] },
  section: { marginTop: spacing[6] },
  eventCard: { marginBottom: spacing[3] },
  eventRow: { flexDirection: 'row', gap: spacing[3], alignItems: 'flex-start' },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventInfo: { flex: 1, gap: 2 },
  eventTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  eventMeta: { fontSize: fontSize.xs },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  location: { fontSize: fontSize.xs },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
  },
  paymentInfo: { flex: 1 },
  paymentName: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  paymentDate: { fontSize: fontSize.xs },
  paymentAmount: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
});
