import { colors, radius, shadow } from '@/constants/theme';
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
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
    >
      <Avatar name={customer.name} />
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{customer.name}</Text>
        <Text style={styles.sub}>
          {count} fatura · {formatMoneyCompact(total)}
        </Text>
      </View>
      {overdue > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{overdue} e vonuar</Text>
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
    backgroundColor: colors.surface,
    borderRadius: radius.lg - 4,
    padding: 12,
    gap: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  name: { fontSize: 14, fontWeight: '700', color: colors.text },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  badge: {
    backgroundColor: colors.dangerSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: colors.danger },
});