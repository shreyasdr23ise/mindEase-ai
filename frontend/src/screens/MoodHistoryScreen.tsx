import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, View, Alert, RefreshControl } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { ApiError, NetworkError } from "../lib/api";
import { Screen } from "../components/Screen";
import { AppHeader } from "../components/AppHeader";
import { AppText } from "../components/AppText";
import { AppCard, SectionLabel } from "../components/AppCard";
import { AppButton } from "../components/AppButton";
import { MoodTrend } from "../components/MoodTrend";
import { mood as moodApi } from "../lib/services";
import { EmptyState, ErrorState, LoadingState } from "../components/States";
import { MOOD_LABELS, MOOD_EMOJI, MOOD_RANK, type MoodLog } from "../types";

export function MoodHistoryScreen({ navigation }: { navigation: { goBack: () => void; navigate: (n: string, p?: unknown) => void } }) {
  const { palette } = useTheme();
  const { token } = useAuth();
  const [logs, setLogs] = useState<MoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const mh = await moodApi.history(token);
      setLogs(mh.logs ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof NetworkError || e instanceof ApiError ? e.message : "Could not load mood history.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const dist = new Map<string, number>();
  logs.forEach((l) => dist.set(l.mood, (dist.get(l.mood) ?? 0) + 1));
  const avgStress = logs.length ? Math.round((logs.reduce((s, l) => s + l.stress_level, 0) / logs.length) * 10) / 10 : null;
  const avgAnx = logs.length ? Math.round((logs.reduce((s, l) => s + l.anxiety_level, 0) / logs.length) * 10) / 10 : null;

  const removeLog = (id: string) => {
    if (!token) return;
    Alert.alert("Delete this mood entry?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await moodApi.remove(token, id);
            setLogs((p) => p.filter((l) => l.id !== id));
          } catch {
            Alert.alert("Could not delete", "Please try again.");
          }
        },
      },
    ]);
  };

  const empty = !loading && logs.length === 0 && !error;

  return (
    <Screen padded>
      <AppHeader title="Mood history" subtitle="Notes about trends — not a diagnosis" canGoBack />
      {loading && logs.length === 0 ? (
        <LoadingState label="Loading mood history…" />
      ) : error && logs.length === 0 ? (
        <ErrorState message={error} onRetry={() => { setLoading(true); void load(); }} />
      ) : empty ? (
        <EmptyState icon="happy-outline" title="No check-ins yet" message="Complete a check-in to start tracking your mood." />
      ) : (
        <FlatList
          data={[0]}
          keyExtractor={() => "a"}
          contentContainerStyle={{ paddingBottom: 40, gap: 18 }}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => void load()}
              tintColor={palette.brand}
            />
          }
          renderItem={() => (
            <>
              <View style={styles.twoCol}>
                <AppCard padded style={styles.statCard}>
                  <AppText variant="caption" style={{ color: palette.textFaint }}>AVG STRESS</AppText>
                  <AppText variant="title" bold>{avgStress ?? "–"}/10</AppText>
                </AppCard>
                <AppCard padded style={styles.statCard}>
                  <AppText variant="caption" style={{ color: palette.textFaint }}>AVG ANXIETY</AppText>
                  <AppText variant="title" bold>{avgAnx ?? "–"}/10</AppText>
                </AppCard>
              </View>

              <View>
                <SectionLabel>Last 7 days</SectionLabel>
                <AppCard padded style={{ marginTop: 8 }}>
                  <MoodTrend logs={logs} days={7} />
                </AppCard>
              </View>

              <View>
                <SectionLabel>Mood mix</SectionLabel>
                <AppCard padded style={{ marginTop: 8, gap: 10 }}>
                  {(["very_good", "good", "neutral", "low", "very_low"] as const).map((m) => {
                    const count = dist.get(m) ?? 0;
                    const pct = logs.length ? Math.round((count / logs.length) * 100) : 0;
                    return (
                      <View key={m}>
                        <View style={styles.distRow}>
                          <AppText variant="caption" style={{ color: palette.textMuted, flex: 1 }}>
                            {MOOD_EMOJI[m]} {MOOD_LABELS[m]}
                          </AppText>
                          <AppText variant="caption" bold style={{ color: palette.textMuted }}>
                            {count} · {pct}%
                          </AppText>
                        </View>
                        <View style={[styles.track, { backgroundColor: palette.cardAlt }]}>
                          <View
                            style={[
                              styles.fill,
                              {
                                width: `${pct}%`,
                                backgroundColor:
                                  MOOD_RANK[m] < 2
                                    ? palette.danger
                                    : MOOD_RANK[m] === 2
                                      ? "#8FA3B8"
                                      : palette.brand,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    );
                  })}
                </AppCard>
              </View>

              <View>
                <SectionLabel>All entries</SectionLabel>
                {logs.map((l) => (
                  <AppCard key={l.id} padded style={{ marginTop: 8 }}>
                    <View style={styles.entryRow}>
                      <AppText style={{ fontSize: 24 }}>{MOOD_EMOJI[l.mood]}</AppText>
                      <View style={{ flex: 1 }}>
                        <AppText variant="subtitle" bold>{MOOD_LABELS[l.mood]}</AppText>
                        <AppText variant="caption" style={{ color: palette.textFaint }}>
                          {new Date(l.created_at).toLocaleString()} · stress {l.stress_level} · anxiety {l.anxiety_level}
                        </AppText>
                      </View>
                      <Pressable onPress={() => removeLog(l.id)} style={styles.delBtn}>
                        <AppText variant="caption" style={{ color: palette.danger }}>Delete</AppText>
                      </Pressable>
                    </View>
                    {l.note ? (
                      <AppText style={{ color: palette.textMuted, marginTop: 6 }}>“{l.note}”</AppText>
                    ) : null}
                  </AppCard>
                ))}
              </View>

              <AppButton
                label="+ New check-in"
                variant="secondary"
                onPress={() => navigation.navigate("MainTabs", { screen: "MoodTab" })}
              />
            </>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  twoCol: { flexDirection: "row", gap: 12 },
  statCard: { flex: 1 },
  distRow: { flexDirection: "row", alignItems: "center" },
  track: { height: 8, borderRadius: 4, marginTop: 6, overflow: "hidden" },
  fill: { height: 8, borderRadius: 4 },
  entryRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  delBtn: { padding: 8 },
});