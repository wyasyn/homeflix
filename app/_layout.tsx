import { useEffect } from "react";
import { InteractionManager } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import { useStationStore } from "@/stores/useStationStore";
import { useFavouritesStore } from "@/stores/useFavouritesStore";
import { useThemeStore } from "@/stores/useThemeStore";
import { useTheme } from "@/lib/useTheme";
import "../global.css";

SplashScreen.preventAutoHideAsync();

/**
 * Eagerly load the react-native-video JS module (and its native bridge
 * binding) on app start. The first import is the expensive part on Android —
 * doing it here means the first time the user opens a station, the JS-side
 * cost is already paid and only ExoPlayer's per-instance setup remains.
 *
 * We do NOT mount a <Video> here: without a real source, ExoPlayer doesn't
 * initialize anyway, and bundling a dummy asset just to warm it up isn't
 * worth the APK size.
 */
function warmupVideoModule() {
  InteractionManager.runAfterInteractions(() => {
    // Fire-and-forget dynamic import. Errors are non-fatal — the real
    // VideoPlayer mount will surface any issue.
    import("react-native-video").catch(() => {});
  });
}

export default function RootLayout() {
  const fetchStations = useStationStore((s) => s.fetchStations);
  const hydrateFavourites = useFavouritesStore((s) => s.hydrate);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const { resolved } = useTheme();

  useEffect(() => {
    async function init() {
      // Fast path: cache → fallback. Remote refresh runs in the background.
      await Promise.all([
        fetchStations(),
        hydrateFavourites(),
        hydrateTheme(),
      ]);
      await SplashScreen.hideAsync();
      warmupVideoModule();
    }
    init();
  }, [fetchStations, hydrateFavourites, hydrateTheme]);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style={resolved === "light" ? "dark" : "light"} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="station/[id]"
            options={{
              presentation: "card",
              headerShown: false,
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="favourites"
            options={{
              presentation: "card",
              headerShown: false,
              animation: "slide_from_right",
            }}
          />
        </Stack>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
