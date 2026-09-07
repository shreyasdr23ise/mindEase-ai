import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useOnline } from "../lib/net";
import { wellness } from "../lib/services";
import { AppText } from "../components/AppText";
import { AppCard } from "../components/AppCard";
import { AppButton } from "../components/AppButton";
import { AppHeader } from "../components/AppHeader";
import { Screen } from "../components/Screen";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Cbt">;

const INTRO_TITLE = "Reframe a thought";
const INTRO_BODY =
  "This gentle, CBT-inspired exercise helps you notice a difficult thought and look at it from a kinder, more balanced perspective. It is educational — not psychotherapy.";

export function CbtScreen({ navigation, route }: Props) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { online } = useOnline();

  const [stage, setStage] = useState(0);
  const [thought, setThought] = useState("");
  const [feelings, setFeelings] = useState("");
  const [evidence, setEvidence] = useState("");
  const [alternative, setAlternative] = useState("");
  const [reframe, setReframe] = useState("");
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [stage, fade]);

  const label = (t: string) => (
    <AppText variant="label" style={{ color: palette.textMuted, marginBottom: 6 }}>{t}</AppText>
  );
  const field = (placeholder: string, value: string, set: (v: string) => void) => (
    <>
      <AppCard padded style={{ marginTop: 8 }}>
        <View style={styles.fieldRow}>
          <Ionicons name="create-outline" size={16} color={palette.textFaint} />
          <TextInput
            style={[styles.fieldInput, { color: palette.text, borderBottomColor: palette.brand }]}
            placeholder={placeholder}
            placeholderTextColor={palette.textFaint}
            value={value}
            onChangeText={set}
          />
        </View>
      </AppCard>
    </>
  );

  const steps = [
    { title: INTRO_TITLE, body: INTRO_BODY, action: "Start" },
    { title: "The thought", body: "What is the difficult or unhelpful thought on your mind right now?" },
    { title: "Feelings", body: "When this thought shows up, how do you feel? Name the emotion and (optionally) how strong it is out of 10." },
    { title: "Fair perspective", body: "What is a more balanced, realistic way to look at this? Is the thought 100% true, or is part of it a guess?" },
    { title: "Your reframe", body: "Put the balanced view into one sentence you could say to yourself next time." },
    { title: "Reflection", body: "Reframing took exactly as much energy as worrying — but leaves you calmer. Remember the wins." },
  ];

  const canNext = [true, thought.trim().length > 0, true, evidence.trim().length > 0, alternative.trim().length > 0, true][stage];

  const next = () => {
    if (stage === 2 && !alternative.trim()) {
      setAlternative(feelings.trim());
    }
    if (stage + 1 < steps.length) setStage((s) => s + 1);
    else finish();
  };

  const finish = () => {
    if (token && route.params?.exerciseId) {
      void wellness
        .complete(token, { exercise_id: route.params.exerciseId, completed: true, duration_seconds: 300 })
        .catch(() => {});
    }
    setStage(0);
    setThought("");
    setFeelings("");
    setEvidence("");
    setAlternative("");
    setReframe("");
  };

  const entry = stage === 1 || stage === 2 || stage === 3 || stage === 4;

  return (
    <Screen padded style={{ paddingTop: insets.top }}>
      <AppHeader
        title={route.params?.title ?? "Cognitive Reflection"}
        subtitle="Guided exercise · 5 minutes"
        canGoBack
      />
      <View style={styles.progress}>
        {steps.map((_, i) => (
          <View key={i} style={[styles.dot, { backgroundColor: i <= stage ? palette.brand : palette.cardAlt }]} />
        ))}
      </View>

      <Animated.View style={{ flex: 1, opacity: fade }}>
        {!entry ? (
          <View style={{ flex: 1, justifyContent: "center" }}>
            <View style={[styles.icon, { backgroundColor: palette.brandSoft }]}>
              <Ionicons name="build-outline" size={40} color={palette.brandDark} />
            </View>
            <AppText variant="title" bold style={{ textAlign: "center", marginTop: 20 }}>{steps[stage].title}</AppText>
            <AppText style={{ color: palette.textMuted, textAlign: "center", marginTop: 10, lineHeight: 22 }}>{steps[stage].body}</AppText>
            {stage === 5 ? (
              <AppText variant="caption" style={{ color: palette.brandDark, textAlign: "center", marginTop: 12 }}>
                Session saved to your wellness history.
              </AppText>
            ) : null}
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <AppText variant="title" bold style={{ textAlign: "center", marginTop: 8 }}>{steps[stage].title}</AppText>
            <AppText style={{ color: palette.textMuted, textAlign: "center", marginTop: 8, lineHeight: 21 }}>{steps[stage].body}</AppText>

            <View style={{ marginTop: 16, gap: 14 }}>
              {stage === 1 ? <>{label("Your thought")}{field("e.g. “Everyone thinks I’m failing.”", thought, setThought)}</> : null}
              {stage === 2 ? <>{label("How do you feel? (emotion and strength)")}{field("e.g. “Ashamed, 8/10”", feelings, setFeelings)}</> : null}
              {stage === 3 ? <>{label("A fairer view")}{field("e.g. “I did my best and it showed.”", evidence, setEvidence)}</> : null}
              {stage === 4 ? <>{label("Your one-sentence reframe")}{field("e.g. “One mistake does not undo my value.”", alternative, setAlternative)}</> : null}
            </View>
          </View>
        )}
      </Animated.View>

      <AppButton
        label={stage === 0 && online === false ? "Start (offline)" : stage === 0 ? "Start" : stage === 5 ? "Finish" : "Continue"}
        onPress={next}
        disabled={!canNext}
      />
      {stage === 5 ? <AppText variant="caption" style={{ color: palette.textFaint, textAlign: "center", marginTop: 10 }}>
        CBT-inspired educational exercise — not psychotherapy.
      </AppText> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  progress: { flexDirection: "row", gap: 8, justifyContent: "center", marginTop: 12, marginBottom: 12 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  icon: { width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  fieldRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  fieldInput: { flex: 1, fontSize: 16, paddingVertical: 4, backgroundColor: "transparent", borderBottomWidth: 2 },
});