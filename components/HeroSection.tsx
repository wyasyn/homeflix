import { Station } from "@/lib/schemas";
import { useTheme } from "@/lib/useTheme";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Radio01Icon, Tv01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Animated, Dimensions, Pressable, Text, View } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CENTER_CARD_WIDTH = SCREEN_WIDTH * 0.70;
const PEEK_WIDTH = SCREEN_WIDTH * 0.13;
const ITEM_SPACING = 6;

const SLOT_WIDTH = CENTER_CARD_WIDTH;
const ITEM_SIZE = SLOT_WIDTH + ITEM_SPACING;

// Fixed height — scale does the visual size difference, no JS-thread height needed
const CARD_HEIGHT = 220;

const SIDE_PADDING = PEEK_WIDTH;

const SCALE_ACTIVE = 1;
const SCALE_INACTIVE = 0.82;
const OPACITY_ACTIVE = 1;
const OPACITY_INACTIVE = 0.5;

// Animation completes over 55% of a card slot — feels snappy
const ANIM_RANGE = ITEM_SIZE * 0.55;

export function HeroSection({
  featuredStations,
}: {
  featuredStations: Station[];
}) {
  const { colors } = useTheme();
  const scrollX = useRef(new Animated.Value(0)).current;
  const middleIndex = Math.floor(featuredStations.length / 2);

  return (
    <View style={{ marginBottom: 24 }}>
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={ITEM_SIZE}
        disableIntervalMomentum
        contentOffset={{ x: middleIndex * ITEM_SIZE, y: 0 }}
        contentContainerStyle={{
          paddingHorizontal: SIDE_PADDING,
          paddingVertical: 24,
          gap: ITEM_SPACING,
          alignItems: "center",
        }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
      >
        {featuredStations.map((station, index) => {
          const center = index * ITEM_SIZE;
          const inputRange = [center - ANIM_RANGE, center, center + ANIM_RANGE];

          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [SCALE_INACTIVE, SCALE_ACTIVE, SCALE_INACTIVE],
            extrapolate: "clamp",
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [OPACITY_INACTIVE, OPACITY_ACTIVE, OPACITY_INACTIVE],
            extrapolate: "clamp",
          });

          const isTv = station.type === "tv";
          const badgeColor = isTv ? colors.primary : colors.success;

          return (
            <Animated.View
              key={station.id}
              style={{
                width: SLOT_WIDTH,
                height: CARD_HEIGHT,
                opacity,
                transform: [{ scale }],
                borderRadius: 20,
                overflow: "hidden",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.35,
                shadowRadius: 16,
                elevation: 12,
              }}
            >
              <Pressable
                style={{ flex: 1 }}
                onPress={() => {
                  usePlayerStore.getState().setPending(station.id);
                  router.push({
                    pathname: "/station/[id]" as const,
                    params: { id: station.id },
                  } as never);
                }}
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
                  <View
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      top: 0,
                      borderBottomLeftRadius: 20,
                      borderBottomRightRadius: 20,
                      backgroundColor: colors.background + "D9",
                    }}
                  />
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
        })}
      </Animated.ScrollView>
    </View>
  );
}

function CardImage({
  station,
  colors,
}: {
  station: Station;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const [logoFailed, setLogoFailed] = useState(false);
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
      transition={300}
      onError={() => setLogoFailed(true)}
    />
  );
}
