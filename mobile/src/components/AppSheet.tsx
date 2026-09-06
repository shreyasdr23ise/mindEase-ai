import React, { useEffect, useRef } from "react";
import {
  Animated,
  BackHandler,
  Modal,
  Pressable,
  StyleSheet,
  View,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { IS_ANDROID } from "../config";
import { AppText } from "./AppText";

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function AppSheet({ visible, onClose, title, children }: Props) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(600)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(600);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 22,
          stiffness: 210,
        }),
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, translateY, opacity]);

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.root} behavior={IS_ANDROID ? undefined : "padding"}>
        <Animated.View style={[{ position: "absolute", inset: 0, opacity }]}>
          <Pressable
            style={[styles.backdrop, { backgroundColor: palette.overlay }]}
            onPress={onClose}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: palette.bgElevated,
              paddingBottom: Math.max(insets.bottom, 16),
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: palette.border }]} />
          {title ? (
            <AppText variant="title" style={styles.title}>
              {title}
            </AppText>
          ) : null}
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { flex: 1 },
  sheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 12,
    width: "100%",
  },
  handle: { alignSelf: "center", width: 44, height: 5, borderRadius: 3, marginBottom: 14 },
  title: { marginBottom: 14 },
});