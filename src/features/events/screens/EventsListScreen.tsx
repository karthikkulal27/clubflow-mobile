import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useEvents } from '../hooks/useEvents';
import { useAuth } from '../../../hooks/useAuth';
import { useTheme } from '../../../hooks/useTheme';
import { fontSize, fontWeight } from '../../../theme/typography';
import { spacing, radius } from '../../../theme/spacing';
import { format, isPast } from 'date-fns';
import type { Event } from '../../../types';

type Filter = 'upcoming' | 'all';

interface EventCardProps {
  event: Event;
  onPress: (event: Event) => void;
}

function EventCard({ event, onPress }: EventCardProps) {
  const { theme } = useTheme();
  const past = isPast(new Date(event.startAt));
  const goingCount = event._count?.rsvps ?? 0;

  return (
    <TouchableOpacity onPress={() => onPress(event)} activeOpacity={0.85}>
      <Card style={styles.card} padding={spacing[4]}>
        {event.coverImageUrl && (
          <View style={[styles.coverPlaceholder, { backgroundColor: theme.primaryLight }]}>
            <Ionicons name="calendar" size={24} color={theme.primary} />
          </View>
        )}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={[styles.eventTitle, { color: theme.text.primary }]} numberOfLines={1}>
              {event.title}
            </Text>
            {past ? (
              <Badge label="Past" variant="neutral" />
            ) : (
              <Badge label="Upcoming" variant="primary" />
            )}
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={13} color={theme.text.tertiary} />
            <Text style={[styles.metaText, { color: theme.text.secondary }]}>
              {format(new Date(event.startAt), 'EEE, MMM d • h:mm a')}
            </Text>
          </View>

          {event.location && (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={13} color={theme.text.tertiary} />
              <Text style={[styles.metaText, { color: theme.text.secondary }]} numberOfLines={1}>
                {event.location}
              </Text>
            </View>
          )}

          {event.description && (
            <Text
              style={[styles.description, { color: theme.text.secondary }]}
              numberOfLines={2}
            >
              {event.description}
            </Text>
          )}

          <View style={styles.footer}>
            <View style={styles.goingRow}>
              <Ionicons name="people-outline" size={13} color={theme.primary} />
              <Text style={[styles.goingText, { color: theme.primary }]}>
                {goingCount} Going
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.text.tertiary} />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

interface EventsListScreenProps {
  onEventPress?: (eventId: string) => void;
  onAdd?: () => void;
}

export function EventsListScreen({ onEventPress, onAdd }: EventsListScreenProps) {
  const { theme } = useTheme();
  const { isAdmin } = useAuth();
  const [filter, setFilter] = useState<Filter>('upcoming');
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch, isRefetching } = useEvents(filter === 'upcoming');

  const filtered = useMemo(() => {
    const all = data?.data ?? [];
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q),
    );
  }, [data, search]);

  return (
    <ScreenWrapper scrollable={false} padded={false}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text.primary }]}>Events</Text>
        {isAdmin && (
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.primary }]} onPress={onAdd}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Search bar */}
      <View style={[styles.searchRow, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Ionicons name="search-outline" size={16} color={theme.text.tertiary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.text.primary }]}
          placeholder="Search events..."
          placeholderTextColor={theme.text.tertiary}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={theme.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterRow, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        {(['upcoming', 'all'] as Filter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterTab,
              filter === f && { borderBottomColor: theme.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === f ? theme.primary : theme.text.secondary },
              ]}
            >
              {f === 'upcoming' ? 'Upcoming' : 'All Events'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title={search ? 'No events match your search' : filter === 'upcoming' ? 'No upcoming events' : 'No events yet'}
              subtitle={search ? 'Try a different keyword' : 'Events created by your club admin will appear here'}
            />
          }
          renderItem={({ item }) => (
            <EventCard event={item} onPress={(e) => onEventPress?.(e.id)} />
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
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2] + 2,
    borderBottomWidth: 1,
    gap: spacing[2],
  },
  searchIcon: { flexShrink: 0 },
  searchInput: { flex: 1, fontSize: fontSize.sm, paddingVertical: spacing[1] },
  filterRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: spacing[5],
  },
  filterTab: {
    paddingVertical: spacing[3],
    marginRight: spacing[6],
  },
  filterText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  loadingWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing[5], gap: spacing[3], paddingBottom: spacing[8] },
  card: { overflow: 'visible' },
  coverPlaceholder: {
    height: 80,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  cardContent: { gap: spacing[2] },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eventTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold, flex: 1, marginRight: spacing[2] },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] + 2 },
  metaText: { fontSize: fontSize.xs },
  description: { fontSize: fontSize.xs, lineHeight: 18 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[1],
  },
  goingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  goingText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
});
