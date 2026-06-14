import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { useTheme } from '../../../hooks/useTheme';
import { fontSize, fontWeight } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { getClubApi, updateClubApi } from '../api/club.api';

const infoSchema = z.object({
  name: z.string().min(2, 'Club name must be at least 2 characters'),
  description: z.string().optional(),
});

type InfoForm = z.infer<typeof infoSchema>;

interface ClubSettingsScreenProps {
  onBack: () => void;
}

export function ClubSettingsScreen({ onBack }: ClubSettingsScreenProps) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const { data: club, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['club'],
    queryFn: getClubApi,
  });

  const infoForm = useForm<InfoForm>({
    resolver: zodResolver(infoSchema),
    values: {
      name: club?.name ?? '',
      description: club?.description ?? '',
    },
  });

  const updateInfo = useMutation({
    mutationFn: (data: InfoForm) => updateClubApi({
      name: data.name,
      description: data.description || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club'] });
      Toast.show({ type: 'success', text1: 'Club info updated' });
    },
    onError: (err: any) => {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.message ?? 'Update failed' });
    },
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Club Settings</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {/* Club Info section */}
        <Card padding={spacing[4]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="shield-outline" size={18} color={theme.primary} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Club Information</Text>
          </View>

          <View style={styles.formFields}>
            <Controller
              control={infoForm.control}
              name="name"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Club Name"
                  placeholder="Enter club name"
                  leftIcon="football-outline"
                  autoCapitalize="words"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={infoForm.formState.errors.name?.message}
                />
              )}
            />

            <Controller
              control={infoForm.control}
              name="description"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Description (optional)"
                  placeholder="A short description of your club"
                  leftIcon="document-text-outline"
                  autoCapitalize="sentences"
                  multiline
                  numberOfLines={3}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={infoForm.formState.errors.description?.message}
                />
              )}
            />

            <Button
              title="Save Club Info"
              variant="secondary"
              fullWidth
              loading={updateInfo.isPending || isLoading}
              onPress={infoForm.handleSubmit((data) => updateInfo.mutate(data))}
            />
          </View>
        </Card>

        {/* Stats */}
        {club && (
          <Card padding={spacing[4]}>
            <Text style={[styles.statsTitle, { color: theme.text.secondary }]}>Club Stats</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.text.primary }]}>
                  {club._count.memberships}
                </Text>
                <Text style={[styles.statLabel, { color: theme.text.tertiary }]}>Members</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.text.primary }]}>{club.currency}</Text>
                <Text style={[styles.statLabel, { color: theme.text.tertiary }]}>Currency</Text>
              </View>
            </View>
          </Card>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
  body: { padding: spacing[5], gap: spacing[4] },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], marginBottom: spacing[4] },
  sectionIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  formFields: { gap: spacing[4] },
  statsTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, marginBottom: spacing[3] },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center', gap: spacing[1] },
  statValue: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  statLabel: { fontSize: fontSize.xs },
  statDivider: { width: 1, height: 36 },
});
