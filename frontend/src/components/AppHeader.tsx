import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { AppText } from "./AppText";

export function AppHeader({
  title,
  subtitle,
  canGoBack = true,
  right,
  onBack,
}: {
  title: string;
  subtitle?: string;
  canGoBack?: boolean;
  right?: React.ReactNode;
  onBack?: () => void;
}) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const goBack = () => {
    if (onBack) return onBack();
    const nav = navigation as { canGoBack: () => boolean; goBack: () => void };
    if (nav.canGoBack()) nav.goBack();
  };

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: palette.bg,
          paddingTop: insets.top + 6,
          borderBottomColor: palette.borderSoft,
        },
      ]}
    >
      <View style={styles.row}>
        {canGoBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={goBack}
            style={({ pressed }) => [
              styles.back,
              { backgroundColor: palette.cardAlt },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="chevron-back" size={22} color={palette.text} />
          </Pressable>
        ) : (
          <View style={styles.backSpacer} />
        )}
        <View style={styles.titles}>
          <AppText variant="subtitle" numberOfLines={1}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" numberOfLines={1} style={{ color: palette.textFaint }}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {right ? <View style={styles.right}>{right}</View> : <View style={styles.backSpacer} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { borderBottomWidth: 1, paddingBottom: 10, paddingHorizontal: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  backSpacer: { width: 40 },
  titles: { flex: 1 },
  right: { maxWidth: 120 },
});