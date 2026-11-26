import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { useApp } from '@/context/AppContext';

export function AppGradientBackground() {
  const { darkMode } = useApp();
  return (
    <LinearGradient
      pointerEvents="none"
      colors={darkMode ? ['#162038', '#0D1322', '#070A12'] : ['#F7F5F2', '#F7F5F2']}
      locations={darkMode ? [0, 0.52, 1] : undefined}
      style={StyleSheet.absoluteFill}
    />
  );
}
