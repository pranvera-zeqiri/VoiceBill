import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Drejton te grupi i tab-eve ku ndodhen të 5 faqet dhe navbari i poshtëm */}
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}