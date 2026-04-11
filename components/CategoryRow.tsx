import type { Station } from "@/lib/schemas";
import { memo } from "react";
import { FlatList, Text, View } from "react-native";
import { StationCard } from "./StationCard";

interface CategoryRowProps {
  title: string;
  stations: Station[];
}

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
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        renderItem={({ item }) => (
          <View className="w-40">
            <StationCard station={item} />
          </View>
        )}
      />
    </View>
  );
});
