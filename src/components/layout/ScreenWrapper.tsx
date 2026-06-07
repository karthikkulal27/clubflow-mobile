import React from 'react';
import {
  ScrollView,
  View,
  RefreshControl,
  StyleSheet,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { spacing } from '../../theme/spacing';

interface ScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  padded?: boolean;
  keyboardAvoid?: boolean;
}

export function ScreenWrapper({
  children,
  scrollable = true,
  refreshing = false,
  onRefresh,
  style,
  contentStyle,
  padded = true,
  keyboardAvoid = false,
}: ScreenWrapperProps) {
  const { theme } = useTheme();

  const content = scrollable ? (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.background }]}
      contentContainerStyle={[padded && styles.padded, contentStyle]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, padded && styles.padded, contentStyle]}>{children}</View>
  );

  const wrapped = keyboardAvoid ? (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.background }, style]}
      edges={['top']}
    >
      {wrapped}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  fill: { flex: 1 },
  scroll: { flex: 1 },
  padded: { paddingHorizontal: spacing[5], paddingBottom: spacing[8] },
});
