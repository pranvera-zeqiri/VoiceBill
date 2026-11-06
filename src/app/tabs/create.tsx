import { Button } from '@/components/button';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { colors, radius } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { uid } from '@/utils/format';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function CreateInvoiceScreen() {
  const router = useRouter();
  const { customers, settings, addInvoice } = useApp();
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');

  const createInvoice = () => {
    const amount = Number(price.replace(',', '.'));
    if (!customerId) {
      setError('Zgjidh një klient për faturën.');
      return;
    }
    if (!title.trim()) {
      setError('Shkruaj përshkrimin e punës.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Shkruaj një çmim të vlefshëm.');
      return;
    }

    const invoice = addInvoice({
      customerId,
      title: title.trim(),
      vatRate: settings.autoVat ? settings.vatRate : 0,
      items: [{ id: uid(), title: title.trim(), quantity: 1, unit: 'copë', unitPrice: amount }],
    });
    router.replace(`../../invoice/${invoice.id}`);
  };

  return (
    <Screen>
      <Header title="Faturë e re" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Zgjidh klientin</Text>
        {customers.length > 0 ? (
          <View style={styles.customers}>
            {customers.map((customer) => {
              const selected = customer.id === customerId;
              return (
                <Pressable
                  key={customer.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    setCustomerId(customer.id);
                    setError('');
                  }}
                  style={[styles.customer, selected && styles.selectedCustomer]}
                >
                  <Text style={[styles.customerName, selected && styles.selectedText]}>
                    {customer.name}
                  </Text>
                  {selected ? <Feather name="check" size={16} color="#FFFFFF" /> : null}
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Text style={styles.helper}>Shto një klient para se të krijosh faturën.</Text>
        )}

        <Input
          label="Përshkrimi i punës"
          icon="file-text"
          placeholder="p.sh. Riparim elektrik"
          value={title}
          onChangeText={(value) => {
            setTitle(value);
            setError('');
          }}
        />
        <Input
          label="Çmimi (€)"
          icon="credit-card"
          placeholder="0.00"
          value={price}
          onChangeText={(value) => {
            setPrice(value);
            setError('');
          }}
          keyboardType="decimal-pad"
        />
        {settings.autoVat ? (
          <Text style={styles.helper}>Do të aplikohet TVSH {settings.vatRate}%.</Text>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          label="Krijo faturën"
          icon="plus"
          onPress={createInvoice}
          disabled={customers.length === 0}
          style={styles.submit}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 32 },
  label: { color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8 },
  customers: { gap: 8, marginBottom: 20 },
  customer: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selectedCustomer: { backgroundColor: colors.primary, borderColor: colors.primary },
  customerName: { color: colors.text, fontSize: 14, fontWeight: '600' },
  selectedText: { color: '#FFFFFF' },
  helper: { color: colors.textMuted, fontSize: 12, marginBottom: 14 },
  error: { color: colors.danger, fontSize: 13, marginBottom: 12 },
  submit: { marginTop: 8 },
});
