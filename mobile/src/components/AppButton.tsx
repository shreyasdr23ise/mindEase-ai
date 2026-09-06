import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { AppText } from "./AppText";

interface Props {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "soft";
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

export function AppButton({
  label,
  onPress,
  variant = "primary",
  disabled,
  loading,
  icon,
  fullWidth = true,
  style,
  labelStyle,
}: Props) {
  const { palette } = useTheme();
  const v = VARIANT_STYLES[palette.mode][variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.full,
        { backgroundColor: v.bg, borderColor: v.border, borderWidth: v.border ? 1 : 0 },
        pressed && !disabled && !loading && { opacity: 0.82, transform: [{ scale: 0.99 }] },
        (disabled || loading) && { opacity: 0.55 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} size="small" />
      ) : (
        <View style={styles.row}>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <AppText
            bold
            variant="subtitle"
            style={[{ color: v.fg, fontSize: 15 }, labelStyle]}
          >
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  full: { width: "100%" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  icon: { marginRight: 2 },
});

type VStyle = { bg: string; fg: string; border?: string };

interface VariantSet {
  primary: VStyle;
  secondary: VStyle;
  ghost: VStyle;
  danger: VStyle;
  soft: VStyle;
}

const VARIANT_STYLES: Record<"light" | "dark", VariantSet> = {
  light: {
    primary: { bg: "#0FA3B3", fg: "#FFFFFF" },
    secondary: { bg: "#EAF4F7", fg: "#0B6E7A" },
    ghost: { bg: "transparent", fg: "#0FA3B3", border: "#9FD3DB" },
    danger: { bg: "#E11D48", fg: "#FFFFFF" },
    soft: { bg: "#EDF0FF", fg: "#4F46E5" },
  },
  dark: {
    primary: { bg: "#2EC4D6", fg: "#062226" },
    secondary: { bg: "#123A42", fg: "#8AE2EA" },
    ghost: { bg: "transparent", fg: "#2EC4D6", border: "#2A5560" },
    danger: { bg: "#FB7185", fg: "#26000A" },
    soft: { bg: "#242A44", fg: "#A5B4FC" },
  },
};