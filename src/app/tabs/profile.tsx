import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../lib/supabase';

export default function ProfileScreen() {
  const router = useRouter();
  
  // States për cilësimet inovative
  const [voiceConfirm, setVoiceConfirm] = useState(true);
  const [autoTva, setAutoTva] = useState(true);
  const [stats, setStats] = useState({ totalInvoices: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileStats();
  }, []);

  async function fetchProfileStats() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('invoices').select('total');
      if (error) throw error;

      if (data) {
        const count = data.length;
        const sum = data.reduce((acc, curr) => acc + Number(curr.total || 0), 0);
        setStats({ totalInvoices: count, totalRevenue: sum });
      }
    } catch (err: any) {
      console.error('Gabim në marrjen e statistikave:', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Profili & Biznesi</Text>
        <TouchableOpacity 
          style={styles.editBtn}
          onPress={() => Alert.alert('Njoftim', 'Veçoria e redaktimit të profil do të jetë së shpejti aktive.')}
        >
          <Text style={styles.editBtnText}>Ndrysho ✏️</Text>
        </TouchableOpacity>
      </View>

      {/* Karta e Biznesit / Pronarit */}
      <View style={styles.profileCard}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarTextLarge}>P</Text>
        </View>
        <Text style={styles.profileName}>Pranvera</Text>
        <Text style={styles.profileRole}>Servis & Instalime Elektrike</Text>
        
        <View style={styles.badgeRow}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>● VoiceBill AI Aktiv</Text>
          </View>
        </View>
      </View>

      {/* Mini-Statistikat e Performancës */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalInvoices}</Text>
          <Text style={styles.statLabel}>Fatura Gjithsej</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#FB923C' }]}>
            €{stats.totalRevenue.toFixed(0)}
          </Text>
          <Text style={styles.statLabel}>Xhiroja e Gjeneruar</Text>
        </View>
      </View>

      {/* Seksioni: Konfigurimi i AI & Zërit */}
      <Text style={styles.sectionTitle}>Konfigurimi i Zërit (AI)</Text>

      <View style={styles.settingCard}>
        <View style={styles.settingTextGroup}>
          <Text style={styles.settingTitle}>Konfirmimi me zë para dërgimit</Text>
          <Text style={styles.settingSub}>Lexo faturën me zë automatikisht pas gjenerimit</Text>
        </View>
        <Switch
          value={voiceConfirm}
          onValueChange={setVoiceConfirm}
          trackColor={{ false: '#E7E5E4', true: '#FB923C' }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View style={styles.settingCard}>
        <View style={styles.settingTextGroup}>
          <Text style={styles.settingTitle}>Llogaritja automatike e TVSH (18%)</Text>
          <Text style={styles.settingSub}>Shto TVSH automatikisht te faturat e krijuara</Text>
        </View>
        <Switch
          value={autoTva}
          onValueChange={setAutoTva}
          trackColor={{ false: '#E7E5E4', true: '#FB923C' }}
          thumbColor="#FFFFFF"
        />
      </View>

      {/* Seksioni: Opsionet e Tjera */}
      <Text style={styles.sectionTitle}>Të përgjithshme</Text>

      <TouchableOpacity style={styles.menuItem} activeOpacity={0.8}>
        <Text style={styles.menuIcon}>🏦</Text>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.menuTitle}>Të dhënat e Bankës / IBAN</Text>
          <Text style={styles.menuSub}>Vendos IBAN-in për pagesat e faturave</Text>
        </View>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} activeOpacity={0.8}>
        <Text style={styles.menuIcon}>📄</Text>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.menuTitle}>Shablloni i PDF-ve</Text>
          <Text style={styles.menuSub}>Zgjidh ngjyrën dhe logon e faturës</Text>
        </View>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.menuItem, { borderBottomWidth: 0 }]} 
        onPress={() => Alert.alert('Kujdes', 'Dëshironi të dilni nga aplikacioni?')}
        activeOpacity={0.8}
      >
        <Text style={styles.menuIcon}>🚪</Text>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={[styles.menuTitle, { color: '#DC2626' }]}>Dil nga Aplikacioni</Text>
        </View>
        <Text style={[styles.menuArrow, { color: '#DC2626' }]}>›</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#FAF5EE', paddingHorizontal: 22, paddingTop: 60, paddingBottom: 40 },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#1C1917' },
  editBtn: { backgroundColor: '#E7E5E4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  editBtnText: { fontSize: 13, fontWeight: '700', color: '#1C1917' },

  profileCard: { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 22, alignItems: 'center', borderWidth: 1, borderColor: '#E7E5E4', marginBottom: 16 },
  avatarLarge: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FB923C', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarTextLarge: { fontSize: 32, fontWeight: '900', color: '#1C1917' },
  profileName: { fontSize: 20, fontWeight: '900', color: '#1C1917' },
  profileRole: { fontSize: 13, color: '#78716C', fontWeight: '500', marginTop: 2 },
  
  badgeRow: { marginTop: 12 },
  statusBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { fontSize: 12, fontWeight: '800', color: '#16A34A' },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#E7E5E4', alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: '900', color: '#1C1917' },
  statLabel: { fontSize: 12, color: '#78716C', fontWeight: '600', marginTop: 2 },

  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#1C1917', marginBottom: 12, marginTop: 8 },

  settingCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#E7E5E4', marginBottom: 10 },
  settingTextGroup: { flex: 1, paddingRight: 10 },
  settingTitle: { fontSize: 14, fontWeight: '800', color: '#1C1917' },
  settingSub: { fontSize: 11, color: '#78716C', fontWeight: '500', marginTop: 2 },

  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#E7E5E4', marginBottom: 10 },
  menuIcon: { fontSize: 20 },
  menuTitle: { fontSize: 14, fontWeight: '800', color: '#1C1917' },
  menuSub: { fontSize: 11, color: '#78716C', fontWeight: '500', marginTop: 2 },
  menuArrow: { fontSize: 20, color: '#A8A29E', fontWeight: 'bold' },
});