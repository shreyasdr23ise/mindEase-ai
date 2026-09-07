import React, { useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AiOrb } from "../components/AiOrb";
import { AppText } from "../components/AppText";
import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { APP_NAME, APP_TAGLINE } from "../config";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Welcome">;

const FEATURES = [
  { icon: "chatbubble-ellipses-outline" as const, label: "Talk to MindEase, day or night" },
  { icon: "happy-outline" as const, label: "Track mood, stress and anxiety" },
  { icon: "leaf-outline" as const, label: "Breathing, grounding & CBT-inspired tools" },
  { icon: "shield-checkmark-outline" as const, label: "Privacy-first & crisis-safe by design" },
];

export function WelcomeScreen({ navigation }: Props) {
  const fade = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [fade]);

  return (
    <LinearGradient colors={["#0B1220", "#10313A", "#0FA3B3"]} style={StyleSheet.absoluteFill}>
      <SafeAreaView style={styles.safe}>
        <Animated.View style={[styles.content, { opacity: fade }]}>
          <AiOrb state="idle" size={120} />
          <AppText variant="hero" bold style={{ color: "#fff", marginTop: 20, textAlign: "center" }}>
            {APP_NAME}
          </AppText>
          <AppText style={{ color: "rgba(255,255,255,0.82)", textAlign: "center", marginTop: 8, paddingHorizontal: 20 }}>
            {APP_TAGLINE}
          </AppText>

          <View style={styles.features}>
            {FEATURES.map((f) => (
              <AppCard key={f.label} style={styles.featureCard}>
                <View style={styles.featureRow}>
                  <View style={[styles.iconChip, { backgroundColor: "rgba(255,255,255,0.12)" }]}>
                    <Ionicons name={f.icon} size={20} color="#FFFFFF" />
                  </View>
                  <AppText style={{ color: "#fff", flex: 1 }}>{f.label}</AppText>
                </View>
              </AppCard>
            ))}
          </View>

          <View style={styles.actions}>
            <AppButton label="Get Started" onPress={() => navigation.navigate("Register")} />
            <AppButton
              label="I already have an account"
              variant="ghost"
              onPress={() => navigation.navigate("Login")}
              labelStyle={{ color: "#c9ecef" }}
            />
          </View>

          <AppText variant="caption" style={{ color: "rgba(255,255,255,0.55)", textAlign: "center" }}>
            MindEase AI is an educational wellness companion, not a substitute for professional care.
          </AppText>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 22, gap: 6 },
  features: { width: "100%", marginTop: 24, gap: 10 },
  featureCard: { backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.14)" },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconChip: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actions: { width: "100%", marginTop: 28, gap: 10 },
});