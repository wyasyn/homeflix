import { Text, View } from "react-native";
import { useTheme } from "@/lib/useTheme";

interface ScreenHeaderProps {
  title: string;
  subtitle: string;
}

export function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  const { colors } = useTheme();
  return (
    <View className="px-4 pb-3 pt-4">
      <Text
        style={{ color: colors.textPrimary, fontSize: 24, fontWeight: "700" }}
      >
        {title}
      </Text>
      <Text
        style={{ color: colors.textSecondary, fontSize: 14, marginTop: 4 }}
      >
        {subtitle}
      </Text>
    </View>
  );
}
