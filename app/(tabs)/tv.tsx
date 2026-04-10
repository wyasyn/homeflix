import { ScreenHeader } from "@/components/ScreenHeader";
import { StationList } from "@/components/StationList";
import { useTheme } from "@/lib/useTheme";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TVScreen() {
  const { colors } = useTheme();
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      <StationList
        type="tv"
        header={
          <ScreenHeader
            title="TV Stations"
            subtitle="Live free-to-air TV channels"
          />
        }
      />
    </SafeAreaView>
  );
}
