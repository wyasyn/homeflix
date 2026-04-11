import TrackPlayer, { Capability } from "react-native-track-player";

let _setupDone = false;

/**
 * Initialises react-native-track-player exactly once per app launch.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export async function setupTrackPlayer() {
  if (_setupDone) return;

  await TrackPlayer.setupPlayer({
    // Allow audio to duck (lower volume) when another app briefly needs audio
    autoHandleInterruptions: true,
  });

  await TrackPlayer.updateOptions({
    capabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.Stop,
    ],
    compactCapabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.Stop,
    ],
    // Show elapsed time on the notification
    progressUpdateEventInterval: 2,
  });

  _setupDone = true;
}
