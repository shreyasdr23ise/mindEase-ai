import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, View, Alert, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useOnline } from "../lib/net";
import { journal } from "../lib/services";
import { ApiError, NetworkError } from "../lib/api";
import { AppText } from "../components/AppText";
import { AppCard } from "../components/AppCard";
import { AppInput } from "../components/AppInput";
import { EmptyState, ErrorState, LoadingState, OfflineBanner } from "../components/States";
import { MOOD_LABELS, MOOD_EMOJI, type JournalEntry } from "../types";

export function JournalListScreen({ navigation }: { navigation: { goBack: () => void; navigate: (n: string, p?: unknown) => void } }) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { online } = useOnline();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const list = await journal.list(token, query || undefined);
      setEntries(list);
      setError(null);
    } catch (e) {
      setError(e instanceof NetworkError || e instanceof ApiError ? e.message : "Could not load your journal.");
    } finally {
      setLoading(false);
    }
  }, [token, query]);

  useEffect(() => {
    if (online === false) setLoading(false);
    else void load();
  }, [online, load]);

  const removeEntry = (id: string, title: string) => {
    if (!token) return;
    Alert.alert("Delete this entry permanently?", title, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await journal.remove(token, id);
            setEntries((p) => p.filter((e) => e.id !== id));
          } catch {
            Alert.alert("Could not delete", "Please try again.");
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: palette.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={palette.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <AppText variant="hero" bold>Journal</AppText>
          <AppText style={{ color: palette.textMuted }}>Your private reflections</AppText>
        </View>
        <Pressable
          style={[styles.addBtn, { backgroundColor: palette.brand }]}
          onPress={() => navigation.navigate("JournalEditor", {})}
        >
          <Ionicons name="add" size={26} color="#fff" />
        </Pressable>
      </View>

      {online === false ? (
        <View style={{ paddingHorizontal: 16, paddingBottom: 6 }}>
          <OfflineBanner />
        </View>
      ) : null}

      <View style={{ paddingHorizontal: 16 }}>
        <AppInput
          placeholder="Search journal entries"
          value={query}
          onChangeText={setQuery}
          left={<Ionicons name="search" size={18} color={palette.textFaint} />}
          containerStyle={styles.search}
        />
      </View>

      {loading ? (
        <LoadingState label="Loading your journal…" />
      ) : error && entries.length === 0 ? (
        <ErrorState message={error} onRetry={() => { setLoading(true); void load(); }} />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(e) => e.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={() => void load()} tintColor={palette.brand} />}
          ListEmptyComponent={
            <EmptyState
              icon="book-outline"
              title={query ? "No entries match your search" : "A blank page awaits"}
              message={query ? "Try a different search." : "Writing can help you untangle how you feel. Start a private entry."}
              actionLabel={query ? undefined : "Write an entry"}
              onAction={query ? undefined : () => navigation.navigate("JournalEditor", {})}
            />
          }
          renderItem={({ item }) => (
            <AppCard onPress={() => navigation.navigate("JournalEditor", { entryId: item.id })} style={styles.entry}>
              <View style={styles.entryHeader}>
                <AppText variant="subtitle" bold numberOfLines={1} style={{ flex: 1 }}>
                  {item.title}
                </AppText>
                {item.mood ? (
                  <AppText style={{ fontSize: 16 }}>{MOOD_EMOJI[item.mood] ?? "📝"}</AppText>
                ) : null}
              </View>
              <AppText variant="caption" style={{ color: palette.textFaint }}>
                {new Date(item.created_at).toLocaleString()} · {item.word_count} words
              </AppText>
              <AppText numberOfLines={3} style={{ color: palette.textMuted, marginTop: 8 }}>
                {item.content}
              </AppText>
              <View style={styles.entryActions}>
                {item.mood ? (
                  <AppText variant="caption" style={{ color: palette.brandDark, marginTop: 6 }}>
                    Mood: {MOOD_LABELS[item.mood] ?? item.mood}
                  </AppText>
                ) : null}
                <Pressable onPress={() => removeEntry(item.id, item.title)} style={styles.delBtn}>
                  <Ionicons name="trash-outline" size={16} color={palette.danger} />
                  <AppText variant="caption" style={{ color: palette.danger }}>Delete</AppText>
                </Pressable>
              </View>
            </AppCard>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingBottom: 12 },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "#00000008" },
  addBtn: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  search: { height: 46 },
  entry: { marginBottom: 10 },
  entryHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  entryActions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  delBtn: { flexDirection: "row", alignItems: "center", gap: 4, padding: 8, marginTop: 4 },
});