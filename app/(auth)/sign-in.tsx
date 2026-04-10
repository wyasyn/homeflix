import { useTheme } from "@/lib/useTheme";
import { useSSO } from "@clerk/expo";
import * as AuthSession from "expo-auth-session";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

WebBrowser.maybeCompleteAuthSession();

const useWarmUpBrowser = () => {
  React.useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

export default function SignInScreen() {
  useWarmUpBrowser();
  const { colors } = useTheme();
  const router = useRouter();
  const { startSSOFlow } = useSSO();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleGoogleSignIn = React.useCallback(async () => {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: AuthSession.makeRedirectUri(),
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace("/");
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Sign-in failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [loading, router, startSSOFlow]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "bottom"]}
    >
      <View style={styles.container}>
        <View style={styles.hero}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text
            style={[
              styles.title,
              { color: colors.textPrimary },
            ]}
          >
            Welcome to Homeflix
          </Text>
          <Text
            style={[styles.subtitle, { color: colors.textSecondary }]}
          >
            Stream free-to-air Ugandan TV and radio. Sign in to sync your
            favourites across devices.
          </Text>
        </View>

        <View style={styles.actions}>
          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            onPress={handleGoogleSignIn}
            disabled={loading}
            style={({ pressed }) => [
              styles.googleButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: loading ? 0.6 : pressed ? 0.85 : 1,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <>
                <View style={styles.googleLogo}>
                  <Text style={{ fontWeight: "700", fontSize: 16 }}>G</Text>
                </View>
                <Text
                  style={[
                    styles.googleButtonText,
                    { color: colors.textPrimary },
                  ]}
                >
                  Continue with Google
                </Text>
              </>
            )}
          </Pressable>

          <Text style={[styles.legal, { color: colors.textSecondary }]}>
            By continuing, you agree to our Terms of Service and Privacy
            Policy.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: "space-between",
  },
  hero: {
    alignItems: "center",
    marginTop: 48,
    gap: 16,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 20,
    marginBottom: 8,
  },
  title: {
    textAlign: "center",
    fontSize: 26,
    fontWeight: "700",
  },
  subtitle: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  actions: {
    gap: 16,
    marginBottom: 16,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  googleLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  legal: {
    textAlign: "center",
    fontSize: 11,
    lineHeight: 16,
    paddingHorizontal: 16,
  },
  error: {
    textAlign: "center",
    fontSize: 13,
    color: "#ef4444",
  },
});
