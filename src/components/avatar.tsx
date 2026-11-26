import { useAppTheme } from '@/components/useAppTheme';
import { getInitials } from '@/utils/format';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  name: string;
  size?: number;
  variant?: 'light' | 'dark';
}

export function Avatar({ name, size = 40, variant = 'light' }: Props) {
  const { colors, darkMode } = useAppTheme();
  const dark = variant === 'dark';
  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: dark
            ? darkMode ? '#26334B' : colors.dark
            : darkMode ? '#22304A' : colors.neutralSoft,
        },
      ]}
    >
      <Text
        style={{
          fontSize: size * 0.34,
          fontWeight: '800',
          color: dark ? colors.textOnDark : colors.text,
        }}
      >
        {getInitials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
});