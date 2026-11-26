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

export const darkColors = {
  background: '#070A12',
  surface: '#172036',
  dark: '#070A12',
  darkSurface: '#131B2E',
  darkBorder: 'rgba(148,163,184,0.14)',
  primary: '#F97316',
  primaryDark: '#EA580C',
  primarySoft: 'rgba(249,115,22,0.16)',
  alertBg: '#172036',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  textOnDark: '#F8FAFC',
  textOnDarkMuted: '#94A3B8',
  border: 'rgba(148,163,184,0.14)',
  field: '#131B2E',
  success: '#10B981',
  successSoft: 'rgba(16,185,129,0.16)',
  danger: '#F87171',
  dangerSoft: 'rgba(248,113,113,0.15)',
  neutralSoft: '#26334B',
} as const;

export const palettes = { light: colors, dark: darkColors } as const;

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