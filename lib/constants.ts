export const IPTV_API = {
  CHANNELS: "https://iptv-org.github.io/api/channels.json",
  STREAMS: "https://iptv-org.github.io/api/streams.json",
  UGANDA_M3U: "https://iptv-org.github.io/iptv/countries/ug.m3u",
} as const;

export const CACHE_KEYS = {
  STATIONS: "@homeflix/stations",
  STATIONS_TIMESTAMP: "@homeflix/stations_timestamp",
  FAVOURITES: "@homeflix/favourites",
  THEME_MODE: "@homeflix/theme_mode",
} as const;

// 24 hours in milliseconds
export const CACHE_TTL = 24 * 60 * 60 * 1000;

// Known Uganda channel IDs and names for matching in iptv-org data
// These must match exactly (or partially) what appears in iptv-org channels.json / streams.json
export const UGANDA_CHANNEL_NAMES = [
  // Major national TV
  "NBS TV",
  "NTV Uganda",
  "UBC TV",
  "Sanyuka TV",
  "Spark TV",
  "Urban TV",
  "Pearl Magic",
  "Pearl Magic Prime",
  "BBS TV",
  "Record TV Uganda",
  // Bukedde
  "Bukedde TV",
  "Bukedde TV 1",
  "Bukedde TV 2",
  // In iptv-org Uganda M3U (verified)
  "3ABN TV Uganda",
  "ACW UG TV",
  "Alpha Digital",
  "Ark TV",
  "BTM TV",
  "BTV",
  "Dream TV",
  "Faraja Television",
  "FORT TV",
  "Galaxy TV",
  "Gugudde TV",
  "Praise Jesus Tower TV",
  "Salt TV",
  "TV West",
  "Wan Luo TV",
  // Other known Ugandan stations
  "Hope Channel Uganda",
  "Nile Broadcasting Services",
  "Star TV Uganda",
  "Top TV",
  "Agape TV",
  "Canary TV",
  "KBC Uganda",
];

// International channels the user wants
export const INTERNATIONAL_CHANNEL_NAMES = [
  "Al Jazeera English",
  "BBC News",
  "BBC World News",
  "France 24 English",
  "DW English",
  "Euronews English",
  "NHK World Japan",
  "NHK World-Japan",
];
