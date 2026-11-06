import { CustomerRow } from '@/components/CostumerRow';
import { Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function CustomersScreen() {
  const { customers, getCustomerStats } = useApp();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Klientët</Text>
        <Text style={styles.subtitle}>{customers.length} klientë gjithsej</Text>
        {customers.length > 0 ? (
          customers.map((customer) => {
            const stats = getCustomerStats(customer.id);
            return (
              <CustomerRow
                key={customer.id}
                customer={customer}
                count={stats.count}
                total={stats.total}
                overdue={stats.overdue}
                onPress={() =>
                  Alert.alert(
                    customer.name,
                    [customer.phone, customer.email, customer.address].filter(Boolean).join('\n') ||
                      'Nuk ka të dhëna kontakti.'
                  )
                }
              />
            );
          })
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Ende nuk ka klientë.</Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 32 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4, marginBottom: 18 },
  empty: { alignItems: 'center', padding: 24 },
  emptyText: { color: colors.textMuted, fontSize: 14 },
});
