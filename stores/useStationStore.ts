import { create } from "zustand";
import type { Station, StationType } from "@/lib/schemas";
import { fetchStationsFromIPTV } from "@/lib/iptv";
import { getCachedData, setCachedData, isCacheValid, setCacheTimestamp } from "@/lib/cache";
import { CACHE_KEYS } from "@/lib/constants";

/**
 * Lazily load + validate the bundled fallback stations.
 * Kept out of module scope so a valid-cache cold start never pays for the
 * JSON parse or the zod schema walk.
 */
function loadFallbackStations(): Station[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const data = require("@/data/fallback-stations.json");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { stationsArraySchema } = require("@/lib/schemas");
  return stationsArraySchema.parse(data);
}

interface StationStore {
  stations: Station[];
  // Derived slices, recomputed once per stations update so components can
  // subscribe to a stable array reference without per-render filter() work.
  tvStations: Station[];
  radioStations: Station[];
  featuredStations: Station[];
  internationalStations: Station[];

  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  searchQuery: string;
  lastFetched: number | null;

  // Actions
  fetchStations: () => Promise<void>;
  refreshStations: () => Promise<void>;
  setSearchQuery: (query: string) => void;

  // Selectors that depend on runtime arguments stay as functions
  getStationsByType: (type: StationType) => Station[];
  getStationById: (id: string) => Station | undefined;
  searchStations: (type?: StationType) => Station[];
}

/**
 * Compute all derived slices in a single pass over `stations`. Cheaper than
 * four separate `.filter()` calls and produces stable references that survive
 * unrelated store updates.
 */
function deriveSlices(stations: Station[]) {
  const tvStations: Station[] = [];
  const radioStations: Station[] = [];
  const featuredStations: Station[] = [];
  const internationalStations: Station[] = [];

  for (const s of stations) {
    if (s.type === "tv") tvStations.push(s);
    else if (s.type === "radio") radioStations.push(s);
    if (s.isFeatured) featuredStations.push(s);
    if (s.country !== "UG") internationalStations.push(s);
  }

  return { tvStations, radioStations, featuredStations, internationalStations };
}

export const useStationStore = create<StationStore>((set, get) => ({
  stations: [],
  tvStations: [],
  radioStations: [],
  featuredStations: [],
  internationalStations: [],
  isLoading: false,
  isRefreshing: false,
  error: null,
  searchQuery: "",
  lastFetched: null,

  /**
   * Fast path: resolves as soon as cached or fallback data is in state.
   * Never awaits the network — kicks off a background refresh if the cache
   * is stale or missing.
   */
  fetchStations: async () => {
    set({ isLoading: true, error: null });

    // 1. Try cache
    const cacheValid = await isCacheValid(CACHE_KEYS.STATIONS_TIMESTAMP);
    const cached = await getCachedData<Station[]>(CACHE_KEYS.STATIONS);

    if (cached && cached.length > 0) {
      set({
        stations: cached,
        ...deriveSlices(cached),
        isLoading: false,
        lastFetched: Date.now(),
      });

      // Stale cache → refresh in background, don't block
      if (!cacheValid) {
        void get().refreshStations();
      }
      return;
    }

    // 2. No cache → load bundled fallback (lazy: only paid on first launch)
    const fallback = loadFallbackStations();
    set({
      stations: fallback,
      ...deriveSlices(fallback),
      isLoading: false,
    });

    // 3. Fire remote fetch in background
    void get().refreshStations();
  },

  /**
   * Background refresh. Safe to call at any time — sets isRefreshing so UI
   * can show a subtle indicator without blocking the splash screen.
   */
  refreshStations: async () => {
    if (get().isRefreshing) return;
    set({ isRefreshing: true });

    try {
      const fetched = await fetchStationsFromIPTV();
      if (fetched.length === 0) {
        set({ isRefreshing: false });
        return;
      }

      // Merge with existing stations so we never lose fallback entries
      const existing = get().stations;
      const fetchedIds = new Set(fetched.map((s) => s.id));
      const merged = [
        ...fetched,
        ...existing.filter((s) => !fetchedIds.has(s.id)),
      ];

      set({
        stations: merged,
        ...deriveSlices(merged),
        isRefreshing: false,
        lastFetched: Date.now(),
      });

      await setCachedData(CACHE_KEYS.STATIONS, merged);
      await setCacheTimestamp(CACHE_KEYS.STATIONS_TIMESTAMP);
    } catch {
      set({ error: "Failed to refresh stations", isRefreshing: false });
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  getStationsByType: (type) => {
    return get().stations.filter((s) => s.type === type);
  },

  getStationById: (id) => {
    return get().stations.find((s) => s.id === id);
  },

  searchStations: (type) => {
    const { stations, searchQuery } = get();
    const query = searchQuery.toLowerCase().trim();
    let filtered = type ? stations.filter((s) => s.type === type) : stations;

    if (query) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.categories.some((c) => c.toLowerCase().includes(query))
      );
    }

    return filtered;
  },
}));
