import { colors, radius, shadow } from '@/constants/theme';
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
  const { total } = calcTotals(invoice.items, invoice.vatRate);
  const subtitle =
    subtitleMode === 'day'
      ? `${invoice.title} · ${formatDayLabel(invoice.date)}`
      : `${invoice.title} · #${invoice.number}`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
    >
      <Avatar name={customerName} />
      <View style={styles.middle}>
        <Text style={styles.name} numberOfLines={1}>
          {customerName}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.amount}>{formatMoney(total)}</Text>
        <StatusBadge status={invoice.status} />
      </View>
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
  middle: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: colors.text },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 4 },
  amount: { fontSize: 14, fontWeight: '800', color: colors.text },
});