import React, { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, View, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useOnline } from "../lib/net";
import { wellness as wellnessApi } from "../lib/services";
import { ApiError, NetworkError } from "../lib/api";
import { AppText } from "../components/AppText";
import { AppCard, Row, SectionLabel, Tag } from "../components/AppCard";
import { Chip } from "../components/Chip";
import { EmptyState, ErrorState, LoadingState, OfflineBanner } from "../components/States";
import { WELLNESS_CATEGORIES, type WellnessExercise } from "../types";

const CAT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  breathing: "body",
  grounding: "flower",
  mindfulness: "compass",
  stress_relief: "rainy",
  cbt: "build",
  sleep: "moon",
  positive_reflection: "sunny",
};

export function WellnessListScreen({ navigation }: { navigation: { navigate: (n: string, p?: unknown) => void } }) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { online } = useOnline();
  const [cat, setCat] = useState<string>("");
  const [items, setItems] = useState<WellnessExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const list = await wellnessApi.list(token, cat || undefined);
      setItems(list);
      setError(null);
    } catch (e) {
      setError(e instanceof NetworkError || e instanceof ApiError ? e.message : "Could not load wellness tools.");
    } finally {
      setLoading(false);
    }
  }, [token, cat]);

  useEffect(() => {
    if (online === false) setLoading(false);
    else void load();
  }, [online, load]);

  const openExercise = (ex: WellnessExercise) => {
    if (ex.category === "breathing") navigation.navigate("Breathing", { exerciseId: ex.id, title: ex.title, durationMinutes: ex.duration_minutes, instructions: ex.instructions });
    else if (ex.category === "grounding") navigation.navigate("Grounding", { exerciseId: ex.id, title: ex.title, instructions: ex.instructions });
    else if (ex.category === "cbt") navigation.navigate("Cbt", { exerciseId: ex.id, title: ex.title });
    else navigation.navigate("WellnessDetail", { id: ex.id, title: ex.title });
  };

  return (
    <FlatList
      style={{ backgroundColor: palette.bg }}
      contentContainerStyle={{ paddingHorizontal: 18, paddingTop: insets.top + 14, paddingBottom: 40, gap: 16 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => void load()} tintColor={palette.brand} />}
      data={[0]}
      keyExtractor={() => "w"}
      renderItem={() => (
        <>
          <View>
            <AppText variant="hero" bold>Wellness</AppText>
            <AppText style={{ color: palette.textMuted }}>Practical tools to steady yourself.</AppText>
          </View>

          {online === false ? <OfflineBanner /> : null}

          <View>
            <SectionLabel>Explore</SectionLabel>
            <View style={styles.exploreRow}>
              <AppCard onPress={() => navigation.navigate("MedicineSearch", {})} style={styles.exploreCard}>
                <View style={[styles.exploreIcon, { backgroundColor: palette.brandSoft }]}>
                  <Ionicons name="medkit" size={24} color={palette.brandDark} />
                </View>
                <AppText variant="subtitle" bold>Medicines</AppText>
                <AppText variant="caption" style={{ color: palette.textFaint }}>General information</AppText>
              </AppCard>
              <AppCard onPress={() => navigation.navigate("ProfessionalHelp", {})} style={styles.exploreCard}>
                <View style={[styles.exploreIcon, { backgroundColor: palette.brandSoft }]}>
                  <Ionicons name="people" size={24} color={palette.brandDark} />
                </View>
                <AppText variant="subtitle" bold>Professionals</AppText>
                <AppText variant="caption" style={{ color: palette.textFaint }}>When to seek help</AppText>
              </AppCard>
            </View>
          </View>

          <FlatList
            horizontal
            data={["", ...Object.keys(WELLNESS_CATEGORIES)]}
            keyExtractor={(c) => c || "all"}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item }) => (
              <Chip
                label={item ? WELLNESS_CATEGORIES[item] : "All"}
                selected={cat === item}
                onPress={() => setCat(item)}
              />
            )}
          />

          {loading && items.length === 0 ? (
            <LoadingState label="Loading exercises…" />
          ) : error && items.length === 0 ? (
            <ErrorState message={error} onRetry={() => void load()} />
          ) : (
            <>
              {items.length === 0 ? (
                <EmptyState
                  icon="leaf-outline"
                  title={cat ? "No exercises in this category yet" : "No exercises available"}
                  message="Try another category."
                />
              ) : null}
              {items.map((ex) => (
                <AppCard key={ex.id} onPress={() => openExercise(ex)} padded accent={ex.category === "breathing"}>
                  <Row>
                    <View style={[styles.exIcon, { backgroundColor: palette.brandSoft }]}>
                      <Ionicons name={CAT_ICONS[ex.category] ?? "sparkles"} size={22} color={palette.brandDark} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText variant="subtitle" bold>{ex.title}</AppText>
                      <AppText numberOfLines={2} style={{ color: palette.textMuted, marginTop: 2 }}>
                        {ex.description}
                      </AppText>
                    </View>
                  </Row>
                  <View style={styles.tags}>
                    <Tag text={`${ex.duration_minutes} min`} />
                    <Tag text={ex.difficulty} />
                    <Tag text={WELLNESS_CATEGORIES[ex.category]} />
                  </View>
                </AppCard>
              ))}
            </>
          )}
        </>
      )}
    />
  );
}

const styles = StyleSheet.create({
  exploreRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  exploreCard: { width: "47.5%", gap: 6 },
  exploreIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  exIcon: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  tags: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  quick: { flexDirection: "row", gap: 8, marginTop: 14 },
});