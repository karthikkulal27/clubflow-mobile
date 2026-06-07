import { Platform } from 'react-native';

export const fontFamily = {
  regular: Platform.OS === 'ios' ? 'System' : 'Roboto',
  medium: Platform.OS === 'ios' ? 'System' : 'Roboto',
  semibold: Platform.OS === 'ios' ? 'System' : 'Roboto',
  bold: Platform.OS === 'ios' ? 'System' : 'Roboto',
  mono: Platform.OS === 'ios' ? 'Courier' : 'monospace',
};

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

export const textStyles = {
  displayLarge: { fontSize: fontSize['4xl'], fontWeight: fontWeight.bold, lineHeight: fontSize['4xl'] * 1.2 },
  displayMedium: { fontSize: fontSize['3xl'], fontWeight: fontWeight.bold, lineHeight: fontSize['3xl'] * 1.2 },
  headingLarge: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, lineHeight: fontSize['2xl'] * 1.3 },
  headingMedium: { fontSize: fontSize.xl, fontWeight: fontWeight.semibold, lineHeight: fontSize.xl * 1.3 },
  headingSmall: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, lineHeight: fontSize.lg * 1.4 },
  bodyLarge: { fontSize: fontSize.md, fontWeight: fontWeight.regular, lineHeight: fontSize.md * 1.5 },
  bodyMedium: { fontSize: fontSize.base, fontWeight: fontWeight.regular, lineHeight: fontSize.base * 1.5 },
  bodySmall: { fontSize: fontSize.sm, fontWeight: fontWeight.regular, lineHeight: fontSize.sm * 1.5 },
  labelLarge: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  labelMedium: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  labelSmall: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  caption: { fontSize: fontSize.xs, fontWeight: fontWeight.regular },
  amount: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold },
  amountLarge: { fontSize: fontSize['4xl'], fontWeight: fontWeight.bold },
} as const;
