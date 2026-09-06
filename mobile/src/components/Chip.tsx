import React from "react";
import { Pressable, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { AppText } from "./AppText";

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export function Chip({ label, selected, onPress, style, icon }: Props) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? palette.brand : palette.bgElevated,
          borderColor: selected ? palette.brand : palette.border,
        },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {icon ? icon : null}
      <AppText
        variant="label"
        bold={selected}
        style={{ color: selected ? "#ffffff" : palette.textMuted }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
});