import type { Station } from "@/lib/schemas";
import { PlayCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import radioFallback from "../assets/images/radio.jpg";
import tvFallback from "../assets/images/tv.jpg";

interface HeroSectionProps {
  station: Station;
}

export function HeroSection({ station }: HeroSectionProps) {
  const router = useRouter();
  const [logoFailed, setLogoFailed] = useState(false);
  const isTv = isTv;
  const showFallback = !station.logo || logoFailed;
  const fallbackSource = isTv ? tvFallback : radioFallback;

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/station/[id]" as const,
          params: { id: station.id },
        } as never)
      }
      className="mx-4 mb-6 overflow-hidden rounded-2xl"
    >
      <View className="h-52 bg-surface-light">
        {showFallback ? (
          <Image
            source={fallbackSource}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <Image
            source={{ uri: station.logo }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={300}
            onError={() => setLogoFailed(true)}
          />
        )}

        {/* Gradient overlay */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.8)"]}
          className="absolute bottom-0 left-0 right-0 h-[60%]"
        />

        {/* Content overlay */}
        <View className="absolute bottom-0 left-0 right-0 p-4">
          <View className="mb-1 flex-row items-center">
            <View className="rounded-md bg-primary px-2 py-0.5">
              <Text className="text-[11px] font-bold text-white">
                FEATURED
              </Text>
            </View>
            <Text className="ml-2 text-[11px] text-white/70">
              {isTv ? "TV" : "Radio"}
            </Text>
          </View>
          <Text className="text-xl font-bold text-white">{station.name}</Text>
          {station.description ? (
            <Text
              numberOfLines={1}
              className="mt-1 text-[13px] text-white/70"
            >
              {station.description}
            </Text>
          ) : null}

          <View className="mt-3 flex-row items-center">
            <View className="flex-row items-center rounded-full bg-primary px-4 py-2">
              <HugeiconsIcon icon={PlayCircleIcon} size={18} color="#fff" />
              <Text className="ml-2 text-[13px] font-semibold text-white">
                {isTv ? "Watch Now" : "Listen Now"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
