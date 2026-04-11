import { useColorScheme } from "nativewind";
import { darkColors, lightColors, type ThemePalette } from "@/constants/theme";
import { useThemeStore, type ThemeMode } from "@/stores/useThemeStore";

export interface Theme {
  mode: ThemeMode;
  resolved: "light" | "dark";
  colors: ThemePalette;
}

export function useTheme(): Theme {
  const mode = useThemeStore((s) => s.mode);
  const { colorScheme } = useColorScheme();

  const resolved: "light" | "dark" = colorScheme === "light" ? "light" : "dark";

  return {
    mode,
    resolved,
    colors: resolved === "light" ? lightColors : darkColors,
  };
}
