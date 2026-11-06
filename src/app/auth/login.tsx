import { Button } from '@/components/button';
import { Input } from '@/components/Input';
import { Logo } from '@/components/Logo';
import { Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useApp();

  // Prefilled for easy testing — any valid email + 6+ char password works.
  const [email, setEmail] = useState('arben@voicebill.app');
  const [password, setPassword] = useState('demo1234');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const next: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Shkruaj një email të vlefshëm';
    if (password.length < 6) next.password = 'Fjalëkalimi duhet të ketë të paktën 6 karaktere';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    await login(email.trim(), password);
    setLoading(false);
    router.replace('/tabs');
  };

  return (
    <Screen dark edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Logo size={44} />

          <Text style={styles.title}>
            Mirë se u ktheve.{'\n'}
            <Text style={{ color: colors.primary }}>Hyr në llogari.</Text>
          </Text>
          <Text style={styles.subtitle}>
            Zejtari tregon çfarë ka kryer, VoiceBill e kthen në faturë.
          </Text>

          <View style={{ marginTop: 28 }}>
            <Input
              dark
              label="Email"
              icon="mail"
              placeholder="emri@email.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              error={errors.email}
            />
            <Input
              dark
              label="Fjalëkalimi"
              icon="lock"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={errors.password}
            />

            <Pressable
              onPress={() =>
                Alert.alert(
                  'Rivendos fjalëkalimin',
                  'Funksioni do të aktivizohet kur të lidhet Supabase.'
                )
              }
              style={{ alignSelf: 'flex-end', marginBottom: 20 }}
            >
              <Text style={styles.link}>Ke harruar fjalëkalimin?</Text>
            </Pressable>

            <Button label="Hyr" onPress={onSubmit} loading={loading} />
          </View>

          <View style={styles.bottom}>
            <Text style={styles.muted}>Nuk ke llogari? </Text>
            <Pressable onPress={() => router.push('./register')}>
              <Text style={styles.link}>Regjistrohu</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: 24, paddingTop: 32 },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    marginTop: 40,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  subtitle: { color: colors.textOnDarkMuted, fontSize: 15, lineHeight: 22, marginTop: 10 },
  link: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  muted: { color: colors.textOnDarkMuted, fontSize: 14 },
  bottom: { flexDirection: 'row', justifyContent: 'center', marginTop: 'auto', paddingTop: 28 },
});