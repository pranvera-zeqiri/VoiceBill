import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ClientsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Të dhëna shembull për klientët (të ngjashme me dizajnin tënd)
  const clientsList = [
    { id: '1', name: 'Familja Berisha', stats: '4 Fatura · €1,860 Gjithsej', badge: '3 ditë · Pagon brenda', statusColor: '#16A34A' },
    { id: '2', name: 'Dardan Kryeziu', stats: '2 Fatura · €760 Gjithsej', badge: '1 e vonuar', statusColor: '#DC2626' },
    { id: '3', name: 'Lulzim Gashi', stats: '3 Fatura · €1,240 Gjithsej', badge: '1 e vonuar', statusColor: '#DC2626' },
    { id: '4', name: 'Besa Krasniqi', stats: '1 Faturë · €940 Gjithsej', badge: 'Pagon rregullisht', statusColor: '#16A34A' },
  ];

  const filteredClients = clientsList.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* Header & Butoni Plus */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Klientët</Text>
        <TouchableOpacity style={styles.addBtn} activeOpacity={0.9}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Shiriti i Kërkimit */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Kërko klient..."
          placeholderTextColor="#A8A29E"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Lista e Klientëve */}
      {filteredClients.map((item) => (
        <TouchableOpacity key={item.id} style={styles.clientCard} activeOpacity={0.9}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>
              {item.name.substring(0, 2).toUpperCase()}
            </Text>
          </View>
          
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{item.name}</Text>
            <Text style={styles.clientStats}>{item.stats}</Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.badgeText, { color: item.statusColor }]}>{item.badge}</Text>
            <Text style={styles.arrowSymbol}>›</Text>
          </View>
        </TouchableOpacity>
      ))}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#FAF5EE', paddingHorizontal: 22, paddingTop: 60, paddingBottom: 40 },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#1C1917' },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FB923C', justifyContent: 'center', alignItems: 'center' },
  addBtnText: { fontSize: 22, fontWeight: 'bold', color: '#1C1917' },

  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 16, height: 50, borderWidth: 1, borderColor: '#E7E5E4', marginBottom: 20 },
  searchIcon: { marginRight: 10, fontSize: 16 },
  searchInput: { flex: 1, fontSize: 15, color: '#1C1917', fontWeight: '500' },

  clientCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#E7E5E4', marginBottom: 12 },
  avatarBox: { width: 46, height: 46, borderRadius: 16, backgroundColor: '#1C1917', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
  
  clientInfo: { flex: 1, marginLeft: 14 },
  clientName: { fontSize: 16, fontWeight: '900', color: '#1C1917' },
  clientStats: { fontSize: 12, color: '#78716C', fontWeight: '500', marginTop: 3 },

  badgeText: { fontSize: 11, fontWeight: '700' },
  arrowSymbol: { fontSize: 20, color: '#A8A29E', fontWeight: 'bold', marginTop: 2 },
});