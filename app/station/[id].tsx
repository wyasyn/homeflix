import { View, Text, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  FavouriteIcon,
  Tv01Icon,
  Radio01Icon,
  LinkSquare01Icon,
} from "@hugeicons/core-free-icons";
import { useStationStore } from "@/stores/useStationStore";
import { useFavouritesStore } from "@/stores/useFavouritesStore";
import { VideoPlayer } from "@/components/VideoPlayer";
import { AudioPlayer } from "@/components/AudioPlayer";
import { useTheme } from "@/lib/useTheme";
import * as WebBrowser from "expo-web-browser";

export default function StationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const station = useStationStore((s) => s.stations.find((st) => st.id === id));
  const isFavourite = useFavouritesStore((s) => s.ids.includes(id));
  const toggle = useFavouritesStore((s) => s.toggle);

  if (!station) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <Text style={{ color: colors.textSecondary }}>Station not found</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary }}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const iconPill = {
    backgroundColor: colors.surface,
    padding: 10,
    borderRadius: 999,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable onPress={() => router.back()} style={iconPill}>
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={22}
            color={colors.textPrimary}
          />
        </Pressable>

        <Pressable onPress={() => toggle(id)} style={iconPill}>
          <HugeiconsIcon
            icon={FavouriteIcon}
            size={22}
            color={isFavourite ? colors.primary : colors.textSecondary}
          />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Player */}
        {station.type === "tv" ? (
          <VideoPlayer streamUrl={station.streamUrl} borderless />
        ) : (
          <View className="px-4">
            <AudioPlayer
              streamUrl={station.streamUrl}
              stationName={station.name}
              logo={station.logo}
            />
          </View>
        )}

        {/* Station Info */}
        <View className="mt-6 px-4">
          <View className="flex-row items-center">
            <HugeiconsIcon
              icon={station.type === "tv" ? Tv01Icon : Radio01Icon}
              size={20}
              color={station.type === "tv" ? colors.primary : colors.success}
            />
            <Text
              style={{
                marginLeft: 8,
                fontSize: 24,
                fontWeight: "700",
                color: colors.textPrimary,
              }}
            >
              {station.name}
            </Text>
          </View>

          {station.description ? (
            <Text
              style={{
                marginTop: 12,
                fontSize: 15,
                lineHeight: 24,
                color: colors.textSecondary,
              }}
            >
              {station.description}
            </Text>
          ) : null}

          {/* Tags */}
          {station.categories.length > 0 && (
            <View className="mt-4 flex-row flex-wrap gap-2">
              {station.categories.map((cat) => (
                <View
                  key={cat}
                  style={{
                    backgroundColor: colors.surface,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: 11,
                      textTransform: "capitalize",
                    }}
                  >
                    {cat}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Details */}
          <View
            style={{
              marginTop: 24,
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 16,
            }}
          >
            <DetailRow label="Language" value={station.language} />
            <DetailRow label="Country" value={station.country} />
            <DetailRow
              label="Type"
              value={station.type === "tv" ? "Television" : "Radio"}
            />
          </View>

          {/* Website link */}
          {station.website && (
            <Pressable
              onPress={() => WebBrowser.openBrowserAsync(station.website!)}
              className="mt-4 flex-row items-center"
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 16,
              }}
            >
              <HugeiconsIcon
                icon={LinkSquare01Icon}
                size={20}
                color={colors.primary}
              />
              <Text
                style={{ marginLeft: 12, flex: 1, color: colors.primary }}
              >
                Visit website
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View className="flex-row items-center justify-between py-2">
      <Text style={{ fontSize: 13, color: colors.textSecondary }}>{label}</Text>
      <Text
        style={{
          fontSize: 13,
          fontWeight: "500",
          color: colors.textPrimary,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
