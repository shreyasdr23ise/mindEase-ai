import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "../components/Screen";
import { AppHeader } from "../components/AppHeader";
import { AppText } from "../components/AppText";
import { AppInput } from "../components/AppInput";
import { AppButton } from "../components/AppButton";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { ApiError, NetworkError, isValidEmail } from "../lib/api";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { palette } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    if (!isValidEmail(email)) return setError("Please enter a valid email address.");
    if (!password) return setError("Please enter your password.");
    setLoading(true);
    try {
      await login(email.trim(), password);
      // AuthProvider holds the session; splash routing logic happens via auth state.
    } catch (e) {
      if (e instanceof NetworkError) setError(e.message);
      else if (e instanceof ApiError) setError(e.message);
      else setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen keyboard padded>
      <AppHeader title="Welcome back" subtitle="Sign in to continue" canGoBack />
      <View style={styles.body}>
        <AppInput
          label="Email"
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          left={<Ionicons name="mail-outline" size={18} color={palette.textFaint} />}
        />
        <AppInput
          label="Password"
          placeholder="Your password"
          secureTextEntry
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
          containerStyle={styles.spaced}
          left={<Ionicons name="lock-closed-outline" size={18} color={palette.textFaint} />}
        />

        {error ? (
          <AppText variant="caption" bold style={{ color: palette.danger, marginTop: 12 }}>
            {error}
          </AppText>
        ) : null}

        <View style={styles.buttonWrap}>
          <AppButton
            label="Sign In"
            onPress={submit}
            loading={loading}
            disabled={loading}
          />
        </View>

        <View style={styles.demo}>
          <AppText variant="caption" style={{ color: palette.textMuted, textAlign: "center" }}>
            Demo logins · demo@mindease.ai / demo123
            {"\n"}counselor@mindease.ai / counselor123
          </AppText>
        </View>

        <AppButton
          label="New here? Create an account"
          variant="soft"
          onPress={() => navigation.replace("Register")}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: 24 },
  spaced: { marginTop: 14 },
  buttonWrap: { marginTop: 22 },
  demo: { marginVertical: 16 },
});