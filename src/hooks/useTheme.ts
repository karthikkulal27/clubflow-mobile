import { useColorScheme } from 'react-native';
import { colors } from '../theme/colors';

type ThemeColors = typeof colors.light | typeof colors.dark;

export function useTheme(): { theme: ThemeColors; isDark: boolean } {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme: ThemeColors = isDark ? colors.dark : colors.light;
  return { theme, isDark };
}
