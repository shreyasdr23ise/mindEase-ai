import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { AppText } from "./AppText";
import { Ionicons } from "@expo/vector-icons";
import { AppButton } from "./AppButton";

export function OfflineBanner() {
  const { palette } = useTheme();
  return (
    <View style={[styles.banner, { backgroundColor: palette.cardAlt }]}>
      <Ionicons name="cloud-offline-outline" size={16} color={palette.textMuted} />
      <AppText variant="caption" bold style={{ color: palette.textMuted, flex: 1 }}>
        You're currently offline. Live AI chat and sync are paused until you reconnect.
      </AppText>
    </View>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  const { palette } = useTheme();
  return (
    <View style={styles.center}>
      <View style={[styles.pill, { backgroundColor: palette.cardAlt }]}>
        <AppText variant="caption" style={{ color: palette.textMuted }}>
          {label}
        </AppText>
      </View>
    </View>
  );
}

export function EmptyState({
  icon = "file-tray-outline",
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { palette } = useTheme();
  return (
    <View style={[styles.center, { padding: 24, gap: 10 }]}>
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: palette.brandSoft },
        ]}
      >
        <Ionicons name={icon} size={30} color={palette.brand} />
      </View>
      <AppText variant="subtitle" style={{ textAlign: "center" }}>
        {title}
      </AppText>
      {message ? (
        <AppText style={{ textAlign: "center", color: palette.textMuted }}>{message}</AppText>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ width: "80%", marginTop: 8 }}>
          <AppButton label={actionLabel} onPress={onAction} variant="soft" />
        </View>
      ) : null}
    </View>
  );
}

export function ErrorState({
  message = "Unable to connect right now. Please check your internet connection and try again.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  const { palette } = useTheme();
  return (
    <View style={[styles.center, { padding: 24, gap: 10 }]}>
      <View style={[styles.iconCircle, { backgroundColor: palette.dangerSoft }]}>
        <Ionicons name="cloud-offline-outline" size={30} color={palette.danger} />
      </View>
      <AppText variant="subtitle" style={{ textAlign: "center" }}>
        {message}
      </AppText>
      {onRetry ? (
        <View style={{ width: "70%", marginTop: 8 }}>
          <AppButton label="Retry" onPress={onRetry} variant="soft" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    borderRadius: 14,
  },
  center: { alignItems: "center", justifyContent: "center", flex: 1, minHeight: 180 },
  pill: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
  },
});