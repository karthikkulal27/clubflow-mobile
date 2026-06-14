import React from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { getAnnouncementsApi, deleteAnnouncementApi } from '../api/announcements.api';
import { useAuth } from '../../../hooks/useAuth';
import { useTheme } from '../../../hooks/useTheme';
import { fontSize, fontWeight } from '../../../theme/typography';
import { spacing, radius } from '../../../theme/spacing';
import { format } from 'date-fns';
import type { Announcement } from '../../../types';

function useAnnouncements() {
  return useQuery({
    queryKey: ['announcements'],
    queryFn: getAnnouncementsApi,
  });
}

function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAnnouncementApi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements'] }),
  });
}

function AnnouncementCard({ item, isAdmin }: { item: Announcement; isAdmin: boolean }) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = React.useState(false);
  const deleteAnnouncement = useDeleteAnnouncement();

  const handleDelete = () => {
    Alert.alert('Delete announcement?', `"${item.title}" will be permanently removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteAnnouncement.mutate(item.id, {
          onSuccess: () => Toast.show({ type: 'success', text1: 'Announcement deleted' }),
          onError: () => Toast.show({ type: 'error', text1: 'Could not delete announcement' }),
        }),
      },
    ]);
  };

  return (
    <TouchableOpacity onPress={() => setExpanded((v) => !v)} activeOpacity={0.9}>
      <Card style={styles.card} padding={spacing[4]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrapper, { backgroundColor: theme.warningLight }]}>
            <Ionicons name="megaphone-outline" size={18} color={theme.warning} />
          </View>
          <View style={styles.headerContent}>
            <Text style={[styles.cardTitle, { color: theme.text.primary }]}>{item.title}</Text>
            <Text style={[styles.cardDate, { color: theme.text.tertiary }]}>
              {format(new Date(item.publishedAt), 'MMM d, yyyy • h:mm a')}
            </Text>
          </View>
          {isAdmin ? (
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation?.(); handleDelete(); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={18} color={theme.danger} />
            </TouchableOpacity>
          ) : (
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={theme.text.tertiary}
            />
          )}
        </View>

        <Text
          style={[styles.cardBody, { color: theme.text.secondary }]}
          numberOfLines={expanded ? undefined : 3}
        >
          {item.body}
        </Text>

        <View style={styles.authorRow}>
          <Ionicons name="person-circle-outline" size={13} color={theme.text.tertiary} />
          <Text style={[styles.authorText, { color: theme.text.tertiary }]}>
            By {item.createdBy.name}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

interface AnnouncementsScreenProps {
  onAdd?: () => void;
  onBack?: () => void;
}

export function AnnouncementsScreen({ onAdd, onBack }: AnnouncementsScreenProps) {
  const { theme } = useTheme();
  const { isAdmin } = useAuth();
  const { data, isLoading, refetch, isRefetching } = useAnnouncements();

  return (
    <ScreenWrapper scrollable={false} padded={false}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Ionicons name="arrow-back" size={22} color={theme.text.primary} />
            </TouchableOpacity>
          )}
          <Text style={[styles.title, { color: theme.text.primary }]}>Announcements</Text>
        </View>
        {isAdmin && (
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.primary }]} onPress={onAdd}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <EmptyState
              icon="megaphone-outline"
              title="No announcements"
              subtitle="Club updates and notices will appear here"
            />
          }
          renderItem={({ item }) => <AnnouncementCard item={item} isAdmin={isAdmin} />}
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
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  loadingWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing[5], gap: spacing[3], paddingBottom: spacing[8] },
  card: {},
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3], marginBottom: spacing[3] },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerContent: { flex: 1 },
  cardTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, lineHeight: 22 },
  cardDate: { fontSize: fontSize.xs, marginTop: 2 },
  cardBody: { fontSize: fontSize.sm, lineHeight: 22 },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing[3],
  },
  authorText: { fontSize: fontSize.xs },
});
