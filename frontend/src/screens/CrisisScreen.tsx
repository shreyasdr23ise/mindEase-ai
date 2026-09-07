import React, { useEffect, useRef } from "react";
import { Animated, ScrollView, StyleSheet, View, type ViewStyle } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { AppText } from "../components/AppText";
import { AppCard } from "../components/AppCard";
import { AppButton } from "../components/AppButton";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Crisis">;

export function CrisisScreen({ navigation, route }: Props) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const fade = useRef(new Animated.Value(0)).current;
  const severity = route.params?.severity;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [fade]);

  const urgent = severity === "high" || severity === "severe";

  return (
    <Animated.View style={[styles.root, { backgroundColor: palette.bg, paddingTop: insets.top, opacity: fade }]}>
      <View style={styles.header}>
        <AppText variant="hero" bold style={{ color: palette.danger }}>You matter</AppText>
        <AppText style={{ color: palette.textMuted, marginTop: 4, textAlign: "center", lineHeight: 22 }}>
          You’re going through something really hard, and you reached out. That takes courage.
          Please take a slow breath. You don’t have to face this alone.
        </AppText>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 30, gap: 14 }}>
        {urgent ? (
          <View style={[styles.urgent, { borderColor: palette.danger, backgroundColor: palette.dangerSoft }]}>
            <View style={styles.urgentRow}>
              <Ionicons name="warning" size={22} color={palette.danger} />
              <AppText variant="subtitle" bold style={{ color: palette.danger, flex: 1 }}>
                If you can’t keep yourself safe right now, that’s an emergency — not a burden.
              </AppText>
            </View>
            <AppButton label="Emergency resources" onPress={() => navigation.navigate("Emergency")} style={{ marginTop: 10 }} />
          </View>
        ) : null}

        <AppCard style={[styles.boost as ViewStyle, { borderColor: palette.brand, backgroundColor: palette.brandSoft } as ViewStyle]}>
          <AppText variant="subtitle" bold style={{ color: palette.brandDark }}>Right now, try</AppText>
          <AppText style={{ color: palette.brandDark, marginTop: 6, lineHeight: 21 }}>
            1. Look around and name 5 things you can see.
            {"\n"}2. Move your shoulders, stamp your feet gently.
            {"\n"}3. Breathe: in for 4, hold 4, out for 4.
            {"\n"}4. Tell yourself: “This feeling is real, and it will pass.”
          </AppText>
        </AppCard>

        <AppCard padded style={{ gap: 8 }}>
          <AppText variant="subtitle" bold>Someone you trust</AppText>
          <AppText style={{ color: palette.textMuted, lineHeight: 20 }}>
            A real voice helps more than any app. Tell a friend or family member how you’re feeling — out loud.
          </AppText>
          <AppButton label="Grounding 5-4-3-2-1" variant="secondary" onPress={() => navigation.navigate("Grounding", {})} />
        </AppCard>

        <AppCard padded style={{ gap: 8 }}>
          <AppText variant="subtitle" bold>Helplines · India</AppText>
          <PressableRow label="AASRA 24×7 — 9152987821" onPress={() => navigation.navigate("Emergency")} />
          <PressableRow label="KIRAN 24×7 — 1800-599-0019" onPress={() => navigation.navigate("Emergency")} />
        </AppCard>

        <AppCard padded style={{ gap: 8 }}>
          <AppText variant="subtitle" bold>Keep talking</AppText>
          <AppText style={{ color: palette.textMuted, lineHeight: 20 }}>
            I’m here, and I’m not going anywhere. Say whatever you need to.
          </AppText>
          <AppButton label="Continue in chat" variant="primary" onPress={() => navigation.navigate("ChatScreen", {})} />
        </AppCard>

        <AppText variant="caption" style={{ color: palette.textFaint, textAlign: "center", marginTop: 4, lineHeight: 18 }}>
          MindEase AI is an educational tool and cannot replace professional care.
        </AppText>
      </ScrollView>
    </Animated.View>
  );
}

function PressableRow({ label, onPress }: { label: string; onPress: () => void }) {
  const { palette } = useTheme();
  return (
    <View style={styles.prow}>
      <Ionicons name="call" size={16} color={palette.brandDark} />
      <AppButton label={label} variant="ghost" onPress={onPress} style={{ flex: 1, paddingHorizontal: 0 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { alignItems: "center", paddingHorizontal: 24, paddingVertical: 16 },
  urgent: { padding: 14, borderWidth: 1, borderRadius: 16 },
  urgentRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  boost: { padding: 14, borderWidth: 1, borderRadius: 16 },
  prow: { flexDirection: "row", alignItems: "center", gap: 4 },
});