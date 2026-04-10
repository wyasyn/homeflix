import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { PlayCircleIcon, Tv01Icon } from "@hugeicons/core-free-icons";
import type { Station } from "@/lib/schemas";
import { useTheme } from "@/lib/useTheme";

interface HeroSectionProps {
  station: Station;
}

export function HeroSection({ station }: HeroSectionProps) {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/station/[id]" as const,
          params: { id: station.id },
        } as never)
      }
      className="mx-4 mb-6 overflow-hidden"
      style={{ borderRadius: 16 }}
    >
      <View style={{ height: 208, backgroundColor: colors.surfaceLight }}>
        {station.logo ? (
          <Image
            source={{ uri: station.logo }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <HugeiconsIcon
              icon={Tv01Icon}
              size={64}
              color={colors.textSecondary}
            />
          </View>
        )}

        {/* Gradient overlay */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.8)"]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "60%",
          }}
        />

        {/* Content overlay */}
        <View className="absolute bottom-0 left-0 right-0 p-4">
          <View className="mb-1 flex-row items-center">
            <View
              style={{
                backgroundColor: colors.primary,
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 2,
              }}
            >
              <Text
                style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}
              >
                FEATURED
              </Text>
            </View>
            <Text
              style={{
                marginLeft: 8,
                fontSize: 11,
                color: "rgba(255,255,255,0.7)",
              }}
            >
              {station.type === "tv" ? "TV" : "Radio"}
            </Text>
          </View>
          <Text
            style={{ fontSize: 20, fontWeight: "700", color: "#fff" }}
          >
            {station.name}
          </Text>
          {station.description ? (
            <Text
              numberOfLines={1}
              style={{
                marginTop: 4,
                fontSize: 13,
                color: "rgba(255,255,255,0.7)",
              }}
            >
              {station.description}
            </Text>
          ) : null}

          <View className="mt-3 flex-row items-center">
            <View
              className="flex-row items-center px-4 py-2"
              style={{ backgroundColor: colors.primary, borderRadius: 999 }}
            >
              <HugeiconsIcon icon={PlayCircleIcon} size={18} color="#fff" />
              <Text
                style={{
                  marginLeft: 8,
                  color: "#fff",
                  fontWeight: "600",
                  fontSize: 13,
                }}
              >
                {station.type === "tv" ? "Watch Now" : "Listen Now"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
