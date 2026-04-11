import type { ThemePalette } from "@/constants/theme";
import { useTheme } from "@/lib/useTheme";
import {
  PauseIcon,
  PlayCircleIcon,
  Radio01Icon,
  StopIcon,
  VolumeHighIcon,
  VolumeLowIcon,
  VolumeMuteIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Image } from "expo-image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import TrackPlayer, {
  State,
  usePlaybackState,
} from "react-native-track-player";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface AudioPlayerProps {
  streamUrl: string;
  stationName: string;
  logo?: string;
  onError?: (error: string) => void;
}

const BAR_COUNT = 40;
const VOLUME_SLIDER_WIDTH = 200;

function WaveformBar({
  index,
  isPlaying,
  colors,
}: {
  index: number;
  isPlaying: boolean;
  colors: ThemePalette;
}) {
  const height = useSharedValue(8);

  useEffect(() => {
    if (isPlaying) {
      const minH = 6 + Math.random() * 6;
      const maxH = 18 + Math.random() * 22;
      const duration = 300 + Math.random() * 400;
      height.value = withDelay(
        index * 25,
        withRepeat(
          withSequence(
            withTiming(maxH, { duration, easing: Easing.inOut(Easing.sin) }),
            withTiming(minH, { duration: duration * 0.8, easing: Easing.inOut(Easing.sin) })
          ),
          -1,
          true
        )
      );
    } else {
      cancelAnimation(height);
      height.value = withTiming(8, { duration: 400 });
    }
  }, [isPlaying, height, index]);

  const barStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View
      className="mx-px w-[3px] rounded-[1.5px]"
      style={[
        barStyle,
        { backgroundColor: isPlaying ? colors.primary : colors.textSecondary },
      ]}
    />
  );
}

export function AudioPlayer({
  streamUrl,
  stationName,
  logo,
  onError,
}: AudioPlayerProps) {
  const { colors } = useTheme();
  const playbackState = usePlaybackState();
  const [isStopped, setIsStopped] = useState(false);
  const [volume, setVolume] = useState(1);
  const [hasError, setHasError] = useState(false);

  // Derive booleans from TrackPlayer state
  const state = playbackState.state;
  const isPlaying = state === State.Playing;
  const isLoading =
    state === State.Loading ||
    state === State.Buffering;

  // Load the stream into TrackPlayer when this component mounts / streamUrl changes
  useEffect(() => {
    let cancelled = false;

    async function loadAndPlay() {
      try {
        setHasError(false);
        setIsStopped(false);

        await TrackPlayer.reset();
        await TrackPlayer.add({
          url: streamUrl,
          title: stationName,
          artist: "Live Radio",
          artwork: logo,
          isLiveStream: true,
        });

        if (!cancelled) {
          await TrackPlayer.play();
        }
      } catch {
        if (!cancelled) {
          setHasError(true);
          onError?.("Stream failed to load");
        }
      }
    }

    loadAndPlay();

    return () => {
      cancelled = true;
      // Stop and reset when navigating away so no ghost audio lingers
      TrackPlayer.reset().catch(() => {});
    };
    // Only re-run when the URL actually changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamUrl]);

  // Sync volume to TrackPlayer
  useEffect(() => {
    TrackPlayer.setVolume(volume).catch(() => {});
  }, [volume]);

  // Detect playback errors
  useEffect(() => {
    if (state === State.Error) {
      setHasError(true);
      onError?.("Stream failed to load");
    }
  }, [state, onError]);

  // Disc rotation animation
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 8000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      cancelAnimation(rotation);
    }
  }, [isPlaying, rotation]);

  const discStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // Glow pulse
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      glowOpacity.value = withRepeat(
        withTiming(0.6, { duration: 1500 }),
        -1,
        true
      );
    } else {
      cancelAnimation(glowOpacity);
      glowOpacity.value = withTiming(0);
    }
  }, [isPlaying, glowOpacity]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const togglePlayback = useCallback(async () => {
    if (isPlaying) {
      await TrackPlayer.pause();
    } else {
      setIsStopped(false);
      await TrackPlayer.play();
    }
  }, [isPlaying]);

  const stop = useCallback(async () => {
    await TrackPlayer.stop();
    setIsStopped(true);
  }, []);

  const retry = useCallback(async () => {
    try {
      setHasError(false);
      setIsStopped(false);
      await TrackPlayer.reset();
      await TrackPlayer.add({
        url: streamUrl,
        title: stationName,
        artist: "Live Radio",
        artwork: logo,
        isLiveStream: true,
      });
      await TrackPlayer.play();
    } catch {
      setHasError(true);
      onError?.("Stream failed to load");
    }
  }, [streamUrl, stationName, logo, onError]);

  const statusText = isLoading
    ? "Connecting..."
    : isPlaying
      ? "Live"
      : hasError
        ? "Stream unavailable"
        : isStopped
          ? "Stopped"
          : "Paused";

  const statusClass = isPlaying
    ? "text-primary"
    : hasError
      ? "text-error"
      : "text-text-secondary";

  const dotClass = isPlaying
    ? "bg-primary"
    : hasError
      ? "bg-error"
      : "bg-text-secondary";

  const volumeIcon =
    volume === 0
      ? VolumeMuteIcon
      : volume < 0.5
        ? VolumeLowIcon
        : VolumeHighIcon;

  // Volume gesture
  const volumeGesture = Gesture.Pan().onUpdate((e) => {
    const pct = Math.min(1, Math.max(0, e.x / VOLUME_SLIDER_WIDTH));
    setVolume(pct);
  });

  const barIndices = useMemo(() => Array.from({ length: BAR_COUNT }, (_, i) => i), []);

  return (
    <View className="items-center px-4 py-6">
      {/* Artwork disc */}
      <View className="relative mb-8 items-center justify-center">
        {/* Glow ring */}
        <Animated.View
          className="absolute h-60 w-60 rounded-full bg-primary"
          style={glowStyle}
        />

        <Animated.View
          className="h-56 w-56 items-center justify-center overflow-hidden rounded-full bg-surface-light"
          style={discStyle}
        >
          {logo ? (
            <Image
              source={{ uri: logo }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <HugeiconsIcon
              icon={Radio01Icon}
              size={80}
              color={colors.textSecondary}
            />
          )}

          {/* Vinyl hole overlay */}
          <View className="absolute h-10 w-10 rounded-full bg-background" />
        </Animated.View>
      </View>

      {/* Station name */}
      <Text className="mb-1 text-center text-2xl font-bold text-foreground">
        {stationName}
      </Text>

      {/* Status indicator */}
      <View className="mb-6 flex-row items-center gap-2">
        {isPlaying && <View className={`h-2 w-2 rounded-full ${dotClass}`} />}
        <Text className={`text-center text-sm font-medium ${statusClass}`}>
          {statusText}
        </Text>
      </View>

      {/* Waveform visualizer */}
      <View className="mb-8 h-12 flex-row items-center justify-center">
        {barIndices.map((i) => (
          <WaveformBar key={i} index={i} isPlaying={isPlaying} colors={colors} />
        ))}
      </View>

      {/* Main controls */}
      <View className="mb-6 flex-row items-center gap-6">
        <Pressable
          onPress={stop}
          disabled={!isPlaying && !isLoading}
          className={`rounded-full bg-surface p-4 ${isPlaying || isLoading ? "" : "opacity-40"}`}
        >
          <HugeiconsIcon icon={StopIcon} size={28} color={colors.textPrimary} />
        </Pressable>

        <Pressable
          onPress={hasError ? retry : togglePlayback}
          className="rounded-full bg-primary p-6 active:scale-95"
        >
          {isLoading ? (
            <ActivityIndicator size={36} color="#fff" />
          ) : (
            <HugeiconsIcon
              icon={isPlaying ? PauseIcon : PlayCircleIcon}
              size={36}
              color="#fff"
            />
          )}
        </Pressable>

        <Pressable
          onPress={() => setVolume((v) => (v > 0 ? 0 : 1))}
          className="rounded-full bg-surface p-4"
        >
          <HugeiconsIcon icon={volumeIcon} size={28} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* Volume slider */}
      <View className="w-full flex-row items-center justify-center gap-3 px-4">
        <HugeiconsIcon icon={VolumeLowIcon} size={16} color={colors.textSecondary} />
        <View className="h-9 w-[200px] overflow-hidden rounded-full bg-surface">
          <GestureDetector gesture={volumeGesture}>
            <Pressable
              onPress={(e) => {
                const pct = Math.min(
                  1,
                  Math.max(0, e.nativeEvent.locationX / VOLUME_SLIDER_WIDTH)
                );
                setVolume(pct);
              }}
              className="h-9 w-[200px] justify-center"
            >
              {/* Track */}
              <View className="mx-3 h-1.5 rounded-full bg-border">
                <View
                  className="h-1.5 rounded-full bg-primary"
                  style={{ width: `${volume * 100}%` }}
                />
              </View>
              {/* Thumb */}
              <View
                className="absolute h-4 w-4 rounded-full bg-white"
                style={{
                  left: 12 + volume * (VOLUME_SLIDER_WIDTH - 32),
                  top: 10,
                }}
              />
            </Pressable>
          </GestureDetector>
        </View>
        <HugeiconsIcon icon={VolumeHighIcon} size={16} color={colors.textSecondary} />
      </View>

      {hasError && (
        <Pressable onPress={retry} className="mt-6">
          <Text className="text-primary">Tap play to retry</Text>
        </Pressable>
      )}
    </View>
  );
}
