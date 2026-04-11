import { Text, View } from "react-native";

function ErrorScreen({ message }: { message: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-[#0b0b0f] p-6">
      <Text className="mb-2 text-center text-lg font-semibold text-white">
        Something went wrong
      </Text>
      <Text className="text-center text-sm leading-5 text-[#b3b3b8]">
        {message}
      </Text>
    </View>
  );
}

export default ErrorScreen;
