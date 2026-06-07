import React from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { getAnnouncementsApi } from '../api/announcements.api';
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

function AnnouncementCard({ item }: { item: Announcement }) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = React.useState(false);

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
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={theme.text.tertiary}
          />
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
}

export function AnnouncementsScreen({ onAdd }: AnnouncementsScreenProps) {
  const { theme } = useTheme();
  const { isAdmin } = useAuth();
  const { data, isLoading, refetch, isRefetching } = useAnnouncements();

  return (
    <ScreenWrapper scrollable={false} padded={false}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text.primary }]}>Announcements</Text>
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
          renderItem={({ item }) => <AnnouncementCard item={item} />}
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
