import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.mindease.ai",
  appName: "MindEase AI",
  webDir: "out",
  server: {
    androidScheme: "https",
    // Wi-Fi build: phone talks to the laptop over the local network.
    // If the laptop's IP changes, rebuild with the new address.
    url: "http://10.114.11.118:3000",
    cleartext: true,
  },
};

export default config;