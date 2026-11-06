import { colors } from '@/constants/theme';
import { StyleSheet, View } from 'react-native';

interface Props {
  values: number[];
  height?: number;
}

/** Last bar is highlighted in orange (today). */
export function MiniBarChart({ values, height = 56 }: Props) {
  const max = Math.max(...values, 1);
  return (
    <View style={[styles.row, { height }]}>
      {values.map((v, i) => {
        const isLast = i === values.length - 1;
        return (
          <View
            key={i}
            style={[
              styles.bar,
              {
                height: Math.max(10, (v / max) * height),
                backgroundColor: isLast ? colors.primary : '#2B4350',
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bar: { flex: 1, borderRadius: 5 },
});