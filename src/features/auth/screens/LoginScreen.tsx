import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useLogin } from '../hooks/useLogin';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useTheme } from '../../../hooks/useTheme';
import { fontSize, fontWeight, textStyles } from '../../../theme/typography';
import { spacing, radius } from '../../../theme/spacing';

const loginSchema = z.object({
  phone: z.string().min(10, 'Enter a valid phone number').max(15),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginScreen() {
  const { theme, isDark } = useTheme();
  const login = useLogin();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '', password: '' },
  });

  const onSubmit = async (values: LoginForm) => {
    try {
      await login.mutateAsync(values);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Login failed. Please check your credentials.';
      Toast.show({ type: 'error', text1: 'Login Failed', text2: msg });
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.logoWrapper, { backgroundColor: theme.primary }]}>
              <Ionicons name="people" size={32} color="#ffffff" />
            </View>
            <Text style={[textStyles.displayMedium, { color: theme.text.primary, marginTop: spacing[4] }]}>
              ClubFlow
            </Text>
            <Text style={[styles.tagline, { color: theme.text.secondary }]}>
              Manage your club smarter
            </Text>
          </View>

          {/* Card */}
          <View
            style={[
              styles.card,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.text.primary }]}>Sign In</Text>
            <Text style={[styles.cardSubtitle, { color: theme.text.secondary }]}>
              Enter your phone number and password
            </Text>

            <View style={styles.form}>
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Phone Number"
                    placeholder="Enter your phone number"
                    keyboardType="phone-pad"
                    leftIcon="call-outline"
                    onChangeText={onChange}
                    onBlur={onBlur}
                    value={value}
                    error={errors.phone?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Password"
                    placeholder="Enter your password"
                    leftIcon="lock-closed-outline"
                    isPassword
                    onChangeText={onChange}
                    onBlur={onBlur}
                    value={value}
                    error={errors.password?.message}
                  />
                )}
              />
            </View>

            <Button
              title="Sign In"
              onPress={handleSubmit(onSubmit)}
              loading={login.isPending}
              fullWidth
              size="lg"
              style={styles.submitButton}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Ionicons name="shield-checkmark-outline" size={14} color={theme.text.tertiary} />
            <Text style={[styles.footerText, { color: theme.text.tertiary }]}>
              Secured with end-to-end encryption
            </Text>
          </View>

          {/* Feature pills */}
          <View style={styles.features}>
            {['Payments', 'Transparency', 'Events'].map((f) => (
              <View
                key={f}
                style={[styles.pill, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}
              >
                <Text style={[styles.pillText, { color: theme.primary }]}>{f}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: spacing[5], paddingTop: spacing[8], paddingBottom: spacing[8] },
  header: { alignItems: 'center', marginBottom: spacing[8] },
  logoWrapper: {
    width: 72,
    height: 72,
    borderRadius: radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagline: { fontSize: fontSize.base, marginTop: spacing[2] },
  card: {
    borderRadius: radius['2xl'],
    borderWidth: 1,
    padding: spacing[6],
    marginBottom: spacing[6],
  },
  cardTitle: { ...textStyles.headingMedium, marginBottom: spacing[1] },
  cardSubtitle: { fontSize: fontSize.sm, marginBottom: spacing[6] },
  form: { gap: spacing[4], marginBottom: spacing[6] },
  submitButton: { marginTop: spacing[2] },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1] + 2,
    marginBottom: spacing[6],
  },
  footerText: { fontSize: fontSize.xs },
  features: { flexDirection: 'row', gap: spacing[2], justifyContent: 'center' },
  pill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1] + 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  pillText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
});
