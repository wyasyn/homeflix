import { WARMUP_SOURCE, WARMUP_STYLE } from "@/constants/contants";
import { useEffect, useState } from "react";
import { InteractionManager, View } from "react-native";
import Video from "react-native-video";

export function VideoWarmup({ onReady }: { onReady: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setMounted(true);
    });
    return () => task.cancel();
  }, []);

  if (!mounted) return null;

  return (
    <View pointerEvents="none" className="absolute h-px w-px opacity-0">
      <Video
        source={WARMUP_SOURCE}
        paused
        muted
        repeat={false}
        playInBackground={false}
        playWhenInactive={false}
        onLoad={onReady}
        onError={onReady}
        style={WARMUP_STYLE}
      />
    </View>
  );
}
