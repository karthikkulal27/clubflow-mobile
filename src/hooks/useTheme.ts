import { useColorScheme } from 'react-native';
import { colors } from '../theme/colors';
import { useClubBrandingStore } from '../store/club-branding.store';

type ThemeColors = typeof colors.light | typeof colors.dark;

function getLightColor(hex: string): string {
  try {
    const c = hex.replace('#', '');
    const rgb = parseInt(c, 16);
    const r = Math.min(255, (rgb >> 16) + 180);
    const g = Math.min(255, ((rgb >> 8) & 255) + 180);
    const b = Math.min(255, (rgb & 255) + 180);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  } catch {
    return '#dbeafe';
  }
}

function getDarkColor(hex: string): string {
  try {
    const c = hex.replace('#', '');
    const rgb = parseInt(c, 16);
    const r = Math.max(0, (rgb >> 16) - 60);
    const g = Math.max(0, ((rgb >> 8) & 255) - 60);
    const b = Math.max(0, (rgb & 255) - 60);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  } catch {
    return '#1e3a5f';
  }
}

export function useTheme(): { theme: ThemeColors & { clubPrimary?: string; clubSecondary?: string }; isDark: boolean } {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const baseTheme: ThemeColors = isDark ? colors.dark : colors.light;
  const branding = useClubBrandingStore((s) => s.branding);

  // Apply club branding colors if available
  const theme = {
    ...baseTheme,
    ...(branding?.primaryColor && {
      primary: branding.primaryColor,
      primaryLight: getLightColor(branding.primaryColor),
      primaryDark: getDarkColor(branding.primaryColor),
      tabBarActive: branding.primaryColor,
      clubPrimary: branding.primaryColor,
    }),
    ...(branding?.secondaryColor && {
      clubSecondary: branding.secondaryColor,
    }),
  } as any;


  return { theme: theme as ThemeColors & { clubPrimary?: string; clubSecondary?: string }, isDark };
}
