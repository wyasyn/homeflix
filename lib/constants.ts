/**
 * Pre-validated stations JSON, built and published automatically by GitHub Actions.
 * See station-builder/ and .github/workflows/build-stations.yml.
 *
 * After enabling GitHub Pages on your repo, replace this URL with:
 *   https://<your-username>.github.io/<your-repo>/stations.json
 */
export const STATIONS_URL = "https://wyasyn.github.io/homeflix/stations.json";

export const CACHE_KEYS = {
  STATIONS: "@homeflix/stations",
  STATIONS_TIMESTAMP: "@homeflix/stations_timestamp",
  FAVOURITES: "@homeflix/favourites",
  THEME_MODE: "@homeflix/theme_mode",
} as const;

// 24 hours in milliseconds
export const CACHE_TTL = 24 * 60 * 60 * 1000;
