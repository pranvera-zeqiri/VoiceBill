/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { colors } from '@/constants/theme';
import { useColorScheme } from './use-color-scheme';

export function useTheme() {
  const scheme = useColorScheme();

  if (scheme !== 'dark') return colors;

  return {
    ...colors,
    background: colors.dark,
    surface: colors.darkSurface,
    border: colors.darkBorder,
    text: colors.textOnDark,
    textMuted: colors.textOnDarkMuted,
  };
}
