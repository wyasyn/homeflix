import { useColorScheme } from "react-native";
import { darkColors, lightColors, type ThemePalette } from "@/constants/theme";
import { useThemeStore, type ThemeMode } from "@/stores/useThemeStore";

export interface Theme {
  mode: ThemeMode;
  resolved: "light" | "dark";
  colors: ThemePalette;
}

export function useTheme(): Theme {
  const mode = useThemeStore((s) => s.mode);
  const systemScheme = useColorScheme();

  const resolved: "light" | "dark" =
    mode === "system" ? (systemScheme === "light" ? "light" : "dark") : mode;

  return {
    mode,
    resolved,
    colors: resolved === "light" ? lightColors : darkColors,
  };
}
