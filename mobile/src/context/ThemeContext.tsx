import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";
import { resolvePalette, type Palette, type ThemeMode } from "../theme";
import { loadThemeMode, saveThemeMode } from "../lib/storage";

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  palette: Palette;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemDark = useColorScheme() === "dark";
  const [mode, setModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    (async () => {
      const saved = (await loadThemeMode()) as ThemeMode | null;
      if (saved) setModeState(saved);
    })();
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    void saveThemeMode(m);
  }, []);

  const palette = useMemo(
    () => resolvePalette(mode, systemDark),
    [mode, systemDark]
  );

  const value = useMemo(
    () => ({ mode, setMode, palette, isDark: palette.mode === "dark" }),
    [mode, setMode, palette]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}

export function useThemeMode(): ThemeMode {
  return useTheme().mode;
}

export function useSetThemeMode(): (m: ThemeMode) => void {
  return useTheme().setMode;
}