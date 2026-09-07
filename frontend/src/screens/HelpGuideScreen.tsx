import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { AppText } from "../components/AppText";
import { AppCard } from "../components/AppCard";
import { AppHeader } from "../components/AppHeader";
import { Screen } from "../components/Screen";
import { WELLNESS_CATEGORIES } from "../types";

const TOPICS = [
  {
    icon: "body",
    title: "Panic & overwhelm",
    body: "When panic rises, your body is trying to protect you — it just brought too much fuel. Grounding and slow breathing tell it the threat isn’t here.",
    action: "Try grounding",
    screen: "grounding",
  },
  {
    icon: "train",
    title: "Racing thoughts at night",
    body: "Your brain rehearses worries because bedtime is the first quiet moment all day. Writing them down puts them outside your head.",
    action: "Try journaling",
    screen: "journal",
  },
  {
    icon: "sunny",
    title: "Low energy days",
    body: "Motivation rarely comes before action. Tiny, kind steps — even one minute — often start the wheel turning.",
    action: "Try a small practice",
    screen: "wellness",
  },
  {
    icon: "chatbubbles",
    title: "Hard conversations",
    body: "You can feel hurt and still speak gently. “When you said that, I felt…” keeps you firm without armour.",
    action: "Talk it through",
    screen: "chat",
  },
  {
    icon: "flame",
    title: "Anger & frustration",
    body: "Anger is a signal that a boundary or need was crossed. First cool the engine, then name what you need.",
    action: "Breathe first",
    screen: "grounding",
  },
  {
    icon: "moon",
    title: "Where do I even start?",
    body: "Start here: five slow breaths, then one kind message to yourself. That’s a real beginning.",
    action: "Talk to MindEase",
    screen: "chat",
  },
] as const;

export function HelpGuideScreen({ navigation }: {
  navigation: {
    goBack: () => void;
    navigate: (n: string, p?: unknown) => void;
  };
}) {
  const { palette } = useTheme();

  const go = (screen: string) => {
    if (screen === "chat") navigation.navigate("Chat", {});
    else if (screen === "journal") navigation.navigate("JournalList", {});
    else if (screen === "wellness") navigation.navigate("MainTabs", { screen: "WellnessTab" });
    else if (screen === "grounding") navigation.navigate("Grounding", {});
  };

  return (
    <Screen padded>
      <AppHeader title="Support guide" subtitle="Common hard moments and what helps" canGoBack />
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 40 }}>
        <View style={[styles.good, { borderColor: palette.brand, backgroundColor: palette.brandSoft }]}>
          <Ionicons name="heart" size={18} color={palette.brandDark} />
          <AppText style={{ color: palette.brandDark, flex: 1, lineHeight: 20 }}>
            You are here, reading, trying. That is already a step a lot of people never take.
          </AppText>
        </View>

        {TOPICS.map((t) => (
          <AppCard key={t.title} padded style={{ gap: 8 }}>
            <View style={styles.row}>
              <View style={[styles.icon, { backgroundColor: palette.brandSoft }]}>
                <Ionicons name={t.icon} size={22} color={palette.brandDark} />
              </View>
              <AppText variant="subtitle" bold style={{ flex: 1 }}>{t.title}</AppText>
            </View>
            <AppText style={{ color: palette.textMuted, lineHeight: 21 }}>{t.body}</AppText>
            <Pressable onPress={() => go(t.screen)} style={styles.action}>
              <AppText variant="caption" bold style={{ color: palette.brandDark }}>{t.action}</AppText>
              <Ionicons name="arrow-forward" size={14} color={palette.brandDark} />
            </Pressable>
          </AppCard>
        ))}

        <AppCard padded style={{ gap: 4 }}>
          <AppText variant="subtitle" bold>Categories</AppText>
          {Object.entries(WELLNESS_CATEGORIES).map(([k, v]) => (
            <AppText key={k} variant="caption" style={{ color: palette.textMuted, marginTop: 2 }}>
              • {v}
            </AppText>
          ))}
        </AppCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  good: { padding: 14, flexDirection: "row", gap: 10, alignItems: "center", borderWidth: 1, borderRadius: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  icon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  action: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start" },
});