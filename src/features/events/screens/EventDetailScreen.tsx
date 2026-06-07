import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useEventDetail, useRsvp } from '../hooks/useEvents';
import { useTheme } from '../../../hooks/useTheme';
import { fontSize, fontWeight } from '../../../theme/typography';
import { spacing, radius } from '../../../theme/spacing';
import { format } from 'date-fns';
import type { RsvpStatus } from '../../../types';

const RSVP_OPTIONS: { status: RsvpStatus; label: string; icon: string }[] = [
  { status: 'GOING', label: 'Going', icon: 'checkmark-circle' },
  { status: 'MAYBE', label: 'Maybe', icon: 'help-circle' },
  { status: 'NOT_GOING', label: "Can't Go", icon: 'close-circle' },
];

interface EventDetailScreenProps {
  eventId: string;
  onBack?: () => void;
}

export function EventDetailScreen({ eventId, onBack }: EventDetailScreenProps) {
  const { theme } = useTheme();
  const { data: event, isLoading } = useEventDetail(eventId);
  const rsvp = useRsvp(eventId);

  const handleRsvp = (status: RsvpStatus) => {
    rsvp.mutate(status, {
      onSuccess: () => Alert.alert('RSVP Updated', `You marked yourself as "${status}"`),
    });
  };

  if (isLoading || !event) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  const counts = event.rsvpCounts ?? { GOING: 0, NOT_GOING: 0, MAYBE: 0 };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* Back Header */}
      <View style={[styles.navBar, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: theme.text.primary }]} numberOfLines={1}>
          Event Details
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover / Icon */}
        <View style={[styles.cover, { backgroundColor: theme.primaryLight }]}>
          <Ionicons name="calendar" size={48} color={theme.primary} />
        </View>

        <View style={styles.content}>
          {/* Title & Date */}
          <Text style={[styles.eventTitle, { color: theme.text.primary }]}>{event.title}</Text>

          <View style={styles.metaBlock}>
            <View style={styles.metaRow}>
              <View style={[styles.metaIcon, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name="calendar-outline" size={16} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.metaLabel, { color: theme.text.tertiary }]}>Date & Time</Text>
                <Text style={[styles.metaValue, { color: theme.text.primary }]}>
                  {format(new Date(event.startAt), 'EEEE, MMMM d, yyyy')}
                </Text>
                <Text style={[styles.metaValueSub, { color: theme.text.secondary }]}>
                  {format(new Date(event.startAt), 'h:mm a')}
                  {event.endAt && ` – ${format(new Date(event.endAt), 'h:mm a')}`}
                </Text>
              </View>
            </View>

            {event.location && (
              <View style={styles.metaRow}>
                <View style={[styles.metaIcon, { backgroundColor: theme.warningLight }]}>
                  <Ionicons name="location-outline" size={16} color={theme.warning} />
                </View>
                <View>
                  <Text style={[styles.metaLabel, { color: theme.text.tertiary }]}>Location</Text>
                  <Text style={[styles.metaValue, { color: theme.text.primary }]}>{event.location}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Description */}
          {event.description && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>About</Text>
              <Text style={[styles.description, { color: theme.text.secondary }]}>
                {event.description}
              </Text>
            </View>
          )}

          {/* RSVP Counts */}
          <Card style={styles.countsCard} padding={spacing[4]}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Attendance</Text>
            <View style={styles.countsRow}>
              <View style={styles.countBlock}>
                <Text style={[styles.countNum, { color: theme.success }]}>{counts.GOING}</Text>
                <Text style={[styles.countLabel, { color: theme.text.secondary }]}>Going</Text>
              </View>
              <View style={styles.countBlock}>
                <Text style={[styles.countNum, { color: theme.warning }]}>{counts.MAYBE}</Text>
                <Text style={[styles.countLabel, { color: theme.text.secondary }]}>Maybe</Text>
              </View>
              <View style={styles.countBlock}>
                <Text style={[styles.countNum, { color: theme.danger }]}>{counts.NOT_GOING}</Text>
                <Text style={[styles.countLabel, { color: theme.text.secondary }]}>Not Going</Text>
              </View>
            </View>
          </Card>

          {/* RSVP Buttons */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Your RSVP</Text>
            <View style={styles.rsvpRow}>
              {RSVP_OPTIONS.map((opt) => {
                const isSelected = event.myRsvp === opt.status;
                return (
                  <TouchableOpacity
                    key={opt.status}
                    style={[
                      styles.rsvpBtn,
                      {
                        backgroundColor: isSelected ? theme.primary : theme.surface,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => handleRsvp(opt.status)}
                    disabled={rsvp.isPending}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={opt.icon as keyof typeof Ionicons.glyphMap}
                      size={18}
                      color={isSelected ? '#fff' : theme.text.secondary}
                    />
                    <Text
                      style={[
                        styles.rsvpBtnText,
                        { color: isSelected ? '#fff' : theme.text.secondary },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
  },
  backBtn: { padding: spacing[1] },
  navTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, flex: 1, textAlign: 'center' },
  cover: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: spacing[5], gap: spacing[5] },
  eventTitle: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, lineHeight: 34 },
  metaBlock: { gap: spacing[4] },
  metaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  metaIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaLabel: { fontSize: fontSize.xs, marginBottom: 2 },
  metaValue: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  metaValueSub: { fontSize: fontSize.sm },
  section: { gap: spacing[3] },
  sectionTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  description: { fontSize: fontSize.sm, lineHeight: 22 },
  countsCard: {},
  countsRow: { flexDirection: 'row', marginTop: spacing[3] },
  countBlock: { flex: 1, alignItems: 'center' },
  countNum: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold },
  countLabel: { fontSize: fontSize.xs, marginTop: 2 },
  rsvpRow: { flexDirection: 'row', gap: spacing[3] },
  rsvpBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1] + 2,
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  rsvpBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
});
