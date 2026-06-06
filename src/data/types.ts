import { z } from 'zod'

export const ApparitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.string(),
  country: z.string(),
  lat: z.number(),
  lng: z.number(),
  year: z.number().int(),
  status: z.literal('approved'),
  sourceUrl: z.string().url(),
  imageUrl: z.string(),
  summary: z.string(),
})

export type Apparition = z.infer<typeof ApparitionSchema>
