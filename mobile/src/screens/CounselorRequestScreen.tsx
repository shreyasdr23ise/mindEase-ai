import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View, type ViewStyle } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useOnline } from "../lib/net";
import { professional } from "../lib/services";
import { ApiError, NetworkError } from "../lib/api";
import { AppText } from "../components/AppText";
import { AppCard } from "../components/AppCard";
import { AppButton } from "../components/AppButton";
import { AppHeader } from "../components/AppHeader";
import { AppInput } from "../components/AppInput";
import { Screen } from "../components/Screen";
import { OfflineBanner } from "../components/States";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "CounselorRequest">;

export function CounselorRequestScreen({ navigation, route }: Props) {
  const { palette } = useTheme();
  const { token } = useAuth();
  const { online } = useOnline();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [prefModes] = useState(["Video", "Call", "Chat"]);

  const send = async () => {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await professional.request(token, route.params.counselorId, message.trim() || undefined);
      setSent(true);
    } catch (e) {
      setError(e instanceof NetworkError || e instanceof ApiError ? e.message : "Could not send the request right now.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen keyboard scroll padded>
      <AppHeader title="Request a session" subtitle={`Reference profile: ${route.params.counselorName}`} canGoBack />
      {online === false ? <OfflineBanner /> : null}

      {sent ? (
        <View style={styles.center}>
          <View style={[styles.icon, { backgroundColor: palette.brandSoft }]}>
            <Ionicons name="checkmark" size={40} color={palette.brandDark} />
          </View>
          <AppText variant="title" bold style={{ textAlign: "center", marginTop: 16 }}>Request sent</AppText>
          <AppText style={{ color: palette.textMuted, textAlign: "center", marginTop: 8, lineHeight: 21 }}>
            Since profiles are demo-only, no one will respond — but reaching out is a skill. In real life, a professional would get back within a few days.
          </AppText>
          <AppButton label="Done" onPress={() => navigation.goBack()} style={{ marginTop: 24, alignSelf: "stretch" }} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 40 }}>
          <AppCard style={[styles.demo as ViewStyle, { borderColor: palette.brand, backgroundColor: palette.brandSoft } as ViewStyle]}>
            <AppText variant="caption" bold style={{ color: palette.brandDark }}>DEMO PROFILE</AppText>
            <AppText variant="caption" style={{ color: palette.brandDark, marginTop: 4 }}>
              This is for practising the flow. Requests are not sent to a real person.
            </AppText>
          </AppCard>

          <AppCard padded style={{ gap: 6 }}>
            <AppText variant="subtitle" bold>{route.params.counselorName}</AppText>
            <AppText variant="caption" style={{ color: palette.textFaint }}>Prefers {prefModes.join(" · ")}</AppText>
          </AppCard>

          <AppInput
            label="What would you like to work on? (optional)"
            placeholder="A few lines about what brings you here…"
            value={message}
            onChangeText={setMessage}
            multiline
          />

          {error ? (
            <AppCard style={{ borderColor: palette.danger, backgroundColor: palette.dangerSoft }}>
              <AppText variant="caption" bold style={{ color: palette.danger }}>{error}</AppText>
            </AppCard>
          ) : null}

          <AppButton label="Send request" onPress={() => void send()} loading={busy} disabled={busy || online === false} />
          <AppText variant="caption" style={{ color: palette.textFaint, textAlign: "center" }}>
            Your message is stored with your account and treated as confidential.
          </AppText>
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  demo: { padding: 12, marginTop: 4 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  icon: { width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center" },
});