import React from "react";
import { Pressable, StyleSheet, View, ViewStyle, StyleProp } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { AppText } from "./AppText";

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  accent?: boolean;
}

export function AppCard({ children, onPress, onLongPress, style, padded = true, accent }: Props) {
  const { palette } = useTheme();
  const content = (
    <View
      style={[
        styles.card,
        { backgroundColor: palette.card, borderColor: accent ? palette.brand : palette.borderSoft },
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );
  if (!onPress && !onLongPress) return content;
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }, styles.pressable]}
    >
      {content}
    </Pressable>
  );
}

export function Row({ children, gap = 12, style }: { children: React.ReactNode; gap?: number; style?: ViewStyle }) {
  return <View style={[styles.row, { gap }, style]}>{children}</View>;
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  const { palette } = useTheme();
  return (
    <AppText variant="label" style={{ color: palette.textFaint, textTransform: "uppercase", letterSpacing: 1 }}>
      {children}
    </AppText>
  );
}

export function Tag({ text, color, bg }: { text: string; color?: string; bg?: string }) {
  const { palette } = useTheme();
  return (
    <View
      style={[
        styles.tag,
        { backgroundColor: bg ?? palette.brandSoft },
      ]}
    >
      <AppText variant="caption" bold style={{ color: color ?? palette.brandDark }}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pressable: { borderRadius: 20 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  padded: { padding: 18 },
  row: { flexDirection: "row", alignItems: "center" },
  tag: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
});