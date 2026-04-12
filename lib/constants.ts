/**
 * Pre-validated stations JSON, built and published automatically by GitHub Actions.
 * See station-builder/ and .github/workflows/build-stations.yml.
 *
 * After enabling GitHub Pages on your repo, replace this URL with:
 *   https://<your-username>.github.io/<your-repo>/stations.json
 */
export const STATIONS_URL = "https://wyasyn.github.io/homeflix/stations.json";

export const CACHE_KEYS = {
  STATIONS: "@laba/stations",
  STATIONS_TIMESTAMP: "@laba/stations_timestamp",
  FAVOURITES: "@laba/favourites",
  THEME_MODE: "@laba/theme_mode",
} as const;

// 24 hours in milliseconds
export const CACHE_TTL = 24 * 60 * 60 * 1000;
