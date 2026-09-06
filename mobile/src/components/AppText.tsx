import React from "react";
import { Text, TextProps, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";

interface Props extends TextProps {
  variant?: "hero" | "title" | "subtitle" | "body" | "caption" | "label";
  color?: string;
  bold?: boolean;
}

export function AppText({ variant = "body", color, bold, style, children, ...rest }: Props) {
  const { palette } = useTheme();
  const base = styles.base;
  const vStyle = VVARIANTS[variant];
  return (
    <Text
      {...rest}
      style={[
        base,
        vStyle,
        { color: color ?? palette.text, fontWeight: bold ? "700" : undefined },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const VVARIANTS = StyleSheet.create({
  hero: { fontSize: 30, lineHeight: 36, fontWeight: "800", letterSpacing: -0.5 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: "700", letterSpacing: -0.3 },
  subtitle: { fontSize: 17, lineHeight: 24, fontWeight: "600" },
  body: { fontSize: 15, lineHeight: 22 },
  caption: { fontSize: 12, lineHeight: 17 },
  label: { fontSize: 13, lineHeight: 18, fontWeight: "600", letterSpacing: 0.2 },
});

const styles = StyleSheet.create({
  base: { fontFamily: undefined },
});