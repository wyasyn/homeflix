import {
  iptvChannelSchema,
  iptvStreamSchema,
  type Station,
  type IptvChannel,
  type IptvStream,
} from "./schemas";
import {
  IPTV_API,
  UGANDA_CHANNEL_NAMES,
  INTERNATIONAL_CHANNEL_NAMES,
} from "./constants";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function inferType(categories: string[]): "tv" | "radio" {
  if (categories.some((c) => c.toLowerCase().includes("radio"))) return "radio";
  return "tv";
}

function matchesWantedChannel(name: string, altNames: string[]): boolean {
  const allNames = [name, ...altNames].map((n) => n.toLowerCase());
  const wanted = [
    ...UGANDA_CHANNEL_NAMES,
    ...INTERNATIONAL_CHANNEL_NAMES,
  ].map((n) => n.toLowerCase());

  return allNames.some(
    (n) =>
      wanted.includes(n) ||
      wanted.some((w) => n.includes(w) || w.includes(n))
  );
}

function mergeChannelsAndStreams(
  channels: IptvChannel[],
  streams: IptvStream[]
): Station[] {
  const stations: Station[] = [];
  const seen = new Set<string>();

  // Index streams by channel ID
  const streamsByChannel = new Map<string, IptvStream[]>();
  const unmatchedStreams: IptvStream[] = [];

  for (const stream of streams) {
    if (stream.channel) {
      const existing = streamsByChannel.get(stream.channel) || [];
      existing.push(stream);
      streamsByChannel.set(stream.channel, existing);
    } else {
      unmatchedStreams.push(stream);
    }
  }

  // Process channels that are from Uganda or match wanted names
  for (const channel of channels) {
    const isUganda = channel.country === "UG";
    const isWanted = matchesWantedChannel(channel.name, channel.alt_names);

    if (!isUganda && !isWanted) continue;
    if (channel.closed) continue;

    const channelStreams = streamsByChannel.get(channel.id);
    if (!channelStreams || channelStreams.length === 0) continue;

    // Pick the best quality stream
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
      type: inferType(channel.categories),
      logo: undefined,
      streamUrl: bestStream.url,
      description: channel.categories.join(", ") || "Live channel",
      language: "English",
      country: channel.country,
      categories: channel.categories,
      website: channel.website ?? undefined,
      isFeatured: isUganda,
    });
  }

  // Process unmatched streams that match wanted channel names
  for (const stream of unmatchedStreams) {
    const isWanted = matchesWantedChannel(stream.title, []);
    if (!isWanted) continue;

    const id = slugify(stream.title);
    if (seen.has(id)) continue;
    seen.add(id);

    stations.push({
      id,
      name: stream.title,
      type: "tv",
      logo: undefined,
      streamUrl: stream.url,
      description: "Live channel",
      language: "English",
      country: "UG",
      categories: [],
      website: undefined,
      isFeatured: false,
    });
  }

  return stations;
}

/**
 * Parse an M3U playlist string into Station objects.
 * M3U format:
 *   #EXTINF:-1 tvg-id="..." tvg-name="..." tvg-logo="..." group-title="...",Channel Name
 *   https://stream-url.m3u8
 */
function parseM3U(content: string): Station[] {
  const lines = content.split("\n").map((l) => l.trim());
  const stations: Station[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith("#EXTINF")) continue;

    const infoLine = lines[i];
    const urlLine = lines[i + 1];
    if (!urlLine || urlLine.startsWith("#")) continue;

    // Extract attributes
    const nameMatch = infoLine.match(/,(.+)$/);
    const logoMatch = infoLine.match(/tvg-logo="([^"]*)"/);
    const groupMatch = infoLine.match(/group-title="([^"]*)"/);

    const name = nameMatch?.[1]?.trim() || "Unknown";
    const id = slugify(name);

    if (seen.has(id)) continue;
    seen.add(id);

    const group = groupMatch?.[1]?.toLowerCase() || "";
    const type = group.includes("radio") ? "radio" : "tv";

    stations.push({
      id,
      name,
      type,
      logo: logoMatch?.[1] || undefined,
      streamUrl: urlLine,
      description: groupMatch?.[1] || "Live channel",
      language: "English",
      country: "UG",
      categories: groupMatch?.[1] ? [groupMatch[1]] : [],
      website: undefined,
      isFeatured: false,
    });
  }

  return stations;
}

export async function fetchStationsFromIPTV(): Promise<Station[]> {
  const allStations: Station[] = [];
  const seenIds = new Set<string>();

  // Fetch channels + streams JSON in parallel
  try {
    const [channelsRes, streamsRes] = await Promise.all([
      fetch(IPTV_API.CHANNELS),
      fetch(IPTV_API.STREAMS),
    ]);

    if (channelsRes.ok && streamsRes.ok) {
      const channelsRaw: unknown = await channelsRes.json();
      const streamsRaw: unknown = await streamsRes.json();

      if (Array.isArray(channelsRaw) && Array.isArray(streamsRaw)) {
        // Pre-filter channels in raw JS (no zod) — iptv-org ships ~10k
        // entries and we only keep Uganda + a small wanted list. This drops
        // zod's workload from thousands of objects to dozens.
        const wantedChannelIds = new Set<string>();
        const candidateChannels: unknown[] = [];

        for (const c of channelsRaw) {
          if (!c || typeof c !== "object") continue;
          const channel = c as Record<string, unknown>;
          if (channel.closed) continue;
          if (typeof channel.name !== "string") continue;
          if (typeof channel.id !== "string") continue;

          const altNames = Array.isArray(channel.alt_names)
            ? (channel.alt_names.filter((n) => typeof n === "string") as string[])
            : [];

          const isUganda = channel.country === "UG";
          const isWanted = matchesWantedChannel(channel.name, altNames);
          if (!isUganda && !isWanted) continue;

          wantedChannelIds.add(channel.id);
          candidateChannels.push(c);
        }

        // Pre-filter streams: keep ones tied to a wanted channel, plus
        // orphan streams whose title matches a wanted name.
        const candidateStreams: unknown[] = [];
        for (const s of streamsRaw) {
          if (!s || typeof s !== "object") continue;
          const stream = s as Record<string, unknown>;
          if (typeof stream.url !== "string") continue;

          const channelId = stream.channel;
          if (typeof channelId === "string" && wantedChannelIds.has(channelId)) {
            candidateStreams.push(s);
            continue;
          }
          if (
            channelId == null &&
            typeof stream.title === "string" &&
            matchesWantedChannel(stream.title, [])
          ) {
            candidateStreams.push(s);
          }
        }

        // Validate only the survivors. safeParse + drop bad entries so a
        // single malformed object can't tank the whole refresh.
        const channels: IptvChannel[] = [];
        for (const raw of candidateChannels) {
          const result = iptvChannelSchema.safeParse(raw);
          if (result.success) channels.push(result.data);
        }
        const streams: IptvStream[] = [];
        for (const raw of candidateStreams) {
          const result = iptvStreamSchema.safeParse(raw);
          if (result.success) streams.push(result.data);
        }

        const merged = mergeChannelsAndStreams(channels, streams);
        for (const s of merged) {
          if (!seenIds.has(s.id)) {
            seenIds.add(s.id);
            allStations.push(s);
          }
        }
      }
    }
  } catch {
    // JSON API failed — continue with M3U
  }

  // Also fetch Uganda M3U playlist for additional channels
  try {
    const m3uRes = await fetch(IPTV_API.UGANDA_M3U);
    if (m3uRes.ok) {
      const m3uContent = await m3uRes.text();
      const m3uStations = parseM3U(m3uContent);
      for (const s of m3uStations) {
        if (!seenIds.has(s.id)) {
          seenIds.add(s.id);
          allStations.push(s);
        }
      }
    }
  } catch {
    // M3U fetch failed — continue with what we have
  }

  return allStations;
}
