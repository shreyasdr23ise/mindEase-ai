import React, { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useOnline } from "../lib/net";
import { emergency } from "../lib/services";
import { ApiError, NetworkError } from "../lib/api";
import { AppText } from "../components/AppText";
import { AppCard } from "../components/AppCard";
import { AppButton } from "../components/AppButton";
import { AppHeader } from "../components/AppHeader";
import { Screen } from "../components/Screen";
import { EmptyState, ErrorState, LoadingState, OfflineBanner } from "../components/States";
import type { EmergencyResource } from "../types";

const INDIA = [
  { name: "National Suicide Prevention Helpline", number: "9152987821", note: "AASRA · 24×7" },
  { name: "Emergency Medical Services", number: "108", note: "All-India emergency response" },
  { name: "Police", number: "100", note: "Emergency law enforcement" },
  { name: "KIRAN 24×7 Mental Health Helpline", number: "1800-599-0019", note: "Govt. of India" },
];

const callNumber = (num: string) => {
  const clean = num.replace(/[^0-9+]/g, "");
  Alert.alert("Call now?", `${num}`, [
    { text: "Cancel", style: "cancel" },
    { text: "Call", onPress: () => void Linking.openURL(`tel:${clean}`) },
  ]);
};

export function EmergencyScreen({ navigation }: { navigation: { navigate: (n: string, p?: unknown) => void } }) {
  const { palette } = useTheme();
  const { token } = useAuth();
  const { online } = useOnline();
  const [resources, setResources] = useState<EmergencyResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setResources(await emergency.list(token, "IN"));
      setError(null);
    } catch (e) {
      setError(e instanceof NetworkError || e instanceof ApiError ? e.message : "Could not load resources.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (online === false) setLoading(false);
    else void load();
  }, [online, load]);

  return (
    <Screen padded>
      <AppHeader title="Emergency resources" subtitle="Help is available — you deserve it" canGoBack />
      {online === false ? <OfflineBanner /> : null}

      <AppCard style={[styles.banner as ViewStyle, { borderColor: palette.danger, backgroundColor: palette.dangerSoft } as ViewStyle]}>
        <Ionicons name="warning" size={22} color={palette.danger} />
        <AppText style={{ color: palette.danger, lineHeight: 20 }}>
          If you or someone else is in immediate danger, call an emergency number now. Do not wait.
        </AppText>
      </AppCard>

      <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 40 }}>
        <View>
          <AppText variant="label" style={{ color: palette.textMuted }}>India · always available</AppText>
          {INDIA.map((r) => (
            <AppCard key={r.name} padded style={{ marginTop: 8, gap: 4 }}>
              <AppText variant="subtitle" bold>{r.name}</AppText>
              <AppText variant="caption" style={{ color: palette.textFaint }}>{r.note}</AppText>
              <AppButton label={`Call ${r.number}`} variant="secondary" onPress={() => callNumber(r.number)} style={{ marginTop: 8 }} />
            </AppCard>
          ))}
        </View>

        <AppText variant="label" style={{ color: palette.textMuted, marginTop: 6 }}>
          More resources {online === false ? "(offline — using cached list)" : ""}
        </AppText>
        {loading ? (
          <LoadingState label="Loading resources…" />
        ) : error && resources.length === 0 ? (
          <ErrorState message={error} onRetry={() => void load()} />
        ) : resources.length === 0 ? (
          <EmptyState icon="call-outline" title="No additional resources" message="The helplines above always work." />
        ) : (
          resources.map((r) => <EmergencyCard key={r.id} r={r} />)
        )}

        <AppButton
          label="Talk to MindEase now"
          variant="primary"
          onPress={() => navigation.navigate("Chat", {})}
        />
      </ScrollView>
    </Screen>
  );
}

function EmergencyCard({ r }: { r: EmergencyResource }) {
  const { palette } = useTheme();
  const number = r.crisis_helpline ?? r.emergency_number;
  return (
    <AppCard style={{ padding: 16, gap: 4, marginBottom: 10 }}>
      <AppText variant="subtitle" bold>{r.organization}</AppText>
      {r.description ? <AppText variant="caption" style={{ color: palette.textMuted }}>{r.description}</AppText> : null}
      {r.availability ? <AppText variant="caption" style={{ color: palette.textFaint }}>{r.availability}</AppText> : null}
      {number ? (
        <>
          <AppText variant="caption" style={{ color: palette.textFaint }}>{number}</AppText>
          <AppButton label="Call now" variant="secondary" onPress={() => callNumber(number)} style={{ marginTop: 8 }} />
        </>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  banner: { padding: 14, flexDirection: "row", gap: 10, alignItems: "center" },
});