import { setAudioModeAsync } from "expo-audio";

let _setupDone = false;

/**
 * Configures the global audio mode once per app launch.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export async function setupTrackPlayer() {
  if (_setupDone) return;

  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    interruptionMode: "duckOthers",
  });

  _setupDone = true;
}
