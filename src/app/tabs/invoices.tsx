import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { invoiceService } from '@/services/invoiceService';
import { useAppTheme } from '@/components/useAppTheme';
import type { Invoice, InvoiceStatus } from '@/types';
import { daysSince, getInitials, statusLabel } from '@/utils/format';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { generateAndShareInvoicePdf, shareReminder } from '@/utils/share';

type Filter = 'all' | 'open' | 'paid';

function formatMoney(value: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
}

function getInvoiceTotal(invoice: Invoice) {
  const subtotal = invoice.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  return subtotal * (1 + invoice.vatRate / 100);
}

function displayStatus(invoice: Invoice): InvoiceStatus {
  return invoice.status === 'pending' && daysSince(invoice.dueDate) > 0 ? 'overdue' : invoice.status;
}

export default function InvoicesScreen() {
  const router = useRouter();
  const { invoices, getCustomer, invoicesLoading, invoicesError, refreshInvoices, user } = useApp();
  const { colors } = useAppTheme();
  const ink = colors.text;
  const [filter, setFilter] = useState<Filter>('all');
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void refreshInvoices();
    }, [refreshInvoices])
  );

  const sorted = useMemo(
    () => [...invoices].sort((a, b) => b.date.localeCompare(a.date) || b.number.localeCompare(a.number, 'en', { numeric: true })),
    [invoices]
  );
  const openCount = invoices.filter((invoice) => ['pending', 'overdue'].includes(displayStatus(invoice))).length;
  const paidCount = invoices.filter((invoice) => invoice.status === 'paid').length;
  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return sorted.filter((invoice) => {
      const status = displayStatus(invoice);
      if (filter === 'open' && status !== 'pending' && status !== 'overdue') return false;
      if (filter === 'paid' && status !== 'paid') return false;
      if (!search) return true;
      const client = (invoice.customerName ?? getCustomer(invoice.customerId)?.name ?? '').toLocaleLowerCase();
      return client.includes(search) || invoice.number.toLocaleLowerCase().includes(search);
    });
  }, [sorted, filter, query, getCustomer]);

  const groups = useMemo(() => {
    const sections: { title: string; invoices: Invoice[] }[] = [
      { title: 'Sot', invoices: [] },
      { title: 'Këtë javë', invoices: [] },
      { title: 'Më herët', invoices: [] },
    ];
    filtered.forEach((invoice) => {
      const age = daysSince(invoice.date);
      sections[age <= 0 ? 0 : age <= 6 ? 1 : 2].invoices.push(invoice);
    });
    return sections.filter((section) => section.invoices.length > 0);
  }, [filtered]);

  const overdueInvoice = sorted.find((invoice) => displayStatus(invoice) === 'overdue');
  const overdueName = overdueInvoice
    ? overdueInvoice.customerName ?? getCustomer(overdueInvoice.customerId)?.name ?? 'Klienti'
    : '';

  const markPaid = async (invoice: Invoice) => {
    if (invoice.status === 'paid' || updatingId) return;
    setUpdatingId(invoice.id);
    try {
      await invoiceService.updateInvoiceStatus(invoice.id, 'paid');
      await refreshInvoices();
    } catch (error) {
      Alert.alert(
        'Statusi nuk u ndryshua',
        error instanceof Error ? error.message : 'Kontrollo lidhjen me Supabase dhe provo përsëri.'
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const sendReminder = async () => {
    if (!overdueInvoice) return;
    try {
      await shareReminder(overdueInvoice, overdueName);
    } catch (error) {
      Alert.alert('Kujtesa nuk u dërgua', error instanceof Error ? error.message : 'Provo përsëri.');
    }
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Faturat</Text>
          <Pressable
            accessibilityLabel={searching ? 'Mbyll kërkimin' : 'Kërko faturë'}
            style={styles.searchToggle}
            onPress={() => {
              setSearching((value) => !value);
              setQuery('');
            }}
          >
            <Feather name={searching ? 'x' : 'search'} size={19} color={ink} />
          </Pressable>
        </View>

        {searching ? (
          <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Feather name="search" size={17} color={colors.textMuted} />
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder="Kërko klient ose numër fature..."
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.text }]}
            />
          </View>
        ) : null}

        <View style={styles.filters}>
          <FilterPill label="Të gjitha" selected={filter === 'all'} onPress={() => setFilter('all')} palette={colors} />
          <FilterPill label={`Në pritje ${openCount}`} selected={filter === 'open'} onPress={() => setFilter('open')} palette={colors} />
          <FilterPill label={`Paguar ${paidCount}`} selected={filter === 'paid'} onPress={() => setFilter('paid')} palette={colors} />
        </View>

        {overdueInvoice && filter !== 'paid' ? (
          <View style={[styles.reminder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.reminderIcon, { backgroundColor: '#F59E0B' }]}><Feather name="zap" size={17} color={ink} /></View>
            <View style={styles.reminderCopy}>
              <Text style={[styles.reminderTitle, { color: colors.text }]}>{overdueName} ka faturë të vonuar</Text>
              <Text style={[styles.reminderSub, { color: colors.textMuted }]}>Dërgo një kujtesë për pagesën</Text>
            </View>
            <Pressable onPress={() => void sendReminder()} style={[styles.reminderButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.reminderButtonLabel}>Dërgo</Text>
            </Pressable>
          </View>
        ) : null}

        {invoicesError ? (
          <Pressable onPress={() => void refreshInvoices()} style={[styles.notice, { backgroundColor: colors.dangerSoft }]}>
            <Text style={[styles.noticeText, { color: colors.danger }]}>Faturat nuk mund të ngarkoheshin nga Supabase. Prek për të provuar përsëri.</Text>
          </Pressable>
        ) : invoicesLoading && invoices.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textMuted }]}>Po ngarkohen faturat...</Text>
        ) : groups.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textMuted }]}>Nuk u gjet asnjë faturë.</Text>
        ) : (
          groups.map((group) => (
            <View key={group.title}>
              <Text style={[styles.groupTitle, { color: colors.textMuted }]}>{group.title}</Text>
              {group.invoices.map((invoice) => {
                const clientName = invoice.customerName ?? getCustomer(invoice.customerId)?.name ?? 'Klient';
                const status = displayStatus(invoice);
                return (
                  <View key={invoice.id} style={[styles.invoiceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Pressable
                      onPress={() => router.push(`/invoice/${invoice.id}`)}
                      style={styles.invoiceMain}
                    >
                      <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
                        <Text style={[styles.avatarText, { color: colors.primary }]}>{getInitials(clientName) || 'K'}</Text>
                      </View>
                      <View style={styles.invoiceCopy}>
                        <Text numberOfLines={1} style={[styles.clientName, { color: colors.text }]}>{clientName}</Text>
                        <Text numberOfLines={1} style={[styles.serviceName, { color: colors.textMuted }]}>{invoice.title}</Text>
                        <Text style={[styles.invoiceNumber, { color: colors.textMuted }]}>#{invoice.number}</Text>
                      </View>
                      <Text style={[styles.amount, { color: colors.text, fontVariant: ['tabular-nums'] }]}>{formatMoney(getInvoiceTotal(invoice))}</Text>
                    </Pressable>
                    <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                      <Text style={[styles.issuedDate, { color: colors.textMuted }]}>{new Date(`${invoice.date}T12:00:00`).toLocaleDateString('sq-AL')}</Text>
                      <View style={styles.cardActions}>
                        <Pressable
                          accessibilityLabel={`Shpërndaj PDF-në e faturës ${invoice.number}`}
                          onPress={() => void generateAndShareInvoicePdf(
                            invoice,
                            clientName,
                            user?.businessName ?? 'VoiceBill',
                            { bankName: user?.bankName, iban: user?.iban }
                          ).catch((error) => {
                            Alert.alert('PDF-ja nuk u krijua', error instanceof Error ? error.message : 'Provo përsëri.');
                          })}
                          style={[styles.cardShare, { backgroundColor: colors.primarySoft }]}
                        >
                          <Feather name="share-2" size={13} color={colors.primary} />
                        </Pressable>
                        <Pressable
                          disabled={invoice.status === 'paid' || updatingId === invoice.id}
                          onPress={() => void markPaid(invoice)}
                          style={[styles.statusPill, { backgroundColor: statusColor(status, colors).backgroundColor }]}
                        >
                          <Text style={[styles.statusText, { color: statusColor(status, colors).color }]}>
                            {updatingId === invoice.id ? 'Po ruhet...' : statusLabel[status]}
                          </Text>
                          {invoice.status !== 'paid' ? <Feather name="check" size={12} color={colors.primaryDark} /> : null}
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

function FilterPill({
  label,
  selected,
  onPress,
  palette,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  palette: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.filterPill,
        { backgroundColor: selected ? palette.primary : palette.surface, borderColor: selected ? palette.primary : palette.border },
      ]}
    >
      <Text style={[styles.filterLabel, { color: selected ? '#FFFFFF' : palette.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: 'transparent' },
  content: { padding: 20, paddingBottom: 36 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  searchToggle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 9, height: 46, marginTop: 14, paddingHorizontal: 13, borderRadius: 13, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 13 },
  filters: { flexDirection: 'row', gap: 8, paddingVertical: 17 },
  filterPill: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 16, borderWidth: 1 },
  filterLabel: { fontWeight: '700', fontSize: 12 },
  reminder: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, marginBottom: 12, borderRadius: 16, borderWidth: 1 },
  reminderIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  reminderCopy: { flex: 1 },
  reminderTitle: { fontSize: 12, fontWeight: '800' },
  reminderSub: { fontSize: 11, marginTop: 3 },
  reminderButton: { borderRadius: 10, paddingHorizontal: 13, paddingVertical: 9 },
  reminderButtonLabel: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  groupTitle: { fontSize: 12, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  invoiceCard: { padding: 14, marginBottom: 9, borderRadius: 17, borderWidth: 1 },
  invoiceMain: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontWeight: '800' },
  invoiceCopy: { flex: 1, minWidth: 0 },
  clientName: { fontSize: 14, fontWeight: '800' },
  serviceName: { fontSize: 11, marginTop: 3 },
  invoiceNumber: { fontSize: 10, marginTop: 3 },
  amount: { fontSize: 13, fontWeight: '800' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardShare: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  issuedDate: { fontSize: 10 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: 42, fontSize: 13 },
  notice: { padding: 13, borderRadius: 12, backgroundColor: '#FEF2F2' },
  noticeText: { fontSize: 12, textAlign: 'center' },
});

function statusColor(
  status: InvoiceStatus,
  palette: ReturnType<typeof useAppTheme>['colors']
) {
  if (status === 'paid') return { backgroundColor: palette.successSoft, color: palette.success };
  if (status === 'overdue') return { backgroundColor: palette.dangerSoft, color: palette.danger };
  if (status === 'pending') return { backgroundColor: palette.primarySoft, color: palette.primaryDark };
  return { backgroundColor: palette.neutralSoft, color: palette.textMuted };
}
