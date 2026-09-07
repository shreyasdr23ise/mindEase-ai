import React, { forwardRef } from "react";
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { AppText } from "./AppText";

interface Props extends TextInputProps {
  label?: string;
  error?: string | null;
  left?: React.ReactNode;
  right?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const AppInput = forwardRef<TextInput, Props>(function AppInput(
  { label, error, left, right, containerStyle, style, multiline, ...rest },
  ref
) {
  const { palette } = useTheme();
  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? (
        <AppText variant="label" style={[styles.label, { color: palette.textMuted }]}>
          {label}
        </AppText>
      ) : null}
      <View
        style={[
          styles.box,
          {
            backgroundColor: palette.bgElevated,
            borderColor: error ? palette.danger : palette.border,
            minHeight: multiline ? 110 : 52,
          },
        ]}
      >
        {left ? <View style={styles.side}>{left}</View> : null}
        <TextInput
          {...rest}
          ref={ref}
          multiline={multiline}
          placeholderTextColor={palette.textFaint}
          selectionColor={palette.brand}
          style={[
            styles.input,
            {
              color: palette.text,
              height: multiline ? undefined : 50,
              textAlignVertical: multiline ? "top" : "center",
              paddingTop: multiline ? 14 : 0,
            },
            style,
          ]}
        />
        {right ? <View style={styles.side}>{right}</View> : null}
      </View>
      {error ? (
        <AppText variant="caption" style={{ color: palette.danger, marginTop: 4 }}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { width: "100%" },
  label: { marginBottom: 6 },
  box: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  input: { flex: 1, fontSize: 16, paddingHorizontal: 14 },
  side: { paddingHorizontal: 12 },
});