import { AuthView } from "@clerk/expo/native";

import { SafeAreaView } from "react-native-safe-area-context";

export default function SignInScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background " edges={["top"]}>
      <AuthView mode="signInOrUp" />
    </SafeAreaView>
  );
}
