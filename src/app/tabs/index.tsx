import { InvoiceRow } from '@/components/InvoiceRow';
import { MiniBarChart } from '@/components/MiniBarChart';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { StatCard } from '@/components/StatCard';
import { colors, radius, shadow } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import {
    calcTotals,
    currentMonthName,
    daysAgoISO,
    formatMoneyCompact,
    toISO,
    todayLabel,
} from '@/utils/format';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, invoices, getCustomer } = useApp();
  const firstName = user?.fullName.split(' ')[0] ?? '';

  const stats = useMemo(() => {
    const withTotal = invoices.map((i) => ({ ...i, total: calcTotals(i.items, i.vatRate).total }));
    const sum = (list: typeof withTotal) => list.reduce((s, i) => s + i.total, 0);

    const paid = withTotal.filter((i) => i.status === 'paid');
    const open = withTotal.filter((i) => i.status === 'pending' || i.status === 'overdue');

    const now = new Date();
    const curMonth = toISO(now).slice(0, 7);
    const prevMonth = toISO(new Date(now.getFullYear(), now.getMonth() - 1, 1)).slice(0, 7);
    const revenue = sum(paid.filter((i) => i.date.startsWith(curMonth)));
    const prevRevenue = sum(paid.filter((i) => i.date.startsWith(prevMonth)));
    const growth = prevRevenue > 0 ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100) : null;

    // Last 7 days of issued (non-draft) invoices for the mini chart
    const chart = Array.from({ length: 7 }, (_, idx) => {
      const day = daysAgoISO(6 - idx);
      return sum(withTotal.filter((i) => i.status !== 'draft' && i.date === day));
    });

    return {
      revenue,
      growth,
      chart,
      openTotal: sum(open),
      openCount: open.length,
      paidTotal: sum(paid),
      paidCount: paid.length,
    };
  }, [invoices]);

  const recent = useMemo(
    () => [...invoices].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : Number(b.number) - Number(a.number))).slice(0, 3),
    [invoices]
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Top row */}
        <View style={styles.topRow}>
          <View>
            <Text style={styles.date}>{todayLabel()}</Text>
            <Text style={styles.greeting}>Mirëdita, {firstName}</Text>
          </View>
          <Pressable
            style={styles.bell}
            onPress={() =>
              Alert.alert(
                'Njoftimet',
                stats.openCount > 0
                  ? `Ke ${stats.openCount} fatura në pritje të pagesës.`
                  : 'Nuk ke njoftime të reja.'
              )
            }
          >
            <Feather name="bell" size={20} color={colors.primary} />
          </Pressable>
        </View>

        {/* Revenue card */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueTop}>
            <Text style={styles.revenueLabel}>Të ardhura · {currentMonthName()}</Text>
            {stats.growth !== null ? (
              <View style={styles.growth}>
                <Text style={styles.growthText}>
                  {stats.growth >= 0 ? '+' : ''}
                  {stats.growth}% nga muaji i kaluar
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.revenueValue}>{formatMoneyCompact(stats.revenue)}</Text>
          <MiniBarChart values={stats.chart} />
          <Text style={styles.revenueCaption}>7 ditët e fundit</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard
            label="Në pritje"
            dotColor={colors.primary}
            value={formatMoneyCompact(stats.openTotal)}
            sub={`${stats.openCount} fatura`}
          />
          <StatCard
            label="Të paguara"
            dotColor={colors.success}
            value={formatMoneyCompact(stats.paidTotal)}
            sub={`${stats.paidCount} fatura`}
          />
        </View>

        {/* Voice CTA */}
        <Pressable
          onPress={() => router.push('./voice')}
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}
        >
          <View style={styles.ctaIcon}>
            <Feather name="mic" size={22} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaTitle}>Fol dhe krijo faturë</Text>
            <Text style={styles.ctaSub}>Shtyp dhe tregoji çfarë punove</Text>
          </View>
          <Feather name="arrow-right" size={20} color="#FFFFFF" />
        </Pressable>

        {/* Recent invoices */}
        <SectionHeader
          title="Faturat e fundit"
          actionLabel="Të gjitha"
          onAction={() => router.push('./invoice')}
        />
        {recent.map((inv) => (
          <InvoiceRow
            key={inv.id}
            invoice={inv}
            customerName={getCustomer(inv.customerId)?.name ?? 'Klient'}
            subtitleMode="day"
            onPress={() => router.push(`../invoice/${inv.id}`)}
          />
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 32 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 12, color: colors.textMuted },
  greeting: { fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 2, letterSpacing: -0.4 },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revenueCard: {
    backgroundColor: colors.dark,
    borderRadius: radius.lg,
    padding: 18,
    marginTop: 18,
  },
  revenueTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  revenueLabel: { color: colors.textOnDarkMuted, fontSize: 12, flexShrink: 1 },
  growth: { backgroundColor: 'rgba(23,160,106,0.18)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  growthText: { color: '#3DDC97', fontSize: 11, fontWeight: '700' },
  revenueValue: { color: '#FFFFFF', fontSize: 36, fontWeight: '800', marginVertical: 8, letterSpacing: -1 },
  revenueCaption: { color: colors.textOnDarkMuted, fontSize: 11, marginTop: 10 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: 14,
    marginTop: 14,
    ...shadow,
  },
  ctaIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  ctaSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
});