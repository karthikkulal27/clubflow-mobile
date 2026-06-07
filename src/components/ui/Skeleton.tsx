import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { radius } from '../../theme/spacing';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = radius.md, style }: SkeletonProps) {
  const { theme } = useTheme();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: theme.border, opacity },
        style,
      ]}
    />
  );
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }, style]}>
      <View style={styles.row}>
        <Skeleton width={44} height={44} borderRadius={22} />
        <View style={styles.col}>
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
        </View>
      </View>
      <Skeleton height={12} style={{ marginTop: 12 }} />
      <Skeleton width="80%" height={12} style={{ marginTop: 6 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  col: { flex: 1, gap: 6 },
});
