import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "../components/Screen";
import { AppHeader } from "../components/AppHeader";
import { AppText } from "../components/AppText";
import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { AppInput } from "../components/AppInput";
import { Chip } from "../components/Chip";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { onboardingApi } from "../lib/services";
import { ApiError, NetworkError } from "../lib/api";
import { sanitize } from "../lib/storage";
import { GOALS_OPTIONS } from "../types";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Onboarding">;

const STYLE_OPTIONS = ["Gentle & warm", "Direct & practical", "A mix of both"];

export function OnboardingScreen({ navigation }: Props) {
  const { palette } = useTheme();
  const { user, token, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(user?.displayName || user?.username || "");
  const [goals, setGoals] = useState<string[]>([]);
  const [style, setStyle] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const toggleGoal = (g: string) =>
    setGoals((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  const finish = async (complete: boolean) => {
    const gotoMain = () => navigation.replace("MainTabs", { screen: "HomeTab", params: { screen: "Home" } });
    if (!token) return gotoMain();
    if (complete) {
      const preferredName = sanitize(name) || user?.username || "Friend";
      setBusy(true);
      setError(null);
      try {
        await onboardingApi.complete(token, {
          preferred_name: preferredName,
          wellness_goals: goals,
          preferred_style: style || undefined,
          onboarding_completed: true,
        });
        await refreshProfile();
      } catch (e) {
        if (e instanceof NetworkError) setError(e.message);
        else if (e instanceof ApiError) setError(e.message);
        else setError("Could not save preferences right now.");
        setBusy(false);
        return;
      }
    } else {
      await refreshProfile();
    }
    gotoMain();
  };

  return (
    <Screen keyboard padded>
      <AppHeader
        title="Welcome aboard"
        subtitle={`Step ${step + 1} of 4`}
        onBack={step > 0 ? () => setStep(step - 1) : undefined}
        right={
          step < 3 ? (
            <AppButton label="Skip" variant="ghost" onPress={() => finish(false)} labelStyle={{ fontSize: 13 }} />
          ) : undefined
        }
      />

      {step === 0 ? (
        <AppCard padded style={styles.intro}>
          <Ionicons name="sparkles" size={30} color={palette.brand} />
          <AppText variant="title" style={styles.introTitle}>
            MindEase is here for you
          </AppText>
          <AppText style={{ color: palette.textMuted }}>
            A calm, private space to talk, reflect and feel supported. Everything you share stays
            between you and MindEase — designed with privacy and data minimization in mind.
          </AppText>
        </AppCard>
      ) : null}

      {step === 1 ? (
        <View style={styles.stepBody}>
          <AppText variant="title">What should we call you?</AppText>
          <AppText style={{ color: palette.textMuted, marginBottom: 12 }}>
            Used for your greeting — you can change this later.
          </AppText>
          <AppInput
            label="Preferred name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Aarav"
            left={<Ionicons name="happy-outline" size={18} color={palette.textFaint} />}
          />
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.stepBody}>
          <AppText variant="title">What would you like to work on?</AppText>
          <AppText style={{ color: palette.textMuted, marginBottom: 14 }}>
            Pick any — this only helps us suggest relevant wellness tools. You can skip.
          </AppText>
          <View style={styles.goals}>
            {GOALS_OPTIONS.map((g) => (
              <Chip key={g} label={g} selected={goals.includes(g)} onPress={() => toggleGoal(g)} />
            ))}
          </View>
        </View>
      ) : null}

      {step === 3 ? (
        <View style={styles.stepBody}>
          <AppText variant="title">How would you like MindEase to talk with you?</AppText>
          <AppText style={{ color: palette.textMuted, marginBottom: 14 }}>
            This shapes the tone of conversations. Optional.
          </AppText>
          {STYLE_OPTIONS.map((s) => (
            <Chip key={s} label={s} selected={style === s} onPress={() => setStyle(s === style ? "" : s)} style={{ marginBottom: 10 }} />
          ))}
        </View>
      ) : null}

      {error ? (
        <AppText variant="caption" bold style={{ color: palette.danger, marginTop: 12 }}>
          {error}
        </AppText>
      ) : null}

      <View style={styles.footer}>
        {step < 3 ? (
          <AppButton label="Continue" onPress={() => setStep(step + 1)} />
        ) : (
          <AppButton label="Finish & explore MindEase" onPress={() => finish(true)} loading={busy} disabled={busy} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginTop: 20, gap: 12 },
  introTitle: { marginTop: 4 },
  stepBody: { marginTop: 24 },
  goals: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  footer: { marginTop: "auto", paddingTop: 24 },
});