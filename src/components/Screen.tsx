import { colors } from '@/constants/theme';
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  children: React.ReactNode;
  dark?: boolean;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
}

export function Screen({ children, dark, edges = ['top'], style }: Props) {
  return (
    <SafeAreaView
      edges={edges}
      style={[{ flex: 1, backgroundColor: dark ? colors.dark : colors.background }, style]}
    >
      {children}
    </SafeAreaView>
  );
}