import { View, Text, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft01Icon,
  FavouriteIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useStationStore } from "@/stores/useStationStore";
import { useFavouritesStore } from "@/stores/useFavouritesStore";
import { StationCard } from "@/components/StationCard";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/lib/useTheme";

export default function FavouritesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const ids = useFavouritesStore((s) => s.ids);
  const stations = useStationStore((s) => s.stations);

  const favouriteStations = stations.filter((s) => ids.includes(s.id));

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 8,
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            backgroundColor: colors.surface,
            padding: 10,
            borderRadius: 999,
          }}
          hitSlop={8}
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={22}
            color={colors.textPrimary}
          />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 24,
              fontWeight: "700",
            }}
          >
            Favourites
          </Text>
          <Text
            style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}
          >
            {favouriteStations.length} saved station
            {favouriteStations.length !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      <FlatList
        data={favouriteStations}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{
          justifyContent: "space-between",
          paddingHorizontal: 16,
          marginBottom: 12,
        }}
        renderItem={({ item }) => (
          <View style={{ width: "48%" }}>
            <StationCard station={item} />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            title="No favourites yet"
            message="Tap the heart icon on any station to save it here"
            icon={FavouriteIcon}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}
      />
    </SafeAreaView>
  );
}
