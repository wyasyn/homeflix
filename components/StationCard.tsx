import { FavouriteButton } from "@/components/FavouriteButton";
import type { Station } from "@/lib/schemas";
import { useTheme } from "@/lib/useTheme";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Radio01Icon, Tv01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { memo, useState } from "react";
import { Pressable, Text, View } from "react-native";

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
  const [logoFailed, setLogoFailed] = useState(false);
  const showFallback = !station.logo || logoFailed;

  return (
    <Pressable
      onPress={() => {
        usePlayerStore.getState().setPending(station.id);
        router.push({
          pathname: "/station/[id]" as const,
          params: { id: station.id },
        } as never);
      }}
      className="rounded-2xl active:opacity-80"
    >
      <View className="overflow-hidden rounded-2xl border border-border bg-surface">
        {/* Logo */}
        <View
          className={`items-center justify-center bg-surface-light ${isLarge ? "h-44" : "h-28"}`}
        >
          {showFallback ? (
            <HugeiconsIcon
              icon={isTv ? Tv01Icon : Radio01Icon}
              size={isLarge ? 48 : 32}
              color={colors.textSecondary}
            />
          ) : (
            <Image
              source={{ uri: station.logo }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={200}
              onError={() => setLogoFailed(true)}
            />
          )}
        </View>

        {/* Info */}
        <View className="flex-row items-start justify-between px-3 py-2.5">
          <View className="flex-1">
            <Text
              numberOfLines={1}
              className={`font-semibold text-foreground ${isLarge ? "text-base" : "text-sm"}`}
            >
              {station.name}
            </Text>
            <View className="mt-1 flex-row items-center">
              <View
                className="rounded-md px-1.5 py-0.5"
                style={{ backgroundColor: badgeColor + "33" }}
              >
                <Text
                  className="text-[11px] font-medium"
                  style={{ color: badgeColor }}
                >
                  {isTv ? "TV" : "Radio"}
                </Text>
              </View>
              {station.language !== "English" && (
                <Text className="ml-2 text-[11px] text-text-secondary">
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
