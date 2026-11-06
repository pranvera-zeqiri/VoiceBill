import { colors } from '@/constants/theme';
import { getInitials } from '@/utils/format';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  name: string;
  size?: number;
  variant?: 'light' | 'dark';
}

export function Avatar({ name, size = 40, variant = 'light' }: Props) {
  const dark = variant === 'dark';
  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: dark ? colors.dark : colors.neutralSoft,
        },
      ]}
    >
      <Text
        style={{
          fontSize: size * 0.34,
          fontWeight: '800',
          color: dark ? '#FFFFFF' : colors.text,
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