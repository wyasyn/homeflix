import { Station } from "@/lib/schemas";
import { useTheme } from "@/lib/useTheme";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Radio01Icon, Tv01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { Animated, Dimensions, Pressable, Text, View } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CENTER_CARD_WIDTH = SCREEN_WIDTH * 0.7;
const PEEK_WIDTH = SCREEN_WIDTH * 0.13;
const ITEM_SPACING = 6;

const SLOT_WIDTH = CENTER_CARD_WIDTH;
const ITEM_SIZE = SLOT_WIDTH + ITEM_SPACING;

const CARD_HEIGHT = 220;
const SIDE_PADDING = PEEK_WIDTH;

const SCALE_ACTIVE = 1;
const SCALE_INACTIVE = 0.82;
const OPACITY_ACTIVE = 1;
const OPACITY_INACTIVE = 0.5;

const ANIM_RANGE = ITEM_SIZE * 0.55;

const CONTAINER_STYLE = { marginBottom: 24 } as const;
const CONTENT_CONTAINER_STYLE = {
  paddingHorizontal: SIDE_PADDING,
  paddingVertical: 24,
  gap: ITEM_SPACING,
  alignItems: "center" as const,
};

type ThemeColors = ReturnType<typeof useTheme>["colors"];

export function HeroSection({
  featuredStations,
}: {
  featuredStations: Station[];
}) {
  const { colors } = useTheme();
  const scrollX = useRef(new Animated.Value(0)).current;
  const middleIndex = Math.floor(featuredStations.length / 2);

  const initialOffset = useMemo(
    () => ({ x: middleIndex * ITEM_SIZE, y: 0 }),
    [middleIndex],
  );

  const onScroll = useMemo(
    () =>
      Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        { useNativeDriver: true },
      ),
    [scrollX],
  );

  return (
    <View style={CONTAINER_STYLE}>
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={ITEM_SIZE}
        disableIntervalMomentum
        contentOffset={initialOffset}
        contentContainerStyle={CONTENT_CONTAINER_STYLE}
        scrollEventThrottle={16}
        onScroll={onScroll}
      >
        {featuredStations.map((station, index) => (
          <FeaturedCard
            key={station.id}
            station={station}
            index={index}
            scrollX={scrollX}
            colors={colors}
          />
        ))}
      </Animated.ScrollView>
    </View>
  );
}

interface FeaturedCardProps {
  station: Station;
  index: number;
  scrollX: Animated.Value;
  colors: ThemeColors;
}

const FeaturedCard = memo(function FeaturedCard({
  station,
  index,
  scrollX,
  colors,
}: FeaturedCardProps) {
  const { scale, opacity } = useMemo(() => {
    const center = index * ITEM_SIZE;
    const inputRange = [center - ANIM_RANGE, center, center + ANIM_RANGE];
    return {
      scale: scrollX.interpolate({
        inputRange,
        outputRange: [SCALE_INACTIVE, SCALE_ACTIVE, SCALE_INACTIVE],
        extrapolate: "clamp",
      }),
      opacity: scrollX.interpolate({
        inputRange,
        outputRange: [OPACITY_INACTIVE, OPACITY_ACTIVE, OPACITY_INACTIVE],
        extrapolate: "clamp",
      }),
    };
  }, [index, scrollX]);

  const isTv = station.type === "tv";
  const badgeColor = isTv ? colors.primary : colors.success;

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    usePlayerStore.getState().setPending(station.id);
    router.push({
      pathname: "/station/[id]" as const,
      params: { id: station.id },
    } as never);
  }, [station.id]);

  const animatedStyle = useMemo(
    () => ({
      width: SLOT_WIDTH,
      height: CARD_HEIGHT,
      opacity,
      transform: [{ scale }],
      borderRadius: 20,
      overflow: "hidden" as const,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 12,
    }),
    [opacity, scale],
  );

  const overlayBgStyle = useMemo(
    () => ({
      position: "absolute" as const,
      bottom: 0,
      left: 0,
      right: 0,
      top: 0,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      backgroundColor: colors.background + "D9",
    }),
    [colors.background],
  );

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={{ flex: 1 }}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`Play ${station.name}`}
      >
        <CardImage station={station} colors={colors} />

        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 14,
            paddingBottom: 14,
            paddingTop: 40,
            justifyContent: "flex-end",
          }}
        >
          <View style={overlayBgStyle} />
          <View style={{ position: "relative" }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 5,
                gap: 6,
              }}
            >
              <View
                style={{
                  backgroundColor: badgeColor + "30",
                  borderRadius: 6,
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                }}
              >
                <Text
                  style={{
                    color: badgeColor,
                    fontSize: 10,
                    fontWeight: "700",
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                  }}
                >
                  {isTv ? "TV" : "Radio"}
                </Text>
              </View>
            </View>
            <Text
              numberOfLines={1}
              style={{
                color: colors.textPrimary,
                fontSize: 15,
                fontWeight: "800",
                letterSpacing: 0.3,
              }}
            >
              {station.name}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

function CardImage({
  station,
  colors,
}: {
  station: Station;
  colors: ThemeColors;
}) {
  const [logoFailed, setLogoFailed] = useState(false);
  const handleError = useCallback(() => setLogoFailed(true), []);
  const showFallback = !station.logo || logoFailed;
  const isTv = station.type === "tv";

  if (showFallback) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.surface,
        }}
      >
        <HugeiconsIcon
          icon={isTv ? Tv01Icon : Radio01Icon}
          size={52}
          color={colors.textSecondary}
        />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: station.logo }}
      style={{ width: "100%", height: "100%" }}
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={300}
      onError={handleError}
    />
  );
}
