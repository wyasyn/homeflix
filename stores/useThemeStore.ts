import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance, Platform } from "react-native";
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

function applyNativeAppearance(mode: ThemeMode) {
  const rnMinor = Platform.constants?.reactNativeVersion?.minor ?? 0;
  if (mode === "system") {
    Appearance.setColorScheme(rnMinor >= 82 ? ("unspecified" as any) : null);
  } else {
    Appearance.setColorScheme(mode);
  }
}

export const useThemeStore = create<ThemeStore>((set) => ({
  mode: "system",
  isLoaded: false,

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(CACHE_KEYS.THEME_MODE);
      const mode: ThemeMode = isValidMode(stored) ? stored : "system";
      applyNativeAppearance(mode);
      set({ mode, isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  setMode: (mode) => {
    applyNativeAppearance(mode);
    set({ mode });
    AsyncStorage.setItem(CACHE_KEYS.THEME_MODE, mode).catch(() => {});
  },
}));
