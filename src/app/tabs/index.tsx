import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../lib/supabase';

export default function DashboardScreen() {
  const router = useRouter();
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLiveInvoices = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setInvoices(data);
        const sum = data.reduce((acc, curr) => acc + Number(curr.total || 0), 0);
        setTotalRevenue(sum);
      }
    } catch (error) {
      console.error('Gabim në Supabase:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveInvoices();
  }, []);

  return (
    <ScrollView 
      contentContainerStyle={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchLiveInvoices} tintColor="#FB923C" />}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.dateText}>E mërkurë, 4 nëntor</Text>
          <Text style={styles.greetingText}>Mirëdita, Pranvera</Text>
        </View>
      </View>

      {/* Karta e Zeze - Të Ardhura Totale Live */}
      <View style={styles.revenueCard}>
        <Text style={styles.revenueLabel}>Të ardhura Totale · Nëntor</Text>
        <Text style={styles.revenueAmount}>€{totalRevenue.toFixed(2)}</Text>
        <Text style={styles.revenueSub}>Të dhëna live nga Supabase</Text>
      </View>

      {/* Banneri Portokallor - Pa veprim tani për tani */}
      <TouchableOpacity 
        style={styles.actionBanner} 
        activeOpacity={0.9}
      >
        <View style={styles.micCircle}>
          <View style={styles.micHead} />
          <View style={styles.micStand} />
        </View>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={styles.actionTitle}>Fol dhe krijo faturë</Text>
          <Text style={styles.actionSub}>Shtyp këtu për gjenerimin me zë</Text>
        </View>
        <Text style={styles.arrowIcon}>→</Text>
      </TouchableOpacity>

      {/* Faturat e Fundit */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Faturat e fundit</Text>
        <TouchableOpacity onPress={fetchLiveInvoices}>
          <Text style={styles.refreshText}>Rifresko 🔄</Text>
        </TouchableOpacity>
      </View>

      {invoices.length === 0 ? (
        <Text style={styles.emptyText}>Nuk ka asnjë faturë ende në Supabase.</Text>
      ) : (
        invoices.slice(0, 3).map((item) => (
          <View key={item.id} style={styles.invoiceItem}>
            <View style={styles.avatarFb}>
              <Text style={styles.avatarTextFb}>
                {item.client_name ? item.client_name.substring(0, 2).toUpperCase() : 'FT'}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.clientName}>{item.client_name}</Text>
              <Text style={styles.clientSub}>{item.service_description}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.invoicePrice}>€{Number(item.total).toFixed(2)}</Text>
              <Text style={styles.statusPending}>{item.status || 'Në pritje'}</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#FAF5EE', paddingHorizontal: 22, paddingTop: 60, paddingBottom: 40 },
  headerRow: { marginBottom: 20 },
  dateText: { fontSize: 13, color: '#78716C', fontWeight: '600' },
  greetingText: { fontSize: 26, fontWeight: '900', color: '#1C1917', marginTop: 3 },
  
  revenueCard: { backgroundColor: '#1C1917', borderRadius: 28, padding: 24, marginBottom: 18 },
  revenueLabel: { fontSize: 13, color: '#A8A29E', fontWeight: '600' },
  revenueAmount: { fontSize: 38, fontWeight: '900', color: '#FFFFFF', marginVertical: 8 },
  revenueSub: { fontSize: 12, color: '#78716C', fontWeight: '500' },

  actionBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FB923C', borderRadius: 24, padding: 18, marginBottom: 28 },
  micCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#1C1917', justifyContent: 'center', alignItems: 'center' },
  micHead: { width: 10, height: 14, backgroundColor: '#FB923C', borderRadius: 5 },
  micStand: { width: 14, height: 6, borderWidth: 2, borderColor: '#FB923C', marginTop: -2 },
  actionTitle: { fontSize: 16, fontWeight: '900', color: '#1C1917' },
  actionSub: { fontSize: 12, color: '#44403C', fontWeight: '500', marginTop: 2 },
  arrowIcon: { fontSize: 20, fontWeight: 'bold', color: '#1C1917' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1C1917' },
  refreshText: { fontSize: 13, fontWeight: '700', color: '#0284C7' },
  emptyText: { textAlign: 'center', color: '#78716C', fontStyle: 'italic', marginTop: 10 },

  invoiceItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#E7E5E4', marginBottom: 10 },
  avatarFb: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center' },
  avatarTextFb: { color: '#16A34A', fontWeight: '900', fontSize: 13 },
  clientName: { fontSize: 15, fontWeight: '900', color: '#1C1917' },
  clientSub: { fontSize: 12, color: '#78716C', fontWeight: '500', marginTop: 2 },
  invoicePrice: { fontSize: 16, fontWeight: '900', color: '#1C1917' },
  statusPending: { fontSize: 11, fontWeight: '700', color: '#CA8A04', marginTop: 3 },
});