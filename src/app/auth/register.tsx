import { Button } from '@/components/button';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
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

interface Errors {
  fullName?: string;
  businessName?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

export default function RegisterScreen() {
  const router = useRouter();
  const { register, resendSignupConfirmation } = useApp();

  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const next: Errors = {};
    if (fullName.trim().length < 2) next.fullName = 'Shkruaj emrin e plotë';
    if (businessName.trim().length < 2) next.businessName = 'Shkruaj emrin e biznesit';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Shkruaj një email të vlefshëm';
    if (password.length < 6) next.password = 'Të paktën 6 karaktere';
    if (confirm !== password) next.confirm = 'Fjalëkalimet nuk përputhen';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    try {
      const sessionCreated = await register(
        { fullName: fullName.trim(), businessName: businessName.trim(), email: email.trim() },
        password
      );
      if (!sessionCreated) {
        Alert.alert(
          'Kontrollo Gmail-in',
          `Dërguam një lidhje konfirmimi te ${email.trim()}. Hap lidhjen nga telefoni për ta aktivizuar llogarinë dhe për t’u kthyer automatikisht në VoiceBill. Kontrollo edhe dosjen Spam.`,
          [
            {
              text: 'Ridërgo emailin',
              onPress: () => {
                void resendSignupConfirmation(email).then(
                  () => Alert.alert('Emaili u ridërgua', 'Kontrollo Inbox dhe Spam në Gmail.'),
                  (error: unknown) =>
                    Alert.alert(
                      'Emaili nuk u ridërgua',
                      error instanceof Error ? error.message : 'Provo përsëri më vonë.'
                    )
                );
              },
            },
            {
              text: 'Në rregull',
              style: 'cancel',
            },
          ]
        );
        return;
      }
      router.replace('/tabs');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kontrollo lidhjen dhe të dhënat e regjistrimit.';
      if (/user already registered|already registered/i.test(message)) {
        Alert.alert(
          'Llogaria ekziston',
          'Kjo adresë emaili është regjistruar më parë. Kyçu me fjalëkalimin e asaj llogarie. Nëse llogaria u krijua para çaktivizimit të konfirmimit, ajo duhet aktivizuar veçmas në Supabase.',
          [
            { text: 'Mbyll', style: 'cancel' },
            {
              text: 'Shko te hyrja',
              onPress: () =>
                router.replace({ pathname: '/auth/login', params: { email: email.trim() } }),
            },
          ]
        );
      } else {
        Alert.alert('Regjistrimi dështoi', message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen dark edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <Header title="Krijo llogari" dark />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.subtitle}>
            Fillo të krijosh fatura profesionale me zërin tënd.
          </Text>

          <View style={{ marginTop: 20 }}>
            <Input dark label="Emri i plotë" icon="user" placeholder="Arben Hoxha"
              value={fullName} onChangeText={setFullName} error={errors.fullName} />
            <Input dark label="Emri i biznesit" icon="briefcase" placeholder="Hoxha Servis"
              value={businessName} onChangeText={setBusinessName} error={errors.businessName} />
            <Input dark label="Email" icon="mail" placeholder="emri@email.com"
              value={email} onChangeText={setEmail} autoCapitalize="none"
              keyboardType="email-address" autoCorrect={false} error={errors.email} />
            <Input dark label="Fjalëkalimi" icon="lock" placeholder="Të paktën 6 karaktere"
              value={password} onChangeText={setPassword} secureTextEntry error={errors.password} />
            <Input dark label="Konfirmo fjalëkalimin" icon="lock" placeholder="••••••••"
              value={confirm} onChangeText={setConfirm} secureTextEntry error={errors.confirm} />

            <Button label="Regjistrohu" onPress={onSubmit} loading={loading} style={{ marginTop: 8 }} />
          </View>

          <View style={styles.bottom}>
            <Text style={styles.muted}>Ke tashmë llogari? </Text>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.link}>Hyr</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, paddingTop: 8 },
  subtitle: { color: colors.textOnDarkMuted, fontSize: 15, lineHeight: 22 },
  link: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  muted: { color: colors.textOnDarkMuted, fontSize: 14 },
  bottom: { flexDirection: 'row', justifyContent: 'center', paddingTop: 24 },
});