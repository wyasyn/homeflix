import { useTheme } from "@/lib/useTheme";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Text, View } from "react-native";

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: Parameters<typeof HugeiconsIcon>[0]["icon"];
}

export function EmptyState({
  title = "No stations found",
  message = "Try a different search term",
  icon = Search01Icon,
}: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View className="flex-1 items-center justify-center px-8 py-20">
      <HugeiconsIcon icon={icon} size={48} color={colors.textSecondary} />
      <Text className="mt-4 text-lg font-semibold text-foreground">
        {title}
      </Text>
      <Text className="mt-2 text-center text-sm text-text-secondary">
        {message}
      </Text>
    </View>
  );
}
