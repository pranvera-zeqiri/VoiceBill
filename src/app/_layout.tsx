import { palettes } from '@/constants/theme';
import { AppProvider, useApp } from '@/context/AppContext';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function AppStack() {
  const { darkMode } = useApp();
  const colors = palettes[darkMode ? 'dark' : 'light'];
  return (
    <>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
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
          name="invoice"
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
            contentStyle: { backgroundColor: colors.background },
          }}
        />
        <Stack.Screen
          name="add-bill"
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: colors.background },
          }}
        />
        <Stack.Screen
          name="voice"
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppStack />
      </AppProvider>
    </SafeAreaProvider>
  );
}