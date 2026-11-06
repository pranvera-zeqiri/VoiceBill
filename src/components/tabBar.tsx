import { colors } from '@/constants/theme';
import { FeatherName } from '@/types';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/build/layouts/Tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ICONS: Record<string, FeatherName> = {
  index: 'home',
  invoices: 'file-text',
  customers: 'users',
  settings: 'user',
};

export function TabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const renderTab = (route: (typeof state.routes)[number]) => {
    const focused = state.routes[state.index]?.key === route.key;
    const label = descriptors[route.key].options.title ?? route.name;

    const onPress = () => {
      const event = emitter.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) {
        navigateToTab(route.key);
      }
    };

    return (
      <Pressable key={route.key} onPress={onPress} style={styles.tab}>
        <View style={[styles.pill, focused && { backgroundColor: colors.primarySoft }]}>
          <Feather
            name={ICONS[route.name] ?? 'circle'}
            size={20}
            color={focused ? colors.primary : colors.textMuted}
          />
        </View>
        <Text
          style={[
            styles.label,
            focused
              ? { color: colors.text, fontWeight: '800' }
              : { color: colors.textMuted, fontWeight: '500' },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  const visibleRoutes = state.routes.filter((route) => route.name !== 'voice');
  const left = visibleRoutes.slice(0, 2);
  const right = visibleRoutes.slice(2);

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {left.map(renderTab)}

      <View style={styles.fabSlot}>
        <Pressable
          onPress={() => router.push('./voice')}
          style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.95 }] }]}
        >
          <Feather name="mic" size={26} color="#FFFFFF" />
        </Pressable>
      </View>

      {right.map(renderTab)}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: 'center', gap: 2 },
  pill: {
    width: 46,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 11 },
  fabSlot: { flex: 1, alignItems: 'center' },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginTop: -30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.surface,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});