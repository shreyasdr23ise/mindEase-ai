import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { journal } from "../lib/services";
import { ApiError, NetworkError } from "../lib/api";
import { AppText } from "../components/AppText";
import { AppCard } from "../components/AppCard";
import { AppInput } from "../components/AppInput";
import { AppButton } from "../components/AppButton";
import { AppHeader } from "../components/AppHeader";
import { Chip } from "../components/Chip";
import { Screen } from "../components/Screen";
import { JOURNAL_PROMPTS, MOOD_LABELS, MOOD_EMOJI } from "../types";
import { loadJournalDraft, saveJournalDraft } from "../lib/storage";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "JournalEditor">;

export function JournalEditorScreen({ navigation, route }: Props) {
  const { palette } = useTheme();
  const { token } = useAuth();
  const entryId = route.params?.entryId;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [loading, setLoading] = useState(!!entryId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reflection, setReflection] = useState<string | null>(null);

  useEffect(() => {
    if (entryId && token) {
      journal
        .show(token, entryId)
        .then((e) => {
          setTitle(e.title);
          setContent(e.content);
          setMood(e.mood ?? null);
          setPrompt(e.writing_prompt ?? "");
          const r = e.emotion_analysis;
          if (typeof r === "string") setReflection(r);
          else if (r && typeof r === "object") {
            const obj = r as Record<string, unknown>;
            const pick = obj.reflection ?? obj.summary ?? obj.emotion ?? obj.text;
            setReflection(typeof pick === "string" ? pick : null);
          }
        })
        .catch((e: unknown) => {
          setError(e instanceof NetworkError || e instanceof ApiError ? e.message : "Could not load this entry.");
        })
        .finally(() => setLoading(false));
    } else {
      // Restore a safe local draft if one exists.
      loadJournalDraft().then((d) => {
        if (d && d.content.trim()) {
          setTitle(d.title);
          setContent(d.content);
          setMood(d.mood ?? null);
          setPrompt(d.prompt ?? "");
        }
      });
    }
  }, [entryId, token]);

  const persistDraft = useCallback(() => {
    void saveJournalDraft(
      content.trim() || title.trim()
        ? { title, content, mood: mood ?? undefined, prompt: prompt || undefined, updatedAt: new Date().toISOString() }
        : null
    );
  }, [title, content, mood, prompt]);

  useEffect(() => {
    const t = setTimeout(persistDraft, 1200);
    return () => clearTimeout(t);
  }, [persistDraft]);

  const save = async () => {
    if (!token) return;
    if (!content.trim()) {
      setError("Write a few words before saving.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const saved = entryId
        ? await journal.update(token, entryId, {
            title: title.trim() || undefined,
            content: content.trim(),
            mood: mood ?? undefined,
          })
        : await journal.create(token, {
            title: title.trim() || undefined,
            content: content.trim(),
            mood: mood ?? undefined,
            writing_prompt: prompt || undefined,
          });
      await saveJournalDraft(null);
      const r = saved.emotion_analysis;
      if (typeof r === "string") setReflection(r);
      else if (r && typeof r === "object") {
        const obj = r as Record<string, unknown>;
        const pick = obj.reflection ?? obj.summary ?? obj.emotion ?? obj.text;
        setReflection(typeof pick === "string" ? pick : null);
      }
      if (!entryId) {
        navigation.setParams({ entryId: saved.id });
      }
    } catch (e) {
      let msg = "Could not save your entry right now.";
      if (e instanceof NetworkError || e instanceof ApiError) msg = e.message;
      setError(msg);
      return;
    } finally {
      setBusy(false);
    }
  };

  const removeEntry = () => {
    if (!entryId || !token) return;
    Alert.alert("Delete this entry permanently?", title || "Journal entry", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await journal.remove(token, entryId);
            navigation.goBack();
          } catch {
            Alert.alert("Could not delete", "Please try again.");
          }
        },
      },
    ]);
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  if (loading) {
    return (
      <Screen padded>
        <AppHeader title="Journal" canGoBack />
        <AppText style={{ color: palette.textMuted }}>Loading entry…</AppText>
      </Screen>
    );
  }

  return (
    <Screen keyboard scroll padded>
      <AppHeader
        title={entryId ? "Edit entry" : "New entry"}
        subtitle={wordCount > 0 ? `${wordCount} word${wordCount > 1 ? "s" : ""}` : undefined}
        canGoBack
        right={entryId ? (
          <AppText variant="caption" style={{ color: palette.danger }} onPress={removeEntry}>
            Delete
          </AppText>
        ) : undefined}
      />

      <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 40 }}>
        <AppCard padded>
          <AppText variant="label" style={{ color: palette.textMuted, marginBottom: 6 }}>Writing prompt (optional)</AppText>
          <View style={styles.promptRow}>
            {JOURNAL_PROMPTS.map((p) => (
              <Chip key={p} label={p.length > 26 ? `${p.slice(0, 26)}…` : p} selected={prompt === p} onPress={() => setPrompt(p === prompt ? "" : p)} />
            ))}
          </View>
        </AppCard>

        {prompt ? (
          <AppCard padded accent>
            <AppText style={{ color: palette.brandDark }}>“{prompt}”</AppText>
          </AppCard>
        ) : null}

        <AppInput
          label="Title (optional)"
          placeholder="A short title"
          value={title}
          onChangeText={setTitle}
        />
        <AppInput
          label="Your entry"
          placeholder="Write freely — this is only for you."
          value={content}
          onChangeText={setContent}
          multiline
        />

        <View>
          <AppText variant="label" style={{ color: palette.textMuted, marginBottom: 8 }}>How did you feel? (optional)</AppText>
          <View style={styles.moods}>
            {Object.keys(MOOD_LABELS).map((m) => (
              <Chip key={m} label={`${MOOD_EMOJI[m] ?? ""} ${MOOD_LABELS[m]}`} selected={mood === m} onPress={() => setMood(mood === m ? null : m)} />
            ))}
          </View>
        </View>

        {error ? (
          <AppCard style={{ borderColor: palette.danger, backgroundColor: palette.dangerSoft }}>
            <AppText variant="caption" bold style={{ color: palette.danger }}>{error}</AppText>
            <AppText variant="caption" style={{ color: palette.textMuted, marginTop: 4 }}>
              Your words are still on this screen — tap Save to retry when your connection is back.
            </AppText>
          </AppCard>
        ) : null}

        {reflection ? (
          <AppCard padded accent>
            <AppText variant="subtitle" bold style={{ color: palette.brandDark }}>Reflection</AppText>
            <AppText style={{ color: palette.textMuted, marginTop: 6 }}>{reflection}</AppText>
            <AppText variant="caption" style={{ color: palette.textFaint, marginTop: 8 }}>
              AI-generated reflection — not clinical advice.
            </AppText>
          </AppCard>
        ) : null}

        <AppButton label={entryId ? "Save changes" : "Save entry"} onPress={() => void save()} loading={busy} disabled={busy} />

        <View style={styles.footerNote}>
          <Ionicons name="lock-closed" size={14} color={palette.textFaint} />
          <AppText variant="caption" style={{ color: palette.textFaint, flex: 1 }}>
            Journal entries are private to you and stored securely with your account.
          </AppText>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  promptRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  moods: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  footerNote: { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 8 },
});