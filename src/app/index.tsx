import { Logo } from '@/components/Logo';
import { Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated } = useApp();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      router.replace(isAuthenticated ? './tabs' : './auth/login');
    }, 2000);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Screen dark edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View style={styles.center}>
        <Animated.View style={{ opacity, transform: [{ scale }], alignItems: 'center' }}>
          <Logo size={72} />
          <Text style={styles.tagline}>
            Foli për punën.{'\n'}
            <Text style={{ color: colors.primary }}>AI bën faturën.</Text>
          </Text>
        </Animated.View>
      </View>
      <Text style={styles.footer}>VoiceBill · MVP</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  tagline: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  footer: {
    textAlign: 'center',
    color: colors.textOnDarkMuted,
    fontSize: 12,
    paddingBottom: 16,
  },
});