import { memo } from "react";
import { View, Text, FlatList } from "react-native";
import { StationCard } from "./StationCard";
import type { Station } from "@/lib/schemas";
import { useTheme } from "@/lib/useTheme";

interface CategoryRowProps {
  title: string;
  stations: Station[];
}

export const CategoryRow = memo(function CategoryRow({
  title,
  stations,
}: CategoryRowProps) {
  const { colors } = useTheme();
  if (stations.length === 0) return null;

  return (
    <View className="mb-6">
      <Text
        className="mb-3 px-4"
        style={{
          color: colors.textPrimary,
          fontSize: 18,
          fontWeight: "700",
        }}
      >
        {title}
      </Text>
      <FlatList
        data={stations}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        renderItem={({ item }) => (
          <View style={{ width: 160 }}>
            <StationCard station={item} />
          </View>
        )}
      />
    </View>
  );
});
