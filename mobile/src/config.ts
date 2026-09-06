/**
 * MindEase AI — environment/configuration.
 *
 * The production APK must talk to the public HTTPS backend.
 * No localhost / 127.0.0.1 / private LAN IP ever appears in this source.
 *
 * DEVELOPMENT: set EXPO_PUBLIC_API_URL when bundling a development build, e.g.
 *   $env:EXPO_PUBLIC_API_URL="http://<LAN-IP>:8000"; npx expo prebuild ... ; gradlew ...
 * PRODUCTION : if EXPO_PUBLIC_API_URL is unset/empty the public backend is used.
 */
import { Platform } from "react-native";

const fromEnv = (process.env.EXPO_PUBLIC_API_URL || "").trim();

export const PRODUCTION_API_URL = "https://mindease-backend.onrender.com";
export const API_URL = fromEnv || PRODUCTION_API_URL;

export const APP_NAME = "MindEase AI";
export const APP_TAGLINE = "Your space to talk, reflect and feel supported.";

export const APP_VERSION = "1.0.0";
export const APP_BUILD = 1;

// How long the branded (animated) splash stays visible before the app shell.
export const SPLASH_MS = 1800;

export const NETWORK_TIMEOUT_MS = 25000;

export const SUPPORT_EMAIL = "support@mindeaseai.app";

export const CRISIS_LINE_INDIA = {
  label: "Vandrevala Foundation (India)",
  number: "1860-266-2345",
};

export const IS_ANDROID = Platform.OS === "android";
export const IS_IOS = Platform.OS === "ios";