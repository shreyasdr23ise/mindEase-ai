export type ThemeMode = "light" | "dark" | "system";

export interface Palette {
  mode: "light" | "dark";
  brand: string;
  brandDark: string;
  brandSoft: string;
  indigo: string;
  lavender: string;
  accent: string;
  bg: string;
  bgElevated: string;
  card: string;
  cardAlt: string;
  text: string;
  textMuted: string;
  textFaint: string;
  border: string;
  borderSoft: string;
  danger: string;
  dangerSoft: string;
  amber: string;
  green: string;
  ok: string;
  overlay: string;
  keyboard: string;
  tabBar: string;
  shadow: string;
}

const LIGHT: Palette = {
  mode: "light",
  brand: "#0FA3B3",
  brandDark: "#0B6E7A",
  brandSoft: "#D9F2F5",
  indigo: "#4F46E5",
  lavender: "#A78BFA",
  accent: "#F59E0B",
  bg: "#F6FAFC",
  bgElevated: "#FFFFFF",
  card: "#FFFFFF",
  cardAlt: "#EEF6F8",
  text: "#0F172A",
  textMuted: "#52606D",
  textFaint: "#8A97A6",
  border: "#D9E2EA",
  borderSoft: "#E7EEF4",
  danger: "#E11D48",
  dangerSoft: "#FDECEF",
  amber: "#B45309",
  green: "#0F9D6B",
  ok: "#0FA3B3",
  overlay: "rgba(15,23,42,0.45)",
  keyboard: "#EDF2F7",
  tabBar: "#FFFFFF",
  shadow: "#0F172A",
};

const DARK: Palette = {
  mode: "dark",
  brand: "#2EC4D6",
  brandDark: "#0FA3B3",
  brandSoft: "#123A42",
  indigo: "#818CF8",
  lavender: "#B9A0FF",
  accent: "#FBBF24",
  bg: "#0A111F",
  bgElevated: "#0E1626",
  card: "#121C2E",
  cardAlt: "#182336",
  text: "#E7EEF6",
  textMuted: "#9FADC0",
  textFaint: "#66758A",
  border: "#26354B",
  borderSoft: "#1D2A3D",
  danger: "#FB7185",
  dangerSoft: "#3A1E28",
  amber: "#FCD34D",
  green: "#34D399",
  ok: "#2EC4D6",
  overlay: "rgba(2,6,12,0.6)",
  keyboard: "#0E1626",
  tabBar: "#0E1626",
  shadow: "#000000",
};

export function resolvePalette(mode: ThemeMode, systemDark: boolean): Palette {
  const dark = mode === "dark" || (mode === "system" && systemDark);
  return dark ? DARK : LIGHT;
}