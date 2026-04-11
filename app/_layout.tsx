import InitialLayout from "@/components/layouts/InitialLayout";
import { PlaybackService } from "@/lib/trackPlayerService";
import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import * as SplashScreen from "expo-splash-screen";
import { LogBox } from "react-native";
import TrackPlayer from "react-native-track-player";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import "../global.css";

LogBox.ignoreLogs(["new NativeEventEmitter"]);

// Register the background playback service before the component tree mounts
TrackPlayer.registerPlaybackService(() => PlaybackService);

SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error("Add your Clerk Publishable Key to the .env file");
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
