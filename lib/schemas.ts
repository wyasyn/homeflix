import { z } from "zod/v4";

export const stationTypeSchema = z.enum(["tv", "radio"]);
export type StationType = z.infer<typeof stationTypeSchema>;

export const stationSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: stationTypeSchema,
  logo: z.string().optional(),
  // streamUrl is optional only for YouTube-based channels that use youtubeChannelId
  streamUrl: z.string().url().optional(),
  // Present only for channels that stream via YouTube Live (e.g. NBS TV, NTV Uganda)
  youtubeChannelId: z.string().optional(),
  description: z.string().default(""),
  language: z.string().default("English"),
  country: z.string().default("UG"),
  categories: z.array(z.string()).default([]),
  website: z.string().url().optional(),
  isFeatured: z.boolean().default(false),
});

export type Station = z.infer<typeof stationSchema>;
export const stationsArraySchema = z.array(stationSchema);
