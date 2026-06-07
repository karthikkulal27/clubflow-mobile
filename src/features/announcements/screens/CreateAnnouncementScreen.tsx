import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, TouchableOpacity, Switch,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useTheme } from '../../../hooks/useTheme';
import { fontSize, fontWeight } from '../../../theme/typography';
import { spacing, radius } from '../../../theme/spacing';
import { createAnnouncementApi, publishAnnouncementApi } from '../api/announcements.api';

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  body: z.string().min(10, 'Announcement must be at least 10 characters'),
});

type FormData = z.infer<typeof schema>;

interface CreateAnnouncementScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function CreateAnnouncementScreen({ onBack, onSuccess }: CreateAnnouncementScreenProps) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [publishNow, setPublishNow] = React.useState(true);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', body: '' },
  });

  const bodyValue = watch('body');

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const announcement = await createAnnouncementApi(data);
      if (publishNow) {
        await publishAnnouncementApi(announcement.id);
      }
      return announcement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      Toast.show({
        type: 'success',
        text1: publishNow ? 'Announcement published' : 'Draft saved',
        text2: publishNow ? 'All members will be notified' : 'You can publish it later',
      });
      onSuccess();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Failed to create announcement';
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
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>New Announcement</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Publish status banner */}
        <View style={[
          styles.publishBanner,
          { backgroundColor: publishNow ? theme.primaryLight : theme.surface, borderColor: publishNow ? theme.primary : theme.border },
        ]}>
          <View style={styles.publishBannerLeft}>
            <Ionicons
              name={publishNow ? 'megaphone' : 'save-outline'}
              size={20}
              color={publishNow ? theme.primary : theme.text.secondary}
            />
            <View>
              <Text style={[styles.publishTitle, { color: publishNow ? theme.primary : theme.text.primary }]}>
                {publishNow ? 'Publish Immediately' : 'Save as Draft'}
              </Text>
              <Text style={[styles.publishSub, { color: theme.text.tertiary }]}>
                {publishNow ? 'Members will be notified via push' : 'Publish manually from the list'}
              </Text>
            </View>
          </View>
          <Switch
            value={publishNow}
            onValueChange={setPublishNow}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor="#fff"
          />
        </View>

        <Controller
          control={control}
          name="title"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Title"
              placeholder="e.g. Practice session rescheduled"
              leftIcon="megaphone-outline"
              autoCapitalize="sentences"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.title?.message}
            />
          )}
        />

        <View style={styles.fieldGroup}>
          <Controller
            control={control}
            name="body"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Message"
                placeholder="Write your announcement here..."
                leftIcon="document-text-outline"
                autoCapitalize="sentences"
                multiline
                numberOfLines={8}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.body?.message}
              />
            )}
          />
          <Text style={[styles.charCount, { color: theme.text.tertiary }]}>
            {bodyValue.length} characters
          </Text>
        </View>

        <Button
          title={publishNow ? 'Publish Announcement' : 'Save Draft'}
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
  publishBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    borderRadius: radius.xl,
    borderWidth: 1.5,
  },
  publishBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], flex: 1 },
  publishTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  publishSub: { fontSize: fontSize.xs, marginTop: 2 },
  fieldGroup: { gap: spacing[1] },
  charCount: { fontSize: fontSize.xs, textAlign: 'right' },
  submitBtn: { marginTop: spacing[2] },
});
