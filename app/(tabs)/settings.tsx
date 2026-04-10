import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import {
  ArrowRight01Icon,
  FavouriteIcon,
  InformationCircleIcon,
  Logout01Icon,
  Mail01Icon,
  Moon02Icon,
  Settings01Icon,
  SmartPhone01Icon,
  StarIcon,
  Sun03Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useAuth, useUser } from "@clerk/expo";
import { useTheme } from "@/lib/useTheme";
import { useThemeStore, type ThemeMode } from "@/stores/useThemeStore";
import { useFavouritesStore } from "@/stores/useFavouritesStore";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";
const APP_NAME = Constants.expoConfig?.name ?? "Homeflix";
const RUNTIME_VERSION =
  (Constants.expoConfig?.runtimeVersion as string | undefined) ??
  Constants.expoConfig?.sdkVersion ??
  "—";

const THEME_OPTIONS: Array<{
  mode: ThemeMode;
  label: string;
  icon: typeof Sun03Icon;
}> = [
  { mode: "light", label: "Light", icon: Sun03Icon },
  { mode: "dark", label: "Dark", icon: Moon02Icon },
  { mode: "system", label: "System", icon: SmartPhone01Icon },
];

export default function SettingsScreen() {
  const { colors, mode } = useTheme();
  const setMode = useThemeStore((s) => s.setMode);
  const favouriteCount = useFavouritesStore((s) => s.ids.length);
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();

  const primaryEmail = user?.primaryEmailAddress?.emailAddress ?? "";
  const displayName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    primaryEmail ||
    "Signed in";
  const avatarUrl = user?.imageUrl;

  const confirmSignOut = () => {
    Alert.alert(
      "Sign out",
      "You'll need to sign in again to sync your favourites.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
              router.replace("/(auth)/sign-in" as never);
            } catch {
              // Clerk already surfaces errors; ignore here
            }
          },
        },
      ],
    );
  };

  const sectionTitleStyle: TextStyle = {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
    marginLeft: 4,
  };

  const cardStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  };

  const rowStyle: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  };

  const dividerStyle: ViewStyle = {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 52,
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: 26,
            fontWeight: "700",
          }}
        >
          Settings
        </Text>
        <Text
          style={{ color: colors.textSecondary, fontSize: 14, marginTop: 2 }}
        >
          Customise your experience
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Appearance */}
        <View>
          <Text style={sectionTitleStyle}>Appearance</Text>
          <View style={cardStyle}>
            <View style={{ padding: 16, gap: 12 }}>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 15,
                  fontWeight: "600",
                }}
              >
                Theme
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {THEME_OPTIONS.map((opt) => {
                  const active = mode === opt.mode;
                  return (
                    <Pressable
                      key={opt.mode}
                      onPress={() => setMode(opt.mode)}
                      style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                        paddingVertical: 12,
                        borderRadius: 10,
                        backgroundColor: active
                          ? colors.primary
                          : colors.surfaceLight,
                        borderWidth: 1,
                        borderColor: active ? colors.primary : colors.border,
                        gap: 6,
                      }}
                    >
                      <HugeiconsIcon
                        icon={opt.icon}
                        size={20}
                        color={active ? "#FFFFFF" : colors.textPrimary}
                      />
                      <Text
                        style={{
                          color: active ? "#FFFFFF" : colors.textPrimary,
                          fontSize: 13,
                          fontWeight: "600",
                        }}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* Library */}
        <View>
          <Text style={sectionTitleStyle}>Library</Text>
          <View style={cardStyle}>
            <Pressable
              style={rowStyle}
              onPress={() => router.push("/favourites")}
            >
              <HugeiconsIcon
                icon={FavouriteIcon}
                size={22}
                color={colors.primary}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 15,
                    fontWeight: "600",
                  }}
                >
                  Favourites
                </Text>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 12,
                    marginTop: 2,
                  }}
                >
                  {favouriteCount} saved station
                  {favouriteCount !== 1 ? "s" : ""}
                </Text>
              </View>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={18}
                color={colors.textSecondary}
              />
            </Pressable>
          </View>
        </View>

        {/* Account */}
        <View>
          <Text style={sectionTitleStyle}>Account</Text>
          <View style={cardStyle}>
            <View style={rowStyle}>
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: colors.surfaceLight,
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: colors.surfaceLight,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <HugeiconsIcon
                    icon={UserIcon}
                    size={22}
                    color={colors.textSecondary}
                  />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    color: colors.textPrimary,
                    fontSize: 15,
                    fontWeight: "600",
                  }}
                >
                  {displayName}
                </Text>
                {!!primaryEmail && (
                  <Text
                    numberOfLines={1}
                    style={{
                      color: colors.textSecondary,
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    {primaryEmail}
                  </Text>
                )}
              </View>
            </View>
            <View style={dividerStyle} />
            <Pressable style={rowStyle} onPress={confirmSignOut}>
              <HugeiconsIcon
                icon={Logout01Icon}
                size={22}
                color="#ef4444"
              />
              <Text
                style={{
                  color: "#ef4444",
                  fontSize: 15,
                  fontWeight: "600",
                  flex: 1,
                }}
              >
                Sign out
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Support */}
        <View>
          <Text style={sectionTitleStyle}>Support</Text>
          <View style={cardStyle}>
            <Pressable
              style={rowStyle}
              onPress={() =>
                Linking.openURL("mailto:support@homeflix.app").catch(() => {})
              }
            >
              <HugeiconsIcon
                icon={Mail01Icon}
                size={22}
                color={colors.textSecondary}
              />
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 15,
                  flex: 1,
                }}
              >
                Contact support
              </Text>
            </Pressable>
            <View style={dividerStyle} />
            <Pressable style={rowStyle}>
              <HugeiconsIcon
                icon={StarIcon}
                size={22}
                color={colors.textSecondary}
              />
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 15,
                  flex: 1,
                }}
              >
                Rate the app
              </Text>
            </Pressable>
          </View>
        </View>

        {/* About */}
        <View>
          <Text style={sectionTitleStyle}>About</Text>
          <View style={cardStyle}>
            <View style={rowStyle}>
              <HugeiconsIcon
                icon={InformationCircleIcon}
                size={22}
                color={colors.textSecondary}
              />
              <Text
                style={{ color: colors.textPrimary, fontSize: 15, flex: 1 }}
              >
                App name
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                {APP_NAME}
              </Text>
            </View>
            <View style={dividerStyle} />
            <View style={rowStyle}>
              <HugeiconsIcon
                icon={Settings01Icon}
                size={22}
                color={colors.textSecondary}
              />
              <Text
                style={{ color: colors.textPrimary, fontSize: 15, flex: 1 }}
              >
                Version
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                {APP_VERSION}
              </Text>
            </View>
            <View style={dividerStyle} />
            <View style={rowStyle}>
              <HugeiconsIcon
                icon={SmartPhone01Icon}
                size={22}
                color={colors.textSecondary}
              />
              <Text
                style={{ color: colors.textPrimary, fontSize: 15, flex: 1 }}
              >
                Runtime
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                {RUNTIME_VERSION}
              </Text>
            </View>
          </View>

          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 12,
              textAlign: "center",
              marginTop: 16,
              lineHeight: 18,
            }}
          >
            Homeflix streams free-to-air Ugandan TV and radio.{"\n"}
            Made with care in Uganda.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
