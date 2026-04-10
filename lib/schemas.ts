import { z } from "zod/v4";

export const stationTypeSchema = z.enum(["tv", "radio"]);
export type StationType = z.infer<typeof stationTypeSchema>;

export const stationSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: stationTypeSchema,
  logo: z.string().optional(),
  streamUrl: z.string().url(),
  description: z.string().default(""),
  language: z.string().default("English"),
  country: z.string().default("UG"),
  categories: z.array(z.string()).default([]),
  website: z.string().url().optional(),
  isFeatured: z.boolean().default(false),
});

export type Station = z.infer<typeof stationSchema>;
export const stationsArraySchema = z.array(stationSchema);

// iptv-org API schemas
export const iptvChannelSchema = z.object({
  id: z.string(),
  name: z.string(),
  alt_names: z.array(z.string()).default([]),
  network: z.string().nullable(),
  owners: z.array(z.string()).default([]),
  country: z.string(),
  categories: z.array(z.string()).default([]),
  is_nsfw: z.boolean().default(false),
  launched: z.string().nullable().optional(),
  closed: z.string().nullable().optional(),
  replaced_by: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
});

export type IptvChannel = z.infer<typeof iptvChannelSchema>;

export const iptvStreamSchema = z.object({
  channel: z.string().nullable(),
  feed: z.string().nullable().optional(),
  title: z.string(),
  url: z.string().url(),
  quality: z.string().nullable().optional(),
  label: z.string().nullable().optional(),
  user_agent: z.string().nullable().optional(),
  referrer: z.string().nullable().optional(),
});

export type IptvStream = z.infer<typeof iptvStreamSchema>;
