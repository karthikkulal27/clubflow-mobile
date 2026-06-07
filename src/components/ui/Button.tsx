import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { radius, spacing } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const { theme } = useTheme();

  const variantContainerStyle: ViewStyle =
    variant === 'primary' ? { backgroundColor: theme.primary }
    : variant === 'secondary' ? { backgroundColor: theme.primaryLight, borderWidth: 1, borderColor: theme.primary }
    : variant === 'ghost' ? { backgroundColor: 'transparent' }
    : { backgroundColor: theme.danger };

  const containerStyles: ViewStyle[] = [
    styles.base,
    sizeStyles[size],
    variantContainerStyle,
    ...(fullWidth ? [styles.fullWidth] : []),
    ...((disabled || loading) ? [styles.disabled] : []),
    ...(style ? [style as ViewStyle] : []),
  ];

  const variantTextColor: TextStyle =
    variant === 'primary' ? { color: theme.text.inverse }
    : variant === 'secondary' ? { color: theme.primary }
    : variant === 'ghost' ? { color: theme.primary }
    : { color: '#ffffff' };

  const textStyles: TextStyle[] = [styles.text, sizeTextStyles[size], variantTextColor];

  return (
    <TouchableOpacity
      style={containerStyles}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'secondary' || variant === 'ghost' ? theme.primary : '#ffffff'}
          size="small"
        />
      ) : (
        <>
          {leftIcon}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    gap: spacing[2],
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  text: { fontWeight: fontWeight.semibold },
});

const sizeStyles: Record<Size, ViewStyle> = {
  sm: { paddingVertical: spacing[2], paddingHorizontal: spacing[4], borderRadius: radius.md },
  md: { paddingVertical: spacing[3] + 2, paddingHorizontal: spacing[6] },
  lg: { paddingVertical: spacing[4], paddingHorizontal: spacing[8] },
};

const sizeTextStyles: Record<Size, TextStyle> = {
  sm: { fontSize: fontSize.sm },
  md: { fontSize: fontSize.base },
  lg: { fontSize: fontSize.md },
};
