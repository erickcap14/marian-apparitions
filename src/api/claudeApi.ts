import type { Apparition } from '../data/types'

/**
 * Requests a 3-sentence summary from the server-side AI proxy.
 * The Anthropic API key lives only on the server; the browser never sees it.
 */
export async function generateSummary(apparition: Apparition): Promise<string> {
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
