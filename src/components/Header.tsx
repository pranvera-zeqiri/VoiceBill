import { colors, radius } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  title: string;
  right?: React.ReactNode;
  dark?: boolean;
  onBack?: () => void;
}

export function Header({ title, right, dark, onBack }: Props) {
  const router = useRouter();
  const goBack = () => {
    if (onBack) return onBack();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('../');
    }
  };

  return (
    <View style={styles.row}>
      <Pressable
        pressRetentionOffset={20}
        onPress={goBack}
        style={[
          styles.back,
          {
            backgroundColor: dark ? colors.darkSurface : colors.surface,
            borderColor: dark ? colors.darkBorder : colors.border,
          },
        ]}
      >
        <Feather name="chevron-left" size={22} color={dark ? '#FFFFFF' : colors.text} />
      </Pressable>
      <Text
        style={[styles.title, { color: dark ? '#FFFFFF' : colors.text }]}
        numberOfLines={1}
      >
        {title}
      </Text>
      <View style={{ flex: 1 }} />
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: radius.sm + 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '700' },
});