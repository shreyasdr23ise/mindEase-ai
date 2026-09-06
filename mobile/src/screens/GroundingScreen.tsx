import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useOnline } from "../lib/net";
import { wellness } from "../lib/services";
import { AppText } from "../components/AppText";
import { AppCard } from "../components/AppCard";
import { AppButton } from "../components/AppButton";
import { Screen } from "../components/Screen";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Grounding">;

const SENSES = [
  { icon: "eye", label: "LOOK", desc: "Name 5 things you can see around you", count: 5 },
  { icon: "hand-left", label: "TOUCH", desc: "Name 4 things you can feel", count: 4 },
  { icon: "ear", label: "HEAR", desc: "Name 3 things you can hear", count: 3 },
  { icon: "flower", label: "SMELL", desc: "Name 2 things you can smell", count: 2 },
  { icon: "nutrition", label: "TASTE", desc: "Name 1 thing you can taste", count: 1 },
] as const;

export function GroundingScreen({ navigation, route }: Props) {
  const { palette } = useTheme();
  const { token } = useAuth();
  const { online } = useOnline();
  const [step, setStep] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  const current = SENSES[step];

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [step, fade]);

  const finish = (save: boolean) => {
    setStep(0);
    if (save && token && route.params?.exerciseId) {
      void wellness
        .complete(token, { exercise_id: route.params.exerciseId, completed: true, duration_seconds: 60 })
        .catch(() => {});
    }
  };

  const finishButton = (
    <Animated.View style={{ flexDirection: "row", gap: 12 }}>
      {online !== false ? <AppButton label="Save session" onPress={() => finish(true)} style={{ flex: 1 }} /> : null}
      <AppButton label="Done" variant="secondary" onPress={() => finish(false)} style={{ flex: 1 }} />
    </Animated.View>
  );

  return (
    <Screen padded>
      <View style={styles.head}>
        <AppText variant="hero" bold>5 · 4 · 3 · 2 · 1</AppText>
        <AppText style={{ color: palette.textMuted, textAlign: "center", marginTop: 4 }}>
          A classic grounding technique for when thoughts race.
        </AppText>
      </View>

      <Animated.View key={step} style={[styles.card, { opacity: fade }]}>
        <View style={[styles.icon, { backgroundColor: palette.brandSoft }]}>
          <Ionicons name={current.icon} size={38} color={palette.brandDark} />
        </View>
        <AppText variant="caption" bold style={{ color: palette.brandDark, letterSpacing: 3, marginTop: 16 }}>
          {current.label}
        </AppText>
        <AppText variant="title" bold style={{ marginTop: 6, textAlign: "center" }}>
          {current.count} {current.count === 1 ? "thing" : "things"}
        </AppText>
        <AppText style={{ color: palette.textMuted, textAlign: "center", marginTop: 8 }}>
          {current.desc}
        </AppText>
        <View style={[styles.bigNum, { borderColor: palette.brand }]}>
          <AppText variant="hero" bold style={{ fontSize: 72, color: palette.brand }}>
            {current.count}
          </AppText>
        </View>
      </Animated.View>

      <AppCard style={{ marginTop: 20 }}>
        <AppText variant="caption" style={{ color: palette.textFaint }}>
          Take your time with each number. There is no right or wrong — noticing is enough.
        </AppText>
      </AppCard>

      <View style={styles.controls}>
        {step + 1 < SENSES.length ? (
          <AppButton label="Next sense" onPress={() => setStep((s) => s + 1)} />
        ) : (
          finishButton
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: "center", marginBottom: 24, paddingTop: 8 },
  card: { alignItems: "center", paddingVertical: 8 },
  icon: { width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center" },
  bigNum: { width: 140, height: 140, borderRadius: 70, borderWidth: 4, alignItems: "center", justifyContent: "center", marginTop: 20 },
  controls: { marginTop: 20 },
});