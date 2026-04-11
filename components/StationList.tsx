import type { Station, StationType } from "@/lib/schemas";
import { useDebounce } from "@/lib/useDebounce";
import { useStationStore } from "@/stores/useStationStore";
import { ReactElement, useCallback, useMemo, useState } from "react";
import { FlatList, View } from "react-native";
import { EmptyState } from "./EmptyState";
import { SearchBar } from "./SearchBar";
import { SkeletonCard } from "./SkeletonCard";
import { StationCard } from "./StationCard";

interface StationListProps {
  header: ReactElement;
  type: StationType;
}

export function StationList({ type, header }: StationListProps) {
  const isLoading = useStationStore((s) => s.isLoading);
  const sourceStations = useStationStore((s) =>
    type === "tv" ? s.tvStations : s.radioStations,
  );

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 250);

  const stations = useMemo(() => {
    const q = debouncedQuery.toLowerCase().trim();
    if (!q) return sourceStations;
    return sourceStations.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.categories.some((c) => c.toLowerCase().includes(q)),
    );
  }, [sourceStations, debouncedQuery]);

  const keyExtractor = useCallback((item: Station) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: Station }) => (
      <View className="w-[48%]">
        <StationCard station={item} />
      </View>
    ),
    [],
  );

  const ListHeader = useMemo(
    () => (
      <View>
        {header}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={`Search ${type === "tv" ? "TV" : "radio"} stations...`}
        />
      </View>
    ),
    [header, searchQuery, type],
  );

  if (isLoading && stations.length === 0) {
    return (
      <View className="flex-1 bg-background">
        {ListHeader}
        <View className="flex-row flex-wrap justify-between px-4 pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} className="w-[48%]">
              <SkeletonCard />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={stations}
        keyExtractor={keyExtractor}
        numColumns={2}
        columnWrapperStyle={{
          justifyContent: "space-between",
          paddingHorizontal: 16,
          marginBottom: 12,
        }}
        renderItem={renderItem}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={<EmptyState />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}
