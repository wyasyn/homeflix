import { AudioPlayer } from "@/components/AudioPlayer";
import { VideoPlayer } from "@/components/VideoPlayer";
import { useTheme } from "@/lib/useTheme";
import { useFavouritesStore } from "@/stores/useFavouritesStore";
import { useStationStore } from "@/stores/useStationStore";
import {
  ArrowLeft01Icon,
  FavouriteIcon,
  LinkSquare01Icon,
  Radio01Icon,
  Tv01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function StationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const station = useStationStore((s) => s.stations.find((st) => st.id === id));
  const isFavourite = useFavouritesStore((s) => s.ids.includes(id));
  const toggle = useFavouritesStore((s) => s.toggle);

  if (!station) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Text className="text-text-secondary">Station not found</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-primary">Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="rounded-full bg-surface p-2.5"
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={22}
            color={colors.textPrimary}
          />
        </Pressable>

        <Pressable
          onPress={() => toggle(id)}
          className="rounded-full bg-surface p-2.5"
        >
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
            <Text className="ml-2 text-2xl font-bold text-foreground">
              {station.name}
            </Text>
          </View>

          {station.description ? (
            <Text className="mt-3 text-[15px] leading-6 text-text-secondary">
              {station.description}
            </Text>
          ) : null}

          {/* Tags */}
          {station.categories.length > 0 && (
            <View className="mt-4 flex-row flex-wrap gap-2">
              {station.categories.map((cat) => (
                <View key={cat} className="rounded-lg bg-surface px-3 py-1.5">
                  <Text className="text-[11px] capitalize text-text-secondary">
                    {cat}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Details */}
          <View className="mt-6 rounded-2xl bg-surface p-4">
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
              className="mt-4 flex-row items-center rounded-2xl bg-surface p-4"
            >
              <HugeiconsIcon
                icon={LinkSquare01Icon}
                size={20}
                color={colors.primary}
              />
              <Text className="ml-3 flex-1 text-primary">Visit website</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <Text className="text-[13px] text-text-secondary">{label}</Text>
      <Text className="text-[13px] font-medium text-foreground">{value}</Text>
    </View>
  );
}
