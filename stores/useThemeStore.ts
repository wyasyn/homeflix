import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";
import { colorScheme as nwColorScheme } from "nativewind";
import { CACHE_KEYS } from "@/lib/constants";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeStore {
  mode: ThemeMode;
  isLoaded: boolean;

  hydrate: () => Promise<void>;
  setMode: (mode: ThemeMode) => void;
}

function isValidMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

function resolveScheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    return Appearance.getColorScheme() === "light" ? "light" : "dark";
  }
  return mode;
}

function applyScheme(mode: ThemeMode) {
  nwColorScheme.set(mode === "system" ? "system" : resolveScheme(mode));
}

export const useThemeStore = create<ThemeStore>((set) => ({
  mode: "system",
  isLoaded: false,

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(CACHE_KEYS.THEME_MODE);
      const mode: ThemeMode = isValidMode(stored) ? stored : "system";
      applyScheme(mode);
      set({ mode, isLoaded: true });
    } catch {
      applyScheme("system");
      set({ isLoaded: true });
    }
  },

  setMode: (mode) => {
    applyScheme(mode);
    set({ mode });
    AsyncStorage.setItem(CACHE_KEYS.THEME_MODE, mode).catch(() => {});
  },
}));
