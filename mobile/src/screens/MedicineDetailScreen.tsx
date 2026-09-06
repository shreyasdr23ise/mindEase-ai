import React, { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View, type ViewStyle } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useOnline } from "../lib/net";
import { medicine } from "../lib/services";
import { ApiError, NetworkError } from "../lib/api";
import { AppText } from "../components/AppText";
import { AppCard } from "../components/AppCard";
import { AppButton } from "../components/AppButton";
import { AppHeader } from "../components/AppHeader";
import { Screen } from "../components/Screen";
import { LoadingState } from "../components/States";
import type { MedicineInfo } from "../types";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "MedicineDetail">;

function join(val: string[] | null | undefined): string | null {
  if (!val || val.length === 0) return null;
  return val.join("\n• ");
}

function RowBlock({ rows }: { rows: { label: string; value?: string | null }[] }) {
  const { palette } = useTheme();
  return (
    <AppCard padded style={{ marginTop: 8 }}>
      {rows.map((r, i) => {
        if (!r.value) return null;
        return (
          <View key={i} style={[styles.blockRow, i > 0 ? { marginTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.cardAlt, paddingTop: 10 } : null]}>
            <AppText variant="caption" bold style={{ color: palette.textFaint, width: 130 }}>{r.label}</AppText>
            <AppText style={{ color: palette.text, flex: 1 }}>{r.value}</AppText>
          </View>
        );
      })}
    </AppCard>
  );
}

export function MedicineDetailScreen({ navigation, route }: Props) {
  const { palette } = useTheme();
  const { token } = useAuth();
  const { online } = useOnline();
  const [med, setMed] = useState<MedicineInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setMed(await medicine.show(token, route.params.id));
      setError(null);
    } catch (e) {
      setError(e instanceof NetworkError || e instanceof ApiError ? e.message : "Could not load this medicine.");
    } finally {
      setLoading(false);
    }
  }, [token, route.params.id]);

  useEffect(() => { if (online !== false) void load(); }, [online, load]);

  const shareCopy = () => {
    if (!med) return;
    Alert.alert("Share this info?", `${med.name} details can be shared via your device tools.`, [
      { text: "Cancel", style: "cancel" },
      { text: "OK" },
    ]);
  };

  if (loading) {
    return (
      <Screen padded>
        <AppHeader title={route.params.name ?? "Medicine"} canGoBack />
        <LoadingState label="Loading details…" />
      </Screen>
    );
  }

  if (!med) {
    return (
      <Screen padded>
        <AppHeader title="Medicine" canGoBack />
        <AppText style={{ color: palette.textMuted }}>{error ?? "Not found."}</AppText>
      </Screen>
    );
  }

  return (
    <Screen padded>
      <AppHeader title={`${med.name} info`} subtitle="Educational only" canGoBack right={
        <Ionicons name="share-social-outline" size={20} color={palette.textMuted} onPress={shareCopy} />
      } />
      <ScrollView contentContainerStyle={{ gap: 8, paddingBottom: 40 }}>
        <AppCard style={[styles.disclaimer as ViewStyle, { borderColor: palette.brand, backgroundColor: palette.brandSoft } as ViewStyle]}>
          <AppText variant="caption" bold style={{ color: palette.brandDark }}>
            Educational information only — not a prescription or personalized medical advice.
          </AppText>
        </AppCard>

        <AppCard padded>
          <AppText variant="title" bold>{med.name}</AppText>
          {med.generic_name ? <AppText style={{ color: palette.textMuted }}>{med.generic_name}</AppText> : null}
          <View style={styles.chips}>
            {med.category ? <View style={[styles.chip, { backgroundColor: palette.brandSoft }]}><AppText variant="caption" bold style={{ color: palette.brandDark }}>{med.category}</AppText></View> : null}
            {med.source ? <View style={[styles.chip, { backgroundColor: palette.cardAlt }]}><AppText variant="caption" style={{ color: palette.textMuted }}>{med.source}</AppText></View> : null}
          </View>
        </AppCard>

        {med.description ? (
          <>
            <AppText variant="label" style={{ color: palette.textMuted }}>Overview</AppText>
            <AppCard padded style={{ marginTop: 8 }}>
              <AppText style={{ color: palette.textMuted, lineHeight: 22 }}>{med.description}</AppText>
            </AppCard>
          </>
        ) : null}

        <RowBlock rows={[
          { label: "Common uses", value: med.common_uses },
          { label: "Side effects", value: join(med.side_effects) },
          { label: "Precautions", value: join(med.precautions) },
          { label: "Interactions", value: join(med.interaction_warnings) },
        ]} />

        {med.warnings && med.warnings.length > 0 ? (
          <>
            <AppText variant="label" style={{ color: palette.textMuted, marginTop: 8 }}>Safety</AppText>
            <AppCard style={[styles.safety as ViewStyle, { borderColor: palette.danger, backgroundColor: palette.dangerSoft, marginTop: 8 } as ViewStyle]}>
              <View style={styles.blockRow}>
                <Ionicons name="warning" size={18} color={palette.danger} />
                <AppText style={{ color: palette.danger, flex: 1 }}>{"• " + join(med.warnings)}</AppText>
              </View>
            </AppCard>
          </>
        ) : null}

        <AppButton
          label="Talk to a professional"
          variant="secondary"
          onPress={() => navigation.navigate("ProfessionalHelp")}
          style={{ marginTop: 8 }}
        />

        <View style={styles.footerNote}>
          <Ionicons name="shield-checkmark-outline" size={14} color={palette.textFaint} />
          <AppText variant="caption" style={{ color: palette.textFaint, flex: 1 }}>
            Every person responds differently. This is general educational content and does not replace medical advice.
          </AppText>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  disclaimer: { marginTop: 4 },
  chips: { flexDirection: "row", gap: 8, marginTop: 10 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  blockRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  safety: { padding: 12 },
  footerNote: { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 6 },
});