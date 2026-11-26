import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { StatusBadge } from '@/components/statusBadge';
import { colors, radius } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { calcTotals, formatDate, formatMoney, formatSavedDate, formatTime } from '@/utils/format';
import { invoiceService } from '@/services/invoiceService';
import { generateAndShareInvoicePdf, shareInvoice } from '@/utils/share';
import { Feather } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';

export default function InvoiceDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getCustomer, getInvoice, user, refreshInvoices, updateInvoice } = useApp();
  const [updatingStatus, setUpdatingStatus] = useState(false);
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
  const iban = user?.iban?.trim() ?? '';
  const qrValue = JSON.stringify({
    invoice: invoice.number,
    amount: totals.total.toFixed(2),
    currency: 'EUR',
    ...(iban ? { iban: iban.replace(/\s+/g, '') } : {}),
  });
  const share = async () => {
    try {
      await shareInvoice(
        invoice,
        customer?.name ?? invoice.customerName ?? 'Klient',
        user?.businessName ?? 'VoiceBill',
        { bankName: user?.bankName, iban: user?.iban }
      );
    } catch (error) {
      Alert.alert(
        'Nuk u nda fatura',
        error instanceof Error ? error.message : 'Provo përsëri të ndash faturën.'
      );
    }
  };
  const togglePaidStatus = async () => {
    if (updatingStatus) return;
    const nextStatus = invoice.status === 'paid' ? 'pending' : 'paid';
    setUpdatingStatus(true);
    try {
      await invoiceService.updateInvoiceStatus(invoice.id, nextStatus);
      updateInvoice(invoice.id, { status: nextStatus });
      await refreshInvoices();
      Alert.alert(
        'Statusi u përditësua',
        nextStatus === 'paid' ? 'Fatura u shënua si e paguar.' : 'Fatura u kthye si e papaguar.'
      );
    } catch (error) {
      Alert.alert(
        'Statusi nuk u ndryshua',
        error instanceof Error ? error.message : 'Kontrollo lidhjen me Supabase dhe provo përsëri.'
      );
    } finally {
      setUpdatingStatus(false);
    }
  };
  const exportPdf = async () => {
    try {
      await generateAndShareInvoicePdf(
        invoice,
        customer?.name ?? invoice.customerName ?? 'Klient',
        user?.businessName ?? 'VoiceBill',
        { bankName: user?.bankName, iban: user?.iban }
      );
    } catch (error) {
      Alert.alert(
        'PDF-ja nuk u krijua',
        error instanceof Error ? error.message : 'Provo përsëri të ruash PDF-në.'
      );
    }
  };

  return (
    <Screen>
      <Header
        title={`Fatura #${invoice.number}`}
        onBack={() => router.back()}
        right={
          <Pressable
            accessibilityLabel="Ndaj faturën"
            onPress={() => void share()}
            style={styles.shareButton}
          >
            <Feather name="share-2" size={18} color={colors.text} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summary}>
          <View style={styles.summaryTop}>
            <Text style={styles.title}>{invoice.title}</Text>
            <StatusBadge status={invoice.status} />
          </View>
          <Text style={styles.customer}>{customer?.name ?? 'Klient'}</Text>
          <Text style={styles.date}>
            Data: {invoice.createdAt ? formatSavedDate(invoice.createdAt) : formatDate(invoice.date)}
          </Text>
          <Text style={styles.date}>
            Ora: {invoice.createdAt ? formatTime(invoice.createdAt) : '--:--'}
          </Text>
          <Text style={styles.date}>Afati i pagesës: {formatDate(invoice.dueDate)}</Text>
        </View>

        {iban ? (
          <View style={styles.paymentCard}>
            <Text style={styles.sectionTitle}>Pagesa bankare</Text>
            {user?.bankName ? <Text style={styles.paymentText}>Banka: {user.bankName}</Text> : null}
            <Text style={styles.paymentText}>IBAN: {iban}</Text>
          </View>
        ) : null}

        <View style={styles.qrCard}>
          <QRCode value={qrValue} size={156} />
          <Text style={styles.qrTitle}>Detajet e pagesës</Text>
          <Text style={styles.qrCaption}>
            Fatura #{invoice.number} · {formatMoney(totals.total)}
          </Text>
          {iban ? <Text style={styles.qrCaption}>IBAN: {iban}</Text> : null}
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
        <Pressable accessibilityLabel="Ruaj PDF ose dërgo" onPress={() => void exportPdf()} style={styles.pdfButton}>
          <Feather name="file-text" size={18} color="#FFFFFF" />
          <Text style={styles.pdfButtonText}>Ruaj PDF / Dërgo</Text>
          <Feather name="send" size={17} color="#FFFFFF" />
        </Pressable>
        {invoice.status !== 'draft' ? (
          <Pressable
            accessibilityLabel={invoice.status === 'paid' ? 'Kthe faturën në të papaguar' : 'Shëno faturën si të paguar'}
            disabled={updatingStatus}
            onPress={() => void togglePaidStatus()}
            style={[styles.statusButton, updatingStatus && styles.disabledButton]}
          >
            <Feather name={invoice.status === 'paid' ? 'rotate-ccw' : 'check-circle'} size={18} color="#FFFFFF" />
            <Text style={styles.statusButtonText}>
              {updatingStatus
                ? 'Po ruhet...'
                : invoice.status === 'paid'
                  ? 'Ktheje si të papaguar'
                  : 'Shëno si të paguar'}
            </Text>
          </Pressable>
        ) : null}
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
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
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
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 54,
    marginTop: 18,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  pdfButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  paymentCard: { padding: 16, marginTop: 16, borderRadius: radius.md, backgroundColor: colors.surface },
  paymentText: { color: colors.text, fontSize: 13, marginTop: 8, fontWeight: '600' },
  qrCard: { alignItems: 'center', gap: 8, padding: 18, marginTop: 16, borderRadius: radius.md, backgroundColor: colors.surface },
  qrTitle: { color: colors.text, fontSize: 15, fontWeight: '800', marginTop: 6 },
  qrCaption: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 52,
    marginTop: 12,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  statusButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  disabledButton: { opacity: 0.6 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { color: colors.textMuted, fontSize: 14 },
});
