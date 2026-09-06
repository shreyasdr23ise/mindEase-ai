import React, { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useOnline } from "../lib/net";
import { privacy } from "../lib/services";
import { ApiError, NetworkError } from "../lib/api";
import { AppText } from "../components/AppText";
import { AppCard } from "../components/AppCard";
import { AppButton } from "../components/AppButton";
import { AppHeader } from "../components/AppHeader";
import { Screen } from "../components/Screen";
import { LoadingState } from "../components/States";
import { loadReminderEnabled, saveReminderEnabled } from "../lib/storage";

export { AboutScreen, PrivacyPolicyScreen, TermsScreen } from "./ProfileInfoScreens";

type Nav = { goBack: () => void; navigate: (n: string, p?: unknown) => void };

// ── Privacy & data ────────────────────────────────────────────────────────
export function PrivacySettingsScreen({ navigation }: { navigation: Nav }) {
  const { palette } = useTheme();
  const { token, user, logout } = useAuth();
  const { online } = useOnline();
  const [settings, setSettings] = useState<{ share_mood_data: boolean; share_journal: boolean; allow_analytics: boolean; data_retention_days: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setSettings(await privacy.settings(token));
    } catch {
      /* non-critical */
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const update = (key: "share_mood_data" | "share_journal" | "allow_analytics", value: boolean) => {
    if (!token || !settings) return;
    setSettings({ ...settings, [key]: value });
    void privacy.updateSettings(token, { [key]: value, data_retention_days: settings.data_retention_days }).catch(() => {
      Alert.alert("Could not save", "Please try again when you’re back online.");
    });
  };

  const deleteAccount = () => {
    if (!token) return;
    Alert.alert(
      "Delete your account?",
      "This permanently deletes your messages, mood logs, journal entries and data. It cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setBusy(true);
            privacy.deleteAccount(token)
              .then(() => { setBusy(false); void logout(); })
              .catch(() => { setBusy(false); Alert.alert("Could not delete", "Please try again later."); });
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <Screen padded>
        <AppHeader title="Privacy & data" canGoBack />
        <LoadingState label="Loading settings…" />
      </Screen>
    );
  }

  return (
    <Screen padded>
      <AppHeader title="Privacy & data" canGoBack />
      <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 40 }}>
        {online === false ? (
          <AppCard style={{ borderColor: palette.brand, backgroundColor: palette.brandSoft }}>
            <AppText variant="caption" bold style={{ color: palette.brandDark }}>
              You’re offline — changes here will be saved when your connection returns.
            </AppText>
          </AppCard>
        ) : null}

        <AppCard padded style={{ gap: 4 }}>
          <RowToggle
            label="Share mood data"
            hint="Used to personalise gentle insights"
            value={settings?.share_mood_data ?? true}
            onChange={(v) => update("share_mood_data", v)}
          />
          <Divider />
          <RowToggle
            label="Share journal reflections"
            hint="We never read this for ads"
            value={settings?.share_journal ?? false}
            onChange={(v) => update("share_journal", v)}
          />
          <Divider />
          <RowToggle
            label="Allow anonymous analytics"
            hint="Helps us improve, no personal info"
            value={settings?.allow_analytics ?? true}
            onChange={(v) => update("allow_analytics", v)}
          />
        </AppCard>

        <AppCard padded>
          <AppText variant="subtitle" bold>Your data, your rights</AppText>
          <AppText style={{ color: palette.textMuted, marginTop: 6, lineHeight: 21 }}>
            You can export everything you’ve saved, or delete your account and all of it, at any time.
          </AppText>
          <AppButton label="Export my data" variant="secondary" onPress={() => navigation.navigate("ExportData")} style={{ marginTop: 12 }} />
        </AppCard>

        <AppCard style={{ borderColor: palette.danger, backgroundColor: palette.dangerSoft }}>
          <View style={styles.dangerRow}>
            <Ionicons name="trash-outline" size={18} color={palette.danger} />
            <AppText variant="caption" bold style={{ color: palette.danger }}>
              {user?.email} · delete this account
            </AppText>
          </View>
          <AppButton label="Delete account" variant="ghost" onPress={deleteAccount} loading={busy} disabled={busy} labelStyle={{ color: palette.danger }} />
        </AppCard>
      </ScrollView>
    </Screen>
  );
}

// ── Export data ───────────────────────────────────────────────────────────
export function ExportDataScreen({ navigation }: { navigation: Nav }) {
  const { palette } = useTheme();
  const { token } = useAuth();
  const { online } = useOnline();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const doExport = async () => {
    if (!token) return;
    setBusy(true);
    try {
      const data = await privacy.exportData(token);
      const json = JSON.stringify(data, null, 2);
      Alert.alert("Export generated", `Your data export is ${(json.length / 1024).toFixed(0)} KB of JSON. Copy it somewhere safe, then delete this copy.`, [
        { text: "OK" },
      ]);
      setDone(true);
    } catch (e) {
      Alert.alert("Export failed", e instanceof NetworkError || e instanceof ApiError ? e.message : "Please try again later.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen padded>
      <AppHeader title="Export your data" subtitle="Everything you’ve saved, in one JSON file" canGoBack />
      <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 40 }}>
        <AppCard padded style={{ gap: 8 }}>
          <Ionicons name="shield-checkmark-outline" size={28} color={palette.brandDark} />
          <AppText style={{ color: palette.textMuted, lineHeight: 21 }}>
            This includes your chat messages, mood logs, journal entries, wellness sessions and profile data. It’s yours — take it anywhere.
          </AppText>
          <AppText variant="caption" style={{ color: palette.textFaint }}>Generated on demand; nothing leaves your device except the file we show you.</AppText>
        </AppCard>
        <AppButton label="Generate export" onPress={() => void doExport()} loading={busy} disabled={busy || online === false} />
        {done ? <AppText variant="caption" style={{ color: palette.brandDark, textAlign: "center" }}>Export ready in the dialog above.</AppText> : null}
      </ScrollView>
    </Screen>
  );
}

// ── Notifications (optional, gentle daily check-in) ───────────────────────
export function NotificationsSettingsScreen({ navigation }: { navigation: Nav }) {
  const { palette } = useTheme();
  const [enabled, setEnabled] = useState(false);
  const [perm, setPerm] = useState<"granted" | "denied" | "undetermined">("undetermined");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const saved = await loadReminderEnabled();
      let p: "granted" | "denied" | "undetermined" = "undetermined";
      try {
        const s = await Notifications.getPermissionsAsync();
        p = s.granted ? "granted" : s.status === "denied" ? "denied" : "undetermined";
      } catch { /* not available */ }
      setPerm(p);
      setEnabled(saved && p === "granted");
      setLoading(false);
    })();
  }, []);

  const apply = async (wantOn: boolean) => {
    setEnabled(wantOn);
    await saveReminderEnabled(wantOn);
    try {
      if (wantOn) {
        const p = await Notifications.requestPermissionsAsync();
        if (!p.granted) {
          setPerm("denied");
          setEnabled(false);
          await saveReminderEnabled(false);
          Alert.alert("Permission needed", "Enable notifications in your phone settings to use gentle reminders.");
          return;
        }
        setPerm("granted");
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "MindEase AI",
            body: "Time for your wellness check-in.",
            sound: true,
          },
          trigger: { type: "calendar", hour: 10, minute: 0, repeats: true } as unknown as Notifications.NotificationTriggerInput,
        });
      } else {
        await Notifications.cancelAllScheduledNotificationsAsync();
      }
    } catch {
      /* offline/unsupported — just persist the preference */
    }
  };

  return (
    <Screen padded>
      <AppHeader title="Notifications" subtitle="A gentle daily check-in — never spam" canGoBack />
      <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 40 }}>
        <AppCard padded style={{ gap: 10 }}>
          <View style={styles.dangerRow}>
            <View style={{ flex: 1 }}>
              <AppText bold>Daily check-in reminder</AppText>
              <AppText variant="caption" style={{ color: palette.textFaint }}>Every day at 10:00 AM · “Time for your wellness check-in.”</AppText>
            </View>
            <Switch
              value={enabled}
              onValueChange={(v) => void apply(v)}
              trackColor={{ true: palette.brand, false: palette.cardAlt }}
              thumbColor="#ffffff"
              disabled={loading}
            />
          </View>
          {perm === "denied" ? (
            <AppText variant="caption" style={{ color: palette.danger }}>
              Notifications are blocked for this app. Allow them in system settings, then come back.
            </AppText>
          ) : (
            <AppText variant="caption" style={{ color: palette.textFaint }}>
              Reminders are stored on this device and never sent anywhere.
            </AppText>
          )}
        </AppCard>
        <AppCard padded>
          <AppText variant="subtitle" bold>We’ll never</AppText>
          <AppText style={{ color: palette.textMuted, marginTop: 6, lineHeight: 21 }}>
            • send marketing or spam{'\n'}
            • share your data with ad networks{'\n'}
            • send more than one gentle nudge a day
          </AppText>
        </AppCard>
      </ScrollView>
    </Screen>
  );
}

function RowToggle({ label, hint, value, onChange }: { label: string; hint: string; value: boolean; onChange: (v: boolean) => void }) {
  const { palette } = useTheme();
  return (
    <View style={styles.dangerRow}>
      <View style={{ flex: 1 }}>
        <AppText bold>{label}</AppText>
        <AppText variant="caption" style={{ color: palette.textFaint }}>{hint}</AppText>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: palette.brand, false: palette.cardAlt }} thumbColor="#ffffff" />
    </View>
  );
}

function Divider() {
  const { palette } = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: palette.cardAlt, marginVertical: 10 }} />;
}

const styles = StyleSheet.create({
  dangerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
});