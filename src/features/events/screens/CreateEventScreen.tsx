import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { DatePickerInput } from '../../../components/ui/DatePickerInput';
import { TimePickerInput } from '../../../components/ui/DatePickerInput';
import { useTheme } from '../../../hooks/useTheme';
import { fontSize, fontWeight } from '../../../theme/typography';
import { spacing, radius } from '../../../theme/spacing';
import { createEventApi, updateEventApi } from '../api/events.api';

const todayStr = new Date().toISOString().slice(0, 10);

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  location: z.string().optional(),
  description: z.string().optional(),
  date: z.string().min(1, 'Select a date').refine(
    (d) => d >= todayStr,
    'Event date cannot be in the past',
  ),
  startTime: z.string().min(1, 'Select a start time'),
  endTime: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface CreateEventScreenProps {
  onBack: () => void;
  onSuccess: () => void;
  eventId?: string;
  initialValues?: {
    title: string;
    location?: string;
    description?: string;
    date: string;
    startTime: string;
    endTime?: string;
  };
}

export function CreateEventScreen({ onBack, onSuccess, eventId, initialValues }: CreateEventScreenProps) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const isEditing = !!eventId;

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialValues ?? {
      title: '',
      location: '',
      description: '',
      date: '',
      startTime: '',
      endTime: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const startAt = `${data.date}T${data.startTime}:00.000Z`;
      const endAt = data.endTime ? `${data.date}T${data.endTime}:00.000Z` : undefined;
      if (isEditing) {
        return updateEventApi(eventId!, {
          title: data.title,
          description: data.description || undefined,
          location: data.location || undefined,
          startAt,
          endAt,
        });
      }
      return createEventApi({
        title: data.title,
        description: data.description || undefined,
        location: data.location || undefined,
        startAt,
        endAt,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      Toast.show({
        type: 'success',
        text1: isEditing ? 'Event updated' : 'Event created',
        text2: isEditing ? undefined : 'Members will be notified',
      });
      onSuccess();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? (isEditing ? 'Failed to update event' : 'Failed to create event');
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
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
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>{isEditing ? 'Edit Event' : 'Create Event'}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Controller
          control={control}
          name="title"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Event Title"
              placeholder="e.g. Monthly Match vs City FC"
              leftIcon="trophy-outline"
              autoCapitalize="sentences"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.title?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="location"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Venue (optional)"
              placeholder="e.g. City Sports Complex"
              leftIcon="location-outline"
              autoCapitalize="sentences"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.location?.message}
            />
          )}
        />

        {/* Date + Times row */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.groupLabel, { color: theme.text.secondary }]}>Date & Time</Text>

          <Controller
            control={control}
            name="date"
            render={({ field: { value, onChange } }) => (
              <DatePickerInput
                value={value}
                onChangeText={onChange}
                error={errors.date?.message}
                minYear={new Date().getFullYear() - 1}
              />
            )}
          />

          <View style={styles.timeRow}>
            <View style={styles.timeInput}>
              <Controller
                control={control}
                name="startTime"
                render={({ field: { value, onChange } }) => (
                  <TimePickerInput
                    label="Start Time"
                    value={value}
                    onChangeText={onChange}
                    error={errors.startTime?.message}
                  />
                )}
              />
            </View>

            <View style={styles.timeInput}>
              <Controller
                control={control}
                name="endTime"
                render={({ field: { value, onChange } }) => (
                  <TimePickerInput
                    label="End Time (optional)"
                    value={value ?? ''}
                    onChangeText={onChange}
                    error={errors.endTime?.message}
                  />
                )}
              />
            </View>
          </View>
        </View>

        <Controller
          control={control}
          name="description"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Description (optional)"
              placeholder="Details about the event..."
              leftIcon="document-text-outline"
              autoCapitalize="sentences"
              multiline
              numberOfLines={4}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.description?.message}
              containerStyle={styles.multilineContainer}
            />
          )}
        />

        <Button
          title={isEditing ? 'Save Changes' : 'Create Event'}
          fullWidth
          loading={mutation.isPending}
          onPress={handleSubmit((data) => mutation.mutate(data))}
          style={styles.submitBtn}
        />
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
  body: { padding: spacing[5], gap: spacing[5] },
  fieldGroup: { gap: spacing[3] },
  groupLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  timeRow: { flexDirection: 'row', gap: spacing[3] },
  timeInput: { flex: 1 },
  multilineContainer: {},
  submitBtn: { marginTop: spacing[2] },
});
