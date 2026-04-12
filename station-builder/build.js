#!/usr/bin/env node
/**
 * Laba Station Builder
 *
 * Fetches TV and radio stations from iptv-org and radio-browser.info,
 * validates every stream URL, and writes a clean stations.json.
 *
 * Run locally:   node station-builder/build.js
 * Output:        station-builder/output/stations.json
 *
 * Requirements:  Node.js 18+ (built-in fetch + AbortSignal.timeout)
 */

import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "output");
const OUTPUT_FILE = join(OUTPUT_DIR, "stations.json");

// ─── External API endpoints ──────────────────────────────────────────────────

const IPTV_CHANNELS = "https://iptv-org.github.io/api/channels.json";
const IPTV_STREAMS = "https://iptv-org.github.io/api/streams.json";
const UGANDA_M3U = "https://iptv-org.github.io/iptv/countries/ug.m3u";
const RADIO_UGANDA =
  "https://de1.api.radio-browser.info/json/stations/bycountry/Uganda";
const RADIO_INTERNATIONAL =
  "https://de1.api.radio-browser.info/json/stations/search?limit=150&order=votes&reverse=true&hidebroken=true";

// User-Agent required by radio-browser.info to avoid being blocked
const RADIO_USER_AGENT = "Laba/1.0 (github.com/wyasyn/laba)";

// ─── Filtering constants ──────────────────────────────────────────────────────

const INTERNATIONAL_ENGLISH_CAP = 200;

const WANTED_TV_CATEGORIES = new Set([
  "news", "general", "entertainment", "sports", "kids",
  "business", "documentary", "science", "education",
]);

// Known Ugandan channel names for M3U matching (exact / close match only)
const UGANDA_CHANNEL_NAMES = [
  "NBS TV", "NTV Uganda", "UBC TV", "Sanyuka TV", "Spark TV",
  "Urban TV", "Pearl Magic", "Pearl Magic Prime", "BBS TV Buganda",
  "Record TV Uganda", "Bukedde TV", "Bukedde TV 1", "Bukedde TV 2",
  "3ABN TV Uganda", "ACW UG TV", "Alpha Digital", "Ark TV", "BTM TV",
  "BTV Uganda", "Dream TV Uganda", "Faraja Television", "FORT TV",
  "Galaxy TV Uganda", "Gugudde TV", "Praise Jesus Tower TV", "Salt TV Uganda",
  "TV West", "Wan Luo TV", "Hope Channel Uganda",
  "Nile Broadcasting Services", "Star TV Uganda", "Agape TV Uganda",
  "Canary TV Uganda", "KBC Uganda",
];

const UGANDA_NAMES_LOWER = UGANDA_CHANNEL_NAMES.map((n) => n.toLowerCase());

// ─── Hardcoded supplement stations ───────────────────────────────────────────
// Major channels whose streams often fail validation on GitHub Actions servers
// (YouTube proxies, etc.) but are known to work on devices. These are always
// merged into the final output — they supplement rather than replace API results.

// NOTE: NBS TV, NTV Uganda, UBC TV, Sanyuka TV, Spark TV, Urban TV, Pearl Magic,
// and BBS TV stream exclusively via YouTube. There are no public direct HLS CDN
// URLs for these channels. They are NOT listed here to avoid broken entries.
// See station-builder/README.md for options to support YouTube-based channels.

const SUPPLEMENT_TV_STATIONS = [
  // ── Uganda channels (YouTube Live) ──────────────────────────────────────────
  // These channels stream exclusively via YouTube. The app uses YouTubePlayer
  // for any station that has a youtubeChannelId field.
  {
    id: "nbs-tv", name: "NBS TV", type: "tv",
    logo: "https://i.imgur.com/DmM8jH6.png",
    youtubeChannelId: "UCmp-YJRNIHCCNmFJOgJGMwA",
    description: "Next Broadcasting Services - Uganda's leading entertainment and news channel",
    language: "English", country: "UG", categories: ["news", "entertainment"],
    website: "https://www.nbs.ug", isFeatured: true,
  },
  {
    id: "ntv-uganda", name: "NTV Uganda", type: "tv",
    logo: "https://i.imgur.com/NTV.png",
    youtubeChannelId: "UCzIwTMsmMSGIdZPYShYbnPQ",
    description: "Nation Television Uganda - Premier news and current affairs",
    language: "English", country: "UG", categories: ["news", "general"],
    website: "https://www.ntv.co.ug", isFeatured: true,
  },
  {
    id: "ubc-tv", name: "UBC TV", type: "tv",
    youtubeChannelId: "UCa7s2SKcRQDpMEB-yPbXkvA",
    description: "Uganda Broadcasting Corporation - National public broadcaster",
    language: "English", country: "UG", categories: ["general", "news"],
    website: "https://www.ubc.go.ug", isFeatured: true,
  },
  {
    id: "sanyuka-tv", name: "Sanyuka TV", type: "tv",
    youtubeChannelId: "UC1YJ4mMOExwmnOYgiAWbKtQ",
    description: "Entertainment and lifestyle television",
    language: "Luganda", country: "UG", categories: ["entertainment"],
    isFeatured: true,
  },
  {
    id: "spark-tv", name: "Spark TV", type: "tv",
    youtubeChannelId: "UCF-5JhTmMFJwTEygqBPfQLg",
    description: "Youth-oriented entertainment and music channel",
    language: "English", country: "UG", categories: ["entertainment", "music"],
    isFeatured: true,
  },
  {
    id: "urban-tv", name: "Urban TV", type: "tv",
    youtubeChannelId: "UCJrvFPaz4DF96mWbiOSGXkA",
    description: "Urban entertainment and lifestyle",
    language: "English", country: "UG", categories: ["entertainment"],
    isFeatured: false,
  },
  {
    id: "pearl-magic", name: "Pearl Magic", type: "tv",
    youtubeChannelId: "UCp-RVKH9VwArl8cD7XtZiqQ",
    description: "Local drama and entertainment",
    language: "English", country: "UG", categories: ["entertainment", "drama"],
    isFeatured: false,
  },
  {
    id: "bbs-tv", name: "BBS TV", type: "tv",
    youtubeChannelId: "UCp90V7fUBeBGAa5jc_v2b0g",
    description: "Buganda Broadcasting Service Television",
    language: "Luganda", country: "UG", categories: ["general", "cultural"],
    isFeatured: false,
  },
  {
    id: "record-tv-uganda", name: "Record TV Uganda", type: "tv",
    youtubeChannelId: "UCfwhx3cp2bLnkxMjRmPgiHQ",
    description: "News and entertainment from Record TV",
    language: "English", country: "UG", categories: ["news", "entertainment"],
    isFeatured: false,
  },
  // ── International channels (direct HLS CDN) ──────────────────────────────────
  // These have official CDN-hosted HLS streams and broadcast in English.
  {
    id: "al-jazeera-english", name: "Al Jazeera English", type: "tv",
    streamUrl: "https://live-hls-apps-aje-fa.getaj.net/AJE/index.m3u8",
    description: "International news from Al Jazeera",
    language: "English", country: "QA", categories: ["news"],
    website: "https://www.aljazeera.com", isFeatured: true,
  },
  {
    id: "france-24-english", name: "France 24 English", type: "tv",
    streamUrl: "https://live.france24.com/hls/live/2037218/F24_EN_HI_HLS/master_2300.m3u8",
    description: "International news in English from France 24",
    language: "English", country: "FR", categories: ["news"],
    website: "https://www.france24.com", isFeatured: false,
  },
  {
    id: "dw-english", name: "DW English", type: "tv",
    streamUrl: "https://dwamdstream104.akamaized.net/hls/live/2015530/dwstream104/master.m3u8",
    description: "Deutsche Welle English - International news",
    language: "English", country: "DE", categories: ["news"],
    website: "https://www.dw.com", isFeatured: false,
  },
  {
    id: "bbc-news", name: "BBC News", type: "tv",
    streamUrl: "https://vs-hls-push-ww-live.akamaized.net/x=4/i=urn:bbc:pips:service:bbc_news_channel_hd/mobile_wifi_main_hd_abr_v2.m3u8",
    description: "BBC News - International breaking news and analysis",
    language: "English", country: "GB", categories: ["news"],
    website: "https://www.bbc.com/news", isFeatured: true,
  },
  {
    id: "euronews-english", name: "Euronews English", type: "tv",
    streamUrl: "https://d35j504z0x2vu2.cloudfront.net/v1/master/0bc8e8376bd8417a1b6761138aa41c26c7309312/euronews/euronews-en.m3u8",
    description: "European news and current affairs in English",
    language: "English", country: "FR", categories: ["news"],
    website: "https://www.euronews.com", isFeatured: false,
  },
  {
    id: "nhk-world-japan", name: "NHK World Japan", type: "tv",
    streamUrl: "https://masterpl.hls.nhkworld.jp/hls/w/live/smarttv.m3u8",
    description: "Japan's international public broadcaster - news and culture",
    language: "English", country: "JP", categories: ["news", "general"],
    website: "https://www3.nhk.or.jp/nhkworld/", isFeatured: false,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Strict Uganda channel check — used for orphan M3U streams only.
 * Requires a close name match (exact or one contains the other at word level).
 */
function isUgandaChannelName(name) {
  const n = name.toLowerCase().trim();
  return UGANDA_NAMES_LOWER.some(
    (w) => n === w || n.startsWith(w) || w.startsWith(n)
  );
}

function inferType(categories) {
  if (
    Array.isArray(categories) &&
    categories.some(
      (c) => typeof c === "string" && c.toLowerCase().includes("radio")
    )
  )
    return "radio";
  return "tv";
}

// ─── Stream URL validation ────────────────────────────────────────────────────

const STREAM_CONTENT_TYPES = [
  "audio", "video", "mpegurl", "ogg", "mpeg",
  "opus", "aac", "mp2t", "mp4",
];

async function checkUrl(url, timeoutMs) {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.status >= 200 && res.status < 300) return true;

    if (res.status === 405) {
      const getRes = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(timeoutMs),
      });
      const ct = getRes.headers.get("content-type") ?? "";
      return (
        (getRes.status >= 200 && getRes.status < 300) ||
        STREAM_CONTENT_TYPES.some((t) => ct.toLowerCase().includes(t))
      );
    }

    const ct = res.headers.get("content-type") ?? "";
    return STREAM_CONTENT_TYPES.some((t) => ct.toLowerCase().includes(t));
  } catch {
    return false;
  }
}

async function validateStreamUrls(stations, batchSize = 50, timeoutMs = 8000) {
  const valid = [];
  const total = stations.length;
  let done = 0;

  for (let i = 0; i < stations.length; i += batchSize) {
    const batch = stations.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (station) => ({
        station,
        ok: await checkUrl(station.streamUrl, timeoutMs),
      }))
    );
    for (const { station, ok } of results) {
      if (ok) valid.push(station);
    }
    done += batch.length;
    process.stdout.write(`  ${done}/${total} checked (${valid.length} valid)\r`);
  }
  process.stdout.write("\n");
  return valid;
}

// ─── TV: iptv-org ─────────────────────────────────────────────────────────────

function mergeChannelsAndStreams(channels, streams) {
  const stations = [];
  const seen = new Set();

  const streamsByChannel = new Map();
  const unmatchedStreams = [];

  for (const stream of streams) {
    if (stream.channel) {
      const existing = streamsByChannel.get(stream.channel) ?? [];
      existing.push(stream);
      streamsByChannel.set(stream.channel, existing);
    } else {
      unmatchedStreams.push(stream);
    }
  }

  for (const channel of channels) {
    if (channel.closed) continue;

    const channelStreams = streamsByChannel.get(channel.id);
    if (!channelStreams || channelStreams.length === 0) continue;

    const bestStream =
      channelStreams.find((s) => s.quality === "1080p") ||
      channelStreams.find((s) => s.quality === "720p") ||
      channelStreams[0];

    const id = slugify(channel.name);
    if (seen.has(id)) continue;
    seen.add(id);

    stations.push({
      id,
      name: channel.name,
      type: inferType(channel.categories ?? []),
      logo: channel.logo ?? undefined,
      streamUrl: bestStream.url,
      description: (channel.categories ?? []).join(", ") || "Live channel",
      language: channel.languages?.[0] ?? "English",
      country: channel.country,
      categories: channel.categories ?? [],
      website: channel.website ?? undefined,
      isFeatured: channel.country === "UG",
    });
  }

  // Orphan streams (no channel ID) — only add well-known Uganda names
  for (const stream of unmatchedStreams) {
    if (!isUgandaChannelName(stream.title)) continue;
    const id = slugify(stream.title);
    if (seen.has(id)) continue;
    seen.add(id);
    stations.push({
      id,
      name: stream.title,
      type: "tv",
      streamUrl: stream.url,
      description: "Live channel",
      language: "English",
      country: "UG",
      categories: [],
      isFeatured: false,
    });
  }

  return stations;
}

function parseM3U(content) {
  const lines = content.split("\n").map((l) => l.trim());
  const stations = [];
  const seen = new Set();

  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith("#EXTINF")) continue;

    const infoLine = lines[i];
    const urlLine = lines[i + 1];
    if (!urlLine || urlLine.startsWith("#")) continue;

    const nameMatch = infoLine.match(/,(.+)$/);
    const logoMatch = infoLine.match(/tvg-logo="([^"]*)"/);
    const groupMatch = infoLine.match(/group-title="([^"]*)"/);

    const name = nameMatch?.[1]?.trim() || "Unknown";

    // Only include M3U entries that are known Ugandan channels.
    // The Uganda M3U from iptv-org also contains non-Ugandan channels
    // (Pluto TV, WBTV, etc.) — exclude those.
    if (!isUgandaChannelName(name)) continue;

    const id = slugify(name);
    if (seen.has(id)) continue;
    seen.add(id);

    const group = groupMatch?.[1]?.toLowerCase() ?? "";

    stations.push({
      id,
      name,
      type: group.includes("radio") ? "radio" : "tv",
      logo: logoMatch?.[1] || undefined,
      streamUrl: urlLine,
      description: groupMatch?.[1] ?? "Live channel",
      language: "English",
      country: "UG",
      categories: groupMatch?.[1] ? [groupMatch[1]] : [],
      isFeatured: false,
    });
  }

  return stations;
}

async function fetchTvStations() {
  console.log("  Fetching iptv-org channels + streams...");
  const stations = [];
  const seenIds = new Set();
  const seenUrls = new Set();

  try {
    const [channelsRes, streamsRes] = await Promise.all([
      fetch(IPTV_CHANNELS),
      fetch(IPTV_STREAMS),
    ]);

    if (channelsRes.ok && streamsRes.ok) {
      const channelsRaw = await channelsRes.json();
      const streamsRaw = await streamsRes.json();

      const wantedChannelIds = new Set();
      const candidateChannels = [];
      let internationalCount = 0;

      for (const c of channelsRaw) {
        if (!c || typeof c !== "object") continue;
        if (c.closed || c.is_nsfw) continue;
        if (typeof c.name !== "string" || typeof c.id !== "string") continue;

        const langs = Array.isArray(c.languages)
          ? c.languages.filter((l) => typeof l === "string")
          : [];
        const cats = Array.isArray(c.categories)
          ? c.categories.filter((cat) => typeof cat === "string")
          : [];

        const isUganda = c.country === "UG";

        // International: must claim English language AND have a relevant category.
        // We do NOT restrict by country — channels like Al Jazeera (QA),
        // France 24 (FR), DW (DE), and NHK World (JP) all broadcast in English
        // but their countries are not English-speaking.
        const isIntlEnglish =
          !isUganda &&
          langs.includes("eng") &&
          cats.some((cat) => WANTED_TV_CATEGORIES.has(cat.toLowerCase())) &&
          internationalCount < INTERNATIONAL_ENGLISH_CAP;

        if (!isUganda && !isIntlEnglish) continue;
        if (!isUganda) internationalCount++;

        wantedChannelIds.add(c.id);
        candidateChannels.push(c);
      }

      const candidateStreams = [];
      for (const s of streamsRaw) {
        if (!s || typeof s !== "object") continue;
        if (typeof s.url !== "string") continue;
        if (s.channel && wantedChannelIds.has(s.channel)) {
          candidateStreams.push(s);
        }
        // Orphan streams without a channel ID are handled via M3U below
      }

      console.log(
        `  iptv-org: ${candidateChannels.length} candidate channels, ${candidateStreams.length} streams`
      );

      const merged = mergeChannelsAndStreams(candidateChannels, candidateStreams);
      for (const s of merged) {
        if (!seenIds.has(s.id) && !seenUrls.has(s.streamUrl)) {
          seenIds.add(s.id);
          seenUrls.add(s.streamUrl);
          stations.push(s);
        }
      }
    }
  } catch (e) {
    console.warn("  iptv-org JSON API failed:", e.message);
  }

  // Uganda M3U — filtered strictly to known Uganda channel names only
  try {
    const m3uRes = await fetch(UGANDA_M3U);
    if (m3uRes.ok) {
      const m3uStations = parseM3U(await m3uRes.text());
      let added = 0;
      for (const s of m3uStations) {
        if (!seenIds.has(s.id) && !seenUrls.has(s.streamUrl)) {
          seenIds.add(s.id);
          seenUrls.add(s.streamUrl);
          stations.push(s);
          added++;
        }
      }
      console.log(`  Uganda M3U: ${added} additional Uganda channels`);
    }
  } catch (e) {
    console.warn("  Uganda M3U failed:", e.message);
  }

  // Deduplicate by stream URL a final time (removes quality variants like
  // "Bukedde TV 1 (576p)" that share a URL with "Bukedde TV 1")
  const urlSeen = new Set();
  const deduped = [];
  for (const s of stations) {
    if (!urlSeen.has(s.streamUrl)) {
      urlSeen.add(s.streamUrl);
      deduped.push(s);
    }
  }

  return deduped;
}

// ─── Radio: radio-browser.info ────────────────────────────────────────────────

async function fetchRadioStations() {
  console.log("  Fetching radio stations from radio-browser.info...");
  const stations = [];
  const seenUrls = new Set();
  const seenIds = new Set();

  const headers = {
    "User-Agent": RADIO_USER_AGENT,
    Accept: "application/json",
  };

  // Try multiple radio-browser.info servers in case one is down
  const servers = [
    "https://de1.api.radio-browser.info",
    "https://nl1.api.radio-browser.info",
    "https://at1.api.radio-browser.info",
  ];

  async function radioFetch(path) {
    for (const server of servers) {
      try {
        const res = await fetch(`${server}${path}`, {
          headers,
          signal: AbortSignal.timeout(15000),
        });
        if (res.ok) return res;
      } catch {
        // try next server
      }
    }
    return null;
  }

  const [ugandaRes, intlRes] = await Promise.all([
    radioFetch("/json/stations/bycountry/Uganda"),
    radioFetch(
      "/json/stations/search?limit=150&order=votes&reverse=true&hidebroken=true&language=english"
    ),
  ]);

  for (const res of [ugandaRes, intlRes]) {
    if (!res) continue;

    let raw;
    try {
      raw = await res.json();
    } catch {
      continue;
    }

    if (!Array.isArray(raw)) continue;

    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      const streamUrl = item.url_resolved?.trim();
      const name = item.name?.trim();
      if (!streamUrl || !name) continue;

      const countryCode = (item.countrycode ?? "").toUpperCase();
      const categories = item.tags
        ? item.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

      const station = {
        id: `radio-${slugify(name)}-${slugify(countryCode || "int")}`,
        name,
        type: "radio",
        streamUrl,
        logo: (item.favicon && item.favicon !== "null") ? item.favicon : undefined,
        description: categories.join(", ") || "Radio station",
        language: item.language || "English",
        country: countryCode || "UG",
        categories,
        website: item.homepage || undefined,
        isFeatured: countryCode === "UG",
      };

      if (seenUrls.has(station.streamUrl)) continue;
      if (seenIds.has(station.id)) continue;
      seenUrls.add(station.streamUrl);
      seenIds.add(station.id);
      stations.push(station);
    }
  }

  console.log(`  radio-browser.info: ${stations.length} stations found`);
  return stations;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Laba Station Builder ===\n");

  console.log("Step 1/3: Fetching stations...");
  const [rawTv, rawRadio] = await Promise.all([
    fetchTvStations(),
    fetchRadioStations(),
  ]);
  console.log(
    `  Raw totals — TV: ${rawTv.length}, Radio: ${rawRadio.length}\n`
  );

  console.log("Step 2/3: Validating TV streams...");
  const validTv = await validateStreamUrls(rawTv, 50, 8000);
  console.log(`  TV: ${validTv.length}/${rawTv.length} streams working\n`);

  console.log("Step 3/3: Validating radio streams...");
  const validRadio = await validateStreamUrls(rawRadio, 30, 8000);
  console.log(
    `  Radio: ${validRadio.length}/${rawRadio.length} streams working\n`
  );

  // Merge supplement stations — these always appear regardless of validation.
  // They supplement the API results: if a station was already found via iptv-org
  // or M3U (and passed validation), we keep that version and skip the supplement.
  const validatedIds = new Set([...validTv, ...validRadio].map((s) => s.id));
  const validatedUrls = new Set([...validTv, ...validRadio].map((s) => s.streamUrl));
  const supplemented = SUPPLEMENT_TV_STATIONS.filter(
    (s) => !validatedIds.has(s.id) && (!s.streamUrl || !validatedUrls.has(s.streamUrl))
  );
  if (supplemented.length > 0) {
    console.log(`  Supplement: adding ${supplemented.length} hardcoded stations not found via API`);
  }

  const all = [...validTv, ...supplemented, ...validRadio];
  const ugTv = all.filter((s) => s.type === "tv" && s.country === "UG");
  const intlTv = all.filter((s) => s.type === "tv" && s.country !== "UG");
  const ugRadio = all.filter((s) => s.type === "radio" && s.country === "UG");
  const intlRadio = all.filter((s) => s.type === "radio" && s.country !== "UG");

  console.log(`Total working stations: ${all.length}`);
  console.log(`  Uganda TV:        ${ugTv.length}`);
  console.log(`  International TV: ${intlTv.length}`);
  console.log(`  Uganda Radio:     ${ugRadio.length}`);
  console.log(`  International Radio: ${intlRadio.length}`);

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(OUTPUT_FILE, JSON.stringify(all, null, 2));
  console.log(`\nWritten to: ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
