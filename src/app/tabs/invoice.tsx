import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function VoiceInvoiceScreen() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Regjistro punën</Text>
        <View style={styles.timerBadge}>
          <View style={styles.redDot} />
          <Text style={styles.timerText}>00:24</Text>
        </View>
      </View>

      <View style={styles.transcriptCard}>
        <Text style={styles.transcriptStatus}>● Po dëgjoj...</Text>
        <Text style={styles.transcriptText}>
          Te familja Berisha ndërrova dy priza dhe një ndërprerës, instalova pesë llamba LED. Puna zgjati katër orë. Materialet 85 euro |
        </Text>
        
        <View style={styles.aiTagContainer}>
          <Text style={styles.aiTagIcon}>✦</Text>
          <Text style={styles.aiTagText}>AI po e kupton</Text>
        </View>

        <View style={styles.extractedDataRow}>
          <View style={styles.extractedItem}>
            <Text style={styles.extractedLabel}>Klienti</Text>
            <Text style={styles.extractedVal}>Berisha</Text>
          </View>
          <View style={styles.extractedItem}>
            <Text style={styles.extractedLabel}>Koha</Text>
            <Text style={styles.extractedVal}>4 orë</Text>
          </View>
          <View style={styles.extractedItem}>
            <Text style={styles.extractedLabel}>Materiale</Text>
            <Text style={styles.extractedVal}>€85</Text>
          </View>
        </View>

        <Text style={styles.aiHintText}>4 zëra fature</Text>
      </View>

      <View style={styles.waveContainer}>
        {[12, 24, 18, 35, 42, 20, 15, 30, 50, 65, 40, 25, 45, 60, 35, 20, 40, 55, 30, 18, 25, 42, 30, 15, 20, 35, 22, 12].map((height, index) => (
          <View 
            key={index} 
            style={[
              styles.waveBar, 
              { height: height, backgroundColor: index > 8 && index < 18 ? '#FB923C' : '#D6D3D1' } 
            ]} 
          />
        ))}
      </View>

      {/* Butoni i madh i qendrës që tani dërgon direkt te faturat e gjeneruara nga AI */}
      <View style={styles.controlsRow}>
        <TouchableOpacity style={styles.controlCircleSmall} activeOpacity={0.8}>
          <View style={styles.pauseIconBar} />
          <View style={styles.pauseIconBar} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.controlCircleLarge} 
          onPress={() => router.push('../add-bill')} 
          activeOpacity={0.9}
        >
          <View style={styles.stopSquare} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlCircleSmall} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={styles.closeX}>✕</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footerInstruction}>Prek për të përfunduar dhe gjeneruar faturën</Text>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#1C1917', paddingHorizontal: 22, paddingTop: 60, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#292524', justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 24, color: '#FFFFFF', fontWeight: 'bold', marginTop: -2 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  timerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#292524', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', marginRight: 6 },
  timerText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  transcriptCard: { backgroundColor: '#292524', borderRadius: 24, padding: 20, marginBottom: 30, borderWidth: 1, borderColor: '#44403C' },
  transcriptStatus: { fontSize: 13, fontWeight: '700', color: '#FB923C', marginBottom: 10 },
  transcriptText: { fontSize: 16, color: '#F5F5F4', lineHeight: 24, fontWeight: '500', marginBottom: 16 },
  aiTagContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  aiTagIcon: { color: '#FB923C', fontSize: 14, marginRight: 6 },
  aiTagText: { fontSize: 12, color: '#A8A29E', fontWeight: '600' },
  extractedDataRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#1C1917', padding: 12, borderRadius: 16, marginBottom: 12 },
  extractedItem: { flex: 1, alignItems: 'center' },
  extractedLabel: { fontSize: 10, color: '#78716C', fontWeight: '600', textTransform: 'uppercase' },
  extractedVal: { fontSize: 13, color: '#FFFFFF', fontWeight: '800', marginTop: 2 },
  aiHintText: { fontSize: 11, color: '#78716C', fontWeight: '600', textAlign: 'right' },
  waveContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 80, paddingHorizontal: 10, marginBottom: 40 },
  waveBar: { width: 4, borderRadius: 2 },
  controlsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24, marginBottom: 12 },
  controlCircleSmall: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#292524', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#44403C' },
  pauseIconBar: { width: 3, height: 14, backgroundColor: '#FFFFFF', marginHorizontal: 2, borderRadius: 1.5 },
  closeX: { fontSize: 18, color: '#FFFFFF', fontWeight: 'bold' },
  controlCircleLarge: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FB923C', justifyContent: 'center', alignItems: 'center', shadowColor: '#FB923C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 8 },
  stopSquare: { width: 22, height: 22, backgroundColor: '#1C1917', borderRadius: 4 },
  footerInstruction: { textAlign: 'center', fontSize: 13, color: '#78716C', fontWeight: '600' },
});