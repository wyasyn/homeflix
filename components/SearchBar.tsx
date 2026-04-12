import { useTheme } from "@/lib/useTheme";
import { Cancel01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { forwardRef, memo, useCallback } from "react";
import { Pressable, TextInput, View } from "react-native";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const SearchBar = memo(
  forwardRef<TextInput, SearchBarProps>(function SearchBar(
    { value, onChangeText, placeholder = "Search stations..." },
    ref,
  ) {
    const { colors } = useTheme();

    const handleClear = useCallback(() => onChangeText(""), [onChangeText]);
    const handleSubmit = useCallback(() => {
      if (ref && typeof ref !== "function" && ref.current) {
        ref.current.blur();
      }
    }, [ref]);

    return (
      <View className="mx-4 mb-4 flex-row items-center rounded-2xl bg-surface px-4 py-1">
        <HugeiconsIcon
          icon={Search01Icon}
          size={20}
          color={colors.textSecondary}
        />
        <TextInput
          ref={ref}
          className="ml-3 flex-1 text-base text-foreground"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={handleSubmit}
        />
        {value.length > 0 && (
          <Pressable
            onPress={handleClear}
            hitSlop={12}
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
  }),
);
