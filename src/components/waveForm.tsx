import { colors } from '@/constants/theme';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

interface Props {
  active: boolean;
  bars?: number;
  height?: number;
}

const envelope = (i: number, n: number) => 0.12 + 0.88 * Math.pow(Math.sin((i / (n - 1)) * Math.PI), 0.9);

export function Waveform({ active, bars = 38, height = 90 }: Props) {
  const [levels, setLevels] = useState<number[]>(() =>
    Array.from({ length: bars }, (_, i) => envelope(i, bars) * 0.6)
  );

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setLevels(Array.from({ length: bars }, (_, i) => envelope(i, bars) * (0.25 + Math.random() * 0.75)));
    }, 130);
    return () => clearInterval(id);
  }, [active, bars]);

  return (
    <View style={[styles.row, { height }]}>
      {levels.map((l, i) => (
        <View
          key={i}
          style={{
            width: 3,
            height: Math.max(4, l * height),
            borderRadius: 2,
            backgroundColor: colors.primary,
            opacity: active ? 1 : 0.5,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});