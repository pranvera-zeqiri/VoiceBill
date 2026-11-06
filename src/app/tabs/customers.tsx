import { Button } from '@/components/button';
import { CustomerRow } from '@/components/CostumerRow';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
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
            <Text style={styles.title}>Klientët</Text>
            <Text style={styles.subtitle}>{customers.length} klientë gjithsej</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Shto klient"
            onPress={() => {
              resetForm();
              setFormVisible(true);
            }}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
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
            <Text style={styles.emptyText}>Ende nuk ka klientë.</Text>
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
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Klient i ri</Text>
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
              {formError ? <Text style={styles.formError}>{formError}</Text> : null}
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
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  empty: { alignItems: 'center', padding: 24 },
  emptyText: { color: colors.textMuted, fontSize: 14 },
  addButton: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
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
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  formError: { color: colors.danger, fontSize: 13, marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionButton: { flex: 1 },
});
