import { Button } from '@/components/button';
import { CustomerSummaryCard } from '@/components/CostumerSummaryCard';
import { Header } from '@/components/Header';
import { InvoiceRow } from '@/components/InvoiceRow';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { colors, radius, shadow } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { FeatherName } from '@/types';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function CustomerDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getCustomer, getCustomerStats, invoices } = useApp();

  const customer = getCustomer(id);
  const stats = getCustomerStats(id);

  const customerInvoices = useMemo(
    () =>
      invoices
        .filter((i) => i.customerId === id)
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    [invoices, id]
  );

  if (!customer) {
    return (
      <Screen edges={['top', 'bottom']}>
        <Header title="Klienti" />
        <Text style={styles.notFound}>Klienti nuk u gjet.</Text>
      </Screen>
    );
  }

  const contact: { icon: FeatherName; label: string; value: string; onPress?: () => void }[] = [
    {
      icon: 'phone',
      label: 'Telefoni',
      value: customer.phone || '—',
      onPress: customer.phone
        ? () => Linking.openURL(`tel:${customer.phone.replace(/\s/g, '')}`)
        : undefined,
    },
    {
      icon: 'mail',
      label: 'Email',
      value: customer.email || '—',
      onPress: customer.email ? () => Linking.openURL(`mailto:${customer.email}`) : undefined,
    },
    { icon: 'map-pin', label: 'Adresa', value: customer.address || '—' },
  ];

  return (
    <Screen edges={['top', 'bottom']}>
      <Header title="Klienti" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <CustomerSummaryCard
          customer={customer}
          count={stats.count}
          total={stats.total}
          onNewJob={() => router.push('/voice')}
        />

        <View style={styles.contactCard}>
          {contact.map((c, idx) => (
            <Pressable
              key={c.label}
              onPress={c.onPress}
              disabled={!c.onPress}
              style={[styles.contactRow, idx > 0 && styles.contactBorder]}
            >
              <View style={styles.contactIcon}>
                <Feather name={c.icon} size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactLabel}>{c.label}</Text>
                <Text style={styles.contactValue}>{c.value}</Text>
              </View>
              {c.onPress ? <Feather name="chevron-right" size={18} color={colors.textMuted} /> : null}
            </Pressable>
          ))}
        </View>

        <SectionHeader title="Faturat" />
        {customerInvoices.length === 0 ? (
          <Text style={styles.empty}>Ky klient nuk ka ende fatura.</Text>
        ) : (
          customerInvoices.map((inv) => (
            <InvoiceRow
              key={inv.id}
              invoice={inv}
              customerName={customer.name}
              onPress={() => router.push(`/invoice/${inv.id}`)}
            />
          ))
        )}

        <Button
          label="Krijo faturë manualisht"
          icon="plus"
          variant="outline"
          onPress={() => router.push(`/invoice/create?customerId=${customer.id}`)}
          style={{ marginTop: 6 }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 8, paddingBottom: 32 },
  notFound: { textAlign: 'center', marginTop: 60, color: colors.textMuted },
  contactCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg - 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 14,
    ...shadow,
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  contactBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  contactIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: { fontSize: 11, color: colors.textMuted },
  contactValue: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 2 },
  empty: { color: colors.textMuted, textAlign: 'center', marginVertical: 16 },
});