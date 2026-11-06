import { colors, radius, shadow } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  label: string;
  value: string;
  sub: string;
  dotColor: string;
}

export function StatCard({ label, value, sub, dotColor }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.labelRow}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.sub}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg - 4,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  label: { fontSize: 12, color: colors.textMuted },
  value: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 6 },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});