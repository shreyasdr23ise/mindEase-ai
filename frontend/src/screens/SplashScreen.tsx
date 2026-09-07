import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { AiOrb } from "../components/AiOrb";
import { AppText } from "../components/AppText";
import { SPLASH_MS, APP_NAME, APP_TAGLINE } from "../config";
import type { RootStackParamList } from "../navigation/types";

export function SplashScreen() {
  const { palette } = useTheme();
  const { ready, token, user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(24)).current;
  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(rise, { toValue: 0, damping: 16, stiffness: 120, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => setMinElapsed(true), SPLASH_MS);
    return () => clearTimeout(t);
  }, [fade, rise]);

  useEffect(() => {
    if (!ready || !minElapsed) return;
    if (!token) navigation.replace("Welcome");
    else if (!user?.onboarding_completed) navigation.replace("Onboarding");
    else navigation.replace("MainTabs", { screen: "HomeTab", params: { screen: "Home" } });
  }, [ready, minElapsed, token, user, navigation]);

  return (
    <LinearGradient colors={["#0B1220", "#0E2A33", "#123A42"]} style={StyleSheet.absoluteFill}>
      <View style={styles.center}>
        <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }], alignItems: "center" }}>
          <AiOrb state="idle" size={140} />
          <AppText variant="hero" bold style={{ color: "#FFFFFF", marginTop: 28 }}>
            {APP_NAME}
          </AppText>
          <AppText style={{ color: "rgba(255,255,255,0.72)", marginTop: 10, textAlign: "center", paddingHorizontal: 30 }}>
            {APP_TAGLINE}
          </AppText>
        </Animated.View>
      </View>
      <AppText variant="caption" style={[styles.footer, { color: "rgba(255,255,255,0.4)" }]}>
        {palette.mode === "dark" ? "Emotional wellness companion" : "Emotional wellness companion"}
      </AppText>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  footer: { textAlign: "center", paddingBottom: 48 },
});