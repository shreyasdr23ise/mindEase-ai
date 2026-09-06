import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { AppText } from "./AppText";
import { MOOD_ORDER, MOOD_LABELS, MOOD_RANK, MOOD_EMOJI } from "../types";

const MOOD_COLORS: Record<string, string> = {
  very_good: "#0F9D6B",
  good: "#0FA3B3",
  neutral: "#8FA3B8",
  low: "#EF7F1A",
  very_low: "#E11D48",
};

interface Props {
  value: string | null;
  onSelect: (mood: string) => void;
}

/** Interactive mood selector. Selecting a mood animates the centre orb. */
export function MoodWheel({ value, onSelect }: Props) {
  const { palette } = useTheme();
  const glow = useRef(new Animated.Value(0)).current;

  const selectedColor = value ? MOOD_COLORS[value] : palette.brand;

  useEffect(() => {
    Animated.spring(glow, {
      toValue: value ? 1 : 0,
      useNativeDriver: false,
      damping: 14,
      stiffness: 160,
    }).start();
  }, [value, glow]);

  const size = 150;
  const scale = glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const bg = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [palette.bgElevated, selectedColor],
  });

  return (
    <View style={styles.wrap}>
      <View style={styles.optionsRow}>
        {MOOD_ORDER.map((m) => {
          const selected = value === m;
          return (
            <Pressable
              key={m}
              accessibilityRole="button"
              accessibilityLabel={MOOD_LABELS[m]}
              onPress={() => onSelect(m)}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: selected ? MOOD_COLORS[m] : palette.bgElevated,
                  borderColor: selected ? MOOD_COLORS[m] : palette.border,
                },
                selected && { transform: [{ scale: 1.06 }] },
                pressed && { opacity: 0.8 },
              ]}
            >
              <AppText style={{ fontSize: 22 }}>{MOOD_EMOJI[m]}</AppText>
              <AppText
                variant="caption"
                bold={selected}
                style={{ color: selected ? "#fff" : palette.textMuted, marginTop: 2 }}
              >
                {MOOD_LABELS[m]}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <Animated.View
        style={[
          styles.centerOrb,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, transform: [{ scale }] },
        ]}
      >
        <AppText style={{ fontSize: 44 }}>
          {value ? MOOD_EMOJI[value] : "🧡"}
        </AppText>
        <AppText variant="caption" bold style={{ color: value ? "#fff" : palette.textFaint, marginTop: 4 }}>
          {value ? `Rank ${MOOD_RANK[value] + 1} of 5` : "Tap a mood"}
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 18 },
  optionsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  option: {
    width: 62,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  centerOrb: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
});