import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AIInvoiceScreen() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* Header i Faturës MVP */}
      <View style={styles.headerRow}>
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => router.push('../(tabs)')} 
          activeOpacity={0.8}
        >
          <Text style={styles.backIcon}>🏠</Text>
        </TouchableOpacity>
        
        <Text style={styles.invoiceTitle}>Fatura #0047</Text>

        <View style={styles.draftBadge}>
          <Text style={styles.draftText}>✦ Draft nga AI</Text>
        </View>
      </View>

      {/* Banneri i Zërit */}
      <View style={styles.audioBanner}>
        <View style={styles.playCircle}>
          <Text style={styles.playTriangle}>▶</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.audioTitle}>Nga regjistrimi juaj · 0:24</Text>
          <Text style={styles.audioSub}>AI gjeti 4 zëra dhe klientin</Text>
        </View>
      </View>

      {/* Detajet e Klientit */}
      <View style={styles.metaCard}>
        <View>
          <Text style={styles.metaLabel}>PËR</Text>
          <Text style={styles.metaVal}>Familja Berisha</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.metaLabel}>DATA</Text>
          <Text style={styles.metaVal}>4 nëntor 2026</Text>
        </View>
      </View>

      {/* Lista e Zërave */}
      <View style={styles.itemsCard}>
        <View style={styles.itemRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName}>Punë dore</Text>
            <Text style={styles.itemSub}>4 orë × €25</Text>
          </View>
          <Text style={styles.itemPrice}>€100.00</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.itemRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName}>Priza</Text>
            <Text style={styles.itemSub}>2 copë × €12</Text>
          </View>
          <Text style={styles.itemPrice}>€24.00</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.itemRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName}>Ndërprerës</Text>
            <Text style={styles.itemSub}>1 copë × €11</Text>
          </View>
          <Text style={styles.itemPrice}>€11.00</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.itemRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName}>Llamba LED</Text>
            <Text style={styles.itemSub}>5 copë × €10</Text>
          </View>
          <Text style={styles.itemPrice}>€50.00</Text>
        </View>

        <View style={styles.dividerThick} />

        <View style={styles.totalSubRow}>
          <Text style={styles.subTotalLabel}>Nëntotali</Text>
          <Text style={styles.subTotalVal}>€185.00</Text>
        </View>

        <View style={styles.totalSubRow}>
          <Text style={styles.subTotalLabel}>TVSH 18%</Text>
          <Text style={styles.subTotalVal}>€33.30</Text>
        </View>

        <View style={[styles.totalSubRow, { marginTop: 8 }]}>
          <Text style={styles.grandTotalLabel}>Totali</Text>
          <Text style={styles.grandTotalVal}>€218.30</Text>
        </View>
      </View>

      {/* Butonat MVP (Dizenjues) */}
      <View style={styles.actionsBottomRow}>
        <TouchableOpacity style={styles.secondaryActionBtn} activeOpacity={0.8}>
          <Text style={styles.secondaryActionText}>✏️ Ndrysho me zë</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.primaryActionBtn} 
          onPress={() => router.push('../(tabs)')}
          activeOpacity={0.9}
        >
          <Text style={styles.primaryActionText}>🚀 Ruaj / Dërgo</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footerPdfText}>PDF · WhatsApp · Email</Text>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#FAF5EE', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 110 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E7E5E4', justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 16 },
  invoiceTitle: { fontSize: 20, fontWeight: '900', color: '#1C1917' },
  draftBadge: { backgroundColor: '#FFEDD5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  draftText: { fontSize: 11, fontWeight: '800', color: '#C2410C' },
  audioBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1917', borderRadius: 20, padding: 14, marginBottom: 16 },
  playCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FB923C', justifyContent: 'center', alignItems: 'center' },
  playTriangle: { fontSize: 14, color: '#1C1917', fontWeight: 'bold', marginLeft: 2 },
  audioTitle: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  audioSub: { fontSize: 11, color: '#A8A29E', fontWeight: '500', marginTop: 2 },
  metaCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E7E5E4' },
  metaLabel: { fontSize: 10, fontWeight: '700', color: '#78716C', textTransform: 'uppercase' },
  metaVal: { fontSize: 15, fontWeight: '900', color: '#1C1917', marginTop: 2 },
  itemsCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#E7E5E4' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  itemName: { fontSize: 14, fontWeight: '800', color: '#1C1917' },
  itemSub: { fontSize: 11, color: '#78716C', fontWeight: '500', marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: '900', color: '#1C1917' },
  divider: { height: 1, backgroundColor: '#F5F5F4', marginVertical: 4 },
  dividerThick: { height: 1, backgroundColor: '#E7E5E4', marginVertical: 12 },
  totalSubRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 },
  subTotalLabel: { fontSize: 12, fontWeight: '600', color: '#78716C' },
  subTotalVal: { fontSize: 13, fontWeight: '700', color: '#1C1917' },
  grandTotalLabel: { fontSize: 16, fontWeight: '900', color: '#1C1917' },
  grandTotalVal: { fontSize: 20, fontWeight: '900', color: '#FB923C' },
  actionsBottomRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  secondaryActionBtn: { flex: 1, backgroundColor: '#E7E5E4', borderRadius: 18, paddingVertical: 14, alignItems: 'center' },
  secondaryActionText: { fontSize: 13, fontWeight: '800', color: '#1C1917' },
  primaryActionBtn: { flex: 1, backgroundColor: '#FB923C', borderRadius: 18, paddingVertical: 14, alignItems: 'center' },
  primaryActionText: { fontSize: 13, fontWeight: '800', color: '#1C1917' },
  footerPdfText: { textAlign: 'center', fontSize: 12, color: '#78716C', fontWeight: '600' },
});