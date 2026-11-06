import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { colors, radius, shadow } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { InvoiceItem } from '@/types';
import { calcTotals, formatMoney, uid } from '@/utils/format';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native';

interface DraftItem {
  id: string;
  title: string;
  quantity: string;
  unit: string;
  unitPrice: string;
}

const emptyItem = (): DraftItem => ({ id: uid(), title: '', quantity: '1', unit: 'copë', unitPrice: '' });
const num = (s: string) => Number(s.replace(',', '.')) || 0;

export default function CreateInvoiceScreen() {
  const router = useRouter();
  const { customerId: paramCustomer } = useLocalSearchParams<{ customerId?: string }>();
  const { customers, settings, addInvoice } = useApp();

  const [customerId, setCustomerId] = useState<string>(paramCustomer ?? customers[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [items, setItems] = useState<DraftItem[]>([emptyItem()]);
  const [vatOn, setVatOn] = useState(settings.autoVat);
  const [saving, setSaving] = useState(false);

  const vatRate = vatOn ? settings.vatRate : 0;

  const parsedItems: InvoiceItem[] = useMemo(
    () =>
      items
        .filter((i) => i.title.trim() && num(i.unitPrice) > 0 && num(i.quantity) > 0)
        .map((i) => ({
          id: i.id,
          title: i.title.trim(),
          quantity: num(i.quantity),
          unit: i.unit.trim() || 'copë',
          unitPrice: num(i.unitPrice),
        })),
    [items]
  );
  const totals = calcTotals(parsedItems, vatRate);

  const patchItem = (id: string, patch: Partial<DraftItem>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const save = async (status: 'draft' | 'pending') => {
    if (saving) return;
    if (!customerId) return Alert.alert('Zgjidh klientin', 'Duhet të zgjedhësh një klient.');
    if (parsedItems.length === 0)
      return Alert.alert('Shto zëra', 'Shto të paktën një zë me përshkrim dhe çmim.');

    setSaving(true);
    try {
      const invoice = await addInvoice({
        customerId,
        title: title.trim() || parsedItems[0].title,
        items: parsedItems,
        vatRate,
        status,
      });
      router.replace(`/invoice/${invoice.id}`);
    } catch (error) {
      Alert.alert(
        'Nuk u ruajt fatura',
        error instanceof Error ? error.message : 'Kontrollo lidhjen me internetin dhe provo përsëri.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <Header title="Faturë e re" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.section}>Klienti</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 6 }}>
            {customers.map((c) => {
              const active = c.id === customerId;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setCustomerId(c.id)}
                  style={[styles.customerChip, active && styles.customerChipActive]}
                >
                  <Avatar name={c.name} size={32} variant={active ? 'dark' : 'light'} />
                  <Text style={styles.customerName}>{c.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={{ height: 16 }} />
          <Input
            label="Përshkrimi i punës"
            placeholder="p.sh. Instalim elektrik"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.section}>Zërat e fatures</Text>
          {items.map((it, idx) => (
            <View key={it.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemIndex}>Zëri {idx + 1}</Text>
                {items.length > 1 ? (
                  <Pressable onPress={() => setItems((p) => p.filter((x) => x.id !== it.id))} hitSlop={10}>
                    <Feather name="trash-2" size={17} color={colors.danger} />
                  </Pressable>
                ) : null}
              </View>
              <Input
                placeholder="Përshkrimi (p.sh. Punë dore)"
                value={it.title}
                onChangeText={(v) => patchItem(it.id, { title: v })}
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Input label="Sasia" keyboardType="decimal-pad" value={it.quantity}
                    onChangeText={(v) => patchItem(it.id, { quantity: v })} />
                </View>
                <View style={{ flex: 1 }}>
                  <Input label="Njësia" value={it.unit}
                    onChangeText={(v) => patchItem(it.id, { unit: v })} />
                </View>
                <View style={{ flex: 1.2 }}>
                  <Input label="Çmimi (€)" keyboardType="decimal-pad" placeholder="0.00" value={it.unitPrice}
                    onChangeText={(v) => patchItem(it.id, { unitPrice: v })} />
                </View>
              </View>
            </View>
          ))}

          <Button
            label="Shto zë"
            icon="plus"
            variant="outline"
            onPress={() => setItems((p) => [...p, emptyItem()])}
          />

          <View style={styles.vatRow}>
            <View>
              <Text style={styles.vatTitle}>TVA {settings.vatRate}%</Text>
              <Text style={styles.vatSub}>Shto TVA në total</Text>
            </View>
            <Switch
              value={vatOn}
              onValueChange={setVatOn}
              trackColor={{ true: colors.primary, false: colors.neutralSoft }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.totals}>
            <Row label="Nëntotali" value={formatMoney(totals.subtotal)} />
            {vatRate > 0 ? <Row label={`TVA ${vatRate}%`} value={formatMoney(totals.vat)} /> : null}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Totali</Text>
              <Text style={styles.totalValue}>{formatMoney(totals.total)}</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Button label="Ruaj draft" variant="outline" loading={saving} onPress={() => void save('draft')} style={{ flex: 1 }} />
        <Button label="Ruaj dhe shiko" loading={saving} onPress={() => void save('pending')} style={{ flex: 1.4 }} />
      </View>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 24 },
  section: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 10, marginTop: 4 },
  customerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 14,
  },
  customerChipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  customerName: { fontSize: 13, fontWeight: '700', color: colors.text },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg - 4,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  itemIndex: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  vatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg - 4,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  vatTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  vatSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  totals: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg - 4,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  rowLabel: { color: colors.textMuted, fontSize: 14 },
  rowValue: { color: colors.textMuted, fontSize: 14 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: 24, fontWeight: '800', color: colors.text },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});