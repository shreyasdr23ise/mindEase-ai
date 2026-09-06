import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View, RefreshControl, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useOnline } from "../lib/net";
import { professional } from "../lib/services";
import { ApiError, NetworkError } from "../lib/api";
import { AppText } from "../components/AppText";
import { AppCard, Row, SectionLabel } from "../components/AppCard";
import { AppButton } from "../components/AppButton";
import { AppHeader } from "../components/AppHeader";
import { Screen } from "../components/Screen";
import { EmptyState, ErrorState, LoadingState, OfflineBanner } from "../components/States";
import type { Counselor } from "../types";

export function ProfessionalHelpScreen({ navigation }: { navigation: { navigate: (n: string, p?: unknown) => void } }) {
  const { palette } = useTheme();
  const { token } = useAuth();
  const { online } = useOnline();
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setCounselors(await professional.list(token));
      setError(null);
    } catch (e) {
      setError(e instanceof NetworkError || e instanceof ApiError ? e.message : "Could not load professionals.");
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
      <AppHeader title="Professional help" subtitle="We’re here — and so is help" canGoBack />
      <ScrollView
        contentContainerStyle={{ gap: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => void load()} tintColor={palette.brand} />}
      >
        {online === false ? <OfflineBanner /> : null}

        <AppCard style={[styles.danger as ViewStyle, { borderColor: palette.danger, backgroundColor: palette.dangerSoft } as ViewStyle]}>
          <AppText variant="subtitle" bold style={{ color: palette.danger }}>In an emergency?</AppText>
          <AppText style={{ color: palette.danger, marginTop: 4, lineHeight: 20 }}>
            If you’re thinking about harming yourself or feel unsafe right now, reach out to an emergency service immediately. It’s not weak to ask.
          </AppText>
          <AppButton label="Emergency resources" variant="secondary" onPress={() => navigation.navigate("Emergency", {})} style={{ marginTop: 12 }} />
        </AppCard>

        <AppCard padded>
          <AppText variant="subtitle" bold>Not sure where this fits?</AppText>
          <AppText style={{ color: palette.textMuted, marginTop: 4, lineHeight: 20 }}>
            MindEase AI is here to support you, but it is not a substitute for professional care. If your feelings feel heavy or last more than a couple of weeks, a therapist can help — that is a sign of strength.
          </AppText>
        </AppCard>

        <View>
          <SectionLabel>Counselor profiles</SectionLabel>
          <AppText variant="caption" style={{ color: palette.textFaint, marginTop: 2, marginBottom: 8 }}>
            These are demo profiles for illustration, not real practitioners.
          </AppText>
          {loading && counselors.length === 0 ? (
            <LoadingState label="Loading counselors…" />
          ) : error && counselors.length === 0 ? (
            <ErrorState message={error} onRetry={() => void load()} />
          ) : (
            counselors.slice(0, 4).map((c) => (
              <AppCard key={c.id} padded style={{ marginBottom: 10, gap: 6 }}>
                <Row>
                  <View style={[styles.avatar, { backgroundColor: palette.brandSoft }]}>
                    <AppText bold style={{ color: palette.brandDark }}>{(c.full_name || "C").charAt(0)}</AppText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="subtitle" bold>{c.full_name || "Counselor"}  <AppText variant="caption" style={{ color: palette.brandDark }}>DEMO PROFILE</AppText></AppText>
                    <AppText variant="caption" style={{ color: palette.textFaint }}>
                      {c.specialty}
                      {c.experience_years ? ` · ${c.experience_years}+ yrs` : ""}
                    </AppText>
                  </View>
                  {c.is_online ? <View style={[styles.onlineDot, { backgroundColor: palette.brand }]} /> : null}
                </Row>
                {c.bio ? <AppText numberOfLines={2} style={{ color: palette.textMuted }}>{c.bio}</AppText> : null}
                {c.consultation_fee ? (
                  <AppText variant="caption" style={{ color: palette.textMuted }}>
                    Session from ₹{c.consultation_fee}
                  </AppText>
                ) : null}
                <AppButton
                  label="Request session"
                  variant="secondary"
                  onPress={() => navigation.navigate("CounselorRequest", { counselorId: c.id, counselorName: c.full_name || "Counselor" })}
                />
              </AppCard>
            ))
          )}
          {!loading && !error && counselors.length === 0 ? (
            <EmptyState icon="people-outline" title="No profiles yet" message="Counselor profiles will appear here." />
          ) : null}
        </View>

        <View>
          <SectionLabel>When to talk to a professional</SectionLabel>
          <AppText variant="caption" style={{ color: palette.textFaint, marginBottom: 8 }}>
            It’s worth reaching out if any of these feel familiar for most of a fortnight:
          </AppText>
          {[
            "Your feelings make daily life hard",
            "You feel stuck, empty, or numb",
            "Sleep or appetite have changed",
            "You’re withdrawing from people you love",
          ].map((b) => (
            <AppCard key={b} padded style={{ marginBottom: 10 }}>
              <Row>
                <Ionicons name="help-circle-outline" size={18} color={palette.brandDark} />
                <AppText style={{ color: palette.textMuted, flex: 1 }}>{b}</AppText>
              </Row>
            </AppCard>
          ))}
        </View>

        <AppCard style={{ gap: 6 }}>
          <AppText variant="caption" style={{ color: palette.textFaint, lineHeight: 18 }}>
            MindEase AI is an educational support tool and is not a substitute for diagnosis, therapy, or emergency care.
          </AppText>
        </AppCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  danger: { padding: 14 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  onlineDot: { width: 10, height: 10, borderRadius: 5 },
});