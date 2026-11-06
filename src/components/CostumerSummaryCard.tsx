import { colors, radius, shadow } from '@/constants/theme';
import { Customer } from '@/types';
import { formatMoneyCompact, formatMonthYear } from '@/utils/format';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from './avatar';
import { Button } from './button';

interface Props {
  customer: Customer;
  count: number;
  total: number;
  onPressName?: () => void;
  onNewJob: () => void;
}

export function CustomerSummaryCard({ customer, count, total, onPressName, onNewJob }: Props) {
  const call = () => Linking.openURL(`tel:${customer.phone.replace(/\s/g, '')}`);

  return (
    <View style={styles.card}>
      <Pressable onPress={onPressName} style={styles.top}>
        <Avatar name={customer.name} size={48} variant="dark" />
        <View>
          <Text style={styles.name}>{customer.name}</Text>
          <Text style={styles.sub}>Klient që nga {formatMonthYear(customer.since)}</Text>
        </View>
      </Pressable>

      <View style={styles.stats}>
        <Stat value={String(count)} label="Fatura" />
        <Stat value={formatMoneyCompact(total)} label="Gjithsej" />
        <Stat value={`${customer.avgPayDays} ditë`} label="Pagon brenda" />
      </View>

      <View style={styles.actions}>
        <Button label="Thirr" icon="phone" variant="outline" onPress={call} style={{ flex: 1 }} />
        <Button label="Fol për punë të re" icon="mic" onPress={onNewJob} style={{ flex: 2 }} />
      </View>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontSize: 17, fontWeight: '800', color: colors.text },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  stats: { flexDirection: 'row', gap: 8, marginTop: 14 },
  stat: {
    flex: 1,
    backgroundColor: colors.field,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statValue: { fontSize: 15, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
});