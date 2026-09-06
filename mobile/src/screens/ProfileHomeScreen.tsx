import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, useThemeMode, useSetThemeMode } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { journal, mood, wellness } from "../lib/services";
import { AppText } from "../components/AppText";
import { AppCard } from "../components/AppCard";
import { Chip } from "../components/Chip";
import { Row } from "../components/AppCard";

type Nav = { navigate: (n: string, p?: unknown) => void };

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub?: string;
  screen: string;
}

export function ProfileHomeScreen({ navigation }: { navigation: Nav }) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, token, logout } = useAuth();
  const mode = useThemeMode();
  const setMode = useSetThemeMode();

  const [moodCount, setMoodCount] = useState<number | null>(null);
  const [journalCount, setJournalCount] = useState<number | null>(null);
  const [wellnessCount, setWellnessCount] = useState<number | null>(null);

  const loadStats = useCallback(async () => {
    if (!token) return;
    try {
      const [ml, jl, wl] = await Promise.all([
        mood.history(token),
        journal.list(token),
        wellness.sessions(token),
      ]);
      setMoodCount(ml.logs?.length ?? 0);
      setJournalCount(jl.length ?? 0);
      setWellnessCount(wl.length ?? 0);
    } catch {
      /* stats are best-effort */
    }
  }, [token]);

  useEffect(() => { void loadStats(); }, [loadStats]);

  const menu: MenuItem[][] = [
    [
      { icon: "shield-checkmark-outline", label: "Privacy & data", sub: "Export or delete your data", screen: "PrivacySettings" },
      { icon: "document-text-outline", label: "Export your data", sub: "Download everything as a file", screen: "ExportData" },
      { icon: "notifications-outline", label: "Notifications", sub: "A gentle daily check-in", screen: "NotificationsSettings" },
      { icon: "people-outline", label: "Trusted contact", sub: "Saved offline for hard moments", screen: "TrustContact" },
      { icon: "compass-outline", label: "Support guide", sub: "Real coping ideas", screen: "HelpGuide" },
    ],
    [
      { icon: "information-circle-outline", label: "About MindEase AI", sub: "Version, disclaimers", screen: "About" },
      { icon: "lock-closed-outline", label: "Privacy policy", screen: "PrivacyPolicy" },
      { icon: "reader-outline", label: "Terms of use", screen: "Terms" },
    ],
  ];

  return (
    <ScrollView
      style={{ backgroundColor: palette.bg }}
      contentContainerStyle={{ paddingHorizontal: 18, paddingTop: insets.top + 14, paddingBottom: 40, gap: 16 }}
    >
      <AppText variant="hero" bold>Profile</AppText>

      <AppCard padded style={{ gap: 10 }}>
        <Row>
          <View style={[styles.avatar, { backgroundColor: palette.brand }]}>
            <AppText variant="title" bold style={{ color: "#fff" }}>
              {(user?.full_name || user?.email || "M").charAt(0).toUpperCase()}
            </AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="subtitle" bold>{user?.full_name || "MindEase friend"}</AppText>
            <AppText variant="caption" style={{ color: palette.textMuted }}>{user?.email}</AppText>
          </View>
        </Row>
      </AppCard>

      <View style={styles.stats}>
        <Stat value={moodCount} label="Check-ins" />
        <Stat value={journalCount} label="Journal" />
        <Stat value={wellnessCount} label="Sessions" />
      </View>

      <View>
        <AppText variant="label" style={{ color: palette.textMuted, marginBottom: 8 }}>Appearance</AppText>
        <View style={styles.modes}>
          {(["light", "dark", "system"] as ("light" | "dark" | "system")[]).map((m) => (
            <Chip
              key={m}
              label={m === "system" ? "System" : m === "light" ? "Light" : "Dark"}
              selected={mode === m}
              onPress={() => setMode(m)}
            />
          ))}
        </View>
      </View>

      {menu.map((group, gi) => (
        <View key={gi} style={{ gap: 10 }}>
          {group.map((item) => (
            <AppCard key={item.label} onPress={() => navigation.navigate(item.screen)} padded>
              <Row>
                <Ionicons name={item.icon} size={20} color={palette.brandDark} />
                <View style={{ flex: 1 }}>
                  <AppText bold>{item.label}</AppText>
                  {item.sub ? <AppText variant="caption" style={{ color: palette.textFaint }}>{item.sub}</AppText> : null}
                </View>
                <Ionicons name="chevron-forward" size={16} color={palette.textFaint} />
              </Row>
            </AppCard>
          ))}
        </View>
      ))}

      <AppCard onPress={() => void logout()} style={[styles.logout as ViewStyle, { backgroundColor: palette.dangerSoft } as ViewStyle]}>
        <Row>
          <Ionicons name="log-out-outline" size={20} color={palette.danger} />
          <AppText bold style={{ color: palette.danger }}>Log out</AppText>
        </Row>
      </AppCard>

      <AppText variant="caption" style={{ color: palette.textFaint, textAlign: "center" }}>
        MindEase AI v1.0.0 · Educational support, not medical care
      </AppText>
    </ScrollView>
  );
}

function Stat({ value, label }: { value: number | null; label: string }) {
  const { palette } = useTheme();
  return (
    <AppCard padded style={{ flex: 1, alignItems: "center", gap: 2 }}>
      <AppText variant="title" bold>{value ?? "–"}</AppText>
      <AppText variant="caption" style={{ color: palette.textFaint }}>{label}</AppText>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  stats: { flexDirection: "row", gap: 10 },
  modes: { flexDirection: "row", gap: 8 },
  logout: { padding: 14 },
});