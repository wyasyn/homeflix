import type { Station } from "@/lib/schemas";
import { memo } from "react";
import { FlatList, ListRenderItem, Text, View } from "react-native";
import { StationCard } from "./StationCard";

interface CategoryRowProps {
  title: string;
  stations: Station[];
}

const CONTENT_CONTAINER_STYLE = { paddingHorizontal: 16, gap: 12 } as const;

const keyExtractor = (item: Station) => item.id;

const renderItem: ListRenderItem<Station> = ({ item }) => (
  <View className="w-40">
    <StationCard station={item} />
  </View>
);

export const CategoryRow = memo(function CategoryRow({
  title,
  stations,
}: CategoryRowProps) {
  if (stations.length === 0) return null;

  return (
    <View className="mb-6">
      <Text className="mb-3 px-4 text-lg font-bold text-foreground">
        {title}
      </Text>
      <FlatList
        data={stations}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={CONTENT_CONTAINER_STYLE}
        renderItem={renderItem}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={3}
        removeClippedSubviews
      />
    </View>
  );
});
