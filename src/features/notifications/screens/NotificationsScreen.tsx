import React from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { EmptyState } from '../../../components/ui/EmptyState';
import {
  getNotificationsApi,
  markAllReadApi,
  markReadApi,
} from '../api/notifications.api';
import { useTheme } from '../../../hooks/useTheme';
import { fontSize, fontWeight } from '../../../theme/typography';
import { spacing, radius } from '../../../theme/spacing';
import { formatDistanceToNow } from 'date-fns';
import type { AppNotification, NotificationType } from '../../../types';

function notificationMeta(type: NotificationType): {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgKey: 'primaryLight' | 'warningLight' | 'successLight' | 'dangerLight';
} {
  switch (type) {
    case 'PAYMENT_DUE': return { icon: 'time-outline', color: '#f59e0b', bgKey: 'warningLight' };
    case 'PAYMENT_SUCCESS': return { icon: 'checkmark-circle-outline', color: '#10b981', bgKey: 'successLight' };
    case 'NEW_ANNOUNCEMENT': return { icon: 'megaphone-outline', color: '#f59e0b', bgKey: 'warningLight' };
    case 'NEW_EVENT': return { icon: 'calendar-outline', color: '#3b82f6', bgKey: 'primaryLight' };
    case 'EVENT_REMINDER': return { icon: 'alarm-outline', color: '#f97316', bgKey: 'warningLight' };
    case 'EXPENSE_ADDED': return { icon: 'receipt-outline', color: '#ef4444', bgKey: 'dangerLight' };
    case 'EVENT_RSVP': return { icon: 'people-outline', color: '#3b82f6', bgKey: 'primaryLight' };
    default: return { icon: 'notifications-outline', color: '#3b82f6', bgKey: 'primaryLight' };
  }
}

function NotificationRow({
  item,
  onRead,
}: {
  item: AppNotification;
  onRead: (id: string) => void;
}) {
  const { theme } = useTheme();
  const meta = notificationMeta(item.type);
  const bgColor = theme[meta.bgKey];

  return (
    <TouchableOpacity
      style={[
        styles.row,
        { backgroundColor: item.isRead ? theme.surface : theme.primaryLight + '40',
          borderBottomColor: theme.borderSubtle },
      ]}
      onPress={() => !item.isRead && onRead(item.id)}
      activeOpacity={0.8}
    >
      <View style={[styles.iconWrapper, { backgroundColor: bgColor }]}>
        <Ionicons name={meta.icon} size={20} color={meta.color} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.notifTitle, { color: theme.text.primary }]}>{item.title}</Text>
        <Text style={[styles.notifBody, { color: theme.text.secondary }]} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={[styles.notifTime, { color: theme.text.tertiary }]}>
          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
        </Text>
      </View>

      {!item.isRead && (
        <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
      )}
    </TouchableOpacity>
  );
}

interface NotificationsScreenProps {
  onBack?: () => void;
}

export function NotificationsScreen({ onBack }: NotificationsScreenProps) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotificationsApi,
  });

  const markRead = useMutation({
    mutationFn: markReadApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAll = useMutation({
    mutationFn: markAllReadApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <ScreenWrapper scrollable={false} padded={false}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        {onBack && (
          <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Ionicons name="arrow-back" size={22} color={theme.text.primary} />
          </TouchableOpacity>
        )}
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: theme.text.primary }]}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: theme.primary }]}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={() => markAll.mutate()}
            disabled={markAll.isPending}
          >
            <Text style={[styles.markAllText, { color: theme.primary }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={refetch}
          removeClippedSubviews
          maxToRenderPerBatch={15}
          windowSize={5}
          initialNumToRender={15}
          ListEmptyComponent={
            <EmptyState
              icon="notifications-outline"
              title="No notifications"
              subtitle="You're all caught up!"
            />
          }
          renderItem={({ item }) => (
            <NotificationRow item={item} onRead={(id) => markRead.mutate(id)} />
          )}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: fontWeight.bold },
  markAllText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  loadingWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing[4],
    gap: spacing[3],
    borderBottomWidth: 1,
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: { flex: 1, gap: 3 },
  notifTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  notifBody: { fontSize: fontSize.xs, lineHeight: 18 },
  notifTime: { fontSize: fontSize.xs },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
});
