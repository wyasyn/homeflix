import { ScreenHeader } from "@/components/ScreenHeader";
import { StationList } from "@/components/StationList";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TVScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
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
