import TrackPlayer, { Event } from "react-native-track-player";

/**
 * Headless playback service — runs in the background even when the app is
 * closed. Handles remote control events from the notification, lock screen,
 * Bluetooth headsets, etc.
 */
export async function PlaybackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    TrackPlayer.play();
  });

  TrackPlayer.addEventListener(Event.RemotePause, () => {
    TrackPlayer.pause();
  });

  TrackPlayer.addEventListener(Event.RemoteStop, () => {
    TrackPlayer.stop();
  });

  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    // Station switching from notification is handled by the app UI.
    // Nothing to do here for a single-stream player.
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    // Same — handled by the app UI.
  });
}
