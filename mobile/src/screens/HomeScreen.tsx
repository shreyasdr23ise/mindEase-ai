import React, { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, View, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useOnline } from "../lib/net";
import { mood as moodApi, wellness as wellnessApi } from "../lib/services";
import { ApiError, NetworkError } from "../lib/api";
import { AppText } from "../components/AppText";
import { AppCard, Row, SectionLabel, Tag } from "../components/AppCard";
import { AppButton } from "../components/AppButton";
import { OfflineBanner } from "../components/States";
import { MoodTrend } from "../components/MoodTrend";
import { MOOD_LABELS, MOOD_EMOJI, type MoodLog, type WellnessSession } from "../types";
import { RootStackParamList, MainTabParamList } from "../navigation/types";

type Props = {
  navigation: {
    navigate: (name: keyof RootStackParamList, params?: unknown) => void;
    goBack: () => void;
  };
};

function morningGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function HomeScreen({ navigation }: Props) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, token, logout } = useAuth();
  const { online } = useOnline();
  const [moods, setMoods] = useState<MoodLog[]>([]);
  const [sessions, setSessions] = useState<WellnessSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [mh, sess] = await Promise.all([moodApi.history(token), wellnessApi.sessions(token)]);
      setMoods(mh.logs ?? []);
      setSessions(sess);
      setError(false);
    } catch (e) {
      if (e instanceof ApiError || e instanceof NetworkError) setError(true);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (online === false) {
      setLoading(false);
    } else {
      void load();
    }
  }, [online, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const lastMood = moods[0] ?? null;
  const todaySessions = sessions.filter(
    (s) => s.created_at.slice(0, 10) === new Date().toISOString().slice(0, 10)
  );

  const actions = [
    { icon: "chatbubbles" as const, label: "Talk to MindEase", sub: "A calm conversation", onPress: () => navigation.navigate("ChatScreen", {}) },
    { icon: "happy" as const, label: "Check Mood", sub: "1-minute check-in", onPress: () => (navigation as never as { navigate: (a: string, p: object) => void }).navigate("MainTabs", { screen: "MoodTab" }) },
    { icon: "leaf" as const, label: "Breathing", sub: "A guided session", onPress: () => navigation.navigate("Breathing", { title: "Calm Breathing" }) },
    { icon: "book" as const, label: "Journal", sub: "Write a reflection", onPress: () => navigation.navigate("JournalEditor", {}) },
  ];

  return (
    <FlatList
      style={{ backgroundColor: palette.bg }}
      contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 24, paddingTop: insets.top + 14 }}
      data={[0]}
      keyExtractor={() => "home"}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.brand} />}
      renderItem={() => (
        <View style={{ gap: 18 }}>
          <View>
            <AppText variant="caption" style={{ color: palette.textFaint }}>
              {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
            </AppText>
            <AppText variant="hero" bold style={{ marginTop: 2 }}>
              {morningGreeting()}, {user?.displayName}
            </AppText>
            <AppText style={{ color: palette.textMuted, marginTop: 4 }}>How are you feeling today?</AppText>
          </View>

          {online === false ? <OfflineBanner /> : null}

          <View style={styles.grid}>
            {actions.map((a) => (
              <AppCard key={a.label} onPress={a.onPress} style={styles.actionCard}>
                <View style={[styles.actionIcon, { backgroundColor: palette.brandSoft }]}>
                  <Ionicons name={a.icon} size={28} color={palette.brandDark} />
                </View>
                <AppText variant="subtitle" bold numberOfLines={2} style={{ marginTop: 10 }}>
                  {a.label}
                </AppText>
                <AppText variant="caption" style={{ color: palette.textFaint, marginTop: 2 }}>
                  {a.sub}
                </AppText>
              </AppCard>
            ))}
          </View>

          <SectionLabel>Today's wellness</SectionLabel>
          <AppCard padded accent>
            <Row>
              <View style={[styles.wellnessIcon, { backgroundColor: palette.brandSoft }]}>
                <Ionicons name="leaf" size={26} color={palette.brandDark} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="subtitle" bold>
                  {todaySessions.length > 0
                    ? `${todaySessions.length} session${todaySessions.length > 1 ? "s" : ""} completed today`
                    : "Nothing completed yet today"}
                </AppText>
                <AppText variant="caption" style={{ color: palette.textMuted }}>
                  {sessions.length > 0
                    ? `A little progress every day adds up. ${sessions.length} total session${sessions.length > 1 ? "s" : ""}.`
                    : "Try a quick breathing exercise to begin."}
                </AppText>
              </View>
            </Row>
            <View style={styles.inlineRow}>
              {["Breathing", "Grounding", "Sleep"].map((w) => (
                <Tag key={w} text={w} />
              ))}
            </View>
          </AppCard>

          <SectionLabel>Recent mood</SectionLabel>
          {lastMood ? (
            <AppCard padded accent>
              <Row>
                <AppText style={{ fontSize: 30 }}>{MOOD_EMOJI[lastMood.mood]}</AppText>
                <View style={{ flex: 1 }}>
                  <AppText variant="subtitle" bold>
                    {MOOD_LABELS[lastMood.mood]}
                  </AppText>
                  <AppText variant="caption" style={{ color: palette.textMuted }}>
                    {new Date(lastMood.created_at).toLocaleString()} · stress {lastMood.stress_level}/10 · anxiety {lastMood.anxiety_level}/10
                  </AppText>
                </View>
              </Row>
              {lastMood.note ? (
                <AppText style={{ color: palette.textMuted, marginTop: 8 }}>“{lastMood.note}”</AppText>
              ) : null}
            </AppCard>
          ) : (
            <AppText style={{ color: palette.textMuted }}>
              No check-in yet. Tap “Check Mood” to get started.
            </AppText>
          )}

          <SectionLabel>Mood trend</SectionLabel>
          <AppCard padded>
            {moods.length ? (
              <MoodTrend logs={moods} days={7} />
            ) : (
              <AppText style={{ color: palette.textMuted }}>Trends appear after your first check-ins.</AppText>
            )}
          </AppCard>

          <SectionLabel>Recommended for you</SectionLabel>
          <AppCard padded accent>
            <AppText variant="subtitle" bold>Take 60 seconds to breathe</AppText>
            <AppText style={{ color: palette.textMuted, marginTop: 4 }}>
              Calm breathing lowers tension and helps you reset. No gear, no music needed.
            </AppText>
            <View style={{ marginTop: 12 }}>
              <AppButton label="Start breathing" variant="soft" onPress={() => navigation.navigate("Breathing", { title: "Calm Breathing" })} />
            </View>
          </AppCard>

          <AppCard
            onPress={() => navigation.navigate("Emergency", {})}
            style={{ backgroundColor: palette.dangerSoft, borderColor: palette.danger }}
          >
            <Row>
              <View style={styles.sos}>
                <Ionicons name="heart" size={28} color={palette.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="subtitle" bold style={{ color: palette.danger }}>
                  Need help right now?
                </AppText>
                <AppText variant="caption" style={{ color: palette.textMuted }}>
                  Free crisis support resources and helplines — always available.
                </AppText>
              </View>
            </Row>
          </AppCard>

          {error && online !== false ? (
            <AppText variant="caption" style={{ color: palette.textFaint }}>
              Some live data failed to load — pull to retry.
            </AppText>
          ) : null}

          {!loading && user?.role === "admin" ? (
            <AppCard padded>
              <AppText variant="subtitle" bold>Admin session</AppText>
              <AppButton label="Logout" variant="ghost" onPress={() => void logout()} />
            </AppCard>
          ) : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "column", gap: 20 },
  actionCard: { width: "100%", minHeight: 150 },
  actionIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  wellnessIcon: { width: 50, height: 50, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  inlineRow: { flexDirection: "column", gap: 8, marginTop: 12, flexWrap: "wrap" },
  sos: { width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(225,29,72,0.12)", alignItems: "center", justifyContent: "center" },
});