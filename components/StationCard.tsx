import { memo } from "react";
import { Pressable, View, Text } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Tv01Icon, Radio01Icon } from "@hugeicons/core-free-icons";
import { FavouriteButton } from "@/components/FavouriteButton";
import type { Station } from "@/lib/schemas";
import { useTheme } from "@/lib/useTheme";

interface StationCardProps {
  station: Station;
  size?: "small" | "large";
}

export const StationCard = memo(function StationCard({
  station,
  size = "small",
}: StationCardProps) {
  const router = useRouter();
  const { colors } = useTheme();

  const isLarge = size === "large";
  const isTv = station.type === "tv";
  const badgeColor = isTv ? colors.primary : colors.success;

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/station/[id]" as const,
          params: { id: station.id },
        } as never)
      }
      style={({ pressed }) => ({
        opacity: pressed ? 0.8 : 1,
        borderRadius: 16,
      })}
    >
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        {/* Logo */}
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            height: isLarge ? 176 : 112,
            backgroundColor: colors.surfaceLight,
          }}
        >
          {station.logo ? (
            <Image
              source={{ uri: station.logo }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <HugeiconsIcon
              icon={isTv ? Tv01Icon : Radio01Icon}
              size={isLarge ? 48 : 32}
              color={colors.textSecondary}
            />
          )}
        </View>

        {/* Info */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={1}
              style={{
                color: colors.textPrimary,
                fontWeight: "600",
                fontSize: isLarge ? 16 : 14,
              }}
            >
              {station.name}
            </Text>
            <View
              style={{
                marginTop: 4,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 6,
                  backgroundColor: badgeColor + "33",
                }}
              >
                <Text
                  style={{
                    color: badgeColor,
                    fontSize: 11,
                    fontWeight: "500",
                  }}
                >
                  {isTv ? "TV" : "Radio"}
                </Text>
              </View>
              {station.language !== "English" && (
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 11,
                    marginLeft: 8,
                  }}
                >
                  {station.language}
                </Text>
              )}
            </View>
          </View>
          <FavouriteButton stationId={station.id} size={16} />
        </View>
      </View>
    </Pressable>
  );
});
