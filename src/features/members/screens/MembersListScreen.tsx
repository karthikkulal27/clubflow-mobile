import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { SkeletonCard } from '../../../components/ui/Skeleton';
import { Input } from '../../../components/ui/Input';
import { useTheme } from '../../../hooks/useTheme';
import { fontSize, fontWeight } from '../../../theme/typography';
import { spacing, radius } from '../../../theme/spacing';
import type { Member, PaginatedResponse } from '../../../types';

function useMembersList(search: string) {
  return useQuery({
    queryKey: ['members', search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50', status: 'active' });
      if (search) params.set('search', search);
      const { data } = await api.get<PaginatedResponse<Member>>(`/members?${params}`);
      return data;
    },
  });
}

interface MembersListScreenProps {
  onAdd?: () => void;
  onSelect?: (userId: string, name: string) => void;
}

export function MembersListScreen({ onAdd, onSelect }: MembersListScreenProps) {
  const { theme } = useTheme();
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, refetch, isRefetching } = useMembersList(debouncedSearch);

  return (
    <ScreenWrapper scrollable={false} padded={false}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text.primary }]}>Members</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.primary }]} onPress={onAdd}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrapper}>
        <Input
          placeholder="Search by name or phone..."
          leftIcon="search-outline"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
      </View>

      {isLoading ? (
        <View style={{ paddingHorizontal: spacing[5] }}>
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </View>
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(item) => item.membershipId}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={refetch}
          removeClippedSubviews
          maxToRenderPerBatch={12}
          windowSize={5}
          initialNumToRender={12}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="No members found"
              subtitle={search ? 'Try a different search term' : 'Add your first member to get started'}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.memberCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              activeOpacity={0.7}
              onPress={() => onSelect?.(item.userId, item.name)}
            >
              <Avatar name={item.name} uri={item.avatarUrl} size={44} />
              <View style={styles.memberInfo}>
                <Text style={[styles.memberName, { color: theme.text.primary }]}>{item.name}</Text>
                <Text style={[styles.memberPhone, { color: theme.text.secondary }]}>{item.phone}</Text>
              </View>
              <View style={styles.memberRight}>
                <Badge
                  label={item.role}
                  variant={item.role === 'ADMIN' ? 'primary' : 'neutral'}
                />
                {!item.isActive && (
                  <Badge label="Inactive" variant="warning" style={{ marginTop: 4 }} />
                )}
                {onSelect && (
                  <Ionicons name="chevron-forward" size={16} color={theme.text.tertiary} style={{ marginTop: 4 }} />
                )}
              </View>
            </TouchableOpacity>
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
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrapper: { padding: spacing[4] },
  list: { paddingHorizontal: spacing[5], paddingBottom: spacing[8], gap: spacing[3] },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  memberInfo: { flex: 1, gap: 2 },
  memberName: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  memberPhone: { fontSize: fontSize.sm },
  memberRight: { alignItems: 'flex-end' },
});
