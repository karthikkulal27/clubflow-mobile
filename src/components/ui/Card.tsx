import React from 'react';
import { View, StyleSheet, ViewStyle, ViewProps, StyleProp } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { radius, shadow, spacing } from '../../theme/spacing';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  padding?: number;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
}

export function Card({ children, padding = spacing[4], style, elevated = false, ...props }: CardProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.cardBorder },
        elevated && shadow.md,
        { padding },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
