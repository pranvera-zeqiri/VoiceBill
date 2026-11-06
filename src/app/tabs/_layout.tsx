import { TabBar } from '@/components/tabBar';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Ballina' }} />
      <Tabs.Screen name="invoices" options={{ title: 'Faturat' }} />
      <Tabs.Screen name="customers" options={{ title: 'Klientët' }} />
      <Tabs.Screen name="settings" options={{ title: 'Profili' }} />
    </Tabs>
  );
}