/**
 * server/analytics.ts
 *
 * Disk persistence for the Medjugorje analytics features, mirroring server/summaries.ts.
 * Live sentiment results and per-window enrichment narratives were previously stored only
 * in browser localStorage (per-origin), so they vanished when the app was opened from a
 * different URL/IP/browser. Saving them server-side makes them shared across every device
 * on the LAN and durable across rebuilds.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { SentimentResult } from '../src/data/medjugorjeTypes.js'

const here = dirname(fileURLToPath(import.meta.url))
const ANALYTICS_FILE = resolve(here, 'analytics.json')

interface AnalyticsStore {
  // Most recent full "Run Claude Analytics" sentiment array, or null if never run.
  sentiments: SentimentResult[] | null
  // Per-window enrichment narratives, keyed by "YYYY–YYYY" window label.
  enrichments: Record<string, string>
}

const EMPTY: AnalyticsStore = { sentiments: null, enrichments: {} }

function load(): AnalyticsStore {
  try {
    if (existsSync(ANALYTICS_FILE)) {
      const parsed = JSON.parse(readFileSync(ANALYTICS_FILE, 'utf-8')) as Partial<AnalyticsStore>
      return {
        sentiments: parsed.sentiments ?? null,
        enrichments: parsed.enrichments ?? {},
      }
    }
  } catch { /* ignore */ }
  return { ...EMPTY }
}

function persist(store: AnalyticsStore): void {
  writeFileSync(ANALYTICS_FILE, JSON.stringify(store, null, 2), 'utf-8')
}

export function getAnalytics(): AnalyticsStore {
  return load()
}

export function saveSentiments(sentiments: SentimentResult[]): void {
  const store = load()
  store.sentiments = sentiments
  persist(store)
}

export function saveEnrichment(windowLabel: string, text: string): void {
  const store = load()
  store.enrichments[windowLabel] = text
  persist(store)
}
