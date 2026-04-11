import { useTheme } from "@/lib/useTheme";
import { useStationStore } from "@/stores/useStationStore";
import { ActivityIndicator, Text, View } from "react-native";

interface RefreshIndicatorProps {
  label?: string;
  className?: string;
}

export function RefreshIndicator({
  label = "Updating…",
  className,
}: RefreshIndicatorProps) {
  const isRefreshing = useStationStore((s) => s.isRefreshing);
  const { colors } = useTheme();

  if (!isRefreshing) return null;

  return (
    <View
      className={`flex-row items-center self-start rounded-full border border-border bg-surface px-3 py-1.5 ${
        className ?? ""
      }`}
    >
      <ActivityIndicator size="small" color={colors.primary} />
      <Text className="ml-2 text-xs font-medium text-text-secondary">
        {label}
      </Text>
    </View>
  );
}
