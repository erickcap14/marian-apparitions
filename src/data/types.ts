import { z } from 'zod'

export const ApparitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.string(),
  country: z.string(),
  lat: z.number(),
  lng: z.number(),
  year: z.number().int(),
  status: z.enum(['approved', 'approved_for_devotion', 'under_investigation', 'not_approved']),
  sourceUrl: z.string().url(),
  imageUrl: z.string(),
  summary: z.string(),
})

export type Apparition = z.infer<typeof ApparitionSchema>

export interface ApparitionFilter {
  searchQuery: string
  century: number | null   // e.g. 19 = 1800s
  country: string | null
}

export function getCentury(year: number): number {
  return Math.ceil(year / 100)
}
