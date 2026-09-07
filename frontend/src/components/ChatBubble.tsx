import React from "react";
import { Pressable, StyleSheet, View, Linking } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { AppText } from "./AppText";
import { AiOrb } from "./AiOrb";
import * as Clipboard from "expo-clipboard";
import { IS_ANDROID } from "../config";

interface Props {
  role: "user" | "assistant";
  text: string;
  timestamp?: string;
  isLast?: boolean;
  onPress?: () => void;
}

function formatTime(ts?: string): string {
  if (!ts) return "";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function renderBody(text: string, color: string) {
  // Split out URLs so they become tappable.
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) => {
    if (/^https?:\/\//.test(part)) {
      return (
        <AppText
          key={i}
          style={{ color, textDecorationLine: "underline" }}
          onPress={() => Linking.openURL(part).catch(() => {})}
        >
          {part}
        </AppText>
      );
    }
    return (
      <AppText key={i} style={{ color }}>
        {part}
      </AppText>
    );
  });
}

export function ChatBubble({ role, text, timestamp, isLast, onPress }: Props) {
  const { palette } = useTheme();
  const isUser = role === "user";

  const copy = async () => {
    try {
      await Clipboard.setStringAsync(text);
    } catch {
      // Clipboard unavailable — ignore.
    }
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={copy}
      style={[
        styles.row,
        { justifyContent: isUser ? "flex-end" : "flex-start" },
        (isLast ?? false) && { marginBottom: 6 },
      ]}
    >
      {!isUser ? (
        <View style={styles.avatarWrap}>
          <AiOrb state="idle" size={30} />
        </View>
      ) : null}
      <View
        style={[
          styles.bubble,
          isUser
            ? { backgroundColor: palette.brand, borderBottomRightRadius: 6 }
            : { backgroundColor: palette.card, borderColor: palette.borderSoft, borderBottomLeftRadius: 6 },
        ]}
      >
        {renderBody(text, isUser ? "#ffffff" : palette.text)}
        <View style={styles.metaRow}>
          <AppText
            variant="caption"
            style={{ color: isUser ? "rgba(255,255,255,0.7)" : palette.textFaint, fontSize: 10, marginTop: 4 }}
          >
            {formatTime(timestamp)}
            {!isUser ? " · long-press to copy" : ""}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginTop: 10 },
  avatarWrap: { width: 34 },
  bubble: {
    maxWidth: IS_ANDROID ? "78%" : "78%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  metaRow: { flexDirection: "row", justifyContent: "flex-end" },
});