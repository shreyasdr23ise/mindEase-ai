import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { wellness } from "../lib/services";
import { ApiError, NetworkError } from "../lib/api";
import { AppText } from "../components/AppText";
import { AppCard } from "../components/AppCard";
import { AppButton } from "../components/AppButton";
import { AppHeader } from "../components/AppHeader";
import { Screen } from "../components/Screen";
import { LoadingState } from "../components/States";
import { WELLNESS_CATEGORIES, type WellnessExercise } from "../types";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "WellnessDetail">;

export function WellnessDetailScreen({ navigation, route }: Props) {
  const { palette } = useTheme();
  const { token } = useAuth();
  const [ex, setEx] = useState<WellnessExercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setEx(await wellness.show(token, route.params.id));
      setError(null);
    } catch (e) {
      setError(e instanceof NetworkError || e instanceof ApiError ? e.message : "Could not load this exercise.");
    } finally {
      setLoading(false);
    }
  }, [token, route.params.id]);

  useEffect(() => { void load(); }, [load]);

  const markComplete = (durationSeconds: number) => {
    if (!token || !ex) return;
    void wellness
      .complete(token, { exercise_id: ex.id, completed: true, duration_seconds: durationSeconds })
      .then(() => Alert.alert("Great work", "Session saved to your wellness history."))
      .catch(() => Alert.alert("Could not save", "We couldn't record this session right now."));
  };

  const openInteractive = () => {
    if (!ex) return;
    if (ex.category === "breathing")
      return navigation.navigate("Breathing", { exerciseId: ex.id, title: ex.title, durationMinutes: ex.duration_minutes, instructions: ex.instructions });
    if (ex.category === "grounding")
      return navigation.navigate("Grounding", { exerciseId: ex.id, title: ex.title, instructions: ex.instructions });
    if (ex.category === "cbt")
      return navigation.navigate("Cbt", { exerciseId: ex.id, title: ex.title });
    markComplete(Math.max(60, ex.duration_minutes * 60));
  };

  if (loading) {
    return (
      <Screen padded>
        <AppHeader title="Exercise" canGoBack />
        <LoadingState label="Loading…" />
      </Screen>
    );
  }

  if (!ex) {
    return (
      <Screen padded>
        <AppHeader title="Exercise" canGoBack />
        <AppText style={{ color: palette.textMuted }}>{error ?? "Exercise not found."}</AppText>
      </Screen>
    );
  }

  return (
    <Screen padded>
      <AppHeader title={ex.title} subtitle={`${WELLNESS_CATEGORIES[ex.category]} · ${ex.duration_minutes} min`} canGoBack />
      <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 40 }}>
        <AppCard padded accent>
          <AppText style={{ color: palette.textMuted }}>{ex.description}</AppText>
        </AppCard>

        <AppCard padded>
          <AppText variant="subtitle" bold style={{ marginBottom: 10 }}>How to do it</AppText>
          {ex.instructions.map((step, i) => (
            <View key={i} style={styles.step}>
              <View style={[styles.stepNum, { backgroundColor: palette.brandSoft }]}>
                <AppText variant="caption" bold style={{ color: palette.brandDark }}>{i + 1}</AppText>
              </View>
              <AppText style={{ color: palette.textMuted, flex: 1 }}>{step}</AppText>
            </View>
          ))}
        </AppCard>

        <AppButton
          label={ex.category === "breathing" || ex.category === "grounding" || ex.category === "cbt" ? "Start guided session" : "I completed this session"}
          onPress={openInteractive}
          icon={<Ionicons name="play" size={18} color="#fff" />}
        />

        {ex.category === "cbt" ? (
          <AppText variant="caption" style={{ color: palette.textFaint, textAlign: "center" }}>
            CBT-inspired educational exercise — not psychotherapy.
          </AppText>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  step: { flexDirection: "row", gap: 12, alignItems: "flex-start", marginBottom: 12 },
  stepNum: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
});