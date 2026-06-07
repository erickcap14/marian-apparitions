import type { MedjugorjeMessage, GeopoliticalEvent, SentimentResult } from '../data/medjugorjeTypes'
import { isPublicBuild } from '../config'

const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'to', 'you', 'i', 'in', 'of', 'dear', 'children', 'little',
  'with', 'and', 'for', 'this', 'that', 'my', 'your', 'me', 'we',
  'not', 'it', 'at', 'which', 'on', 'by', 'have', 'from', 'so',
  'do', 'can', 'all', 'as', 'through', 'also', 'today', 'call', 'having',
  'responded', 'again', 'especially', 'will', 'would', 'could', 'should',
  'their', 'them', 'they', 'who', 'what', 'when', 'how', 'or', 'if', 'but',
  'more', 'each', 'one', 'only', 'just', 'even', 'still', 'now', 'than',
])

export interface ApiUsage {
  inputTokens: number
  outputTokens: number
}

/**
 * Sentiment analysis via the server-side AI proxy. Chunking, prompting, and the
 * fallback-on-parse-failure behavior now live on the server (server/anthropic.ts);
 * this returns the same { sentiments, usage } shape the UI expects.
 */
export async function analyzeSentiments(
  messages: MedjugorjeMessage[],
): Promise<{ sentiments: SentimentResult[]; usage: ApiUsage }> {
  if (isPublicBuild) throw new Error('AI analytics is disabled in the public build')
  const res = await fetch('/api/sentiments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ messages }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `Sentiment analysis failed (${res.status})`)
  }
  return (await res.json()) as { sentiments: SentimentResult[]; usage: ApiUsage }
}

/**
 * Time-window enrichment via the server-side AI proxy. Returns the same { text, usage }
 * shape the UI expects.
 */
export async function enrichTimeWindow(
  messages: MedjugorjeMessage[],
  events: GeopoliticalEvent[],
  windowLabel: string,
): Promise<{ text: string; usage: ApiUsage }> {
  if (isPublicBuild) throw new Error('AI enrichment is disabled in the public build')
  const res = await fetch('/api/enrich', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ messages, events, windowLabel }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `Enrichment failed (${res.status})`)
  }
  return (await res.json()) as { text: string; usage: ApiUsage }
}

export function computeKeywordFrequency(
  messages: MedjugorjeMessage[],
): { word: string; count: number }[] {
  const freq: Record<string, number> = {}

  for (const message of messages) {
    const tokens = message.text
      .toLowerCase()
      .replace(/[^a-z\s'-]/g, '')
      .split(/\s+/)

    for (const raw of tokens) {
      const word = raw.replace(/^['-]+|['-]+$/g, '')
      if (!word || word.length < 2 || STOPWORDS.has(word)) continue
      freq[word] = (freq[word] ?? 0) + 1
    }
  }

  return Object.entries(freq)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 40)
}
