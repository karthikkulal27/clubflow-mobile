import React from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useSpecialCollections } from '../hooks/usePayments';
import { useTheme } from '../../../hooks/useTheme';
import { fontSize, fontWeight } from '../../../theme/typography';
import { spacing, radius } from '../../../theme/spacing';
import type { SpecialCollection } from '../../../types';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function CollectionCard({ collection, onPress }: { collection: SpecialCollection; onPress: () => void }) {
  const { theme } = useTheme();
  const { stats } = collection;
  const totalAmount = Number(collection.amount) * stats.total;
  const pct = stats.total > 0 ? Math.round((stats.paidCount / stats.total) * 100) : 0;

  return (
    <Card style={styles.card} padding={spacing[4]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: theme.warningLight }]}>
            <Ionicons name="gift" size={18} color={theme.warning} />
          </View>

          <View style={styles.info}>
            <Text style={[styles.label, { color: theme.text.primary }]} numberOfLines={1}>
              {collection.label}
            </Text>
            <Text style={[styles.amount, { color: theme.warning }]}>
              ₹{Number(collection.amount).toLocaleString('en-IN')}
              <Text style={[styles.amountSuffix, { color: theme.text.tertiary }]}> / member</Text>
            </Text>
            <Text style={[styles.meta, { color: theme.text.tertiary }]} numberOfLines={1}>
              {MONTHS[collection.month - 1]} {collection.year} · Due{' '}
              {new Date(collection.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={18} color={theme.text.tertiary} />
        </View>

        <View style={[styles.progressTrack, { backgroundColor: theme.borderSubtle }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: theme.success, width: `${pct}%` as any },
            ]}
          />
        </View>

        <View style={styles.statsRow}>
          <Text style={[styles.statsText, { color: theme.text.secondary }]}>
            {stats.paidCount}/{stats.total} paid
          </Text>
          <Text style={[styles.statsText, { color: theme.text.secondary }]}>
            ₹{Number(stats.collectedAmount).toLocaleString('en-IN')} / ₹{totalAmount.toLocaleString('en-IN')}
          </Text>
        </View>
      </TouchableOpacity>
    </Card>
  );
}

interface SpecialCollectionsScreenProps {
  onAdd: () => void;
  onSelect: (collectionId: string, label: string) => void;
}

export function SpecialCollectionsScreen({ onAdd, onSelect }: SpecialCollectionsScreenProps) {
  const { theme } = useTheme();
  const { data: collections, isLoading, refetch, isRefetching } = useSpecialCollections();

  return (
    <ScreenWrapper scrollable={false} padded={false}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text.primary }]}>Special Collections</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.primary }]} onPress={onAdd} activeOpacity={0.85}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={[styles.banner, { backgroundColor: theme.surfaceElevated, borderColor: theme.borderSubtle }]}>
        <Ionicons name="information-circle-outline" size={16} color={theme.text.tertiary} />
        <Text style={[styles.bannerText, { color: theme.text.tertiary }]}>
          One-off charges — festival celebrations, event contributions, anything outside the regular monthly fee. Every active member is billed immediately, on top of their normal dues.
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={collections ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <EmptyState
              icon="gift-outline"
              title="No special collections yet"
              subtitle="Create one to bill every active member for a festival, event, or one-off contribution"
            />
          }
          renderItem={({ item }) => (
            <CollectionCard collection={item} onPress={() => onSelect(item.id, item.label)} />
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
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginHorizontal: spacing[5],
    marginTop: spacing[4],
    padding: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  bannerText: { flex: 1, fontSize: fontSize.xs, lineHeight: 16 },
  loadingWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing[5], gap: spacing[3], paddingBottom: spacing[8] },
  card: {},
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info: { flex: 1, gap: 3 },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  amount: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  amountSuffix: { fontSize: fontSize.xs, fontWeight: fontWeight.regular },
  meta: { fontSize: fontSize.xs },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: spacing[3] },
  progressFill: { height: '100%', borderRadius: 3 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing[2] },
  statsText: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
});
