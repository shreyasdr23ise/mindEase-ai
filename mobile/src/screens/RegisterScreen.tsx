import React, { useEffect, useState } from "react";
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
import { sanitize } from "../lib/storage";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const { palette } = useTheme();
  const { register, token, user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // New accounts finish onboarding before entering the app.
  useEffect(() => {
    if (!token) return;
    if (!user?.onboarding_completed) navigation.replace("Onboarding");
    else navigation.replace("MainTabs", { screen: "HomeTab", params: { screen: "Home" } });
  }, [token, user, navigation]);

  const submit = async () => {
    setError(null);
    const uname = sanitize(username);
    if (!isValidEmail(email)) return setError("Please enter a valid email address.");
    if (uname.length < 3) return setError("Username must be at least 3 characters.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setLoading(true);
    try {
      await register({
        email: email.trim(),
        username: uname,
        password,
        full_name: fullName.trim() || undefined,
      });
    } catch (e) {
      if (e instanceof NetworkError) setError(e.message);
      else if (e instanceof ApiError) setError(e.message);
      else setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <Screen keyboard padded>
      <AppHeader title="Create account" subtitle="Your space to talk, reflect and feel supported." canGoBack />
      <View style={styles.body}>
        <AppInput label="Full name (optional)" placeholder="How should we know you?" value={fullName} onChangeText={setFullName}
          left={<Ionicons name="person-outline" size={18} color={palette.textFaint} />} />
        <AppInput label="Username" placeholder="e.g. aarav" autoCapitalize="none" value={username} onChangeText={setUsername} containerStyle={styles.spaced}
          left={<Ionicons name="at-outline" size={18} color={palette.textFaint} />} />
        <AppInput label="Email" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" autoComplete="email" value={email} onChangeText={setEmail} containerStyle={styles.spaced}
          left={<Ionicons name="mail-outline" size={18} color={palette.textFaint} />} />
        <AppInput label="Password" placeholder="At least 6 characters" secureTextEntry autoComplete="new-password" value={password} onChangeText={setPassword} containerStyle={styles.spaced}
          left={<Ionicons name="lock-closed-outline" size={18} color={palette.textFaint} />} />
        <AppInput label="Confirm password" placeholder="Repeat your password" secureTextEntry autoComplete="new-password" value={confirm} onChangeText={setConfirm} containerStyle={styles.spaced}
          left={<Ionicons name="lock-closed-outline" size={18} color={palette.textFaint} />} />

        {error ? (
          <AppText variant="caption" bold style={{ color: palette.danger, marginTop: 12 }}>
            {error}
          </AppText>
        ) : null}

        <View style={styles.buttonWrap}>
          <AppButton label="Create my account" onPress={submit} loading={loading} disabled={loading} />
        </View>
        <AppButton label="Already have an account? Sign in" variant="ghost" onPress={() => navigation.replace("Login")} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: 20 },
  spaced: { marginTop: 14 },
  buttonWrap: { marginTop: 22 },
});