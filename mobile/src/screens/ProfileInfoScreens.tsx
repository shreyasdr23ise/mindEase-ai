import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { AppText } from "../components/AppText";
import { AppCard } from "../components/AppCard";
import { AppHeader } from "../components/AppHeader";
import { Screen } from "../components/Screen";

type Nav = { goBack: () => void };

export function AboutScreen({ navigation }: { navigation: Nav }) {
  const { palette } = useTheme();
  return (
    <Screen padded>
      <AppHeader title="About MindEase AI" canGoBack />
      <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 40 }}>
        <View style={styles.logo}>
          <View style={[styles.mark, { backgroundColor: palette.brand }]}>
            <Ionicons name="heart" size={34} color="#fff" />
          </View>
          <AppText variant="title" bold>MindEase AI</AppText>
          <AppText variant="caption" style={{ color: palette.textFaint }}>Version 1.0.0 · Android</AppText>
        </View>

        <AppCard padded style={{ gap: 6 }}>
          <AppText variant="subtitle" bold>Your space to talk, reflect and feel supported.</AppText>
          <AppText style={{ color: palette.textMuted, lineHeight: 21 }}>
            MindEase AI is an educational mental-wellness companion. Chat, track your mood, journal, try breathing
            or grounding exercises, and find general medicine information — all in one calm place.
          </AppText>
        </AppCard>

        <AppCard padded style={{ gap: 6 }}>
          <AppText variant="subtitle" bold>Important</AppText>
          <AppText style={{ color: palette.textMuted, lineHeight: 21 }}>
            MindEase AI is not a medical device, diagnosis, or replacement for therapy or emergency services.
            If you are in danger, call emergency services in your country right away.
          </AppText>
        </AppCard>

        <AppCard padded style={{ gap: 6 }}>
          <AppText variant="subtitle" bold>Built with care</AppText>
          <AppText style={{ color: palette.textMuted, lineHeight: 21 }}>
            React Native · Expo · FastAPI · Python. Made as a student project with honest safety and privacy
            design — no ads, no data resale.
          </AppText>
        </AppCard>
      </ScrollView>
    </Screen>
  );
}

export function PrivacyPolicyScreen({ navigation }: { navigation: Nav }) {
  const { palette } = useTheme();
  return (
    <Screen padded>
      <AppHeader title="Privacy policy" canGoBack />
      <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 40 }}>
        <DocAppCard
          title="What we collect"
          body="The least we need: your email, a display name, and the content you create (chats, mood logs, journal entries, wellness sessions). No contact list, photos, location or device identifiers are collected."
        />
        <DocAppCard
          title="How it’s used"
          body="Your content powers the assistant and your personal insights. It is never sold, shared with advertisers, or used to target you."
        />
        <DocAppCard
          title="Where it’s stored"
          body="On our secure backend, encrypted in transit (HTTPS). Your session token lives in your phone’s secure keystore. Your trusted contacts and reminder preferences stay on your device only."
        />
        <DocAppCard
          title="Your rights"
          body="Export everything you’ve saved, edit or delete any entry, or delete your whole account — all from within the app."
        />
        <DocAppCard
          title="Children"
          body="MindEase AI is not intended for users under 13. If a parent discovers a child account, they can request deletion."
        />
        <DocAppCard
          title="Not medical advice"
          body="Nothing here is a diagnosis or treatment recommendation. Always involve a qualified professional and your country’s crisis helplines when needed."
        />
      </ScrollView>
    </Screen>
  );
}

export function TermsScreen({ navigation }: { navigation: Nav }) {
  const { palette } = useTheme();
  return (
    <Screen padded>
      <AppHeader title="Terms of use" canGoBack />
      <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 40 }}>
        <DocAppCard
          title="Use MindEase AI responsibly"
          body="You agree to use the app for personal, non-commercial wellness purposes only. Don’t use it in ways that could harm anyone — including yourself."
        />
        <DocAppCard
          title="Medical disclaimer"
          body="MindEase AI provides general educational information. It does not diagnose, prescribe, treat or prevent any condition and is not a substitute for professional care. Medicine content especially must be verified with a doctor or pharmacist."
        />
        <DocAppCard
          title="Emergency"
          body="This app can never replace emergency services. In an emergency, contact local authorities immediately. If a safety concern is detected in a chat, the app will encourage crisis resources."
        />
        <DocAppCard
          title="Data & deletion"
          body="Your account and data can be deleted at any time from the privacy screen. We keep data no longer than needed and honour legal retention requests."
        />
        <DocAppCard
          title="Liability"
          body="To the maximum extent permitted by law, as an educational tool the app is provided ‘as is’, without warranties. Demo profiles do not represent real practitioners and no session or request creates a professional relationship."
        />
      </ScrollView>
    </Screen>
  );
}

function DocAppCard({ title, body }: { title: string; body: string }) {
  const { palette } = useTheme();
  return (
    <AppCard padded style={{ gap: 6 }}>
      <AppText variant="subtitle" bold>{title}</AppText>
      <AppText style={{ color: palette.textMuted, lineHeight: 21 }}>{body}</AppText>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  logo: { alignItems: "center", gap: 8, paddingVertical: 8 },
  mark: { width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});