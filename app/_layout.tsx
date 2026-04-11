import { useTheme } from "@/lib/useTheme";
import { useFavouritesStore } from "@/stores/useFavouritesStore";
import { useStationStore } from "@/stores/useStationStore";
import { useThemeStore } from "@/stores/useThemeStore";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  InteractionManager,
  LogBox,
  Text,
  TextInput,
  View,
} from "react-native";

LogBox.ignoreLogs([
  "new NativeEventEmitter",
]);
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import Video from "react-native-video";
import "../global.css";

SplashScreen.preventAutoHideAsync();

const FONT_LOAD_TIMEOUT_MS = 10000;

function applyDefaultFont() {
  const defaultStyle = { fontFamily: "Inter_400Regular" };
  // @ts-expect-error - defaultProps exists at runtime
  Text.defaultProps = Text.defaultProps || {};
  // @ts-expect-error
  Text.defaultProps.style = [defaultStyle, Text.defaultProps.style];
  // @ts-expect-error
  TextInput.defaultProps = TextInput.defaultProps || {};
  // @ts-expect-error
  TextInput.defaultProps.style = [defaultStyle, TextInput.defaultProps.style];
}

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error("Add your Clerk Publishable Key to the .env file");
}

const WARMUP_SOURCE = require("../assets/videos/tiny.mp4");

const WARMUP_STYLE = {
  position: "absolute" as const,
  width: 1,
  height: 1,
  opacity: 0,
};

// Renders a 1x1 invisible Video once interactions settle so ExoPlayer's
// native bridge is initialized before the user opens their first station.
function VideoWarmup({ onReady }: { onReady: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setMounted(true);
    });
    return () => task.cancel();
  }, []);

  if (!mounted) return null;

  return (
    <View pointerEvents="none" className="absolute h-px w-px opacity-0">
      <Video
        source={WARMUP_SOURCE}
        paused
        muted
        repeat={false}
        playInBackground={false}
        playWhenInactive={false}
        onLoad={onReady}
        onError={onReady}
        style={WARMUP_STYLE}
      />
    </View>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-[#0b0b0f] p-6">
      <Text className="mb-2 text-center text-lg font-semibold text-white">
        Something went wrong
      </Text>
      <Text className="text-center text-sm leading-5 text-[#b3b3b8]">
        {message}
      </Text>
    </View>
  );
}

function InitialLayout() {
  const { resolved } = useTheme();
  const { isLoaded: authLoaded, isSignedIn } = useAuth({
    treatPendingAsSignedOut: false,
  });
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!authLoaded) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (isSignedIn && inAuthGroup) {
      router.replace("/(tabs)");
    } else if (!isSignedIn && segments.length > 0 && !inAuthGroup) {
      router.replace("/(auth)/sign-in");
    }
  }, [authLoaded, isSignedIn, segments, router]);
  const [warmupDone, setWarmupDone] = useState(false);
  const [fontTimedOut, setFontTimedOut] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const fetchStations = useStationStore((s) => s.fetchStations);
  const hydrateFavourites = useFavouritesStore((s) => s.hydrate);
  const hydrateTheme = useThemeStore((s) => s.hydrate);

  useEffect(() => {
    async function init() {
      await Promise.all([fetchStations(), hydrateFavourites(), hydrateTheme()]);
    }
    init();
  }, [fetchStations, hydrateFavourites, hydrateTheme]);

  useEffect(() => {
    if (fontsLoaded || fontError) return;
    const timer = setTimeout(() => setFontTimedOut(true), FONT_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (fontsLoaded) applyDefaultFont();
  }, [fontsLoaded]);

  const fontFailed = !!fontError || fontTimedOut;
  const fontReady = fontsLoaded || fontFailed;
  const ready = authLoaded && fontReady;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  if (fontFailed) {
    return (
      <ErrorScreen
        message={
          "We couldn't load the app fonts. Please check your connection and restart the app."
        }
      />
    );
  }

  return (
    <>
      <StatusBar style={resolved === "light" ? "dark" : "light"} />
      {!warmupDone && <VideoWarmup onReady={() => setWarmupDone(true)} />}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
        <Stack.Screen
          name="station/[id]"
          options={{
            presentation: "card",
            headerShown: false,
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            presentation: "card",
            headerShown: false,
            animation: "slide_from_right",
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <GestureHandlerRootView className="flex-1">
          <InitialLayout />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ClerkProvider>
  );
}
