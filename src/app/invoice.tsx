import { invoiceService } from '@/services/invoiceService';
import { Feather } from '@expo/vector-icons';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ORANGE = '#FB923C';
const BAR_COUNT = 35;
const TRANSCRIPTION_CHUNK_MS = 7000;
const RECORDING_OPTIONS = { ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true };

function formatTimer(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function VoiceInvoiceScreen() {
  const router = useRouter();
  const mountedRef = useRef(true);
  const processingRef = useRef(false);
  const chunkingRef = useRef(false);
  const rotationPromiseRef = useRef<Promise<void> | null>(null);
  const queuedTranscriptionsRef = useRef<Promise<void>>(Promise.resolve());
  const transcriptPartsRef = useRef<string[]>([]);
  const failedSegmentsRef = useRef<string[]>([]);
  const elapsedMillisRef = useRef(0);
  const segmentStartedAtRef = useRef(0);
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [audioUri, setAudioUri] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [transcribedSegmentCount, setTranscribedSegmentCount] = useState(0);
  const [transcriptionPending, setTranscriptionPending] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(recorder, 100);

  const queueTranscription = useCallback((uri: string) => {
    const task = queuedTranscriptionsRef.current.then(async () => {
      try {
        const text = await invoiceService.transcribeAudioSegment(uri);
        if (text) {
          transcriptPartsRef.current.push(text);
          if (mountedRef.current) {
            setLiveTranscript(transcriptPartsRef.current.join(' '));
            setTranscribedSegmentCount(transcriptPartsRef.current.length);
          }
        }
      } catch (error) {
        console.error('Nuk u transkriptua segmenti audio:', error);
        if (!failedSegmentsRef.current.includes(uri)) failedSegmentsRef.current.push(uri);
        if (mountedRef.current) setTranscriptionError(true);
      }
    });
    queuedTranscriptionsRef.current = task;
    if (mountedRef.current) setTranscriptionPending(true);
    void task.finally(() => {
      if (mountedRef.current && queuedTranscriptionsRef.current === task) {
        setTranscriptionPending(false);
      }
    });
  }, []);

  const rotateChunk = useCallback(() => {
    if (rotationPromiseRef.current || chunkingRef.current || processingRef.current) {
      return rotationPromiseRef.current ?? Promise.resolve();
    }

    chunkingRef.current = true;
    const operation = (async () => {
      try {
        await recorder.stop();
        const uri = recorder.uri ?? recorder.getStatus().url ?? '';
        elapsedMillisRef.current += Date.now() - segmentStartedAtRef.current;
        if (uri) queueTranscription(uri);

        await recorder.prepareToRecordAsync();
        if (!mountedRef.current) return;
        recorder.record();
        segmentStartedAtRef.current = Date.now();
      } catch (error) {
        console.error('Nuk u nda regjistrimi për transkriptim live:', error);
        if (mountedRef.current) {
          setRecording(false);
          Alert.alert(
            'Regjistrimi u ndërpre',
            error instanceof Error ? error.message : 'Nuk mund të vazhdohet regjistrimi audio.'
          );
        }
      } finally {
        chunkingRef.current = false;
      }
    })();
    rotationPromiseRef.current = operation;
    void operation.finally(() => {
      if (rotationPromiseRef.current === operation) rotationPromiseRef.current = null;
    });
    return operation;
  }, [queueTranscription, recorder]);

  const startRecording = useCallback(async () => {
    const permission = await requestRecordingPermissionsAsync();
    if (!mountedRef.current) return;
    if (!permission.granted) {
      Alert.alert('Leja për mikrofonin', 'Lejo përdorimin e mikrofonit për të regjistruar faturën.');
      router.back();
      return;
    }

    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
    });
    if (!mountedRef.current) return;
    await recorder.prepareToRecordAsync();
    if (!mountedRef.current) return;
    recorder.record();
    segmentStartedAtRef.current = Date.now();
    if (mountedRef.current) setRecording(true);
  }, [recorder, router]);

  useEffect(() => {
    mountedRef.current = true;
    void startRecording().catch((error: unknown) => {
      console.error('Nuk mund të niste regjistrimi audio:', error);
      Alert.alert(
        'Regjistrimi dështoi',
        error instanceof Error ? error.message : 'Kontrollo lejen e mikrofonit dhe provo përsëri.'
      );
      router.back();
    });
    return () => {
      mountedRef.current = false;
      if (recorder.getStatus().isRecording) {
        void recorder.stop().catch((error: unknown) => {
          console.error('Nuk u mbyll regjistrimi audio:', error);
        });
      }
      void setAudioModeAsync({ allowsRecording: false }).catch((error: unknown) => {
        console.error('Nuk u rivendos modaliteti audio:', error);
      });
    };
  }, [recorder, router, startRecording]);

  useEffect(() => {
    if (!recording || paused || processing) return;
    const timer = setInterval(() => {
      setTimerSeconds(
        Math.floor((elapsedMillisRef.current + Date.now() - segmentStartedAtRef.current) / 1000)
      );
    }, 1000);
    const chunkTimer = setInterval(() => {
      void rotateChunk();
    }, TRANSCRIPTION_CHUNK_MS);
    return () => {
      clearInterval(timer);
      clearInterval(chunkTimer);
    };
  }, [paused, processing, recording, rotateChunk]);

  const togglePause = async () => {
    if (!recording || processing) return;
    try {
      if (paused) {
        recorder.record();
        setPaused(false);
      } else {
        recorder.pause();
        elapsedMillisRef.current += Date.now() - segmentStartedAtRef.current;
        setTimerSeconds(Math.floor(elapsedMillisRef.current / 1000));
        setPaused(true);
      }
      if (paused) segmentStartedAtRef.current = Date.now();
    } catch (error) {
      Alert.alert('Gabim audio', error instanceof Error ? error.message : 'Regjistrimi nuk mund të ndryshohej.');
    }
  };

  const finish = async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setProcessing(true);
    try {
      if (rotationPromiseRef.current) await rotationPromiseRef.current;
      let uri = audioUri;
      if (recording) {
        await recorder.stop();
        uri = recorder.uri ?? recorder.getStatus().url ?? uri;
        elapsedMillisRef.current += Date.now() - segmentStartedAtRef.current;
        if (uri) queueTranscription(uri);
        setRecording(false);
        setPaused(false);
        setAudioUri(uri);
      }
      const durationSeconds = Math.floor(elapsedMillisRef.current / 1000);
      setTimerSeconds(durationSeconds);
      await queuedTranscriptionsRef.current;
      const failedSegments = failedSegmentsRef.current.splice(0);
      for (const failedUri of failedSegments) {
        const text = await invoiceService.transcribeAudioSegment(failedUri);
        if (text) {
          transcriptPartsRef.current.push(text);
          setLiveTranscript(transcriptPartsRef.current.join(' '));
          setTranscribedSegmentCount(transcriptPartsRef.current.length);
        }
      }
      const transcript = transcriptPartsRef.current.join(' ').trim();
      if (!uri && !transcript) throw new Error('Nuk u gjet regjistrimi audio ose transkripti.');
      if (!transcript) {
        if (uri) {
          await setAudioModeAsync({ allowsRecording: false });
          const result = await invoiceService.transcribeAndExtractInvoice(uri, durationSeconds);
          router.push({ pathname: '/add-bill', params: { draft: JSON.stringify(result) } });
          return;
        }
        throw new Error('Nuk u njoh të folurit. Fol pak më qartë dhe provo përsëri.');
      }
      await setAudioModeAsync({ allowsRecording: false });
      router.push({
        pathname: '/add-bill',
        params: { transcript, durationSeconds: String(durationSeconds) },
      });
    } catch (error) {
      Alert.alert(
        'Nuk u analizua regjistrimi',
        error instanceof Error
          ? error.message
          : 'Kontrollo lidhjen me Supabase dhe konfigurimin e Edge Function, pastaj provo përsëri.'
      );
    } finally {
      processingRef.current = false;
      setProcessing(false);
    }
  };

  const cancel = async () => {
    processingRef.current = true;
    setProcessing(true);
    try {
      if (rotationPromiseRef.current) await rotationPromiseRef.current;
    } catch (error) {
      console.error('Nuk u përfundua segmenti para anulimit:', error);
    }
    if (recorder.getStatus().isRecording || paused) {
      try {
        await recorder.stop();
      } catch (error) {
        console.error('Nuk u anulua regjistrimi:', error);
      }
    }
    await setAudioModeAsync({ allowsRecording: false });
    router.back();
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Pressable accessibilityLabel="Kthehu" onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backGlyph}>&lt;</Text>
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Regjistro punën</Text>
          <Text style={styles.subtitle}>Fol natyrshëm, AI e rregullon vetë.</Text>
        </View>
        <View style={styles.timer}>
          <View style={[styles.timerDot, paused && styles.pausedDot]} />
          <Text style={styles.timerText}>{formatTimer(timerSeconds)}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.transcriptCard}>
          <View style={styles.cardHeading}>
            <View style={[styles.liveDot, paused && styles.pausedDot]} />
            <Text style={styles.cardHeadingText}>
              {recording
                ? paused
                  ? 'Në pauzë'
                  : transcriptionPending
                    ? 'AI po transkripton...'
                    : 'AI po dëgjon'
                : 'Transkripti'}
            </Text>
          </View>
          <Text style={styles.transcriptText}>
            {liveTranscript ||
              (transcriptionError
                ? 'Disa fjalë nuk u njohën ende. Vazhdo të flasësh; AI do të provojë me segmentet pasuese.'
                : 'Fjalët e tua do të shfaqen këtu pas analizimit të segmentit të parë audio.')}
          </Text>
        </View>

        <View style={styles.aiHeading}>
          <Text style={styles.sparkle}>✦</Text>
          <Text style={styles.aiLabel}>
            {transcriptionPending ? '✦ AI po shkruan atë që po thua' : '✦ Transkriptim live me AI'}
          </Text>
        </View>
        <View style={styles.chips}>
          <Chip label={transcriptionError ? 'Transkriptimi po riprovohet' : `${transcribedSegmentCount} segmente analizuar`} />
          <Chip label="Fatura plotësohet pas përfundimit" />
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <View style={styles.waveform}>
          {Array.from({ length: BAR_COUNT }, (_, index) => {
            const shape = 0.18 + Math.sin((index / (BAR_COUNT - 1)) * Math.PI) * 0.82;
            const variation = 0.25 + ((index * 17) % 13) / 20;
            const meter = recorderState.metering === undefined
              ? 0
              : Math.max(0, Math.min(1, (recorderState.metering + 60) / 60));
            const height = recording && !paused ? Math.max(4, 66 * meter * shape * variation) : 5;
            return <View key={index} style={[styles.waveBar, { height }]} />;
          })}
        </View>
        <View style={styles.controls}>
          <Pressable
            accessibilityLabel={paused ? 'Vazhdo regjistrimin' : 'Pauzo regjistrimin'}
            disabled={!recording || processing}
            style={[styles.sideButton, (!recording || processing) && styles.disabled]}
            onPress={() => void togglePause()}
          >
            <Feather name={paused ? 'play' : 'pause'} size={20} color="#FFFFFF" />
          </Pressable>
          <Pressable
            accessibilityLabel="Përfundo regjistrimin"
            disabled={processing || (!recording && !audioUri)}
            style={[styles.stopOuter, processing && styles.disabled]}
            onPress={() => void finish()}
          >
            <View style={styles.stopInner}>
              {processing ? (
                <ActivityIndicator size="large" color="#141312" />
              ) : (
                <Feather name={recording ? 'square' : 'mic'} size={26} color="#141312" />
              )}
            </View>
          </Pressable>
          <Pressable
            accessibilityLabel="Anulo regjistrimin"
            disabled={processing}
            style={[styles.sideButton, processing && styles.disabled]}
            onPress={() => void cancel()}
          >
            <Feather name="x" size={21} color="#FFFFFF" />
          </Pressable>
        </View>
        <Text style={styles.caption}>
          {processing ? 'Duke hapur faturën...' : 'Prek për të përfunduar'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#141312' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 18 },
  backButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#1C1917', alignItems: 'center', justifyContent: 'center' },
  backGlyph: { color: '#FFFFFF', fontSize: 24, lineHeight: 27 },
  headerText: { flex: 1 },
  title: { color: '#FFFFFF', fontSize: 19, fontWeight: '800' },
  subtitle: { color: '#A8A29E', fontSize: 11, marginTop: 3 },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#1C1917', borderRadius: 18, paddingHorizontal: 10, paddingVertical: 8 },
  timerDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#EF4444' },
  pausedDot: { backgroundColor: '#78716C' },
  timerText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  body: { paddingHorizontal: 20, paddingBottom: 12 },
  transcriptCard: { minHeight: 200, padding: 18, borderWidth: 1, borderColor: '#292524', borderRadius: 20, backgroundColor: '#1C1917' },
  cardHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: ORANGE },
  cardHeadingText: { color: '#D6D3D1', fontSize: 12, fontWeight: '600' },
  transcriptText: { color: '#E7E5E4', fontSize: 16, lineHeight: 25 },
  aiHeading: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 20, marginBottom: 10 },
  sparkle: { color: ORANGE, fontSize: 16 },
  aiLabel: { color: '#A8A29E', fontSize: 13, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 9, backgroundColor: '#1C1917', borderRadius: 14, borderWidth: 1, borderColor: '#292524' },
  chipText: { color: '#E7E5E4', fontSize: 12, fontWeight: '600' },
  bottom: { paddingHorizontal: 24, paddingBottom: 12 },
  waveform: { height: 76, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 3 },
  waveBar: { width: 3, borderRadius: 3, backgroundColor: ORANGE },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 30, marginTop: 12 },
  sideButton: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#292524', alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.55 },
  stopOuter: { width: 104, height: 104, borderRadius: 52, borderWidth: 2, borderColor: 'rgba(251,146,60,0.35)', backgroundColor: 'rgba(251,146,60,0.13)', alignItems: 'center', justifyContent: 'center' },
  stopInner: { width: 80, height: 80, borderRadius: 40, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
  caption: { color: '#A8A29E', textAlign: 'center', fontSize: 12, marginTop: 12 },
});
