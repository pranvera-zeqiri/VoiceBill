import { palettes } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

export function useAppTheme() {
  const { darkMode } = useApp();
  return { darkMode, colors: palettes[darkMode ? 'dark' : 'light'] };
}
