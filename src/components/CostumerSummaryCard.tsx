import { radius, shadow } from '@/constants/theme';
import { useAppTheme } from '@/components/useAppTheme';
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
  const { colors } = useAppTheme();
  const call = () => Linking.openURL(`tel:${customer.phone.replace(/\s/g, '')}`);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable onPress={onPressName} style={styles.top}>
        <Avatar name={customer.name} size={48} variant="dark" />
        <View>
          <Text style={[styles.name, { color: colors.text }]}>{customer.name}</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>Klient që nga {formatMonthYear(customer.since)}</Text>
        </View>
      </Pressable>

      <View style={styles.stats}>
        <Stat value={String(count)} label="Fatura" colors={colors} />
        <Stat value={formatMoneyCompact(total)} label="Gjithsej" colors={colors} />
        <Stat value={`${customer.avgPayDays} ditë`} label="Pagon brenda" colors={colors} />
      </View>

      <View style={styles.actions}>
        <Button label="Thirr" icon="phone" variant="outline" onPress={call} style={{ flex: 1 }} />
        <Button label="Fol për punë të re" icon="mic" onPress={onNewJob} style={{ flex: 2 }} />
      </View>
    </View>
  );
}

function Stat({ value, label, colors }: { value: string; label: string; colors: ReturnType<typeof useAppTheme>['colors'] }) {
  return (
    <View style={[styles.stat, { backgroundColor: colors.field }]}>
      <Text style={[styles.statValue, { color: colors.text, fontVariant: ['tabular-nums'] }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    ...shadow,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontSize: 17, fontWeight: '800' },
  sub: { fontSize: 12, marginTop: 2 },
  stats: { flexDirection: 'row', gap: 8, marginTop: 14 },
  stat: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statValue: { fontSize: 15, fontWeight: '800' },
  statLabel: { fontSize: 11, marginTop: 2, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
});