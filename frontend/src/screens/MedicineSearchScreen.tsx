import React, { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, View, RefreshControl, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useOnline } from "../lib/net";
import { medicine } from "../lib/services";
import { ApiError, NetworkError } from "../lib/api";
import { AppText } from "../components/AppText";
import { AppCard } from "../components/AppCard";
import { AppInput } from "../components/AppInput";
import { Chip } from "../components/Chip";
import { EmptyState, ErrorState, LoadingState, OfflineBanner } from "../components/States";
import { MEDICINE_CATEGORIES, type MedicineInfo } from "../types";

export function MedicineSearchScreen({ navigation }: { navigation: { navigate: (n: string, p?: unknown) => void } }) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { online } = useOnline();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("");
  const [items, setItems] = useState<MedicineInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (q: string, c: string) => {
    if (!token) return;
    try {
      setLoading(true);
      const list = q.trim()
        ? await medicine.search(token, q.trim())
        : await medicine.list(token, c || undefined);
      setItems(list.medicines);
      setError(null);
      setSearched(true);
    } catch (e) {
      setError(e instanceof NetworkError || e instanceof ApiError ? e.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (online === false) {
      setLoading(false);
      setSearched(true);
    } else {
      void search("", "");
    }
  }, [online]);

  return (
    <FlatList
      style={{ backgroundColor: palette.bg }}
      contentContainerStyle={{ paddingHorizontal: 18, paddingTop: insets.top + 14, paddingBottom: 40, gap: 16 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => void search(query, cat)} tintColor={palette.brand} />}
      data={[0]}
      keyExtractor={() => "m"}
      ListHeaderComponent={
        <>
          <View>
            <Ionicons name="medkit-outline" size={26} color={palette.brandDark} />
            <AppText variant="hero" bold>Medicine Information Center</AppText>
            <AppCard style={[styles.disclaimer as ViewStyle, { borderColor: palette.brand, backgroundColor: palette.brandSoft } as ViewStyle]}>
              <AppText variant="caption" bold style={{ color: palette.brandDark }}>
                Educational information only — not a prescription or personalized medical advice.
              </AppText>
            </AppCard>
            <AppText variant="caption" style={{ color: palette.textFaint }}>
              Always verify with your doctor or pharmacist before taking or stopping any medicine.
            </AppText>
          </View>

          {online === false ? <OfflineBanner /> : null}

          <AppInput
            placeholder="Search a medicine or condition"
            value={query}
            onChangeText={(t) => {
              setQuery(t);
              void search(t, cat);
            }}
            left={<Ionicons name="search" size={18} color={palette.textFaint} />}
          />

          <FlatList
            horizontal
            data={["", ...Object.keys(MEDICINE_CATEGORIES)]}
            keyExtractor={(c) => c || "all"}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item }) => (
              <Chip
                label={item ? MEDICINE_CATEGORIES[item] : "All"}
                selected={cat === item}
                onPress={() => {
                  setCat(item);
                  void search(query, item);
                }}
              />
            )}
          />
        </>
      }
      renderItem={() => (
        <View style={{ gap: 14 }}>
          {loading ? (
            <LoadingState label="Searching…" />
          ) : error ? (
            <ErrorState message={error} onRetry={() => void search(query, cat)} />
          ) : searched && items.length === 0 ? (
            <EmptyState icon="medkit-outline" title="No results" message="Try a different name or category." />
          ) : (
            items.map((m) => (
              <AppCard key={m.id} onPress={() => navigation.navigate("MedicineDetail", { id: m.id, name: m.name })} padded>
                <View style={styles.row}>
                  <View style={[styles.icon, { backgroundColor: palette.brandSoft }]}>
                    <Ionicons name="medkit" size={22} color={palette.brandDark} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="subtitle" bold>{m.name}</AppText>
                    <AppText variant="caption" style={{ color: palette.textFaint }}>
                      {m.category ?? "General"} · {m.generic_name ?? ""}
                    </AppText>
                    <AppText numberOfLines={2} style={{ color: palette.textMuted, marginTop: 4 }}>
                      {m.description}
                    </AppText>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={palette.textFaint} />
                </View>
              </AppCard>
            ))
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  disclaimer: { marginTop: 10, marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
});