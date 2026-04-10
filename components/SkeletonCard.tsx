import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";
import { useTheme } from "@/lib/useTheme";

export function SkeletonCard() {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.7, { duration: 800 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View
      className="mb-3 overflow-hidden"
      style={{ backgroundColor: colors.surface, borderRadius: 16 }}
    >
      <Animated.View
        style={[{ height: 112, backgroundColor: colors.surfaceLight }, animatedStyle]}
      />
      <View className="px-3 py-2.5">
        <Animated.View
          style={[
            {
              height: 16,
              width: "75%",
              borderRadius: 4,
              backgroundColor: colors.surfaceLight,
            },
            animatedStyle,
          ]}
        />
        <Animated.View
          style={[
            {
              marginTop: 8,
              height: 12,
              width: "33%",
              borderRadius: 4,
              backgroundColor: colors.surfaceLight,
            },
            animatedStyle,
          ]}
        />
      </View>
    </View>
  );
}
