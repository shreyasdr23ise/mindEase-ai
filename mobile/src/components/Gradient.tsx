import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface Props {
  children?: React.ReactNode;
  style?: ViewStyle;
  colors?: [string, string, ...string[]];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

export function Gradient({ children, style, colors, start, end }: Props) {
  return (
    <LinearGradient
      colors={colors ?? ["#0FA3B3", "#4F46E5"]}
      start={start ?? { x: 0, y: 0 }}
      end={end ?? { x: 1, y: 1 }}
      style={[{ position: "absolute", inset: 0 }, style]}
    >
      {children}
    </LinearGradient>
  );
}

export function GradientShell({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={style}>{children}</View>;
}