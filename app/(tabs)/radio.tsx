import { ScreenHeader } from "@/components/ScreenHeader";
import { StationList } from "@/components/StationList";
import { useTheme } from "@/lib/useTheme";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RadioScreen() {
  const { colors } = useTheme();
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      <StationList
        type="radio"
        header={
          <ScreenHeader
            title="Radio Stations"
            subtitle="Live Ugandan radio streams"
          />
        }
      />
    </SafeAreaView>
  );
}
