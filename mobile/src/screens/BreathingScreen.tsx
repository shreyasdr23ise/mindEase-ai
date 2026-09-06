import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { wellness } from "../lib/services";
import { AppText } from "../components/AppText";
import { AppButton } from "../components/AppButton";
import { Screen } from "../components/Screen";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Breathing">;

const PHASES = [
  { label: "INHALE", seconds: 4, range: [0, 0.25] as const },
  { label: "HOLD", seconds: 4, range: [0.25, 0.5] as const },
  { label: "EXHALE", seconds: 4, range: [0.5, 1] as const },
];

export function BreathingScreen({ navigation, route }: Props) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [cycle, setCycle] = useState(0);

  const progress = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  const scale = progress.interpolate({ inputRange: [0, 0.25, 0.5, 1], outputRange: [0.9, 1.45, 1.45, 1.1] });

  const phaseLabel = progress.interpolate({
    inputRange: [0, 0.25, 0.5, 1],
    outputRange: ["INHALE", "INHALE", "HOLD", "EXHALE"],
  }) as unknown as string;

  useEffect(() => {
    return () => {
      if (loopRef.current) loopRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!playing) return;
    loopRef.current = Animated.loop(
      Animated.timing(progress, { toValue: 1, duration: 12000, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
    );
    loopRef.current.start();
    const t0 = Date.now();
    timerRef.current = setInterval(() => {
      const e = Math.round((Date.now() - t0) / 1000);
      setElapsed((prev) => {
        const next = prev + 1;
        setCycle(Math.floor(next / 12));
        return next;
      });
    }, 1000);
    return () => {
      if (loopRef.current) loopRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      loopRef.current = null;
      timerRef.current = null;
    };
  }, [playing, progress]);

  const totalSeconds = (route.params?.durationMinutes ?? 2) * 60;
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  const finish = (save: boolean) => {
    setPlaying(false);
    setDone(true);
    if (save && token && route.params?.exerciseId) {
      void wellness
        .complete(token, {
          exercise_id: route.params.exerciseId,
          completed: true,
          duration_seconds: Math.max(1, elapsed),
        })
        .catch(() => {});
    }
  };

  const timerText = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <Screen padded>
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <AppText variant="caption" style={{ color: palette.textFaint }}>{route.params?.title ?? "Calm Breathing"} · 4-4-4 cycle</AppText>
      </View>

      {!done ? (
        <View style={styles.area}>
          <View style={styles.orbWrap}>
            <View style={[styles.halo, { borderColor: palette.brand, width: 260, height: 260 }]} />
            <Animated.View
              style={[
                styles.orb,
                { backgroundColor: palette.brand, width: 150, height: 150, borderRadius: 75, transform: [{ scale }] },
              ]}
            />
            <AppText variant="subtitle" bold style={{ color: "#ffffff", position: "absolute", fontSize: 20, letterSpacing: 2 }}>
              {phaseLabel}
            </AppText>
          </View>

          <AppText variant="title" bold style={{ marginTop: 20 }}>{timerText}</AppText>
          <AppText variant="caption" style={{ color: palette.textFaint }}>
            Cycle {cycle + 1} · target {Math.round(totalSeconds / 12)} cycles
          </AppText>

          <View style={styles.controls}>
            <AppButton
              label={playing ? "Pause" : "Resume"}
              variant={playing ? "secondary" : "primary"}
              onPress={() => setPlaying((p) => !p)}
              style={{ flex: 1 }}
            />
            <AppButton
              label="Stop"
              variant="ghost"
              onPress={() => finish(elapsed >= 20)}
              style={{ flex: 1 }}
            />
          </View>
          <AppButton
            label="End session"
            variant="ghost"
            onPress={() => {
              setPlaying(false);
              navigation.goBack();
            }}
            labelStyle={{ color: palette.textFaint }}
          />
        </View>
      ) : (
        <View style={styles.area}>
          <View style={[styles.check, { backgroundColor: palette.brandSoft }]}>
            <Ionicons name="checkmark-done" size={44} color={palette.brandDark} />
          </View>
          <AppText variant="title" bold style={{ marginTop: 16 }}>Beautifully done</AppText>
          <AppText style={{ color: palette.textMuted, textAlign: "center", marginTop: 6 }}>
            {elapsed >= 20
              ? `Your session has been saved. ${timerText} of deliberate breathing.`
              : `You took ${timerText}. Try a full minute next time — small steps count.`}
          </AppText>
          <View style={styles.controls}>
            <AppButton label="Done" onPress={() => navigation.goBack()} />
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center" },
  area: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 24 },
  orbWrap: { alignItems: "center", justifyContent: "center" },
  halo: { position: "absolute", borderRadius: 130, borderWidth: 2, opacity: 0.35 },
  orb: { alignItems: "center", justifyContent: "center" },
  controls: { flexDirection: "row", gap: 12, width: "100%", marginTop: 28 },
  check: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center" },
});