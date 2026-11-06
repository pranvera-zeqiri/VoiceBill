import { Platform } from 'react-native';

export const colors = {
  background: '#F7F5F2',
  surface: '#FFFFFF',
  dark: '#0F1B22',
  darkSurface: '#17262F',
  darkBorder: '#24363F',
  primary: '#F26B1D',
  primaryDark: '#D9560B',
  primarySoft: '#FDEADD',
  alertBg: '#F6E0D0',
  text: '#10191F',
  textMuted: '#7B868C',
  textOnDark: '#FFFFFF',
  textOnDarkMuted: '#9AA8B0',
  border: '#ECE8E1',
  field: '#F6F4F0',
  success: '#17A06A',
  successSoft: '#DDF4EA',
  danger: '#E5484D',
  dangerSoft: '#FDE4E4',
  neutralSoft: '#ECEAE6',
} as const;

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 } as const;

export const shadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  android: { elevation: 2 },
  default: {},
});