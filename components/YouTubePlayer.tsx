import { useTheme } from "@/lib/useTheme";
import {
  FullscreenIcon,
  MinimizeScreenIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as ScreenOrientation from "expo-screen-orientation";
import { useCallback, useState } from "react";
import { Modal, Pressable, StatusBar, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { WebView } from "react-native-webview";

interface YouTubePlayerProps {
  channelId: string;
  borderless?: boolean;
}

function buildEmbedUrl(channelId: string) {
  return (
    `https://www.youtube.com/embed/live_stream` +
    `?channel=${channelId}&autoplay=1&playsinline=1&rel=0&modestbranding=1`
  );
}

export function YouTubePlayer({
  channelId,
  borderless = false,
}: YouTubePlayerProps) {
  const { colors } = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const enterFullscreen = useCallback(async () => {
    await ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.LANDSCAPE
    );
    StatusBar.setHidden(true);
    setIsFullscreen(true);
  }, []);

  const exitFullscreen = useCallback(async () => {
    await ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_UP
    );
    StatusBar.setHidden(false);
    setIsFullscreen(false);
  }, []);

  const webview = (
    <WebView
      source={{ uri: buildEmbedUrl(channelId) }}
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      allowsFullscreenVideo={false}
      javaScriptEnabled
      domStorageEnabled
      style={{ flex: 1, backgroundColor: "black" }}
    />
  );

  const fullscreenButton = (
    <Pressable
      onPress={isFullscreen ? exitFullscreen : enterFullscreen}
      className="absolute bottom-3 right-4 rounded-full bg-black/50 p-2"
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
    >
      <HugeiconsIcon
        icon={isFullscreen ? MinimizeScreenIcon : FullscreenIcon}
        size={20}
        color="#fff"
      />
    </Pressable>
  );

  return (
    <>
      {/* Inline player */}
      <View
        className={`aspect-video w-full overflow-hidden bg-black ${borderless ? "" : "rounded-xl"}`}
      >
        {!isFullscreen && (
          <>
            {webview}
            {fullscreenButton}
          </>
        )}
      </View>

      {/* Fullscreen modal */}
      <Modal
        visible={isFullscreen}
        animationType="fade"
        supportedOrientations={["landscape"]}
        statusBarTranslucent
        onRequestClose={exitFullscreen}
      >
        <GestureHandlerRootView className="flex-1">
          <View className="flex-1 bg-black">
            {webview}
            {fullscreenButton}
          </View>
        </GestureHandlerRootView>
      </Modal>
    </>
  );
}
