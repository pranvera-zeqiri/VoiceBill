import { useAppTheme } from '@/components/useAppTheme';
import { InvoiceStatus } from '@/types';
import { statusLabel } from '@/utils/format';
import { StyleSheet, Text, View } from 'react-native';

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  const { colors } = useAppTheme();
  const statusStyles: Record<InvoiceStatus, { bg: string; fg: string }> = {
    pending: { bg: colors.primarySoft, fg: colors.primaryDark },
    paid: { bg: colors.successSoft, fg: colors.success },
    overdue: { bg: colors.dangerSoft, fg: colors.danger },
    draft: { bg: colors.neutralSoft, fg: colors.textMuted },
  };
  const s = statusStyles[status];
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      <Text style={[styles.text, { color: s.fg }]}>{statusLabel[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  text: { fontSize: 11, fontWeight: '700' },
});