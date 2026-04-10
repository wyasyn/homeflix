import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

export const useThemeStore = create<ThemeStore>((set) => ({
  mode: "system",
  isLoaded: false,

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(CACHE_KEYS.THEME_MODE);
      if (isValidMode(stored)) {
        set({ mode: stored, isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },

  setMode: (mode) => {
    set({ mode });
    AsyncStorage.setItem(CACHE_KEYS.THEME_MODE, mode).catch(() => {});
  },
}));
