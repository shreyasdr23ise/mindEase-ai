import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
  RefreshControl,
  TextInput,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useOnline } from "../lib/net";
import { chat } from "../lib/services";
import { ApiError, NetworkError } from "../lib/api";
import { AppText } from "../components/AppText";
import { AppCard } from "../components/AppCard";
import { AppInput } from "../components/AppInput";
import { AppSheet } from "../components/AppSheet";
import { AppButton } from "../components/AppButton";
import { EmptyState, ErrorState, LoadingState, OfflineBanner } from "../components/States";
import type { Conversation } from "../types";

function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (isNaN(t)) return "";
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function ChatListScreen({ navigation }: { navigation: { navigate: (n: string, p?: unknown) => void } }) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { online } = useOnline();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<Conversation | null>(null);
  const [sheet, setSheet] = useState<null | "rename" | "delete">(null);
  const [renameValue, setRenameValue] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const list = await chat.conversations(token);
      setConvs(list.sort((a, b) => b.updated_at.localeCompare(a.updated_at)));
      setError(null);
    } catch (e) {
      if (e instanceof NetworkError) setError(e.message);
      else if (e instanceof ApiError) setError(e.message);
      else setError("Could not load your conversations.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (online === false) {
      setLoading(false);
      setError("You're currently offline.");
    } else {
      void load();
    }
  }, [online, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const filtered = query.trim()
    ? convs.filter((c) => c.title.toLowerCase().includes(query.trim().toLowerCase()))
    : convs;

  const confirmDelete = () => {
    setSheet(null);
    if (!target || !token) return;
    Alert.alert("Delete this conversation permanently?", `${target.title}`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setBusy(true);
          try {
            await chat.remove(token, target.id);
            setConvs((p) => p.filter((c) => c.id !== target.id));
          } catch {
            Alert.alert("Could not delete", "Please check your connection and try again.");
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const doRename = async () => {
    if (!target || !token) return;
    const v = renameValue.trim();
    setSheet(null);
    if (!v || v === target.title) return;
    setBusy(true);
    try {
      const updated = await chat.rename(token, target.id, v);
      setConvs((p) => p.map((c) => (c.id === updated.id ? { ...c, title: updated.title } : c)));
    } catch {
      Alert.alert("Could not rename", "Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: palette.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <AppText variant="hero" bold>Chats</AppText>
          <AppText style={{ color: palette.textMuted }}>Your conversations with MindEase</AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="New chat"
          onPress={() => navigation.navigate("ChatScreen", {})}
          style={[styles.newBtn, { backgroundColor: palette.brand }]}
        >
          <Ionicons name="add" size={26} color="#ffffff" />
        </Pressable>
      </View>

      {online === false ? (
        <View style={{ paddingHorizontal: 16, paddingBottom: 6 }}>
          <OfflineBanner />
        </View>
      ) : null}

      <View style={styles.searchWrap}>
        <AppInput
          placeholder="Search chats"
          value={query}
          onChangeText={setQuery}
          left={<Ionicons name="search" size={18} color={palette.textFaint} />}
          right={query ? (
            <Pressable onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={18} color={palette.textFaint} />
            </Pressable>
          ) : undefined}
          containerStyle={styles.search}
        />
      </View>

      {loading ? (
        <LoadingState label="Loading conversations…" />
      ) : error && convs.length === 0 ? (
        <ErrorState message={error} onRetry={() => { setLoading(true); void load(); }} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="chatbubbles-outline"
          title={query ? "No chats match your search" : "Start a conversation"}
          message={
            query
              ? "Try a different search."
              : "MindEase is here to listen. Tap the + to begin a calm, private chat."
          }
          actionLabel={query ? undefined : "New chat"}
          onAction={query ? undefined : () => navigation.navigate("ChatScreen", {})}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.brand} />}
          renderItem={({ item }) => (
            <AppCard
              onPress={() => navigation.navigate("ChatScreen", { conversationId: item.id, title: item.title })}
              onLongPress={() => {
                setTarget(item);
                setSheet("delete");
              }}
              style={styles.convCard}
            >
              <View style={styles.convRow}>
                <View style={[styles.avatar, { backgroundColor: palette.brandSoft }]}>
                  <Ionicons name="chatbubble-ellipses" size={20} color={palette.brandDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="subtitle" bold numberOfLines={1}>
                    {item.title}
                  </AppText>
                  <AppText variant="caption" style={{ color: palette.textFaint }}>
                    Updated {relativeTime(item.updated_at)}
                  </AppText>
                </View>
                <Pressable
                  onPress={() => {
                    setTarget(item);
                    setSheet("rename");
                    setRenameValue(item.title);
                  }}
                  style={[styles.iconBtn, { backgroundColor: palette.cardAlt }]}
                >
                  <Ionicons name="ellipsis-horizontal" size={18} color={palette.textMuted} />
                </Pressable>
              </View>
            </AppCard>
          )}
        />
      )}

      <AppSheet
        visible={sheet === "rename"}
        onClose={() => setSheet(null)}
        title="Rename conversation"
      >
        <AppInput
          value={renameValue}
          onChangeText={setRenameValue}
          placeholder="Conversation title"
          autoFocus
          label="Title"
        />
        <View style={styles.sheetActions}>
          <AppButton label="Cancel" variant="ghost" onPress={() => setSheet(null)} />
          <AppButton label="Save" onPress={() => void doRename()} loading={busy} />
        </View>
      </AppSheet>

      <AppSheet visible={sheet === "delete"} onClose={() => setSheet(null)} title="Delete conversation">
        <AppText style={{ color: palette.textMuted }}>
          “{target?.title}” will be permanently removed. This cannot be undone.
        </AppText>
        <View style={styles.sheetActions}>
          <AppButton label="Cancel" variant="ghost" onPress={() => setSheet(null)} />
          <AppButton label="Delete" variant="danger" onPress={confirmDelete} loading={busy} />
        </View>
      </AppSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingBottom: 14, gap: 12 },
  newBtn: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  searchWrap: { paddingHorizontal: 16, marginBottom: 10 },
  search: { height: 46 },
  convCard: { marginBottom: 10 },
  convRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  iconBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  sheetActions: { flexDirection: "row", gap: 10, marginTop: 16, justifyContent: "flex-end" },
});