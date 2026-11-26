import { invoiceService, type ExtractedVoiceInvoice } from '@/services/invoiceService';
import { useApp } from '@/context/AppContext';
import { Screen } from '@/components/Screen';
import { useAppTheme } from '@/components/useAppTheme';
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
  const { colors, darkMode } = useAppTheme();
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

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/invoice');
    }
  };

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
    <Screen style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kthehu te regjistrimi"
          hitSlop={8}
          onPress={goBack}
          style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Feather name="chevron-left" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>Kontrollo faturën</Text>
          <Text numberOfLines={1} style={[styles.subtitle, { color: colors.textMuted }]}>AI e përgatiti nga regjistrimi yt</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={[styles.audioBanner, { backgroundColor: colors.primarySoft }]}>
            <View style={styles.audioIcon}><Feather name="mic" size={16} color="#FFFFFF" /></View>
            <View>
              <Text style={[styles.audioTitle, { color: colors.text }]}>
                Nga regjistrimi juaj · {draft?.duration_formatted ?? formatDuration(durationSeconds)}
              </Text>
              <Text style={[styles.audioSub, { color: colors.textMuted }]}>
                {analyzing ? 'AI po transkripton dhe përgatit faturën…' : 'Transkriptu u analizua automatikisht'}
              </Text>
            </View>
          </View>

          {!draft ? (
            <View style={[styles.errorCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {analyzing ? (
                <View style={styles.analysisProgress}>
                  <ActivityIndicator color={colors.primary} size="small" />
                  <Text style={[styles.errorText, { color: colors.text }]}>Po përgatiten transkripti dhe zërat e faturës…</Text>
                </View>
              ) : (
                <>
                  <Text style={[styles.errorText, { color: colors.text }]}>
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
                      <Text style={[styles.backLink, { color: colors.primary }]}>Provo përsëri</Text>
                    </Pressable>
                  ) : null}
                  <Pressable onPress={goBack}>
                    <Text style={[styles.backLink, { color: colors.primary }]}>Kthehu te regjistrimi</Text>
                  </Pressable>
                </>
              )}
            </View>
          ) : (
            <>
              <View style={styles.metaRow}>
                <View style={[styles.metaBlock, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.metaLabel, { color: colors.textMuted }]}>PËR</Text>
                  <TextInput value={clientName} onChangeText={setClientName} placeholder="Emri i klientit" placeholderTextColor={colors.textMuted} style={[styles.metaInput, { color: colors.text }]} />
                </View>
                <View style={[styles.metaBlock, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.metaLabel, { color: colors.textMuted }]}>DATA</Text>
                  <Text style={[styles.dateValue, { color: colors.text }]}>{dateLabel}</Text>
                </View>
              </View>

              <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>PËRSHKRIMI I PUNËS</Text>
              <TextInput value={summary} onChangeText={setSummary} placeholder="Përmbledhja e shërbimit" placeholderTextColor={colors.textMuted} style={[styles.summaryInput, { backgroundColor: colors.field, color: colors.text }]} />

              <View style={styles.itemsHeading}>
                <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>ZËRAT E FATURËS</Text>
                <Pressable
                  accessibilityLabel="Shto zë"
                  onPress={() => setItems((current) => [...current, { name: '', quantity: '1', unit: 'copë', unitPrice: '' }])}
                  style={[styles.addButton, { backgroundColor: colors.primarySoft }]}
                >
                  <Feather name="plus" size={17} color={colors.primary} />
                </Pressable>
              </View>
              {items.map((item, index) => {
                const lineTotal = numberValue(item.quantity) * numberValue(item.unitPrice);
                return (
                  <AnimatedItem key={`item-${index}`} index={index}>
                    <View style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <View style={styles.itemTop}>
                        <TextInput value={item.name} onChangeText={(value) => updateItem(index, { name: value })} placeholder="Përshkrimi" placeholderTextColor={colors.textMuted} style={[styles.itemName, { color: colors.text }]} />
                        {items.length > 1 ? (
                          <Pressable accessibilityLabel="Hiq zërin" onPress={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                            <Feather name="trash-2" size={16} color={colors.textMuted} />
                          </Pressable>
                        ) : null}
                      </View>
                      <View style={styles.itemFields}>
                        <TextInput keyboardType="decimal-pad" value={item.quantity} onChangeText={(value) => updateItem(index, { quantity: value })} style={[styles.itemField, { backgroundColor: colors.field, color: colors.text }]} placeholder="Sasia" placeholderTextColor={colors.textMuted} />
                        <TextInput value={item.unit} onChangeText={(value) => updateItem(index, { unit: value })} style={[styles.itemField, { backgroundColor: colors.field, color: colors.text }]} placeholder="Njësia" placeholderTextColor={colors.textMuted} />
                        <TextInput keyboardType="decimal-pad" value={item.unitPrice} onChangeText={(value) => updateItem(index, { unitPrice: value })} style={[styles.itemField, { backgroundColor: colors.field, color: colors.text }]} placeholder="Çmimi €" placeholderTextColor={colors.textMuted} />
                        <Text style={[styles.lineTotal, { color: colors.text }]}>{money(lineTotal)}</Text>
                      </View>
                    </View>
                  </AnimatedItem>
                );
              })}

              <AnimatedItem index={items.length}>
                <View style={[styles.totalsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <SummaryRow label="Nëntotali" value={money(subtotal)} />
                  <View style={styles.vatRow}>
                    <Text style={[styles.rowLabel, { color: colors.textMuted }]}>TVA</Text>
                    <View style={[styles.vatInputWrap, { backgroundColor: colors.field }]}>
                      <TextInput keyboardType="decimal-pad" value={vatRate} onChangeText={setVatRate} style={[styles.vatInput, { color: colors.text }]} />
                      <Text style={[styles.vatSuffix, { color: colors.textMuted }]}>%</Text>
                    </View>
                    <Text style={[styles.rowValue, { color: colors.text, fontVariant: ['tabular-nums'] }]}>{money(vatAmount)}</Text>
                  </View>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <SummaryRow label="Totali" value={money(total)} strong />
                </View>
              </AnimatedItem>

              {draft.transcript ? (
                <View style={[styles.transcriptBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>TRANSKRIPTI</Text>
                    <Text style={[styles.transcriptText, { color: colors.textMuted }]}>{draft.transcript}</Text>
                </View>
              ) : null}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {draft ? (
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <Pressable disabled={saving} onPress={() => void save()} style={[styles.saveButton, saving && styles.saving]}>
            {saving ? <ActivityIndicator color={INK} /> : <Text style={styles.saveLabel}>Dërgo faturën</Text>}
            {!saving ? <Feather name="arrow-right" size={18} color={INK} /> : null}
          </Pressable>
        </View>
      ) : null}
    </Screen>
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
  const { colors } = useAppTheme();
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.rowLabel, { color: strong ? colors.text : colors.textMuted }, strong && styles.strong]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.text, fontVariant: ['tabular-nums'] }, strong && styles.strong]}>{value}</Text>
    </View>
  );
}

function formatDuration(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: 'transparent' },
  fill: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 15 },
  headerText: { flex: 1, minWidth: 0 },
  backButton: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  title: { color: INK, fontSize: 20, fontWeight: '800' },
  subtitle: { color: '#78716C', fontSize: 12, marginTop: 3 },
  content: { paddingHorizontal: 24, paddingBottom: 24 },
  audioBanner: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14, backgroundColor: '#FFEDD5', borderRadius: 16, marginBottom: 18 },
  audioIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
  audioTitle: { color: INK, fontSize: 13, fontWeight: '800' },
  audioSub: { color: '#78716C', fontSize: 11, marginTop: 3 },
  errorCard: { padding: 18, borderRadius: 16, backgroundColor: '#FFFFFF' },
  analysisProgress: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  errorText: { color: INK, fontSize: 14 },
  backLink: { color: '#C2410C', fontWeight: '700', marginTop: 14 },
  metaRow: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  metaBlock: { flex: 1, padding: 14, borderRadius: 16, borderWidth: 1 },
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
  divider: { height: 1 },
  strong: { color: INK, fontSize: 16, fontWeight: '800' },
  transcriptBox: { marginTop: 14, padding: 14, borderRadius: 14, backgroundColor: '#FFFFFF' },
  transcriptText: { color: '#57534E', lineHeight: 20, fontSize: 12, marginTop: 8 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#E7E5E4', backgroundColor: '#FAF5EE' },
  saveButton: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 16, backgroundColor: ORANGE },
  saving: { opacity: 0.75 },
  saveLabel: { color: INK, fontSize: 15, fontWeight: '800' },
});
