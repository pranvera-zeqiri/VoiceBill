import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Grupi i tab-eve kryesore me navbar (Ballina, Klientët, Profili) */}
      <Stack.Screen name="(tabs)" />
      
      {/* Ekranet e faturës dhe zërit që hapen pa navbar dhe me shigjetë lart */}
      <Stack.Screen name="invoice" />
      <Stack.Screen name="add-bill" />
    </Stack>
  );
}