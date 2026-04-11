import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

export function SkeletonCard() {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.7, { duration: 800 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View className="mb-3 overflow-hidden rounded-2xl bg-surface">
      <Animated.View
        className="h-28 bg-surface-light"
        style={animatedStyle}
      />
      <View className="px-3 py-2.5">
        <Animated.View
          className="h-4 w-3/4 rounded bg-surface-light"
          style={animatedStyle}
        />
        <Animated.View
          className="mt-2 h-3 w-1/3 rounded bg-surface-light"
          style={animatedStyle}
        />
      </View>
    </View>
  );
}
