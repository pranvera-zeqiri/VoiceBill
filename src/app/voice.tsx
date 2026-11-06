import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Waveform } from '@/components/waveForm';
import { colors, radius } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { formatTimer, uid } from '@/utils/format';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

/**
 * SIMULATED speech-to-text: the transcript "types itself" word by word.
 * Replace with real recording (expo-audio) + a transcription/AI call when you connect your backend.
 * [[double brackets]] mark the words that get the orange highlight.
 */
const RAW =
  'Te familja [[Berisha]] ndërrova [[dy priza]] dhe [[një ndërprerës]], instalova [[pesë llamba LED]]. Puna zgjati [[katër orë]]. Materialet [[85 euro]]';

interface Token {
  word: string;
  hl: boolean;
}

const TOKENS: Token[] = RAW.split(/(\[\[.*?\]\])/)
  .filter(Boolean)
  .flatMap((part) => {
    const hl = part.startsWith('[[');
    const text = hl ? part.slice(2, -2) : part;
    return text
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => ({ word, hl }));
  });

const after = (w: string) => TOKENS.findIndex((t) => t.word === w) + 1;

const CHIPS = [
  { label: 'Klienti · Berisha', at: after('Berisha') },
  { label: 'Koha · 4 orë', at: after('orë') },
  { label: 'Materiale · €85', at: after('euro') },
  { label: '4 zëra fature', at: TOKENS.length },
];

export default function VoiceScreen() {
  const router = useRouter();
  const { customers, settings, addInvoice } = useApp();

  const [seconds, setSeconds] = useState(0);
  const [revealed, setRevealed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [processing, setProcessing] = useState(false);
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Recording timer
  useEffect(() => {
    if (paused || processing) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [paused, processing]);

  // Simulated live transcription
  useEffect(() => {
    if (paused || processing || revealed >= TOKENS.length) return;
    const id = setInterval(() => setRevealed((r) => Math.min(r + 1, TOKENS.length)), 380);
    return () => clearInterval(id);
  }, [paused, processing, revealed]);

  useEffect(() => () => {
    if (finishTimer.current) clearTimeout(finishTimer.current);
  }, []);

  const visible = useMemo(() => TOKENS.slice(0, revealed), [revealed]);

  const finish = () => {
    if (processing) return;
    setProcessing(true);
    finishTimer.current = setTimeout(() => {
      void (async () => {
        try {
          const customer = customers.find((c) => c.name.includes('Berisha')) ?? customers[0];
          if (!customer) throw new Error('Shto një klient para se të krijosh faturë me zë.');
          const invoice = await addInvoice({
            customerId: customer.id,
            title: 'Instalim elektrik',
            vatRate: settings.autoVat ? settings.vatRate : 0,
            status: 'draft',
            fromVoice: true,
            audioSeconds: Math.max(seconds, 1),
            items: [
              { id: uid(), title: 'Punë dore', quantity: 4, unit: 'orë', unitPrice: 25 },
              { id: uid(), title: 'Priza', quantity: 2, unit: 'copë', unitPrice: 12 },
              { id: uid(), title: 'Ndërprerës', quantity: 1, unit: 'copë', unitPrice: 11, needsConfirm: true },
              { id: uid(), title: 'Llamba LED', quantity: 5, unit: 'copë', unitPrice: 10 },
            ],
          });
          router.replace(`../invoice/${invoice.id}`);
        } catch (error) {
          Alert.alert(
            'Nuk u ruajt fatura',
            error instanceof Error ? error.message : 'Kontrollo lidhjen me internetin dhe provo përsëri.'
          );
          setProcessing(false);
        }
      })();
    }, 1400);
  };

  return (
    <Screen dark edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <Header
        dark
        title="Regjistro punën"
        right={
          <View style={styles.timer}>
            <View style={styles.timerDot} />
            <Text style={styles.timerText}>{formatTimer(seconds)}</Text>
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Fol natyrshëm, AI e rregullon vetë.</Text>

        <View style={styles.transcript}>
          <View style={styles.listeningRow}>
            <View style={[styles.listeningDot, paused && { backgroundColor: colors.textOnDarkMuted }]} />
            <Text style={styles.listeningText}>{paused ? 'Në pauzë' : 'Po dëgjoj...'}</Text>
          </View>
          <Text style={styles.transcriptText}>
            {visible.map((t, i) => (
              <React.Fragment key={i}>
                <Text style={t.hl ? styles.highlight : undefined}>{t.word}</Text>
                <Text> </Text>
              </React.Fragment>
            ))}
            <Text style={{ color: colors.primary }}>|</Text>
          </Text>
        </View>

        <View style={styles.aiRow}>
          <Ionicons name="sparkles" size={14} color={colors.primary} />
          <Text style={styles.aiText}>AI po e kupton</Text>
        </View>
        <View style={styles.chips}>
          {CHIPS.filter((c) => revealed >= c.at).map((c) => (
            <View key={c.label} style={styles.chip}>
              <Text style={styles.chipText}>{c.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <Waveform active={!paused && !processing} />

        <View style={styles.controls}>
          <Pressable style={styles.sideBtn} onPress={() => setPaused((p) => !p)}>
            <Feather name={paused ? 'play' : 'pause'} size={20} color="#FFFFFF" />
          </Pressable>

          <Pressable onPress={finish} style={styles.stopOuter}>
            <View style={styles.stopInner}>
              <View style={styles.stopSquare} />
            </View>
          </Pressable>

          <Pressable style={styles.sideBtn} onPress={() => router.back()}>
            <Feather name="x" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        <Text style={styles.caption}>Prek për të përfunduar</Text>
      </View>

      {processing ? (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.overlayText}>AI po krijon faturën...</Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.darkSurface,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  timerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger },
  timerText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13, fontVariant: ['tabular-nums'] },
  body: { paddingHorizontal: 20, paddingBottom: 16 },
  subtitle: { color: colors.textOnDarkMuted, fontSize: 14, marginBottom: 16 },
  transcript: {
    backgroundColor: colors.darkSurface,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    minHeight: 170,
  },
  listeningRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  listeningDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
  listeningText: { color: colors.textOnDarkMuted, fontSize: 12 },
  transcriptText: { color: '#FFFFFF', fontSize: 17, lineHeight: 26 },
  highlight: { color: colors.primary, backgroundColor: 'rgba(242,107,29,0.18)' },
  aiRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, marginBottom: 10 },
  aiText: { color: colors.textOnDarkMuted, fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: colors.darkSurface,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  bottom: { paddingHorizontal: 20, paddingBottom: 12 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    marginTop: 18,
  },
  sideBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.darkSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopOuter: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2,
    borderColor: 'rgba(242,107,29,0.35)',
    backgroundColor: 'rgba(242,107,29,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopSquare: { width: 22, height: 22, borderRadius: 5, backgroundColor: colors.dark },
  caption: { color: colors.textOnDarkMuted, textAlign: 'center', fontSize: 12, marginTop: 14 },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15,27,34,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  overlayText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});