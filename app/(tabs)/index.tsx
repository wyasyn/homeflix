import { ScrollView, View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { FavouriteIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useStationStore } from "@/stores/useStationStore";
import { useFavouritesStore } from "@/stores/useFavouritesStore";
import { HeroSection } from "@/components/HeroSection";
import { CategoryRow } from "@/components/CategoryRow";
import { SkeletonCard } from "@/components/SkeletonCard";
import { useTheme } from "@/lib/useTheme";

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const favouriteCount = useFavouritesStore((s) => s.ids.length);
  const stations = useStationStore((s) => s.stations);
  const isLoading = useStationStore((s) => s.isLoading);
  const tvStations = useStationStore((s) => s.tvStations);
  const radioStations = useStationStore((s) => s.radioStations);
  const internationalStations = useStationStore((s) => s.internationalStations);
  const featuredStations = useStationStore((s) => s.featuredStations);

  const heroStation = featuredStations[0];

  if (isLoading && stations.length === 0) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={["top"]}
      >
        <View className="px-4 pt-6">
          <View
            style={{
              marginBottom: 24,
              height: 32,
              width: 128,
              borderRadius: 4,
              backgroundColor: colors.surfaceLight,
            }}
          />
          <View
            style={{
              height: 208,
              borderRadius: 16,
              backgroundColor: colors.surfaceLight,
            }}
          />
          <View className="mt-6 flex-row gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <View key={i} style={{ width: 160 }}>
                <SkeletonCard />
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Header */}
        <View
          className="flex-row items-center justify-between px-4 pb-4 pt-6"
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 30,
                fontWeight: "700",
              }}
            >
              Homeflix
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 14,
                marginTop: 4,
              }}
            >
              Live Uganda TV & Radio
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/favourites")}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Open favourites"
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 10,
              borderRadius: 999,
              position: "relative",
            })}
          >
            <HugeiconsIcon
              icon={FavouriteIcon}
              size={22}
              color={colors.textPrimary}
            />
            {favouriteCount > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  minWidth: 18,
                  height: 18,
                  paddingHorizontal: 4,
                  borderRadius: 999,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: colors.background,
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 10,
                    fontWeight: "700",
                  }}
                >
                  {favouriteCount > 99 ? "99+" : favouriteCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Hero */}
        {heroStation && <HeroSection station={heroStation} />}

        {/* Category rows */}
        <CategoryRow title="Popular TV" stations={tvStations.slice(0, 10)} />
        <CategoryRow
          title="Radio Stations"
          stations={radioStations.slice(0, 10)}
        />
        {internationalStations.length > 0 && (
          <CategoryRow
            title="International"
            stations={internationalStations}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
