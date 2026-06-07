import type { Apparition } from '../data/types'
import { isPublicBuild } from '../config'

// Module-level cache so we only fetch once per page load.
let summaryCache: Record<string, string> | null = null

export async function fetchAllSummaries(): Promise<Record<string, string>> {
  if (isPublicBuild) return {}
  if (summaryCache) return summaryCache
  try {
    const res = await fetch('/api/summaries', { credentials: 'same-origin' })
    if (!res.ok) return {}
    summaryCache = (await res.json()) as Record<string, string>
    return summaryCache
  } catch {
    return {}
  }
}

export function updateSummaryCache(id: string, summary: string): void {
  if (summaryCache) summaryCache[id] = summary
}

/**
 * Requests a 3-sentence summary from the server-side AI proxy.
 * The Anthropic API key lives only on the server; the browser never sees it.
 * The server automatically saves the result so all devices see it on next load.
 */
export async function generateSummary(apparition: Apparition): Promise<string> {
  if (isPublicBuild) throw new Error('AI generation is disabled in the public build')
  const res = await fetch('/api/summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ apparition }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `Summary request failed (${res.status})`)
  }
  const data = (await res.json()) as { summary: string }
  return data.summary
}
