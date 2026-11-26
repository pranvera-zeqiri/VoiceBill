import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { invoiceService } from '@/services/invoiceService';
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
          <Text style={styles.title}>Faturat</Text>
          <Pressable
            accessibilityLabel={searching ? 'Mbyll kërkimin' : 'Kërko faturë'}
            style={styles.searchToggle}
            onPress={() => {
              setSearching((value) => !value);
              setQuery('');
            }}
          >
            <Feather name={searching ? 'x' : 'search'} size={19} color={INK} />
          </Pressable>
        </View>

        {searching ? (
          <View style={styles.searchBox}>
            <Feather name="search" size={17} color="#78716C" />
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder="Kërko klient ose numër fature..."
              placeholderTextColor="#A8A29E"
              style={styles.searchInput}
            />
          </View>
        ) : null}

        <View style={styles.filters}>
          <FilterPill label="Të gjitha" selected={filter === 'all'} onPress={() => setFilter('all')} />
          <FilterPill label={`Në pritje ${openCount}`} selected={filter === 'open'} onPress={() => setFilter('open')} />
          <FilterPill label={`Paguar ${paidCount}`} selected={filter === 'paid'} onPress={() => setFilter('paid')} />
        </View>

        {overdueInvoice && filter !== 'paid' ? (
          <View style={styles.reminder}>
            <View style={styles.reminderIcon}><Feather name="zap" size={17} color={INK} /></View>
            <View style={styles.reminderCopy}>
              <Text style={styles.reminderTitle}>{overdueName} ka faturë të vonuar</Text>
              <Text style={styles.reminderSub}>Dërgo një kujtesë për pagesën</Text>
            </View>
            <Pressable onPress={() => void sendReminder()} style={styles.reminderButton}>
              <Text style={styles.reminderButtonLabel}>Dërgo</Text>
            </Pressable>
          </View>
        ) : null}

        {invoicesError ? (
          <Pressable onPress={() => void refreshInvoices()} style={styles.notice}>
            <Text style={styles.noticeText}>Faturat nuk mund të ngarkoheshin nga Supabase. Prek për të provuar përsëri.</Text>
          </Pressable>
        ) : invoicesLoading && invoices.length === 0 ? (
          <Text style={styles.empty}>Po ngarkohen faturat...</Text>
        ) : groups.length === 0 ? (
          <Text style={styles.empty}>Nuk u gjet asnjë faturë.</Text>
        ) : (
          groups.map((group) => (
            <View key={group.title}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              {group.invoices.map((invoice) => {
                const clientName = invoice.customerName ?? getCustomer(invoice.customerId)?.name ?? 'Klient';
                const status = displayStatus(invoice);
                return (
                  <View key={invoice.id} style={styles.invoiceCard}>
                    <Pressable
                      onPress={() => router.push(`/invoice/${invoice.id}`)}
                      style={styles.invoiceMain}
                    >
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{getInitials(clientName) || 'K'}</Text>
                      </View>
                      <View style={styles.invoiceCopy}>
                        <Text numberOfLines={1} style={styles.clientName}>{clientName}</Text>
                        <Text numberOfLines={1} style={styles.serviceName}>{invoice.title}</Text>
                        <Text style={styles.invoiceNumber}>#{invoice.number}</Text>
                      </View>
                      <Text style={styles.amount}>{formatMoney(getInvoiceTotal(invoice))}</Text>
                    </Pressable>
                    <View style={styles.cardFooter}>
                      <Text style={styles.issuedDate}>{new Date(`${invoice.date}T12:00:00`).toLocaleDateString('sq-AL')}</Text>
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
                          style={styles.cardShare}
                        >
                          <Feather name="share-2" size={13} color={INK} />
                        </Pressable>
                        <Pressable
                          disabled={invoice.status === 'paid' || updatingId === invoice.id}
                          onPress={() => void markPaid(invoice)}
                          style={[styles.statusPill, statusStyles[status]]}
                        >
                          <Text style={[styles.statusText, status === 'paid' && styles.paidText]}>
                            {updatingId === invoice.id ? 'Po ruhet...' : statusLabel[status]}
                          </Text>
                          {invoice.status !== 'paid' ? <Feather name="check" size={12} color="#9A3412" /> : null}
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

function FilterPill({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.filterPill, selected && styles.filterPillSelected]}>
      <Text style={[styles.filterLabel, selected && styles.filterLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

const INK = '#1C1917';
const ORANGE = '#FB923C';
const styles = StyleSheet.create({
  screen: { backgroundColor: '#FAF5EE' },
  content: { padding: 20, paddingBottom: 36 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: INK, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  searchToggle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 9, height: 46, marginTop: 14, paddingHorizontal: 13, borderRadius: 13, backgroundColor: '#FFFFFF' },
  searchInput: { flex: 1, color: INK, fontSize: 13 },
  filters: { flexDirection: 'row', gap: 8, paddingVertical: 17 },
  filterPill: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 16, backgroundColor: '#FFFFFF' },
  filterPillSelected: { backgroundColor: INK },
  filterLabel: { color: '#78716C', fontWeight: '700', fontSize: 12 },
  filterLabelSelected: { color: '#FFFFFF' },
  reminder: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, marginBottom: 12, borderRadius: 16, backgroundColor: '#FFEDD5' },
  reminderIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: ORANGE },
  reminderCopy: { flex: 1 },
  reminderTitle: { color: INK, fontSize: 12, fontWeight: '800' },
  reminderSub: { color: '#78716C', fontSize: 11, marginTop: 3 },
  reminderButton: { backgroundColor: INK, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 9 },
  reminderButtonLabel: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  groupTitle: { color: '#78716C', fontSize: 12, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  invoiceCard: { padding: 14, marginBottom: 9, backgroundColor: '#FFFFFF', borderRadius: 17 },
  invoiceMain: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFEDD5', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#9A3412', fontSize: 13, fontWeight: '800' },
  invoiceCopy: { flex: 1, minWidth: 0 },
  clientName: { color: INK, fontSize: 14, fontWeight: '800' },
  serviceName: { color: '#78716C', fontSize: 11, marginTop: 3 },
  invoiceNumber: { color: '#A8A29E', fontSize: 10, marginTop: 3 },
  amount: { color: INK, fontSize: 13, fontWeight: '800' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F5F5F4' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardShare: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFEDD5' },
  issuedDate: { color: '#A8A29E', fontSize: 10 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 12 },
  status_pending: { backgroundColor: '#FFF7ED' },
  status_overdue: { backgroundColor: '#FEF2F2' },
  status_paid: { backgroundColor: '#ECFDF5' },
  status_draft: { backgroundColor: '#F5F5F4' },
  statusText: { color: '#9A3412', fontSize: 10, fontWeight: '700' },
  paidText: { color: '#047857' },
  empty: { textAlign: 'center', color: '#78716C', marginTop: 42, fontSize: 13 },
  notice: { padding: 13, borderRadius: 12, backgroundColor: '#FEF2F2' },
  noticeText: { color: '#991B1B', fontSize: 12, textAlign: 'center' },
});

const statusStyles: Record<InvoiceStatus, object> = {
  pending: styles.status_pending,
  overdue: styles.status_overdue,
  paid: styles.status_paid,
  draft: styles.status_draft,
};
