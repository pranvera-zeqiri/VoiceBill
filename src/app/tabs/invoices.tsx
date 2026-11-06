import { Chip } from '@/components/Chip';
import { InvoiceRow } from '@/components/InvoiceRow';
import { Screen } from '@/components/Screen';
import { colors, radius } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { Invoice } from '@/types';
import { daysSince } from '@/utils/format';
import { shareReminder } from '@/utils/share';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

type Filter = 'all' | 'open' | 'paid';

export default function InvoicesScreen() {
  const router = useRouter();
  const { invoices, getCustomer, invoicesLoading, invoicesError, refreshInvoices } = useApp();
  const [filter, setFilter] = useState<Filter>('all');
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      void refreshInvoices();
    }, [refreshInvoices])
  );

  const sorted = useMemo(
    () =>
      [...invoices].sort((a, b) =>
        a.date === b.date ? Number(b.number) - Number(a.number) : a.date < b.date ? 1 : -1
      ),
    [invoices]
  );

  const openCount = invoices.filter((i) => i.status === 'pending' || i.status === 'overdue').length;
  const paidCount = invoices.filter((i) => i.status === 'paid').length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter((i) => {
      if (filter === 'open' && !(i.status === 'pending' || i.status === 'overdue')) return false;
      if (filter === 'paid' && i.status !== 'paid') return false;
      if (!q) return true;
      const name = getCustomer(i.customerId)?.name.toLowerCase() ?? '';
      return name.includes(q) || i.title.toLowerCase().includes(q) || i.number.includes(q);
    });
  }, [sorted, filter, query, getCustomer]);

  const groups = useMemo(() => {
    const g: { title: string; items: Invoice[] }[] = [
      { title: 'Sot', items: [] },
      { title: 'Këtë javë', items: [] },
      { title: 'Më herët', items: [] },
    ];
    filtered.forEach((i) => {
      const d = daysSince(i.date);
      g[d <= 0 ? 0 : d <= 6 ? 1 : 2].items.push(i);
    });
    return g.filter((x) => x.items.length > 0);
  }, [filtered]);

  const overdue = useMemo(
    () => sorted.filter((i) => i.status === 'overdue').sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))[0],
    [sorted]
  );
  const overdueCustomer = overdue ? getCustomer(overdue.customerId) : undefined;

  const sendReminder = async () => {
    if (overdue && overdueCustomer) await shareReminder(overdue, overdueCustomer.name);
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>Faturat</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              style={styles.iconBtn}
              onPress={() => {
                setSearching((s) => !s);
                setQuery('');
              }}
            >
              <Feather name={searching ? 'x' : 'search'} size={19} color={colors.text} />
            </Pressable>
            <Pressable
              style={[styles.iconBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => router.push('/invoice/create')}
            >
              <Feather name="plus" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {searching ? (
          <View style={styles.search}>
            <Feather name="search" size={18} color={colors.textMuted} />
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder="Kërko faturë, klient..."
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
            />
          </View>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="Të gjitha" active={filter === 'all'} onPress={() => setFilter('all')} />
          <Chip label={`Në pritje ${openCount}`} active={filter === 'open'} onPress={() => setFilter('open')} />
          <Chip label={`Paguara ${paidCount}`} active={filter === 'paid'} onPress={() => setFilter('paid')} />
        </ScrollView>

        {overdue && overdueCustomer && filter !== 'paid' ? (
          <View style={styles.alert}>
            <View style={styles.alertIcon}>
              <Feather name="zap" size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>
                {overdueCustomer.name.split(' ').pop()} nuk ka paguar {Math.max(daysSince(overdue.dueDate), 1)} ditë
              </Text>
              <Text style={styles.alertSub}>Kujtesa u përgatit nga AI</Text>
            </View>
            <Pressable style={styles.alertBtn} onPress={sendReminder}>
              <Text style={styles.alertBtnText}>Dërgo</Text>
            </Pressable>
          </View>
        ) : null}

        {invoicesError ? (
          <Pressable onPress={() => void refreshInvoices()} style={styles.loadError}>
            <Text style={styles.empty}>
              Faturat nuk mund të ngarkoheshin nga Supabase. Prek për të provuar përsëri.
            </Text>
          </Pressable>
        ) : invoicesLoading && invoices.length === 0 ? (
          <Text style={styles.empty}>Po ngarkohen faturat...</Text>
        ) : groups.length === 0 ? (
          <Text style={styles.empty}>Nuk u gjet asnjë faturë.</Text>
        ) : (
          groups.map((g) => (
            <View key={g.title}>
              <Text style={styles.groupTitle}>{g.title}</Text>
              {g.items.map((inv) => (
                <InvoiceRow
                  key={inv.id}
                  invoice={inv}
                  customerName={getCustomer(inv.customerId)?.name ?? 'Klient'}
                  onPress={() => router.push(`../invoice/${inv.id}`)}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 32 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    marginTop: 14,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },
  chips: { gap: 8, paddingVertical: 16 },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.alertBg,
    borderRadius: radius.lg - 4,
    padding: 12,
    marginBottom: 6,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  alertSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  alertBtn: { backgroundColor: colors.dark, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  alertBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  groupTitle: { fontSize: 12, color: colors.textMuted, marginTop: 14, marginBottom: 8, fontWeight: '600' },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
  loadError: { paddingVertical: 8 },
});