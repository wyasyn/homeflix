import { EmptyState } from "@/components/EmptyState";
import { StationCard } from "@/components/StationCard";
import { useFavouritesStore } from "@/stores/useFavouritesStore";
import { useStationStore } from "@/stores/useStationStore";
import { FavouriteIcon } from "@hugeicons/core-free-icons";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FavouritesTabScreen() {
  const ids = useFavouritesStore((s) => s.ids);
  const stations = useStationStore((s) => s.stations);

  const favouriteStations = stations.filter((s) => ids.includes(s.id));

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="px-4 pb-2 pt-4">
        <Text className="text-[26px] font-bold text-foreground">
          Favourites
        </Text>
        <Text className="mt-0.5 text-sm text-text-secondary">
          {favouriteStations.length} saved station
          {favouriteStations.length !== 1 ? "s" : ""}
        </Text>
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
          <View className="w-[48%]">
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
