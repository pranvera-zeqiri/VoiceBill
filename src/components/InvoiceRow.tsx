import { radius, shadow } from '@/constants/theme';
import { useAppTheme } from '@/components/useAppTheme';
import { Invoice } from '@/types';
import { calcTotals, formatDayLabel, formatMoney } from '@/utils/format';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from './avatar';
import { StatusBadge } from './statusBadge';

interface Props {
  invoice: Invoice;
  customerName: string;
  onPress: () => void;
  subtitleMode?: 'day' | 'number';
}

export function InvoiceRow({ invoice, customerName, onPress, subtitleMode = 'number' }: Props) {
  const { colors } = useAppTheme();
  const { total } = calcTotals(invoice.items, invoice.vatRate);
  const subtitle =
    subtitleMode === 'day'
      ? `${invoice.title} · ${formatDayLabel(invoice.date)}`
      : `${invoice.title} · #${invoice.number}`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { opacity: 0.85 },
      ]}
    >
      <Avatar name={customerName} />
      <View style={styles.middle}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {customerName}
        </Text>
        <Text style={[styles.sub, { color: colors.textMuted }]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: colors.text, fontVariant: ['tabular-nums'] }]}>{formatMoney(total)}</Text>
        <StatusBadge status={invoice.status} />
      </View>
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
  middle: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700' },
  sub: { fontSize: 12, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 4 },
  amount: { fontSize: 14, fontWeight: '800' },
});