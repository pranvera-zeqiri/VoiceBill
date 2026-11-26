import { Button } from '@/components/button';
import { Screen } from '@/components/Screen';
import { useAppTheme } from '@/components/useAppTheme';
import { supabase } from '@/lib/supabase';
import type { EmailOtpType } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

const EMAIL_OTP_TYPES: EmailOtpType[] = [
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
];

function getUrlParameter(url: URL, name: string) {
  const query = new URLSearchParams(url.search);
  const fragment = new URLSearchParams(url.hash.replace(/^#/, ''));
  return query.get(name) ?? fragment.get(name);
}

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const handledUrls = useRef(new Set<string>());
  const [failure, setFailure] = useState('');

  useEffect(() => {
    let active = true;

    const completeAuthentication = async (url: string) => {
      if (handledUrls.current.has(url)) return;
      handledUrls.current.add(url);

      try {
        const parsedUrl = new URL(url);
        const providerError =
          getUrlParameter(parsedUrl, 'error_description') ??
          getUrlParameter(parsedUrl, 'error');
        if (providerError) throw new Error(providerError);

        const code = getUrlParameter(parsedUrl, 'code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          const tokenHash = getUrlParameter(parsedUrl, 'token_hash');
          const otpTypeValue = getUrlParameter(parsedUrl, 'type');
          const otpType = EMAIL_OTP_TYPES.find((candidate) => candidate === otpTypeValue);

          if (tokenHash && otpType) {
            const { error } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: otpType,
            });
            if (error) throw error;
          } else {
            const accessToken = getUrlParameter(parsedUrl, 'access_token');
            const refreshToken = getUrlParameter(parsedUrl, 'refresh_token');
            if (!accessToken || !refreshToken) {
              throw new Error('Lidhja e konfirmimit është e pavlefshme ose ka skaduar.');
            }

            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) throw error;
          }
        }

        if (active) router.replace('/tabs');
      } catch (error) {
        console.error('Nuk u përfundua konfirmimi i emailit:', error);
        if (active) {
          setFailure(
            error instanceof Error
              ? error.message
              : 'Konfirmimi dështoi. Ridërgo emailin dhe provo përsëri.'
          );
        }
      }
    };

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void completeAuthentication(url);
    });

    void Linking.getInitialURL()
      .then((url) => {
        if (url) void completeAuthentication(url);
      })
      .catch((error: unknown) => {
        console.error('Nuk u lexua lidhja e konfirmimit:', error);
        if (active) setFailure('Nuk u lexua lidhja. Hape sërish emailin e konfirmimit.');
      });

    return () => {
      active = false;
      subscription.remove();
    };
  }, [router]);

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.content}>
        {failure ? (
          <>
            <Text style={[styles.title, { color: colors.text }]}>Konfirmimi dështoi</Text>
            <Text style={[styles.message, { color: colors.textMuted }]}>{failure}</Text>
            <Button
              label="Kthehu te hyrja"
              onPress={() => router.replace('/auth/login')}
              style={styles.button}
            />
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.title, { color: colors.text }]}>Po konfirmohet emaili...</Text>
            <Text style={[styles.message, { color: colors.textMuted }]}>Do të kalosh automatikisht te VoiceBill.</Text>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 28,
  },
  title: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  message: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
  button: { width: '100%', marginTop: 8 },
});
