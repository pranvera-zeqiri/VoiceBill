import { AppGradientBackground } from '@/components/AppGradientBackground';
import { useAppTheme } from '@/components/useAppTheme';
import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  children: React.ReactNode;
  dark?: boolean;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
}

export function Screen({ children, edges = ['top'], style }: Props) {
  const { darkMode, colors } = useAppTheme();
  return (
    <View style={[{ flex: 1, backgroundColor: darkMode ? colors.dark : colors.background }, style]}>
      <AppGradientBackground />
      <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: 'transparent' }}>
        {children}
      </SafeAreaView>
    </View>
  );
}