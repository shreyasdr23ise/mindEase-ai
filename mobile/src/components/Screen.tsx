import React from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { IS_ANDROID } from "../config";

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  keyboard?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  padded?: boolean;
  edges?: ("top" | "bottom")[];
}

export function Screen({
  children,
  scroll,
  keyboard,
  style,
  contentStyle,
  padded = true,
  edges = ["top", "bottom"],
}: Props) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const padTop = edges.includes("top") ? insets.top : 0;
  const padBottom = edges.includes("bottom") ? Math.max(insets.bottom, 12) : 0;

  const shell = (
    <View
      style={[
        styles.base,
        { backgroundColor: palette.bg, paddingTop: padTop, paddingBottom: padBottom },
        style,
      ]}
    >
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            padded && styles.padded,
            { paddingBottom: 32 },
            contentStyle,
          ]}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, padded && styles.padded, contentStyle]}>{children}</View>
      )}
    </View>
  );

  if (!keyboard) return shell;
  return (
    <KeyboardAvoidingView
      style={styles.base}
      behavior={IS_ANDROID ? undefined : "padding"}
    >
      {shell}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  base: { flex: 1 },
  padded: { paddingHorizontal: 18 },
});