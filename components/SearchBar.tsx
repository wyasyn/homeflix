import { useTheme } from "@/lib/useTheme";
import { Cancel01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Pressable, TextInput, View } from "react-native";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Search stations...",
}: SearchBarProps) {
  const { colors } = useTheme();
  return (
    <View className="mx-4 mb-4 flex-row items-center rounded-2xl bg-surface px-4 py-1">
      <HugeiconsIcon
        icon={Search01Icon}
        size={20}
        color={colors.textSecondary}
      />
      <TextInput
        className="ml-3 flex-1 text-base text-foreground"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText("")}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          className="ml-2 rounded-full p-1"
        >
          <HugeiconsIcon
            icon={Cancel01Icon}
            size={18}
            color={colors.textSecondary}
          />
        </Pressable>
      )}
    </View>
  );
}
