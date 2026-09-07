import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useTheme } from "../context/ThemeContext";

export function TypingDots() {
  const { palette } = useTheme();
  const a = useRef(new Animated.Value(0)).current;
  const b = useRef(new Animated.Value(0)).current;
  const c = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const mk = (v: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, { toValue: 1, duration: 340, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 340, useNativeDriver: true }),
          Animated.delay(220),
        ])
      );
    const loops = [mk(a, 0), mk(b, 140), mk(c, 280)];
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [a, b, c]);

  const op = (v: Animated.Value) => v.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });

  return (
    <View style={styles.row}>
      {[a, b, c].map((v, i) => (
        <Animated.View
          key={i}
          style={[styles.dot, { backgroundColor: palette.brand, opacity: op(v) }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 5, paddingHorizontal: 2 },
  dot: { width: 7, height: 7, borderRadius: 4 },
});