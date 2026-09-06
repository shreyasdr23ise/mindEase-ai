import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { AppText } from "./AppText";
import { MOOD_RANK, MOOD_LABELS, type MoodLog } from "../types";

const BAND_COLORS = ["#E11D48", "#EF7F1A", "#8FA3B8", "#0FA3B3", "#0F9D6B"];

interface Props {
  logs: MoodLog[];
  days?: number;
}

/** Lightweight animated 7/30-day mood trend bar chart (no heavy chart lib). */
export function MoodTrend({ logs, days = 7 }: Props) {
  const { palette } = useTheme();
  const prog = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(prog, { toValue: 1, duration: 650, useNativeDriver: true }).start();
  }, [logs, prog]);

  const buckets: { label: string; value: number; n: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayLogs = logs.filter((l) => l.created_at.slice(0, 10) === key);
    const avg = dayLogs.length
      ? dayLogs.reduce((s, l) => s + MOOD_RANK[l.mood], 0) / dayLogs.length
      : null;
    buckets.push({
      label: d.toDateString().slice(0, 3),
      value: avg === null ? 0 : avg / 4,
      n: dayLogs.length,
    });
  }

  const hasData = buckets.some((b) => b.n > 0);

  return (
    <View>
      {!hasData ? (
        <AppText style={{ color: palette.textMuted }}>
          Add a mood check-in to see your trend here.
        </AppText>
      ) : (
        <View style={styles.chart}>
          {buckets.map((b, i) => {
            const height = b.n === 0 ? 4 : Math.max(10, Math.round(b.value * 88));
            const colorIdx = b.n === 0 ? 2 : Math.round((b.value || 0) * 4);
            return (
              <View key={i} style={styles.col}>
                <AppText variant="caption" style={{ color: palette.textFaint, height: 16 }}>
                  {b.n > 0 ? `${Math.round((b.value || 0) * 4 + 1)}` : ""}
                </AppText>
                <Animated.View
                  style={[
                    styles.bar,
                    {
                      height,
                      backgroundColor: BAND_COLORS[colorIdx] ?? BAND_COLORS[2],
                      opacity: prog.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.2, b.n ? 1 : 0.35],
                      }),
                    },
                  ]}
                />
                <AppText variant="caption" style={{ color: palette.textFaint, height: 18 }}>
                  {b.label}
                </AppText>
              </View>
            );
          })}
        </View>
      )}
      <View style={styles.legend}>
        {([5, 4, 3, 2, 1] as const).map((rank) => (
          <AppText key={rank} variant="caption" style={{ color: palette.textFaint }}>
            {rank}·{MOOD_LABELS[rank === 5 ? "very_good" : rank === 4 ? "good" : rank === 3 ? "neutral" : rank === 2 ? "low" : "very_low"]}
          </AppText>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { flexDirection: "row", alignItems: "flex-end", gap: 7, height: 150 },
  col: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 4 },
  bar: { width: "100%", borderRadius: 6, maxWidth: 26 },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
});