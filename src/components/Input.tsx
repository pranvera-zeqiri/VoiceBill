import { radius } from '@/constants/theme';
import { useAppTheme } from '@/components/useAppTheme';
import { FeatherName } from '@/types';
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

interface Props extends TextInputProps {
  label?: string;
  icon?: FeatherName;
  error?: string;
  dark?: boolean;
}

export function Input({ label, icon, error, dark, secureTextEntry, style, ...rest }: Props) {
  const [hidden, setHidden] = useState(!!secureTextEntry);
  const [focused, setFocused] = useState(false);
  const { colors, darkMode } = useAppTheme();

  const useDarkField = dark || darkMode;
  const fg = useDarkField ? colors.textOnDark : colors.text;
  const muted = useDarkField ? colors.textOnDarkMuted : colors.textMuted;

  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Text style={[styles.label, { color: muted }]}>{label}</Text> : null}
      <View
        style={[
          styles.field,
          {
            backgroundColor: useDarkField ? colors.darkSurface : colors.surface,
            borderColor: error
              ? colors.danger
              : focused
              ? colors.primary
              : useDarkField
              ? colors.darkBorder
              : colors.border,
          },
        ]}
      >
        {icon ? <Feather name={icon} size={18} color={muted} style={{ marginRight: 10 }} /> : null}
        <TextInput
          {...rest}
          secureTextEntry={hidden}
          placeholderTextColor={muted}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={[styles.input, { color: fg }, style]}
        />
        {secureTextEntry ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10}>
            <Feather name={hidden ? 'eye' : 'eye-off'} size={18} color={muted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  field: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: { flex: 1, fontSize: 15, height: '100%' },
  error: { fontSize: 12, marginTop: 4 },
});