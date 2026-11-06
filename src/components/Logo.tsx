import { colors } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  size?: number;
  dark?: boolean; // true = white text (for dark backgrounds)
}

export function Logo({ size = 44, dark = true }: Props) {
  return (
    <View style={styles.row}>
      <View
        style={[
          styles.badge,
          { width: size, height: size, borderRadius: size * 0.28 },
        ]}
      >
        <Feather name="mic" size={size * 0.46} color="#FFFFFF" />
      </View>
      <Text
        style={[
          styles.text,
          { fontSize: size * 0.58, color: dark ? colors.textOnDark : colors.text },
        ]}
      >
        VoiceBill
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  text: { fontWeight: '800', letterSpacing: -0.5 },
});