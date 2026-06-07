export const palette = {
  blue50: '#eff6ff',
  blue100: '#dbeafe',
  blue400: '#60a5fa',
  blue500: '#3b82f6',
  blue600: '#2563eb',
  blue700: '#1d4ed8',
  blue900: '#1e3a8a',

  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',
  slate950: '#020617',

  green400: '#4ade80',
  green500: '#22c55e',
  green600: '#16a34a',

  amber400: '#fbbf24',
  amber500: '#f59e0b',
  amber600: '#d97706',

  red400: '#f87171',
  red500: '#ef4444',
  red600: '#dc2626',

  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
} as const;

export const colors = {
  light: {
    background: palette.slate50,
    surface: palette.white,
    surfaceElevated: palette.white,
    border: palette.slate200,
    borderSubtle: palette.slate100,

    text: {
      primary: palette.slate900,
      secondary: palette.slate600,
      tertiary: palette.slate400,
      inverse: palette.white,
    },

    primary: palette.blue600,
    primaryLight: palette.blue100,
    primaryDark: palette.blue700,

    success: palette.green500,
    successLight: '#dcfce7',
    warning: palette.amber500,
    warningLight: '#fef3c7',
    danger: palette.red500,
    dangerLight: '#fee2e2',

    card: palette.white,
    cardBorder: palette.slate200,

    tabBar: palette.white,
    tabBarBorder: palette.slate200,
    tabBarActive: palette.blue600,
    tabBarInactive: palette.slate400,
  },

  dark: {
    background: palette.slate950,
    surface: palette.slate900,
    surfaceElevated: palette.slate800,
    border: palette.slate700,
    borderSubtle: palette.slate800,

    text: {
      primary: palette.white,
      secondary: palette.slate400,
      tertiary: palette.slate600,
      inverse: palette.slate900,
    },

    primary: palette.blue500,
    primaryLight: '#1e3a5f',
    primaryDark: palette.blue400,

    success: palette.green400,
    successLight: '#052e16',
    warning: palette.amber400,
    warningLight: '#451a03',
    danger: palette.red400,
    dangerLight: '#450a0a',

    card: palette.slate800,
    cardBorder: palette.slate700,

    tabBar: palette.slate900,
    tabBarBorder: palette.slate800,
    tabBarActive: palette.blue400,
    tabBarInactive: palette.slate600,
  },
} as const;

export type ColorScheme = 'light' | 'dark';
export type ThemeColors = typeof colors.light;
