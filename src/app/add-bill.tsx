import { invoiceService, type ExtractedVoiceInvoice } from '@/services/invoiceService';
import { useApp } from '@/context/AppContext';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import {
  Animated,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ORANGE = '#FB923C';
const INK = '#1C1917';

interface EditableItem {
  name: string;
  quantity: string;
  unit: string;
  unitPrice: string;
}

function parseDraft(value: string | string[] | undefined): ExtractedVoiceInvoice | null {
  if (!value || Array.isArray(value)) return null;
  try {
    return JSON.parse(value) as ExtractedVoiceInvoice;
  } catch {
    return null;
  }
}

function numberValue(value: string) {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function money(value: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
}

export default function AddBillScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    draft?: string | string[];
    audioUri?: string | string[];
    durationSeconds?: string | string[];
    transcript?: string | string[];
  }>();
  const { refreshInvoices } = useApp();
  const audioUri = Array.isArray(params.audioUri) ? '' : params.audioUri ?? '';
  const transcript = Array.isArray(params.transcript) ? '' : params.transcript ?? '';
  const durationParam = Array.isArray(params.durationSeconds) ? '' : params.durationSeconds;
  const durationSeconds = Math.max(0, Number(durationParam) || 0);
  const [draft, setDraft] = useState(() => parseDraft(params.draft));
  const [analyzing, setAnalyzing] = useState(() => !draft && Boolean(audioUri || transcript));
  const [analysisError, setAnalysisError] = useState('');
  const [analysisAttempt, setAnalysisAttempt] = useState(0);
  const [clientName, setClientName] = useState(draft?.client_name ?? '');
  const [summary, setSummary] = useState(draft?.service_summary ?? '');
  const [vatRate, setVatRate] = useState(String(draft?.vat_rate ?? 18));
  const [items, setItems] = useState<EditableItem[]>(
    () =>
      draft?.items.map((item) => ({
        name: item.name,
        quantity: String(item.quantity),
        unit: item.unit,
        unitPrice: String(item.unit_price),
      })) ?? []
  );
  const [saving, setSaving] = useState(false);

  const parsedItems = useMemo(
    () =>
      items
        .map((item) => ({
          title: item.name.trim(),
          quantity: numberValue(item.quantity),
          unit: item.unit.trim() || 'copë',
          unitPrice: numberValue(item.unitPrice),
        }))
        .filter((item) => item.title && item.quantity > 0 && item.unitPrice > 0),
    [items]
  );
  const subtotal = parsedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const parsedVatRate = Math.max(0, Number(vatRate.replace(',', '.')) || 0);
  const vatAmount = subtotal * parsedVatRate / 100;
  const total = subtotal + vatAmount;
  const dateLabel = new Intl.DateTimeFormat('sq-AL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  useEffect(() => {
    if (draft || (!audioUri && !transcript)) return;

    let active = true;
    const analysis = transcript
      ? invoiceService.extractInvoiceFromTranscript(transcript, durationSeconds)
      : invoiceService.transcribeAndExtractInvoice(audioUri, durationSeconds);
    void analysis
      .then((result) => {
        if (active) {
          setClientName(result.client_name);
          setSummary(result.service_summary);
          setVatRate(String(result.vat_rate));
          setItems(
            result.items.map((item) => ({
              name: item.name,
              quantity: String(item.quantity),
              unit: item.unit,
              unitPrice: String(item.unit_price),
            }))
          );
          setDraft(result);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setAnalysisError(
            error instanceof Error ? error.message : 'Kontrollo lidhjen me Supabase dhe provo përsëri.'
          );
        }
      })
      .finally(() => {
        if (active) setAnalyzing(false);
      });

    return () => {
      active = false;
    };
  }, [analysisAttempt, audioUri, draft, durationSeconds, transcript]);

  const save = async () => {
    if (!draft) {
      Alert.alert('Regjistrimi mungon', 'Kthehu te regjistrimi me zë dhe provo përsëri.');
      return;
    }
    if (!clientName.trim()) {
      Alert.alert('Klienti mungon', 'Shkruaj emrin e klientit për faturën.');
      return;
    }
    if (items.some((item) => item.name.trim() && (numberValue(item.quantity) <= 0 || numberValue(item.unitPrice) <= 0))) {
      Alert.alert('Kontrollo zërat', 'Çdo zë i plotësuar duhet të ketë sasi dhe çmim më të madh se zero.');
      return;
    }
    if (!parsedItems.length) {
      Alert.alert('Shto zëra', 'Fatura duhet të ketë të paktën një zë me çmim.');
      return;
    }

    setSaving(true);
    try {
      await invoiceService.createVoiceInvoice(
        {
          ...draft,
          client_name: clientName.trim(),
          service_summary: summary.trim() || parsedItems[0].title,
          vat_rate: parsedVatRate,
          subtotal: Math.round(subtotal * 100) / 100,
          vat_amount: Math.round(vatAmount * 100) / 100,
          total: Math.round(total * 100) / 100,
        },
        parsedItems.map((item) => ({ ...item, needsConfirm: false }))
      );
      await refreshInvoices();
      router.replace('/tabs/invoices');
    } catch (error) {
      Alert.alert(
        'Nuk u ruajt fatura',
        error instanceof Error ? error.message : 'Kontrollo lidhjen me Supabase dhe provo përsëri.'
      );
    } finally {
      setSaving(false);
    }
  };

  const updateItem = (index: number, patch: Partial<EditableItem>) => {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable accessibilityLabel="Kthehu" onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={INK} />
        </Pressable>
        <View>
          <Text style={styles.title}>Kontrollo faturën</Text>
          <Text style={styles.subtitle}>AI e përgatiti nga regjistrimi yt</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.audioBanner}>
            <View style={styles.audioIcon}><Feather name="mic" size={16} color={INK} /></View>
            <View>
              <Text style={styles.audioTitle}>
                Nga regjistrimi juaj · {draft?.duration_formatted ?? formatDuration(durationSeconds)}
              </Text>
              <Text style={styles.audioSub}>
                {analyzing ? 'AI po transkripton dhe përgatit faturën…' : 'Transkriptu u analizua automatikisht'}
              </Text>
            </View>
          </View>

          {!draft ? (
            <View style={styles.errorCard}>
              {analyzing ? (
                <View style={styles.analysisProgress}>
                  <ActivityIndicator color={ORANGE} size="small" />
                  <Text style={styles.errorText}>Po përgatiten transkripti dhe zërat e faturës…</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.errorText}>
                    {analysisError || 'Të dhënat e faturës mungojnë ose janë të pavlefshme.'}
                  </Text>
                  {analysisError && (audioUri || transcript) ? (
                    <Pressable
                      onPress={() => {
                        setAnalysisError('');
                        setAnalyzing(true);
                        setAnalysisAttempt((attempt) => attempt + 1);
                      }}
                    >
                      <Text style={styles.backLink}>Provo përsëri</Text>
                    </Pressable>
                  ) : null}
                  <Pressable onPress={() => router.back()}>
                    <Text style={styles.backLink}>Kthehu te regjistrimi</Text>
                  </Pressable>
                </>
              )}
            </View>
          ) : (
            <>
              <View style={styles.metaRow}>
                <View style={styles.metaBlock}>
                  <Text style={styles.metaLabel}>PËR</Text>
                  <TextInput value={clientName} onChangeText={setClientName} placeholder="Emri i klientit" placeholderTextColor="#A8A29E" style={styles.metaInput} />
                </View>
                <View style={styles.metaBlock}>
                  <Text style={styles.metaLabel}>DATA</Text>
                  <Text style={styles.dateValue}>{dateLabel}</Text>
                </View>
              </View>

              <Text style={styles.sectionLabel}>PËRSHKRIMI I PUNËS</Text>
              <TextInput value={summary} onChangeText={setSummary} placeholder="Përmbledhja e shërbimit" placeholderTextColor="#A8A29E" style={styles.summaryInput} />

              <View style={styles.itemsHeading}>
                <Text style={styles.sectionLabel}>ZËRAT E FATURËS</Text>
                <Pressable
                  accessibilityLabel="Shto zë"
                  onPress={() => setItems((current) => [...current, { name: '', quantity: '1', unit: 'copë', unitPrice: '' }])}
                  style={styles.addButton}
                >
                  <Feather name="plus" size={17} color={ORANGE} />
                </Pressable>
              </View>
              {items.map((item, index) => {
                const lineTotal = numberValue(item.quantity) * numberValue(item.unitPrice);
                return (
                  <AnimatedItem key={`item-${index}`} index={index}>
                    <View style={styles.itemCard}>
                      <View style={styles.itemTop}>
                        <TextInput value={item.name} onChangeText={(value) => updateItem(index, { name: value })} placeholder="Përshkrimi" placeholderTextColor="#A8A29E" style={styles.itemName} />
                        {items.length > 1 ? (
                          <Pressable accessibilityLabel="Hiq zërin" onPress={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                            <Feather name="trash-2" size={16} color="#A8A29E" />
                          </Pressable>
                        ) : null}
                      </View>
                      <View style={styles.itemFields}>
                        <TextInput keyboardType="decimal-pad" value={item.quantity} onChangeText={(value) => updateItem(index, { quantity: value })} style={styles.itemField} placeholder="Sasia" placeholderTextColor="#A8A29E" />
                        <TextInput value={item.unit} onChangeText={(value) => updateItem(index, { unit: value })} style={styles.itemField} placeholder="Njësia" placeholderTextColor="#A8A29E" />
                        <TextInput keyboardType="decimal-pad" value={item.unitPrice} onChangeText={(value) => updateItem(index, { unitPrice: value })} style={styles.itemField} placeholder="Çmimi €" placeholderTextColor="#A8A29E" />
                        <Text style={styles.lineTotal}>{money(lineTotal)}</Text>
                      </View>
                    </View>
                  </AnimatedItem>
                );
              })}

              <AnimatedItem index={items.length}>
                <View style={styles.totalsCard}>
                  <SummaryRow label="Nëntotali" value={money(subtotal)} />
                  <View style={styles.vatRow}>
                    <Text style={styles.rowLabel}>TVA</Text>
                    <View style={styles.vatInputWrap}>
                      <TextInput keyboardType="decimal-pad" value={vatRate} onChangeText={setVatRate} style={styles.vatInput} />
                      <Text style={styles.vatSuffix}>%</Text>
                    </View>
                    <Text style={styles.rowValue}>{money(vatAmount)}</Text>
                  </View>
                  <View style={styles.divider} />
                  <SummaryRow label="Totali" value={money(total)} strong />
                </View>
              </AnimatedItem>

              {draft.transcript ? (
                <View style={styles.transcriptBox}>
                  <Text style={styles.sectionLabel}>TRANSKRIPTI</Text>
                  <Text style={styles.transcriptText}>{draft.transcript}</Text>
                </View>
              ) : null}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {draft ? (
        <View style={styles.footer}>
          <Pressable disabled={saving} onPress={() => void save()} style={[styles.saveButton, saving && styles.saving]}>
            {saving ? <ActivityIndicator color={INK} /> : <Text style={styles.saveLabel}>Dërgo faturën</Text>}
            {!saving ? <Feather name="arrow-right" size={18} color={INK} /> : null}
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function AnimatedItem({ children, index }: PropsWithChildren<{ index: number }>) {
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(10));

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        delay: Math.min(index * 65, 390),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 260,
        delay: Math.min(index * 65, 390),
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [index, opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.rowLabel, strong && styles.strong]}>{label}</Text>
      <Text style={[styles.rowValue, strong && styles.strong]}>{value}</Text>
    </View>
  );
}

function formatDuration(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAF5EE' },
  fill: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 15 },
  backButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  title: { color: INK, fontSize: 20, fontWeight: '800' },
  subtitle: { color: '#78716C', fontSize: 12, marginTop: 3 },
  content: { paddingHorizontal: 20, paddingBottom: 20 },
  audioBanner: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14, backgroundColor: '#FFEDD5', borderRadius: 16, marginBottom: 18 },
  audioIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
  audioTitle: { color: INK, fontSize: 13, fontWeight: '800' },
  audioSub: { color: '#78716C', fontSize: 11, marginTop: 3 },
  errorCard: { padding: 18, borderRadius: 16, backgroundColor: '#FFFFFF' },
  analysisProgress: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  errorText: { color: INK, fontSize: 14 },
  backLink: { color: '#C2410C', fontWeight: '700', marginTop: 14 },
  metaRow: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  metaBlock: { flex: 1, padding: 14, backgroundColor: '#FFFFFF', borderRadius: 16 },
  metaLabel: { color: '#A8A29E', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  metaInput: { color: INK, fontSize: 15, fontWeight: '700', padding: 0 },
  dateValue: { color: INK, fontSize: 13, fontWeight: '700' },
  sectionLabel: { color: '#78716C', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  summaryInput: { marginTop: 8, marginBottom: 18, padding: 14, borderRadius: 14, backgroundColor: '#FFFFFF', color: INK, fontSize: 14 },
  itemsHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 },
  addButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFEDD5' },
  itemCard: { backgroundColor: '#FFFFFF', borderRadius: 15, padding: 13, marginBottom: 9 },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemName: { flex: 1, color: INK, fontWeight: '700', fontSize: 14, padding: 0, minHeight: 28 },
  itemFields: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 9 },
  itemField: { flex: 1, minWidth: 42, paddingHorizontal: 7, paddingVertical: 8, borderRadius: 8, backgroundColor: '#FAF5EE', color: INK, fontSize: 12, textAlign: 'center' },
  lineTotal: { color: INK, fontSize: 12, fontWeight: '800', minWidth: 66, textAlign: 'right' },
  totalsCard: { marginTop: 8, padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF', gap: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vatRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vatInputWrap: { flexDirection: 'row', alignItems: 'center', marginRight: 'auto', borderRadius: 8, backgroundColor: '#FAF5EE', paddingHorizontal: 7 },
  vatInput: { minWidth: 26, color: INK, fontSize: 13, textAlign: 'right', paddingVertical: 6 },
  vatSuffix: { color: '#78716C', fontSize: 12 },
  rowLabel: { color: '#78716C', fontSize: 13 },
  rowValue: { color: INK, fontSize: 13, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#E7E5E4' },
  strong: { color: INK, fontSize: 16, fontWeight: '800' },
  transcriptBox: { marginTop: 14, padding: 14, borderRadius: 14, backgroundColor: '#FFFFFF' },
  transcriptText: { color: '#57534E', lineHeight: 20, fontSize: 12, marginTop: 8 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#E7E5E4', backgroundColor: '#FAF5EE' },
  saveButton: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 16, backgroundColor: ORANGE },
  saving: { opacity: 0.75 },
  saveLabel: { color: INK, fontSize: 15, fontWeight: '800' },
});
