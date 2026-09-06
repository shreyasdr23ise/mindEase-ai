import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  View,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useOnline } from "../lib/net";
import { chat } from "../lib/services";
import { ApiError, NetworkError } from "../lib/api";
import { AppText } from "../components/AppText";
import { AppInput } from "../components/AppInput";
import { ChatBubble } from "../components/ChatBubble";
import { AiOrb } from "../components/AiOrb";
import { TypingDots } from "../components/TypingDots";
import { EmptyState } from "../components/States";
import { IS_ANDROID } from "../config";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "ChatScreen">;

interface LocalMsg {
  key: string;
  role: "user" | "assistant";
  text: string;
  ts: string;
  failed?: boolean;
}

const STARTERS = [
  "I'm feeling stressed.",
  "Help me calm down.",
  "I want to talk about my day.",
  "Give me a breathing exercise.",
  "Help me understand what I'm feeling.",
  "Tell me about a medicine.",
];

let uid = 0;
const keyOf = () => `m${Date.now()}_${uid++}`;

export function ChatScreen({ navigation, route }: Props) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { online } = useOnline();

  const [convId, setConvId] = useState<string | undefined>(route.params?.conversationId);
  const [title, setTitle] = useState<string>(route.params?.title ?? "New chat");
  const [hadTitle] = useState<boolean>(!!route.params?.title);
  const [messages, setMessages] = useState<LocalMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(!!route.params?.conversationId);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [streamingKey, setStreamingKey] = useState<string | null>(null);
  const [streamText, setStreamText] = useState("");

  const listRef = useRef<FlatList<LocalMsg>>(null);
  const streamTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  useEffect(() => {
    if (!convId || !token) return;
    (async () => {
      try {
        const detail = await chat.conversation(token, convId!);
        setTitle(detail.title);
        setMessages(
          detail.messages.map((m) => ({
            key: keyOf(),
            role: m.role === "user" ? "user" : "assistant",
            text: m.content,
            ts: m.created_at,
          }))
        );
        setLoadError(null);
      } catch (e) {
        setLoadError(
          e instanceof NetworkError || e instanceof ApiError ? e.message : "Could not load this conversation."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [convId, token]);

  useEffect(() => () => {
    if (streamTimer.current) clearInterval(streamTimer.current);
  }, []);

  const startReveal = (key: string, fullText: string) => {
    if (streamTimer.current) clearInterval(streamTimer.current);
    setStreamingKey(key);
    setStreamText("");
    let shown = 0;
    streamTimer.current = setInterval(() => {
      shown = Math.min(fullText.length, shown + 3);
      setStreamText(fullText.slice(0, shown));
      scrollToEnd();
      if (shown >= fullText.length) {
        if (streamTimer.current) clearInterval(streamTimer.current);
        setStreamingKey(null);
        setStreamText("");
      }
    }, 14);
  };

  const send = useCallback(
    async (raw: string, opts?: { rewrite?: boolean }) => {
      const text = (opts?.rewrite ? raw : raw.trim());
      if (!text || !token || sending) return;

      const shouldAppend = !opts?.rewrite;
      const userMsg: LocalMsg = { key: keyOf(), role: "user", text, ts: new Date().toISOString() };

      setInput("");
      setSending(true);
      setSendError(null);
      if (shouldAppend) setMessages((p) => [...p, userMsg]);
      scrollToEnd();

      try {
        const res = await chat.send(token, text, convId);
        setConvId((prev) => (prev === res.conversation_id ? prev : res.conversation_id));
        if (!hadTitle && messages.length <= 1 && res.conversation_id) {
          const auto = text.length > 42 ? `${text.slice(0, 42)}…` : text;
          setTitle(auto);
        }
        const aMsg: LocalMsg = {
          key: keyOf(),
          role: "assistant",
          text: res.response,
          ts: new Date().toISOString(),
        };
        setMessages((p) => [...p, aMsg]);
        startReveal(aMsg.key, res.response);
        if (res.is_crisis) {
          navigation.navigate("Crisis", { severity: res.crisis_severity ?? "high" });
        } else if (res.suggested_actions?.length) {
          setSuggestedChips(res.suggested_actions.slice(0, 3));
        }
      } catch (e) {
        const msg =
          e instanceof NetworkError || e instanceof ApiError ? e.message : "Something went wrong sending your message.";
        setSendError(msg);
        if (shouldAppend) {
          setMessages((p) => p.map((m) => (m.key === userMsg.key ? { ...m, failed: true } : m)));
        }
      } finally {
        setSending(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, convId, sending, navigation, hadTitle, messages.length]
  );

  const [suggestedChips, setSuggestedChips] = useState<string[]>([]);

  const retry = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user" && m.failed);
    if (lastUser) send(lastUser.text, { rewrite: true });
    else setSendError(null);
  };

  const regenerate = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user" && !m.failed);
    if (!lastUser) return;
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.key === lastUser.key);
      return idx >= 0 ? prev.slice(0, idx + 1) : prev;
    });
    void send(lastUser.text, { rewrite: true });
  };

  const newChat = () => {
    setConvId(undefined);
    setMessages([]);
    setTitle("New chat");
    setSuggestedChips([]);
    setSendError(null);
  };

  const deleteConv = () => {
    if (!convId || !token) return newChat();
    Alert.alert("Delete this conversation permanently?", title, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await chat.remove(token, convId);
          } catch {
            // Ignore — still clear locally.
          }
          navigation.goBack();
        },
      },
    ]);
  };

  const registerSend = () => {
    if (sending) return;
    const v = input.trim();
    if (!v) return;
    void send(v);
  };

  const empty = messages.length === 0 && !loading;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: palette.bg }]}
      behavior={IS_ANDROID ? undefined : "padding"}
    >
      <View style={[styles.header, { backgroundColor: palette.bg, paddingTop: insets.top + 4 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={24} color={palette.text} />
        </Pressable>
        <View style={[styles.orbMini, { backgroundColor: palette.brandSoft }]}>
          <AiOrb state="idle" size={26} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="subtitle" bold numberOfLines={1}>
            {title}
          </AppText>
          <AppText variant="caption" style={{ color: online === false ? palette.amber : palette.textFaint }}>
            {sending ? "MindEase is thinking…" : online === false ? "You're currently offline" : "MindEase AI"}
          </AppText>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="New chat" onPress={newChat} style={styles.headerBtn}>
          <Ionicons name="add" size={22} color={palette.text} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Delete conversation" onPress={deleteConv} style={styles.headerBtn}>
          <Ionicons name="trash-outline" size={20} color={palette.danger} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center98}>
          <AiOrb state="thinking" size={70} />
          <AppText variant="caption" style={{ color: palette.textMuted, marginTop: 10 }}>
            Loading conversation…
          </AppText>
        </View>
      ) : loadError ? (
        <View style={styles.center98}>
          <AppText style={{ color: palette.textMuted, textAlign: "center" }}>{loadError}</AppText>
          <Pressable onPress={() => setLoading(true)} style={styles.retryLink}>
            <AppText variant="subtitle" bold style={{ color: palette.brand }}>
              Retry
            </AppText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.key}
          contentContainerStyle={[styles.list, { paddingBottom: 16 }]}
          onContentSizeChange={scrollToEnd}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <EmptyState
                icon="sparkles"
                title="Talk to MindEase"
                message="A calm space to talk, reflect and feel supported. Start with a prompt below."
              />
              <View style={styles.starters}>
                {STARTERS.map((s) => (
                  <Pressable key={s} onPress={() => send(s)} disabled={sending} style={[styles.starter, { backgroundColor: palette.card, borderColor: palette.borderSoft }]}>
                    <AppText variant="caption" style={{ color: palette.brandDark }}>{s}</AppText>
                  </Pressable>
                ))}
              </View>
            </View>
          }
          renderItem={({ item, index }) => {
            const isStreaming = streamingKey === item.key;
            return (
              <ChatBubble
                role={item.role}
                text={isStreaming ? streamText : item.text}
                timestamp={item.ts}
                isLast={index === messages.length - 1}
              />
            );
          }}
          ListFooterComponent={
            sending ? (
              <View style={styles.typingRow}>
                <View style={styles.typingBubble}>
                  <TypingDots />
                </View>
                <AppText variant="caption" style={{ color: palette.textFaint }}>MindEase is replying…</AppText>
              </View>
            ) : sendError ? (
              <View style={styles.errWrap}>
                <AppText variant="caption" style={{ color: palette.danger }}>{sendError}</AppText>
                <Pressable onPress={retry} style={styles.retryChip}>
                  <Ionicons name="refresh" size={14} color={palette.brand} />
                  <AppText variant="caption" bold style={{ color: palette.brand }}>Retry</AppText>
                </Pressable>
              </View>
            ) : (
              suggestedChips.length > 0 && !sending ? (
                <View style={styles.chipsRow}>
                  {suggestedChips.map((c) => (
                    <Pressable key={c} onPress={() => send(c)} style={[styles.chip, { backgroundColor: palette.brandSoft }]}>
                      <AppText variant="caption" style={{ color: palette.brandDark }}>{c}</AppText>
                    </Pressable>
                  ))}
                </View>
              ) : null
            )
          }
        />
      )}

      <View style={[styles.composer, { backgroundColor: palette.bgElevated, paddingBottom: Math.max(insets.bottom, 10) }]}>
        <View style={styles.composerRow}>
          <AppInput
            placeholder={online === false ? "Offline — chat is unavailable" : "Message MindEase…"}
            value={input}
            onChangeText={setInput}
            multiline
            editable={online !== false}
            containerStyle={styles.inputBox}
            style={styles.inputText}
            submitBehavior="submit"
            onSubmitEditing={registerSend}
            returnKeyType="send"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            onPress={registerSend}
            disabled={sending || online === false || !input.trim()}
            style={[
              styles.sendBtn,
              { backgroundColor: sending || online === false ? palette.textFaint : palette.brand, opacity: input.trim() ? 1 : 0.5 },
            ]}
          >
            <Ionicons name="arrow-up" size={22} color="#ffffff" />
          </Pressable>
        </View>
        {!empty ? (
          <View style={styles.miniActions}>
            <Pressable onPress={regenerate} style={styles.miniBtn}>
              <Ionicons name="refresh" size={14} color={palette.textFaint} />
              <AppText variant="caption" style={{ color: palette.textFaint }}>Regenerate</AppText>
            </Pressable>
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 10, paddingBottom: 8 },
  headerBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  orbMini: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  center98: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  retryLink: { padding: 12 },
  list: { paddingHorizontal: 12, paddingTop: 8, flexGrow: 1 },
  emptyWrap: { paddingTop: 40 },
  starters: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", paddingTop: 6 },
  starter: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1 },
  typingRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 },
  typingBubble: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 18, alignSelf: "flex-start" },
  errWrap: { alignItems: "center", gap: 6, marginTop: 12 },
  retryChip: { flexDirection: "row", alignItems: "center", gap: 6, padding: 10 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8, justifyContent: "flex-end" },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  composer: { borderTopWidth: 1, borderTopColor: "#00000000", paddingHorizontal: 10, paddingTop: 8 },
  composerRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  inputBox: { flex: 1 },
  inputText: { minHeight: 44, maxHeight: 120 },
  sendBtn: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  miniActions: { flexDirection: "row", justifyContent: "flex-end", paddingTop: 6, paddingRight: 6 },
  miniBtn: { flexDirection: "row", alignItems: "center", gap: 4, padding: 6 },
});