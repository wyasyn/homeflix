import { create } from "zustand";
import type { Station } from "@/lib/schemas";

interface PlayerStore {
  currentStation: Station | null;
  // Set on press, before navigation — lets players start warming up immediately
  pendingStationId: string | null;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setPending: (stationId: string) => void;
  clearPending: () => void;
  play: (station: Station) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  currentStation: null,
  pendingStationId: null,
  isPlaying: false,
  isLoading: false,
  error: null,

  setPending: (stationId) => set({ pendingStationId: stationId }),

  clearPending: () => set({ pendingStationId: null }),

  play: (station) =>
    set({
      currentStation: station,
      pendingStationId: null,
      isPlaying: true,
      isLoading: true,
      error: null,
    }),

  pause: () => set({ isPlaying: false }),

  resume: () => set({ isPlaying: true }),

  stop: () =>
    set({
      currentStation: null,
      pendingStationId: null,
      isPlaying: false,
      isLoading: false,
      error: null,
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error, isPlaying: false, isLoading: false }),
}));
