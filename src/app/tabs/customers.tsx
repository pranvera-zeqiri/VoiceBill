import { Button } from '@/components/button';
import { CustomerRow } from '@/components/CostumerRow';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { useAppTheme } from '@/components/useAppTheme';
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function CustomersScreen() {
  const { customers, getCustomerStats, addCustomer } = useApp();
  const { colors } = useAppTheme();
  const [formVisible, setFormVisible] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setFormError('');
  };

  const saveCustomer = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName) {
      setFormError('Emri i klientit është i detyrueshëm.');
      return;
    }
    if (trimmedEmail && !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setFormError('Shkruaj një email të vlefshëm ose lëre bosh.');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      await addCustomer({
        name: trimmedName,
        phone: phone.trim(),
        email: trimmedEmail,
        address: address.trim(),
      });
      resetForm();
      setFormVisible(false);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Klienti nuk u ruajt. Kontrollo lidhjen me internetin dhe provo përsëri.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Klientët</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{customers.length} klientë gjithsej</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Shto klient"
            onPress={() => {
              resetForm();
              setFormVisible(true);
            }}
            style={({ pressed }) => [styles.addButton, { backgroundColor: '#F97316' }, pressed && styles.pressed]}
          >
            <Feather name="plus" size={18} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Shto klient</Text>
          </Pressable>
        </View>
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
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>Ende nuk ka klientë.</Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={formVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!saving) setFormVisible(false);
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Klient i ri</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Mbyll formularin"
                disabled={saving}
                onPress={() => setFormVisible(false)}
                hitSlop={12}
              >
                <Feather name="x" size={22} color={colors.textMuted} />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Input
                label="Emri i klientit *"
                icon="user"
                placeholder="Emri dhe mbiemri"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                editable={!saving}
              />
              <Input
                label="Telefoni"
                icon="phone"
                placeholder="+383 ..."
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                editable={!saving}
              />
              <Input
                label="Email"
                icon="mail"
                placeholder="emri@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!saving}
              />
              <Input
                label="Adresa"
                icon="map-pin"
                placeholder="Qyteti, rruga"
                value={address}
                onChangeText={setAddress}
                editable={!saving}
              />
              {formError ? <Text style={[styles.formError, { color: colors.danger }]}>{formError}</Text> : null}
              <View style={styles.modalActions}>
                <Button
                  label="Anulo"
                  variant="outline"
                  disabled={saving}
                  onPress={() => setFormVisible(false)}
                  style={styles.actionButton}
                />
                <Button
                  label="Ruaj klientin"
                  icon="check"
                  loading={saving}
                  onPress={saveCustomer}
                  style={styles.actionButton}
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 32 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 18,
  },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 4 },
  empty: { alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 14 },
  addButton: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  addButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  pressed: { opacity: 0.8 },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,27,34,0.55)',
  },
  modalCard: {
    maxHeight: '90%',
    padding: 20,
    paddingBottom: 28,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  formError: { fontSize: 13, marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionButton: { flex: 1 },
});
