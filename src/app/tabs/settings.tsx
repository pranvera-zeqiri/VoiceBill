import { Screen } from '@/components/Screen';
import { colors, radius } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { Feather } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

export default function SettingsScreen() {
  const { user, settings, updateSettings } = useApp();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Profili dhe cilësimet</Text>

        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Feather name="user" size={22} color={colors.primary} />
          </View>
          <View style={styles.profileDetails}>
            <Text style={styles.name}>{user?.fullName ?? 'Përdorues i VoiceBill'}</Text>
            <Text style={styles.muted}>{user?.businessName ?? 'Biznesi im'}</Text>
            {user?.email ? <Text style={styles.muted}>{user.email}</Text> : null}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Preferencat</Text>
        <SettingRow
          title="Njoftimet"
          description="Merr njoftime për faturat dhe aktivitetin."
          value={settings.notifications}
          onValueChange={(notifications) => updateSettings({ notifications })}
        />
        <SettingRow
          title="Kujtesat automatike"
          description="Aktivizo kujtesat për faturat e papaguara."
          value={settings.autoReminders}
          onValueChange={(autoReminders) => updateSettings({ autoReminders })}
        />
        <SettingRow
          title="TVSH automatike"
          description={`Norma aktuale: ${settings.vatRate}%`}
          value={settings.autoVat}
          onValueChange={(autoVat) => updateSettings({ autoVat })}
        />
      </ScrollView>
    </Screen>
  );
}

interface SettingRowProps {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

function SettingRow({ title, description, value, onValueChange }: SettingRowProps) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingText}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.muted}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primarySoft }}
        thumbColor={value ? colors.primary : colors.surface}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 32 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', marginBottom: 18 },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileDetails: { flex: 1 },
  name: { color: colors.text, fontSize: 15, fontWeight: '700' },
  muted: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 24, marginBottom: 10 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    marginBottom: 8,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingText: { flex: 1 },
  settingTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
});
