#!/usr/bin/env node
/**
 * Homeflix Station Builder
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

// ─── Filtering constants ──────────────────────────────────────────────────────

const INTERNATIONAL_ENGLISH_CAP = 300;

const WANTED_TV_CATEGORIES = new Set([
  "news",
  "general",
  "entertainment",
  "sports",
  "kids",
  "business",
  "documentary",
  "music",
  "science",
  "education",
]);

// Known Uganda channel names (for matching channels that may not have UG country code)
const UGANDA_CHANNEL_NAMES = [
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
  "Bukedde TV",
  "Bukedde TV 1",
  "Bukedde TV 2",
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
  "Hope Channel Uganda",
  "Nile Broadcasting Services",
  "Star TV Uganda",
  "Top TV",
  "Agape TV",
  "Canary TV",
  "KBC Uganda",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function isUgandaChannel(name, altNames = []) {
  const all = [name, ...altNames].map((n) => n.toLowerCase());
  const wanted = UGANDA_CHANNEL_NAMES.map((n) => n.toLowerCase());
  return all.some((n) =>
    wanted.some((w) => n === w || n.includes(w) || w.includes(n))
  );
}

function inferType(categories) {
  if (
    categories.some((c) => typeof c === "string" && c.toLowerCase().includes("radio"))
  )
    return "radio";
  return "tv";
}

// ─── Stream URL validation ────────────────────────────────────────────────────

const STREAM_CONTENT_TYPES = [
  "audio",
  "video",
  "mpegurl",
  "ogg",
  "mpeg",
  "opus",
  "aac",
  "mp2t",
  "mp4",
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
      logo: undefined,
      streamUrl: bestStream.url,
      description: (channel.categories ?? []).join(", ") || "Live channel",
      language: channel.languages?.[0] ?? "English",
      country: channel.country,
      categories: channel.categories ?? [],
      website: channel.website ?? undefined,
      isFeatured: channel.country === "UG",
    });
  }

  for (const stream of unmatchedStreams) {
    if (!isUgandaChannel(stream.title)) continue;
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

        const altNames = Array.isArray(c.alt_names)
          ? c.alt_names.filter((n) => typeof n === "string")
          : [];
        const langs = Array.isArray(c.languages)
          ? c.languages.filter((l) => typeof l === "string")
          : [];
        const cats = Array.isArray(c.categories)
          ? c.categories.filter((cat) => typeof cat === "string")
          : [];

        const isUganda = c.country === "UG";
        const isKnownUganda = isUgandaChannel(c.name, altNames);
        const isEnglish = langs.includes("eng");
        const hasWantedCategory = cats.some((cat) =>
          WANTED_TV_CATEGORIES.has(cat.toLowerCase())
        );
        const isIntlEnglish =
          isEnglish &&
          hasWantedCategory &&
          internationalCount < INTERNATIONAL_ENGLISH_CAP;

        if (!isUganda && !isKnownUganda && !isIntlEnglish) continue;
        if (!isUganda && !isKnownUganda) internationalCount++;

        wantedChannelIds.add(c.id);
        candidateChannels.push(c);
      }

      const candidateStreams = [];
      for (const s of streamsRaw) {
        if (!s || typeof s !== "object") continue;
        if (typeof s.url !== "string") continue;
        if (s.channel && wantedChannelIds.has(s.channel)) {
          candidateStreams.push(s);
        } else if (!s.channel && typeof s.title === "string" && isUgandaChannel(s.title)) {
          candidateStreams.push(s);
        }
      }

      console.log(
        `  iptv-org: ${candidateChannels.length} candidate channels, ${candidateStreams.length} streams`
      );

      const merged = mergeChannelsAndStreams(candidateChannels, candidateStreams);
      for (const s of merged) {
        if (!seenIds.has(s.id)) {
          seenIds.add(s.id);
          stations.push(s);
        }
      }
    }
  } catch (e) {
    console.warn("  iptv-org JSON API failed:", e.message);
  }

  try {
    const m3uRes = await fetch(UGANDA_M3U);
    if (m3uRes.ok) {
      const m3uStations = parseM3U(await m3uRes.text());
      for (const s of m3uStations) {
        if (!seenIds.has(s.id)) {
          seenIds.add(s.id);
          stations.push(s);
        }
      }
      console.log(`  Uganda M3U: ${m3uStations.length} additional entries`);
    }
  } catch (e) {
    console.warn("  Uganda M3U failed:", e.message);
  }

  return stations;
}

// ─── Radio: radio-browser.info ────────────────────────────────────────────────

async function fetchRadioStations() {
  console.log("  Fetching radio stations from radio-browser.info...");
  const stations = [];
  const seenUrls = new Set();
  const seenIds = new Set();

  const [ugandaRes, intlRes] = await Promise.allSettled([
    fetch(RADIO_UGANDA),
    fetch(RADIO_INTERNATIONAL),
  ]);

  for (const result of [ugandaRes, intlRes]) {
    if (result.status !== "fulfilled" || !result.value.ok) continue;

    let raw;
    try {
      raw = await result.value.json();
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
        ? item.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      const station = {
        id: `radio-${slugify(name)}-${slugify(countryCode || "int")}`,
        name,
        type: "radio",
        streamUrl,
        logo: item.favicon || undefined,
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

  return stations;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Homeflix Station Builder ===\n");

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

  const all = [...validTv, ...validRadio];
  console.log(`Total working stations: ${all.length}`);
  console.log(
    `  TV: ${all.filter((s) => s.type === "tv").length}`,
    `| Radio: ${all.filter((s) => s.type === "radio").length}`,
    `| Uganda: ${all.filter((s) => s.country === "UG").length}`,
    `| International: ${all.filter((s) => s.country !== "UG").length}`
  );

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(OUTPUT_FILE, JSON.stringify(all, null, 2));
  console.log(`\nWritten to: ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
