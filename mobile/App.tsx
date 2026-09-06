import React, { useEffect } from "react";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { AuthProvider } from "./src/context/AuthContext";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { setNotificationHandler } from "expo-notifications";
import { IS_ANDROID } from "./src/config";
import { warmUp } from "./src/lib/api";

SplashScreen.preventAutoHideAsync().catch(() => {});

// Notifications: never show sensitive content in the banner/preview.
setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function ThemedApp() {
  const { palette, isDark } = useTheme();
  return (
    <NavigationContainer
      theme={{
        ...(isDark ? DarkTheme : DefaultTheme),
        colors: {
          ...(isDark ? DarkTheme : DefaultTheme).colors,
          primary: palette.brand,
          background: palette.bg,
          card: palette.card,
          text: palette.text,
          border: palette.border,
          notification: palette.danger,
        },
      }}
    >
      <RootNavigator />
      <StatusBar style={isDark ? "light" : "dark"} />
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    // Wake the (free-tier, sleeping) backend as early as possible.
    warmUp();
    // Give the native splash a beat before our React splash takes over.
    const t = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, Platform.OS === "android" ? 600 : 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <ThemedApp />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}