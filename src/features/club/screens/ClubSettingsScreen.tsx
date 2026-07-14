import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  KeyboardAvoidingView, Platform, TouchableOpacity, Image, Alert, TextInput,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ColorPicker } from '../../../components/ui/ColorPicker';
import { useTheme } from '../../../hooks/useTheme';
import { fontSize, fontWeight } from '../../../theme/typography';
import { spacing, radius } from '../../../theme/spacing';
import { getClubApi, updateClubApi, getClubBrandingApi, updateClubBrandingApi, uploadLogoApi } from '../api/club.api';
import { useClubBrandingStore } from '../../../store/club-branding.store';

const infoSchema = z.object({
  name: z.string().min(2, 'Club name must be at least 2 characters'),
  description: z.string().optional(),
});

const brandingSchema = z.object({
  logoUrl: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  slogan: z.string().optional(),
});

type InfoForm = z.infer<typeof infoSchema>;
type BrandingForm = z.infer<typeof brandingSchema>;

interface ClubSettingsScreenProps {
  onBack: () => void;
}

export function ClubSettingsScreen({ onBack }: ClubSettingsScreenProps) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const { setBranding } = useClubBrandingStore();
  const [logoUploading, setLogoUploading] = React.useState(false);

  const { data: club, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['club'],
    queryFn: getClubApi,
  });

  const { data: branding } = useQuery({
    queryKey: ['clubBranding'],
    queryFn: getClubBrandingApi,
  });

  const infoForm = useForm<InfoForm>({
    resolver: zodResolver(infoSchema),
    values: {
      name: club?.name ?? '',
      description: club?.description ?? '',
    },
  });

  const brandingForm = useForm<BrandingForm>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      logoUrl: '',
      primaryColor: '#2563eb',
      secondaryColor: '#3b82f6',
      slogan: '',
    },
  });

  // Update form when branding data loads
  React.useEffect(() => {
    if (branding) {
      console.log('[ClubSettings] Loading branding data into form:', branding);
      brandingForm.reset({
        logoUrl: branding.logoUrl ?? '',
        primaryColor: branding.primaryColor ?? '#2563eb',
        secondaryColor: branding.secondaryColor ?? '#3b82f6',
        slogan: branding.slogan ?? '',
      });
    }
  }, [branding, brandingForm]);

  const updateInfo = useMutation({
    mutationFn: (data: InfoForm) => updateClubApi({
      name: data.name,
      description: data.description || undefined,
    }),
    onSuccess: (data) => {
      console.log('[ClubSettings] Club info updated:', data);
      infoForm.reset({
        name: data.name,
        description: data.description ?? '',
      });
      queryClient.invalidateQueries({ queryKey: ['club'] });
      queryClient.refetchQueries({ queryKey: ['club'] });
      Toast.show({ type: 'success', text1: 'Club info updated' });
    },
    onError: (err: any) => {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.message ?? 'Update failed' });
    },
  });

  const updateBranding = useMutation({
    mutationFn: (data: BrandingForm) => {
      console.log('[LOGO] Saving branding...');
      return updateClubBrandingApi(data);
    },
    onSuccess: (data) => {
      console.log('[LOGO] Save successful, logoUrl:', data.logoUrl);
      setBranding(data);
      brandingForm.reset({
        logoUrl: data.logoUrl ?? '',
        primaryColor: data.primaryColor ?? '#2563eb',
        secondaryColor: data.secondaryColor ?? '#3b82f6',
        slogan: data.slogan ?? '',
      });
      queryClient.invalidateQueries({ queryKey: ['clubBranding'] });
      queryClient.refetchQueries({ queryKey: ['clubBranding'] });
      Toast.show({ type: 'success', text1: 'Branding updated' });
    },
    onError: (err: any) => {
      console.error('[LOGO] Save failed:', err?.response?.data?.message ?? err?.message);
      const message = err?.response?.data?.message ?? err?.message ?? 'Update failed';
      Toast.show({ type: 'error', text1: 'Error', text2: message });
    },
  });

  const handleLogoUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        console.log('[LOGO] Upload started');
        setLogoUploading(true);
        const logoUri = result.assets[0].uri;
        const logoFile = {
          uri: logoUri,
          type: 'image/jpeg',
          name: 'club-logo.jpg',
        } as any;
        const url = await uploadLogoApi(logoFile, branding?.logoUrl);
        console.log('[LOGO] Upload successful, URL:', url);
        brandingForm.setValue('logoUrl', url, { shouldDirty: true });
        Toast.show({ type: 'success', text1: 'Logo uploaded' });
      }
    } catch (err: any) {
      console.error('[LOGO] Upload failed:', err?.message);
      Toast.show({ type: 'error', text1: 'Error', text2: err?.message || 'Failed to upload logo' });
    } finally {
      setLogoUploading(false);
    }
  };

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

        {/* Club Branding Section */}
        <Card padding={spacing[4]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="color-palette-outline" size={18} color={theme.primary} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Club Branding</Text>
          </View>

          <View style={styles.formFields}>
            {/* Logo Upload */}
            <View>
              <Text style={[styles.label, { color: theme.text.primary }]}>Club Logo</Text>
              {brandingForm.watch('logoUrl') && (
                <Image
                  source={{ uri: brandingForm.watch('logoUrl') }}
                  style={styles.logoPreview}
                />
              )}
              <TouchableOpacity
                style={[styles.uploadBtn, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}
                onPress={handleLogoUpload}
                disabled={logoUploading}
              >
                <Ionicons name="cloud-upload-outline" size={18} color={theme.primary} />
                <Text style={[styles.uploadBtnText, { color: theme.primary }]}>
                  {logoUploading ? 'Uploading...' : 'Upload Logo'}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.helperText, { color: theme.text.tertiary }]}>
                Recommended: Square image 200×200px or larger
              </Text>
            </View>

            {/* Primary Color */}
            <View>
              <Text style={[styles.label, { color: theme.text.primary }]}>Primary Color</Text>
              <Controller
                control={brandingForm.control}
                name="primaryColor"
                render={({ field: { value, onChange } }) => (
                  <ColorPicker value={value || '#2563eb'} onChange={onChange} />
                )}
              />
            </View>

            {/* Secondary Color */}
            <View>
              <Text style={[styles.label, { color: theme.text.primary }]}>Secondary Color</Text>
              <Controller
                control={brandingForm.control}
                name="secondaryColor"
                render={({ field: { value, onChange } }) => (
                  <ColorPicker value={value || '#3b82f6'} onChange={onChange} />
                )}
              />
            </View>

            {/* Slogan */}
            <Controller
              control={brandingForm.control}
              name="slogan"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Slogan (optional)"
                  placeholder="Your club's motto or tagline"
                  leftIcon="chatbubble-outline"
                  multiline
                  numberOfLines={2}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />

            <View style={{ marginTop: spacing[4], paddingTop: spacing[4], borderTopWidth: 1, borderTopColor: theme.border }}>
              <Button
                title={updateBranding.isPending ? 'Saving...' : 'Save Branding'}
                fullWidth
                loading={updateBranding.isPending || isLoading}
                onPress={() => {
                  console.log('[ClubSettings] Save button pressed');
                  brandingForm.handleSubmit((data) => {
                    console.log('[ClubSettings] Form submitted with:', data);
                    updateBranding.mutate(data);
                  })();
                }}
              />
            </View>
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
  body: { padding: spacing[5], paddingBottom: spacing[8], gap: spacing[4] },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], marginBottom: spacing[4] },
  sectionIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  formFields: { gap: spacing[4] },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, marginBottom: spacing[2] },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    paddingVertical: spacing[4],
    marginBottom: spacing[2],
  },
  uploadBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  helperText: { fontSize: fontSize.xs, marginTop: spacing[1] },
  logoPreview: { width: 80, height: 80, borderRadius: radius.md, marginBottom: spacing[3] },
  colorInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  colorPreview: { width: 48, height: 48, borderRadius: radius.md, borderWidth: 2, borderColor: '#e5e7eb' },
  colorTextInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    justifyContent: 'center',
  },
  colorInputText: {
    fontSize: fontSize.base,
    paddingVertical: spacing[3],
  },
  statsTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, marginBottom: spacing[3] },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center', gap: spacing[1] },
  statValue: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  statLabel: { fontSize: fontSize.xs },
  statDivider: { width: 1, height: 36 },
});
