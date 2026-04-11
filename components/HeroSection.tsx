import { Station } from "@/lib/schemas";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

export function HeroSection({
  featuredStations,
}: {
  featuredStations: Station[];
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mb-6"
    >
      {featuredStations.map((station, index) => (
        <Pressable
          key={station.id}
          className=" mr-3 rounded-2xl p-2 overflow-hidden bg-surface"
          style={{ width: 150, height: 200 }}
          onPress={() =>
            router.push({
              pathname: "/station/[id]" as const,
              params: { id: station.id },
            } as never)
          }
        >
          <View>
            <Text className=" text-lg  text-foreground">{station.name}</Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}
