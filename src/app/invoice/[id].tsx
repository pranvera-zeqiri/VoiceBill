import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { StatusBadge } from '@/components/statusBadge';
import { colors, radius } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { calcTotals, formatDate, formatMoney } from '@/utils/format';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function InvoiceDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getCustomer, getInvoice } = useApp();
  const invoice = getInvoice(id);

  if (!invoice) {
    return (
      <Screen>
        <Header title="Fatura" onBack={() => router.back()} />
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Fatura nuk u gjet.</Text>
        </View>
      </Screen>
    );
  }

  const customer = getCustomer(invoice.customerId);
  const totals = calcTotals(invoice.items, invoice.vatRate);

  return (
    <Screen>
      <Header title={`Fatura #${invoice.number}`} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summary}>
          <View style={styles.summaryTop}>
            <Text style={styles.title}>{invoice.title}</Text>
            <StatusBadge status={invoice.status} />
          </View>
          <Text style={styles.customer}>{customer?.name ?? 'Klient'}</Text>
          <Text style={styles.date}>Data: {formatDate(invoice.date)}</Text>
          <Text style={styles.date}>Afati i pagesës: {formatDate(invoice.dueDate)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Artikujt</Text>
        <View style={styles.items}>
          {invoice.items.map((item) => (
            <View key={item.id} style={styles.item}>
              <View style={styles.itemDescription}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.muted}>
                  {item.quantity} {item.unit} × {formatMoney(item.unitPrice)}
                </Text>
              </View>
              <Text style={styles.itemTotal}>
                {formatMoney(item.quantity * item.unitPrice)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <TotalRow label="Nëntotali" value={formatMoney(totals.subtotal)} />
          <TotalRow label={`TVSH (${invoice.vatRate}%)`} value={formatMoney(totals.vat)} />
          <View style={styles.totalDivider} />
          <TotalRow label="Gjithsej" value={formatMoney(totals.total)} strong />
        </View>
      </ScrollView>
    </Screen>
  );
}

function TotalRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.totalRow}>
      <Text style={[styles.totalLabel, strong && styles.strong]}>{label}</Text>
      <Text style={[styles.totalValue, strong && styles.strong]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 32 },
  summary: {
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { flex: 1, color: colors.text, fontSize: 20, fontWeight: '800' },
  customer: { color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 16 },
  date: { color: colors.textMuted, fontSize: 13, marginTop: 6 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 24, marginBottom: 10 },
  items: {
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemDescription: { flex: 1 },
  itemTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  muted: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  itemTotal: { color: colors.text, fontSize: 14, fontWeight: '700' },
  totals: { gap: 10, padding: 16, marginTop: 16, borderRadius: radius.md, backgroundColor: colors.surface },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  totalLabel: { color: colors.textMuted, fontSize: 13 },
  totalValue: { color: colors.text, fontSize: 13, fontWeight: '600' },
  totalDivider: { height: 1, backgroundColor: colors.border, marginVertical: 2 },
  strong: { color: colors.text, fontSize: 15, fontWeight: '800' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { color: colors.textMuted, fontSize: 14 },
});
