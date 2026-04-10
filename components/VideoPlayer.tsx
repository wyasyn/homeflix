import { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Pressable,
  ActivityIndicator,
  Text,
  StatusBar,
  Modal,
} from "react-native";
import Video, {
  type VideoRef,
  type OnLoadData,
  type OnBufferData,
} from "react-native-video";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  PlayCircleIcon,
  PauseIcon,
  FullscreenIcon,
  MinimizeScreenIcon,
  VolumeHighIcon,
  VolumeLowIcon,
  VolumeMuteIcon,
  ReloadIcon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import * as ScreenOrientation from "expo-screen-orientation";
import { useTheme } from "@/lib/useTheme";

interface VideoPlayerProps {
  streamUrl: string;
  onError?: (error: string) => void;
  onReady?: () => void;
  borderless?: boolean;
}

const CONTROLS_TIMEOUT = 4000;
const VOLUME_SLIDER_WIDTH = 120;

export function VideoPlayer({ streamUrl, onError, onReady, borderless = false }: VideoPlayerProps) {
  const { colors } = useTheme();
  const videoRef = useRef<VideoRef>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // Animated controls opacity
  const controlsOpacity = useSharedValue(1);
  const [controlsVisible, setControlsVisible] = useState(true);

  const controlsStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      controlsOpacity.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(setControlsVisible)(false);
      });
      setShowVolumeSlider(false);
    }, CONTROLS_TIMEOUT);
  }, [controlsOpacity]);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    controlsOpacity.value = withTiming(1, { duration: 200 });
    scheduleHide();
  }, [controlsOpacity, scheduleHide]);

  const toggleControls = useCallback(() => {
    if (controlsVisible) {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      controlsOpacity.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(setControlsVisible)(false);
      });
      setShowVolumeSlider(false);
    } else {
      showControls();
    }
  }, [controlsVisible, controlsOpacity, showControls]);

  // Restore portrait on unmount
  useEffect(() => {
    return () => {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      );
      StatusBar.setHidden(false);
    };
  }, []);

  // Auto-hide controls after load
  useEffect(() => {
    if (!isLoading && !hasError) {
      scheduleHide();
    }
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [isLoading, hasError, scheduleHide]);

  const handleLoad = useCallback(
    (_data: OnLoadData) => {
      setIsLoading(false);
      setHasError(false);
      onReady?.();
    },
    [onReady]
  );

  const handleError = useCallback(
    (e: { error: { errorString?: string } }) => {
      setIsLoading(false);
      setHasError(true);
      onError?.(e.error.errorString || "Stream failed to load");
    },
    [onError]
  );

  const handleBuffer = useCallback(({ isBuffering: buffering }: OnBufferData) => {
    setIsBuffering(buffering);
    if (buffering) setIsLoading(false);
  }, []);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
    setIsPaused(false);
    setReloadKey((k) => k + 1);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      );
      StatusBar.setHidden(false);
    } else {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE
      );
      StatusBar.setHidden(true);
    }
    setIsFullscreen((f) => !f);
    showControls();
  }, [isFullscreen, showControls]);

  const togglePlay = useCallback(() => {
    setIsPaused((p) => !p);
    showControls();
  }, [showControls]);

  const toggleMute = useCallback(() => {
    setVolume((v) => (v > 0 ? 0 : 1));
    showControls();
  }, [showControls]);

  // Volume slider gesture
  const volumeGesture = Gesture.Pan()
    .onUpdate((e) => {
      const pct = Math.min(1, Math.max(0, e.x / VOLUME_SLIDER_WIDTH));
      runOnJS(setVolume)(pct);
    })
    .onEnd(() => {
      runOnJS(scheduleHide)();
    });

  const volumeIcon =
    volume === 0
      ? VolumeMuteIcon
      : volume < 0.5
        ? VolumeLowIcon
        : VolumeHighIcon;

  const overlays = (
    <>
      {/* Buffering spinner */}
      {isBuffering && !hasError && !isLoading && (
        <View className="absolute inset-0 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* Initial loading overlay */}
      {isLoading && !hasError && (
        <View className="absolute inset-0 items-center justify-center bg-black/60">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={{
              marginTop: 12,
              fontSize: 13,
              color: "rgba(255,255,255,0.7)",
            }}
          >
            Loading stream...
          </Text>
        </View>
      )}

      {/* Error overlay */}
      {hasError && (
        <View className="absolute inset-0 items-center justify-center bg-black/80">
          <Text
            style={{ marginBottom: 16, color: "rgba(255,255,255,0.7)" }}
          >
            Stream unavailable
          </Text>
          <Pressable
            onPress={handleRetry}
            className="flex-row items-center gap-2 px-6 py-3"
            style={{ backgroundColor: colors.primary, borderRadius: 8 }}
          >
            <HugeiconsIcon icon={ReloadIcon} size={18} color="#fff" />
            <Text style={{ fontWeight: "600", color: "#fff" }}>Retry</Text>
          </Pressable>
        </View>
      )}

      {/* Controls overlay */}
      {!hasError && !isLoading && (
        <Pressable onPress={toggleControls} className="absolute inset-0">
          <Animated.View style={[{ flex: 1 }, controlsStyle]}>
            {controlsVisible && (
              <View className="absolute inset-0 bg-black/40">
                {/* Top bar — back (fullscreen only) + volume */}
                <View className="flex-row items-center justify-between px-4 pt-3">
                  {isFullscreen ? (
                    <Pressable
                      onPress={toggleFullscreen}
                      className="rounded-full bg-black/50 p-2"
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Exit fullscreen"
                    >
                      <HugeiconsIcon
                        icon={ArrowLeft01Icon}
                        size={20}
                        color="#fff"
                      />
                    </Pressable>
                  ) : (
                    <View />
                  )}
                  <Pressable
                    onPress={() => {
                      setShowVolumeSlider((v) => !v);
                      showControls();
                    }}
                    className="rounded-full bg-black/50 p-2"
                    hitSlop={8}
                  >
                    <HugeiconsIcon icon={volumeIcon} size={20} color="#fff" />
                  </Pressable>
                </View>

                {/* Volume slider */}
                {showVolumeSlider && (
                  <View className="absolute right-14 top-3.5 flex-row items-center">
                    <View
                      className="overflow-hidden rounded-full bg-black/60"
                      style={{ width: VOLUME_SLIDER_WIDTH, height: 32 }}
                    >
                      <GestureDetector gesture={volumeGesture}>
                        <Pressable
                          onPress={(e) => {
                            const pct = Math.min(
                              1,
                              Math.max(0, e.nativeEvent.locationX / VOLUME_SLIDER_WIDTH)
                            );
                            setVolume(pct);
                            showControls();
                          }}
                          style={{ width: VOLUME_SLIDER_WIDTH, height: 32, justifyContent: "center" }}
                        >
                          <View className="mx-2 h-1 rounded-full bg-white/30">
                            <View
                              style={{
                                height: 4,
                                borderRadius: 999,
                                backgroundColor: colors.primary,
                                width: `${volume * 100}%`,
                              }}
                            />
                          </View>
                          <View
                            className="absolute h-4 w-4 rounded-full bg-white"
                            style={{
                              left: 8 + volume * (VOLUME_SLIDER_WIDTH - 24),
                              top: 8,
                            }}
                          />
                        </Pressable>
                      </GestureDetector>
                    </View>
                  </View>
                )}

                {/* Center play/pause */}
                <View className="flex-1 items-center justify-center">
                  <Pressable
                    onPress={togglePlay}
                    className="rounded-full bg-black/50 p-5"
                  >
                    <HugeiconsIcon
                      icon={isPaused ? PlayCircleIcon : PauseIcon}
                      size={44}
                      color="#fff"
                    />
                  </Pressable>
                </View>

                {/* Bottom bar — live badge + fullscreen */}
                <View className="flex-row items-center justify-between px-4 pb-3">
                  <View className="flex-row items-center gap-2">
                    <View
                      style={{
                        height: 8,
                        width: 8,
                        borderRadius: 999,
                        backgroundColor: colors.primary,
                      }}
                    />
                    <Text className="text-xs font-semibold uppercase text-white">
                      Live
                    </Text>
                  </View>

                  <Pressable
                    onPress={toggleFullscreen}
                    className="rounded-full bg-black/50 p-2"
                    hitSlop={8}
                  >
                    <HugeiconsIcon
                      icon={isFullscreen ? MinimizeScreenIcon : FullscreenIcon}
                      size={20}
                      color="#fff"
                    />
                  </Pressable>
                </View>
              </View>
            )}
          </Animated.View>
        </Pressable>
      )}
    </>
  );

  const videoElement = (
    <Video
      key={reloadKey}
      ref={videoRef}
      source={{ uri: streamUrl }}
      style={{ width: "100%", height: "100%" }}
      resizeMode="contain"
      paused={isPaused}
      volume={volume}
      onLoad={handleLoad}
      onError={handleError}
      onBuffer={handleBuffer}
      bufferConfig={{
        minBufferMs: 15000,
        maxBufferMs: 50000,
        bufferForPlaybackMs: 2500,
        bufferForPlaybackAfterRebufferMs: 5000,
      }}
      maxBitRate={2000000}
    />
  );

  return (
    <>
      {/* Inline player */}
      <View
        className={`aspect-video w-full overflow-hidden bg-black ${borderless ? "" : "rounded-xl"}`}
      >
        {!isFullscreen && (
          <>
            {videoElement}
            {overlays}
          </>
        )}
      </View>

      {/* Fullscreen modal */}
      <Modal
        visible={isFullscreen}
        animationType="fade"
        supportedOrientations={["landscape"]}
        statusBarTranslucent
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View className="flex-1 bg-black">
            {videoElement}
            {overlays}
          </View>
        </GestureHandlerRootView>
      </Modal>
    </>
  );
}
