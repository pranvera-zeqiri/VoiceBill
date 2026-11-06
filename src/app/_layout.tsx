import { colors } from '@/constants/theme';
import { AppProvider } from '@/context/AppContext';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" options={{ animation: 'fade' }} />
          <Stack.Screen name="auth" options={{ animation: 'fade' }} />
          <Stack.Screen name="tabs" options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen
            name="voice"
            options={{
              presentation: 'fullScreenModal',
              animation: 'slide_from_bottom',
              contentStyle: { backgroundColor: colors.dark },
            }}
          />
        </Stack>
      </AppProvider>
    </SafeAreaProvider>
  );
}