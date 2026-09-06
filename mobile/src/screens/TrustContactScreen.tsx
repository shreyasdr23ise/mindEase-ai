import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useOnline } from "../lib/net";
import { emergency } from "../lib/services";
import { AppText } from "../components/AppText";
import { AppCard } from "../components/AppCard";
import { AppButton } from "../components/AppButton";
import { AppHeader } from "../components/AppHeader";
import { AppInput } from "../components/AppInput";
import { Screen } from "../components/Screen";
import { OfflineBanner } from "../components/States";
import { loadTrustContacts, saveTrustContacts } from "../lib/storage";

export function TrustContactScreen({ navigation }: { navigation: { goBack: () => void } }) {
  const { palette } = useTheme();
  const { token } = useAuth();
  const { online } = useOnline();

  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [saved, setSaved] = useState<{ name: string; number: string }[]>([]);
  const [detail, setDetail] = useState<string | null>(null);

  const load = useCallback(async () => {
    const c = await loadTrustContacts();
    setSaved(c ?? []);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const add = () => {
    if (!name.trim()) {
      setDetail("Add a name.");
      return;
    }
    if (number.replace(/\D/g, "").length < 7) {
      setDetail("Please enter a valid phone number.");
      return;
    }
    const next = [...saved, { name: name.trim(), number: number.trim() }];
    setSaved(next);
    void saveTrustContacts(next);
    setName("");
    setNumber("");
    setDetail(null);
  };

  const remove = (i: number) => {
    const next = saved.filter((_, idx) => idx !== i);
    setSaved(next);
    void saveTrustContacts(next);
  };

  const reachable = online !== false;

  return (
    <Screen padded>
      <AppHeader title="Trusted contact" subtitle="Someone safe, saved offline" canGoBack />
      <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 40 }}>
        {online === false ? <OfflineBanner /> : null}
        <AppCard padded style={{ gap: 8 }}>
          <AppText variant="subtitle" bold>How this helps</AppText>
          <AppText style={{ color: palette.textMuted, lineHeight: 21 }}>
            In a hard moment you might not remember whose voice you need. Storing a trusted contact on your
            phone means it’s there even without the internet.
          </AppText>
        </AppCard>

        {saved.length > 0 ? (
          <AppCard padded style={{ gap: 10 }}>
            <AppText variant="subtitle" bold>Saved contacts</AppText>
            {saved.map((c, i) => (
              <View key={i} style={styles.savedRow}>
                <View style={[styles.avatar, { backgroundColor: palette.brandSoft }]}>
                  <Ionicons name="person" size={18} color={palette.brandDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText bold>{c.name}</AppText>
                  <AppText variant="caption" style={{ color: palette.textFaint }}>{c.number}</AppText>
                </View>
                <AppButton label="Call" variant="secondary" onPress={() => setDetail("Calls use your phone’s dialer.")} disabled={!reachable} />
                <Ionicons name="trash-outline" size={18} color={palette.danger} onPress={() => remove(i)} />
              </View>
            ))}
          </AppCard>
        ) : (
          <AppCard padded style={{ alignItems: "center", gap: 8 }}>
            <Ionicons name="person-add-outline" size={28} color={palette.textFaint} />
            <AppText style={{ color: palette.textFaint }}>No trusted contacts saved yet.</AppText>
          </AppCard>
        )}

        <AppCard padded style={{ gap: 12 }}>
          <AppText variant="subtitle" bold>Add someone</AppText>
          <AppInput label="Name" placeholder="e.g. Mom" value={name} onChangeText={setName} />
          <AppInput label="Phone number" placeholder="10-digit mobile number" value={number} onChangeText={setNumber} keyboardType="phone-pad" />
          {detail ? (
            <AppText variant="caption" style={{ color: detail.includes("add") || detail.includes("valid") ? palette.danger : palette.brandDark }}>
              {detail}
            </AppText>
          ) : null}
          <AppButton label="Save contact" onPress={add} />
          <AppText variant="caption" style={{ color: palette.textFaint }}>
            Stored only on this device — never uploaded.
          </AppText>
        </AppCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  savedRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
});