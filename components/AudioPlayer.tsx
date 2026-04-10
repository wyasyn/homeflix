import { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
} from "expo-audio";
import { Image } from "expo-image";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  PlayCircleIcon,
  PauseIcon,
  Radio01Icon,
  StopIcon,
  VolumeHighIcon,
  VolumeLowIcon,
  VolumeMuteIcon,
} from "@hugeicons/core-free-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  cancelAnimation,
  Easing,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useTheme } from "@/lib/useTheme";
import type { ThemePalette } from "@/constants/theme";

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
      style={[
        barStyle,
        {
          width: 3,
          borderRadius: 1.5,
          backgroundColor: isPlaying ? colors.primary : colors.textSecondary,
          marginHorizontal: 1,
        },
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
  const player = useAudioPlayer({ uri: streamUrl });
  const status = useAudioPlayerStatus(player);
  const [isStopped, setIsStopped] = useState(false);
  const [volume, setVolume] = useState(1);

  const isPlaying = status.playing;
  const isLoading = status.isBuffering;
  const [hasError, setHasError] = useState(false);

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

  useEffect(() => {
    if (status.playbackState === "error") {
      setHasError(true);
      onError?.("Stream failed to load");
    }
  }, [status.playbackState, onError]);

  // Set audio mode and auto-play on mount
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
    })
      .then(() => {
        setIsStopped(false);
        player.play();
      })
      .catch(() => {
        player.play();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync volume
  useEffect(() => {
    player.volume = volume;
  }, [player, volume]);

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      player.pause();
    } else {
      setIsStopped(false);
      player.play();
    }
  }, [player, isPlaying]);

  const stop = useCallback(() => {
    player.pause();
    setIsStopped(true);
  }, [player]);

  const retry = useCallback(() => {
    setHasError(false);
    player.replace({ uri: streamUrl });
    setIsStopped(false);
    player.play();
  }, [player, streamUrl]);

  const statusText = isLoading
    ? "Connecting..."
    : isPlaying
      ? "Live"
      : hasError
        ? "Stream unavailable"
        : isStopped
          ? "Stopped"
          : "Paused";

  const statusColor = isPlaying
    ? colors.primary
    : hasError
      ? colors.error
      : colors.textSecondary;

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
          style={[
            glowStyle,
            {
              position: "absolute",
              width: 240,
              height: 240,
              borderRadius: 120,
              backgroundColor: colors.primary,
            },
          ]}
        />

        <Animated.View
          style={[
            discStyle,
            {
              height: 224,
              width: 224,
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              borderRadius: 999,
              backgroundColor: colors.surfaceLight,
            },
          ]}
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
          <View
            style={{
              position: "absolute",
              height: 40,
              width: 40,
              borderRadius: 999,
              backgroundColor: colors.background,
            }}
          />
        </Animated.View>
      </View>

      {/* Station name */}
      <Text
        style={{
          marginBottom: 4,
          textAlign: "center",
          fontSize: 24,
          fontWeight: "700",
          color: colors.textPrimary,
        }}
      >
        {stationName}
      </Text>

      {/* Status indicator */}
      <View className="mb-6 flex-row items-center gap-2">
        {isPlaying && (
          <View
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: statusColor }}
          />
        )}
        <Text
          className="text-center text-sm font-medium"
          style={{ color: statusColor }}
        >
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
          style={{
            opacity: isPlaying || isLoading ? 1 : 0.4,
            backgroundColor: colors.surface,
            padding: 16,
            borderRadius: 999,
          }}
        >
          <HugeiconsIcon icon={StopIcon} size={28} color={colors.textPrimary} />
        </Pressable>

        <Pressable
          onPress={hasError ? retry : togglePlayback}
          style={({ pressed }) => ({
            transform: [{ scale: pressed ? 0.95 : 1 }],
            backgroundColor: colors.primary,
            padding: 24,
            borderRadius: 999,
          })}
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
          style={{
            backgroundColor: colors.surface,
            padding: 16,
            borderRadius: 999,
          }}
        >
          <HugeiconsIcon icon={volumeIcon} size={28} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* Volume slider */}
      <View className="w-full flex-row items-center justify-center gap-3 px-4">
        <HugeiconsIcon icon={VolumeLowIcon} size={16} color={colors.textSecondary} />
        <View
          style={{
            overflow: "hidden",
            borderRadius: 999,
            backgroundColor: colors.surface,
            width: VOLUME_SLIDER_WIDTH,
            height: 36,
          }}
        >
          <GestureDetector gesture={volumeGesture}>
            <Pressable
              onPress={(e) => {
                const pct = Math.min(
                  1,
                  Math.max(0, e.nativeEvent.locationX / VOLUME_SLIDER_WIDTH)
                );
                setVolume(pct);
              }}
              style={{
                width: VOLUME_SLIDER_WIDTH,
                height: 36,
                justifyContent: "center",
              }}
            >
              {/* Track */}
              <View
                style={{
                  marginHorizontal: 12,
                  height: 6,
                  borderRadius: 999,
                  backgroundColor: colors.border,
                }}
              >
                <View
                  style={{
                    height: 6,
                    borderRadius: 999,
                    backgroundColor: colors.primary,
                    width: `${volume * 100}%`,
                  }}
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
        <Pressable onPress={retry} style={{ marginTop: 24 }}>
          <Text style={{ color: colors.primary }}>Tap play to retry</Text>
        </Pressable>
      )}
    </View>
  );
}
