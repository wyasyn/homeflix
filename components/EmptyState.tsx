import { View, Text } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { useTheme } from "@/lib/useTheme";

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
      <Text
        style={{
          color: colors.textPrimary,
          fontSize: 18,
          fontWeight: "600",
          marginTop: 16,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: 14,
          textAlign: "center",
          marginTop: 8,
        }}
      >
        {message}
      </Text>
    </View>
  );
}
