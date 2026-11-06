import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { Chip } from '@/components/Chip';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { colors, radius, shadow } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

const VAT_OPTIONS = [0, 8, 18];

export default function SettingsScreen() {
  const router = useRouter();
  const { user, updateUser, settings, updateSettings, logout } = useApp();

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [businessName, setBusinessName] = useState(user?.businessName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [taxId, setTaxId] = useState(user?.taxId ?? '');

  const save = () => {
    if (fullName.trim().length < 2 || businessName.trim().length < 2) {
      return Alert.alert('Të dhëna të pakompletuara', 'Emri dhe emri i biznesit janë të detyrueshëm.');
    }
    updateUser({
      fullName: fullName.trim(),
      businessName: businessName.trim(),
      phone: phone.trim(),
      taxId: taxId.trim(),
    });
    Alert.alert('U ruajt', 'Ndryshimet u ruajtën me sukses.');
  };

  const onLogout = () =>
    Alert.alert('Dil nga llogaria', 'Je i sigurt që dëshiron të dalësh?', [
      { text: 'Anulo', style: 'cancel' },
      {
        text: 'Dil',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/login');
        },
      },
    ]);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Profili</Text>

        <View style={styles.profile}>
          <Avatar name={user?.fullName ?? 'VB'} size={56} variant="dark" />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.fullName}</Text>
            <Text style={styles.sub}>{user?.businessName}</Text>
            <Text style={styles.sub}>{user?.email}</Text>
          </View>
        </View>

        <Text style={styles.section}>Të dhënat e biznesit</Text>
        <View style={styles.card}>
          <Input label="Emri i plotë" value={fullName} onChangeText={setFullName} />
          <Input label="Emri i biznesit" value={businessName} onChangeText={setBusinessName} />
          <Input label="Telefoni" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
          <Input label="Numri fiskal" keyboardType="number-pad" value={taxId} onChangeText={setTaxId} />
          <Button label="Ruaj ndryshimet" onPress={save} />
        </View>

        <Text style={styles.section}>Faturimi</Text>
        <View style={styles.card}>
          <SwitchRow
            title="Shto TVA automatikisht"
            sub="Zbatohet në faturat e reja"
            value={settings.autoVat}
            onChange={(v) => updateSettings({ autoVat: v })}
          />
          <Text style={styles.fieldLabel}>Norma e TVA-së</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {VAT_OPTIONS.map((v) => (
              <Chip
                key={v}
                label={`${v}%`}
                active={settings.vatRate === v}
                onPress={() => updateSettings({ vatRate: v })}
              />
            ))}
          </View>
        </View>

        <Text style={styles.section}>Preferencat</Text>
        <View style={styles.card}>
          <SwitchRow
            title="Njoftimet"
            sub="Merr njoftime për pagesat"
            value={settings.notifications}
            onChange={(v) => updateSettings({ notifications: v })}
          />
          <View style={styles.divider} />
          <SwitchRow
            title="Kujtesa automatike"
            sub="AI përgatit kujtesë për faturat e vonuara"
            value={settings.autoReminders}
            onChange={(v) => updateSettings({ autoReminders: v })}
          />
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.rowTitle}>Gjuha</Text>
            <Text style={styles.infoValue}>Shqip</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.rowTitle}>Valuta</Text>
            <Text style={styles.infoValue}>Euro (€)</Text>
          </View>
        </View>

        <Button label="Dil nga llogaria" icon="log-out" variant="danger" onPress={onLogout} style={{ marginTop: 24 }} />
        <Text style={styles.version}>VoiceBill v1.0.0 · MVP</Text>
      </ScrollView>
    </Screen>
  );
}

function SwitchRow({
  title,
  sub,
  value,
  onChange,
}: {
  title: string;
  sub: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.primary, false: colors.neutralSoft }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  name: { fontSize: 17, fontWeight: '800', color: colors.text },
  sub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  section: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 24, marginBottom: 10 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginTop: 14, marginBottom: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  rowSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoValue: { fontSize: 14, color: colors.textMuted },
  version: { textAlign: 'center', color: colors.textMuted, fontSize: 12, marginTop: 16 },
});