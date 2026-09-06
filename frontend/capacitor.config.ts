import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.mindease.ai",
  appName: "MindEase AI",
  webDir: "out",
  server: {
    androidScheme: "https",
    // Coming soon: the hosted app URL. Replaced once the app is deployed online.
    url: "https://mindease-ai.example.app",
  },
};

export default config;