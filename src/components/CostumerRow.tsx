import { radius, shadow } from '@/constants/theme';
import { useAppTheme } from '@/components/useAppTheme';
import { Customer } from '@/types';
import { formatMoneyCompact } from '@/utils/format';
import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from './avatar';

interface Props {
  customer: Customer;
  count: number;
  total: number;
  overdue: number;
  onPress: () => void;
}

export function CustomerRow({ customer, count, total, overdue, onPress }: Props) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { opacity: 0.85 },
      ]}
    >
      <Avatar name={customer.name} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, { color: colors.text }]}>{customer.name}</Text>
        <Text style={[styles.sub, { color: colors.textMuted }]}>
          {count} fatura · {formatMoneyCompact(total)}
        </Text>
      </View>
      {overdue > 0 ? (
        <View style={[styles.badge, { backgroundColor: colors.dangerSoft }]}>
          <Text style={[styles.badgeText, { color: colors.danger }]}>{overdue} e vonuar</Text>
        </View>
      ) : (
        <Feather name="chevron-right" size={18} color={colors.textMuted} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg - 4,
    padding: 12,
    gap: 12,
    marginBottom: 10,
    borderWidth: 1,
    ...shadow,
  },
  name: { fontSize: 14, fontWeight: '700' },
  sub: { fontSize: 12, marginTop: 2 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
});