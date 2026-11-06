import { colors, radius } from '@/constants/theme';
import { Pressable, StyleSheet, Text } from 'react-native';

interface Props {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export function Chip({ label, active, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active
          ? { backgroundColor: colors.dark, borderColor: colors.dark }
          : { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.text, { color: active ? '#FFFFFF' : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  text: { fontSize: 13, fontWeight: '700' },
});