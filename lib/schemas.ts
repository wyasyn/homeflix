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
