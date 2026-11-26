import { radius, shadow } from '@/constants/theme';
import { useAppTheme } from '@/components/useAppTheme';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  label: string;
  value: string;
  sub: string;
  dotColor: string;
}

export function StatCard({ label, value, sub, dotColor }: Props) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.labelRow}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      </View>
      <Text style={[styles.value, { color: colors.text, fontVariant: ['tabular-nums'] }]}>{value}</Text>
      <Text style={[styles.sub, { color: colors.textMuted }]}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radius.lg - 4,
    padding: 14,
    borderWidth: 1,
    ...shadow,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  label: { fontSize: 12 },
  value: { fontSize: 22, fontWeight: '800', marginTop: 6 },
  sub: { fontSize: 12, marginTop: 2 },
});