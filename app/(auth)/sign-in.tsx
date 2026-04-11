import { useTheme } from "@/lib/useTheme";
import { useAuth } from "@clerk/expo";
import { AuthView } from "@clerk/expo/native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignInScreen() {
  const { isSignedIn, isLoaded } = useAuth({ treatPendingAsSignedOut: false });
  const { resolved } = useTheme();

  if (!isLoaded || isSignedIn) return null;

  return (
    <SafeAreaView className="flex-1 bg-background " edges={["top"]}>
      <StatusBar style={resolved === "light" ? "dark" : "light"} />
      <AuthView mode="signInOrUp" />
    </SafeAreaView>
  );
}
