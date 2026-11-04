import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.dateText}>E mërkurë, 4 nëntor</Text>
            <Text style={styles.greetingText}>Mirëdita, Arben</Text>
          </View>
          <TouchableOpacity style={styles.profileIconButton}>
            <View style={styles.doorIconLine1} />
            <View style={styles.doorIconBox} />
          </TouchableOpacity>
        </View>

        {/* Hero Card - Të ardhura & Grafik */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <Text style={styles.heroSubtitle}>Të ardhura · Nëntor</Text>
            <View style={styles.percentageBadge}>
              <Text style={styles.percentageText}>+18% nga tetori</Text>
            </View>
          </View>
          <Text style={styles.heroAmount}>€3,480</Text>

          {/* Grafiku i 7 ditëve */}
          <View style={styles.chartContainer}>
            <View style={[styles.bar, { height: '35%' }]} />
            <View style={[styles.bar, { height: '60%' }]} />
            <View style={[styles.bar, { height: '45%' }]} />
            <View style={[styles.bar, { height: '70%' }]} />
            <View style={[styles.bar, { height: '55%' }]} />
            <View style={[styles.bar, { height: '80%' }]} />
            <View style={[styles.bar, styles.activeBar, { height: '95%' }]} />
          </View>
          <Text style={styles.chartFooter}>7 ditët e fundit</Text>
        </View>

        {/* Statistikat (Në pritje / Të paguara) */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <View style={styles.statDotRow}>
              <View style={[styles.dot, { backgroundColor: '#EAB308' }]} />
              <Text style={styles.statLabel}>Në pritje</Text>
            </View>
            <Text style={styles.statAmount}>€940</Text>
            <Text style={styles.statCount}>3 fatura</Text>
          </View>

          <View style={styles.statBox}>
            <View style={styles.statDotRow}>
              <View style={[styles.dot, { backgroundColor: '#22C55E' }]} />
              <Text style={styles.statLabel}>Të paguara</Text>
            </View>
            <Text style={styles.statAmount}>€2,540</Text>
            <Text style={styles.statCount}>9 fatura</Text>
          </View>
        </View>

        {/* Voice Button Banner */}
        <TouchableOpacity 
          style={styles.voiceBanner}
          onPress={() => router.push('/add-bill' as any)}
          activeOpacity={0.9}
        >
          <View style={styles.micCircle}>
            <View style={styles.micHead} />
            <View style={styles.micStand} />
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.voiceTitle}>Fol dhe krijo faturë</Text>
            <Text style={styles.voiceSub}>Shtyp dhe tregoji çfarë punove</Text>
          </View>
          <Text style={styles.arrowIcon}>→</Text>
        </TouchableOpacity>

        {/* Faturat e fundit */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Faturat e fundit</Text>
          <Text style={styles.seeAllText}>Të gjitha</Text>
        </View>

        {/* Item 1 */}
        <View style={styles.invoiceItem}>
          <View style={styles.avatarFb}>
            <Text style={styles.avatarTextFb}>FB</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.clientName}>Familja Berisha</Text>
            <Text style={styles.clientSub}>Instalim elektrik · sot</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.invoicePrice}>€218.30</Text>
            <Text style={styles.statusPending}>Në pritje</Text>
          </View>
        </View>

        <View style={{ height: 14 }} />

        {/* Item 2 */}
        <View style={styles.invoiceItem}>
          <View style={styles.avatarDk}>
            <Text style={styles.avatarTextDk}>DK</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.clientName}>Dardan Kryeziu</Text>
            <Text style={styles.clientSub}>Riparim tubash · dje</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.invoicePrice}>€380.00</Text>
            <Text style={styles.statusPaid}>Paguar</Text>
          </View>
        </View>

      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/' as any)}>
          <View style={styles.navIconHome}>
            <View style={styles.roof} />
            <View style={styles.houseBody} />
          </View>
          <Text style={[styles.navText, styles.activeNavText]}>Ballina</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navIconDoc}>
            <View style={styles.docLine1} />
            <View style={styles.docLine2} />
          </View>
          <Text style={styles.navText}>Faturat</Text>
        </TouchableOpacity>

        {/* Qendra (Mikrofoni i përmirësuar me unazë rrethuese dhe hije estetike) */}
        <TouchableOpacity 
          style={styles.navMicCenter}
          onPress={() => router.push('/add-bill' as any)}
        >
          <View style={styles.navMicInner}>
            <View style={styles.navMicHead} />
            <View style={styles.navMicStand} />
          </View>
        </TouchableOpacity>

        {/* Klientët (Me dy persona të vizatuar qartë) */}
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navIconUsersContainer}>
            <View style={styles.userPersonLeft}>
              <View style={styles.miniHead} />
              <View style={styles.miniBody} />
            </View>
            <View style={styles.userPersonRight}>
              <View style={styles.miniHead} />
              <View style={styles.miniBody} />
            </View>
          </View>
          <Text style={styles.navText}>Klientët</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navIconUser}>
            <View style={styles.singleUserHead} />
            <View style={styles.singleUserBody} />
          </View>
          <Text style={styles.navText}>Profili</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF5EE' },
  scrollContent: { paddingHorizontal: 22, paddingTop: 60, paddingBottom: 130 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  dateText: { fontSize: 13, color: '#78716C', fontWeight: '600' },
  greetingText: { fontSize: 28, fontWeight: '900', color: '#1C1917', marginTop: 3 },
  profileIconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E7E5E4', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  doorIconBox: { width: 14, height: 16, borderWidth: 2, borderColor: '#44403C', borderRadius: 2 },
  doorIconLine1: { position: 'absolute', width: 6, height: 2, backgroundColor: '#44403C', left: 24, top: 19 },

  heroCard: { backgroundColor: '#1C1917', borderRadius: 32, padding: 24, marginBottom: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 14, elevation: 8 },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroSubtitle: { fontSize: 13, color: '#A8A29E', fontWeight: '600' },
  percentageBadge: { backgroundColor: '#292524', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  percentageText: { color: '#4ADE80', fontSize: 11, fontWeight: '700' },
  heroAmount: { fontSize: 42, fontWeight: '900', color: '#FFFFFF', marginVertical: 12, letterSpacing: -1 },
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 75, marginTop: 14, paddingHorizontal: 2 },
  bar: { width: 30, backgroundColor: '#292524', borderRadius: 8 },
  activeBar: { backgroundColor: '#FB923C' },
  chartFooter: { fontSize: 12, color: '#A8A29E', marginTop: 14, fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 18 },
  statBox: { flex: 1, backgroundColor: '#FFFFFF', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#E7E5E4', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 3 },
  statDotRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  statLabel: { fontSize: 13, color: '#78716C', fontWeight: '600' },
  statAmount: { fontSize: 24, fontWeight: '900', color: '#1C1917' },
  statCount: { fontSize: 12, color: '#A8A29E', fontWeight: '600', marginTop: 4 },

  voiceBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FB923C', borderRadius: 28, padding: 20, marginBottom: 24, shadowColor: '#FB923C', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  micCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#1C1917', justifyContent: 'center', alignItems: 'center' },
  micHead: { width: 11, height: 16, backgroundColor: '#FB923C', borderRadius: 6 },
  micStand: { width: 16, height: 7, borderBottomWidth: 2, borderLeftWidth: 2, borderRightWidth: 2, borderColor: '#FB923C', borderBottomLeftRadius: 6, borderBottomRightRadius: 6, marginTop: -2 },
  voiceTitle: { fontSize: 17, fontWeight: '900', color: '#1C1917' },
  voiceSub: { fontSize: 13, color: '#44403C', fontWeight: '500', marginTop: 3 },
  arrowIcon: { fontSize: 22, color: '#1C1917', fontWeight: 'bold' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1C1917' },
  seeAllText: { fontSize: 13, color: '#2563EB', fontWeight: '700' },

  invoiceItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 18, borderRadius: 22, borderWidth: 1, borderColor: '#E7E5E4', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 3 },
  avatarFb: { width: 50, height: 50, borderRadius: 18, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center' },
  avatarTextFb: { color: '#16A34A', fontWeight: '900', fontSize: 15 },
  avatarDk: { width: 50, height: 50, borderRadius: 18, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center' },
  avatarTextDk: { color: '#2563EB', fontWeight: '900', fontSize: 15 },
  clientName: { fontSize: 16, fontWeight: '900', color: '#1C1917' },
  clientSub: { fontSize: 13, color: '#78716C', fontWeight: '500', marginTop: 4 },
  invoicePrice: { fontSize: 17, fontWeight: '900', color: '#1C1917' },
  statusPending: { fontSize: 12, fontWeight: '700', color: '#CA8A04', marginTop: 5 },
  statusPaid: { fontSize: 12, fontWeight: '700', color: '#16A34A', marginTop: 5 },

  navBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 85, backgroundColor: '#FFFFFF', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E7E5E4', paddingBottom: 12 },
  navItem: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  navText: { fontSize: 11, color: '#A8A29E', fontWeight: '600', marginTop: 5 },
  activeNavText: { color: '#1C1917', fontWeight: '900' },
  
  // Mikrofoni qendror më i bukur dhe me unazë portokalli
  navMicCenter: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#FED7AA', justifyContent: 'center', alignItems: 'center', marginBottom: 22, shadowColor: '#FB923C', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },
  navMicInner: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FB923C', justifyContent: 'center', alignItems: 'center' },
  navMicHead: { width: 10, height: 14, backgroundColor: '#1C1917', borderRadius: 5 },
  navMicStand: { width: 14, height: 6, borderBottomWidth: 2, borderLeftWidth: 2, borderRightWidth: 2, borderColor: '#1C1917', borderBottomLeftRadius: 6, borderBottomRightRadius: 6, marginTop: -2 },

  navIconHome: { width: 20, height: 20, justifyContent: 'flex-end', alignItems: 'center' },
  roof: { width: 0, height: 0, borderLeftWidth: 10, borderRightWidth: 10, borderBottomWidth: 9, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#1C1917' },
  houseBody: { width: 14, height: 11, backgroundColor: '#1C1917' },

  navIconDoc: { width: 15, height: 20, borderWidth: 2, borderColor: '#A8A29E', borderRadius: 3 },
  docLine1: { width: 7, height: 2, backgroundColor: '#A8A29E', position: 'absolute', top: 5, left: 2 },
  docLine2: { width: 7, height: 2, backgroundColor: '#A8A29E', position: 'absolute', top: 10, left: 2 },

  // Ikona e Klientëve me dy persona të vizatuar qartë
  navIconUsersContainer: { flexDirection: 'row', width: 26, height: 18, justifyContent: 'space-between', alignItems: 'flex-end' },
  userPersonLeft: { alignItems: 'center' },
  userPersonRight: { alignItems: 'center' },
  miniHead: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#A8A29E', marginBottom: 2 },
  miniBody: { width: 10, height: 8, borderTopLeftRadius: 5, borderTopRightRadius: 5, backgroundColor: '#A8A29E' },

  navIconUser: { width: 16, height: 18, position: 'relative', alignItems: 'center' },
  singleUserHead: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#A8A29E', marginBottom: 2 },
  singleUserBody: { width: 14, height: 9, borderTopLeftRadius: 7, borderTopRightRadius: 7, backgroundColor: '#A8A29E' },
});