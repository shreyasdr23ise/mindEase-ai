import React, { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, View, Pressable, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useOnline } from "../lib/net";
import { mood as moodApi } from "../lib/services";
import { ApiError, NetworkError } from "../lib/api";
import { AppText } from "../components/AppText";
import { AppCard, Row, SectionLabel } from "../components/AppCard";
import { AppButton } from "../components/AppButton";
import { AppInput } from "../components/AppInput";
import { MoodWheel } from "../components/MoodWheel";
import { EmptyState, ErrorState, LoadingState, OfflineBanner } from "../components/States";
import { MOOD_LABELS, MOOD_EMOJI, type MoodLog } from "../types";

function Stepper({
  value,
  onChange,
  color,
}: {
  value: number;
  onChange: (n: number) => void;
  color: string;
}) {
  const { palette } = useTheme();
  return (
    <Row gap={8}>
      <Pressable
        style={[styles.stepBtn, { backgroundColor: palette.cardAlt }]}
        onPress={() => onChange(Math.max(1, value - 1))}
      >
        <Ionicons name="remove" size={18} color={palette.text} />
      </Pressable>
      <AppText variant="subtitle" bold style={{ color, minWidth: 46, textAlign: "center" }}>
        {value}/10
      </AppText>
      <Pressable
        style={[styles.stepBtn, { backgroundColor: palette.cardAlt }]}
        onPress={() => onChange(Math.min(10, value + 1))}
      >
        <Ionicons name="add" size={18} color={palette.text} />
      </Pressable>
    </Row>
  );
}

export function MoodHomeScreen({ navigation }: { navigation: { navigate: (n: string, p?: unknown) => void } }) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { online } = useOnline();

  const [selected, setSelected] = useState<string | null>(null);
  const [stress, setStress] = useState(5);
  const [anxiety, setAnxiety] = useState(4);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [recent, setRecent] = useState<MoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const mh = await moodApi.history(token);
      setRecent(mh.logs ?? []);
      setError(null);
    } catch (e) {
      if (e instanceof NetworkError || e instanceof ApiError) setError(e.message);
      setError("Could not load your mood history.");
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

  const submit = async () => {
    if (!token || !selected) return;
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      await moodApi.create(token, {
        mood: selected,
        stress_level: stress,
        anxiety_level: anxiety,
        note: note.trim() || undefined,
      });
      setSaved(true);
      setNote("");
      setSelected(null);
      setTimeout(() => setSaved(false), 2500);
      void load();
    } catch (e) {
      setSaveError(e instanceof NetworkError || e instanceof ApiError ? e.message : "Could not save your check-in.");
    } finally {
      setSaving(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const moodMsg = (m: string) => {
    switch (m) {
      case "very_low":
      case "low":
        return "Thank you for checking in. You don't have to solve everything at once.";
      case "neutral":
        return "Thanks for checking in. It's okay to sit with where you are.";
      case "good":
        return "Lovely. Savor the good moments — they matter.";
      case "very_good":
        return "Wonderful. Make the most of this energy, gently.";
      default:
        return "Thanks for checking in.";
    }
  };

  return (
    <FlatList
      style={{ backgroundColor: palette.bg }}
      data={[0]}
      keyExtractor={() => "mood"}
      contentContainerStyle={{ paddingHorizontal: 18, paddingTop: insets.top + 14, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.brand} />}
      renderItem={() => (
        <View style={{ gap: 18 }}>
          <View>
            <AppText variant="hero" bold>Mood</AppText>
            <AppText style={{ color: palette.textMuted }}>A private check-in, whenever you like.</AppText>
          </View>

          {online === false ? <OfflineBanner /> : null}

          <AppCard padded accent>
            <AppText variant="subtitle" bold>How are you feeling?</AppText>
            <View style={styles.moodWrap}>
              <MoodWheel value={selected} onSelect={(m) => { setSelected(m); setSaved(false); }} />
              {selected ? (
                <AppText variant="body" style={{ color: palette.brandDark, textAlign: "center", marginTop: 10 }}>
                  {moodMsg(selected)}
                </AppText>
              ) : null}
            </View>

            <View style={styles.scaleRow}>
              <View style={{ flex: 1 }}>
                <AppText variant="label" style={{ color: palette.textMuted }}>Stress</AppText>
                <Stepper value={stress} onChange={setStress} color={palette.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="label" style={{ color: palette.textMuted }}>Anxiety</AppText>
                <Stepper value={anxiety} onChange={setAnxiety} color={palette.amber} />
              </View>
            </View>

            <AppInput
              placeholder="Optional note (e.g. before a big presentation)"
              value={note}
              onChangeText={setNote}
              multiline
              containerStyle={{ marginTop: 14 }}
            />

            {saveError ? (
              <AppText variant="caption" bold style={{ color: palette.danger, marginTop: 10 }}>
                {saveError}
              </AppText>
            ) : null}
            {saved ? (
              <AppText variant="caption" bold style={{ color: palette.green, marginTop: 10 }}>
                Saved. Thank you for checking in. 💙
              </AppText>
            ) : null}

            <View style={{ marginTop: 16 }}>
              <AppButton
                label="Save check-in"
                onPress={() => void submit()}
                loading={saving}
                disabled={!selected || online === false}
              />
            </View>
          </AppCard>

          <SectionLabel>Recent check-ins</SectionLabel>
          {loading ? (
            <LoadingState label="Loading…" />
          ) : error && recent.length === 0 ? (
            <ErrorState message={error} onRetry={() => { setLoading(true); void load(); }} />
          ) : recent.length === 0 ? (
            <EmptyState icon="happy-outline" title="No check-ins yet" message="Your mood history will appear here." />
          ) : (
            recent.slice(0, 5).map((m) => (
              <AppCard key={m.id} padded>
                <Row>
                  <AppText style={{ fontSize: 26 }}>{MOOD_EMOJI[m.mood]}</AppText>
                  <View style={{ flex: 1 }}>
                    <AppText variant="subtitle" bold>{MOOD_LABELS[m.mood]}</AppText>
                    <AppText variant="caption" style={{ color: palette.textFaint }}>
                      {new Date(m.created_at).toLocaleString()} · stress {m.stress_level} · anxiety {m.anxiety_level}
                    </AppText>
                  </View>
                </Row>
              </AppCard>
            ))
          )}

          <AppButton
            label="View full history & charts"
            variant="secondary"
            onPress={() => navigation.navigate("MoodHistory", {})}
          />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  moodWrap: { marginTop: 8 },
  scaleRow: { flexDirection: "row", gap: 16, marginTop: 20 },
  stepBtn: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
});