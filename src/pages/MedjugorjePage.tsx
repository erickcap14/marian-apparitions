import { useState, useEffect, useMemo, useRef } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
} from 'recharts'
import type {
  AnalyticsResult,
  GeopoliticalEvent,
  MedjugorjeMessage,
  SentimentResult,
  ThemeCluster,
} from '../data/medjugorjeTypes'
import { medjugorjeMessages } from '../data/medjugorjeMessages'
import { geopoliticalEvents } from '../data/geopoliticalEvents'
import { precomputedSentiments } from '../data/medjugorjeSentiments'
import {
  analyzeSentiments,
  enrichTimeWindow,
  computeKeywordFrequency,
  fetchSavedAnalytics,
} from '../api/medjugorjeAnalytics'
import { GeopoliticalTimeline } from '../components/GeopoliticalTimeline'
import { MedjugorjeStats } from '../components/MedjugorjeStats'
import { isPublicBuild } from '../config'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EVENT_CATEGORY_COLORS: Record<GeopoliticalEvent['category'], string> = {
  war:       '#ef4444',
  collapse:  '#f97316',
  disaster:  '#8b5cf6',
  papal:     '#fbbf24',
  terrorism: '#ec4899',
  diplomacy: '#22d3ee',
}

const THEME_PALETTE = [
  '#d4af37', '#4a90d9', '#8b5cf6', '#22d3ee',
  '#f97316', '#ec4899', '#10b981', '#ef4444',
]

const PAGE_SIZE = 50

// claude-sonnet-4-6 pricing (USD per token)
const INPUT_PRICE_PER_TOKEN  = 3.00  / 1_000_000
const OUTPUT_PRICE_PER_TOKEN = 15.00 / 1_000_000

const USAGE_KEY          = 'medjugorje-api-usage'
const BUDGET_KEY         = 'medjugorje-budget'
const BUDGET_SAVED_AT_KEY = 'medjugorje-budget-saved-at'
const ENRICHMENT_KEY     = 'medjugorje-enrichments'
const SENTIMENTS_KEY     = 'medjugorje-live-sentiments'

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

interface UsageRecord {
  inputTokens: number
  outputTokens: number
  callCount: number
}

function loadUsage(): UsageRecord {
  try {
    const raw = localStorage.getItem(USAGE_KEY)
    if (raw) return JSON.parse(raw) as UsageRecord
  } catch { /* ignore */ }
  return { inputTokens: 0, outputTokens: 0, callCount: 0 }
}

function saveUsage(u: UsageRecord): void {
  localStorage.setItem(USAGE_KEY, JSON.stringify(u))
}

function loadBudget(): number {
  try {
    const raw = localStorage.getItem(BUDGET_KEY)
    if (raw) {
      const parsed = parseFloat(raw)
      if (!isNaN(parsed)) return parsed
    }
  } catch { /* ignore */ }
  return 99.84
}

function loadBudgetSavedAt(): string | null {
  try {
    return localStorage.getItem(BUDGET_SAVED_AT_KEY)
  } catch { /* ignore */ }
  return null
}

function formatSavedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    })
  } catch { return iso }
}

// Enrichments: map of "YYYY–YYYY" window label → narrative text
function loadEnrichments(): Record<string, string> {
  try {
    const raw = localStorage.getItem(ENRICHMENT_KEY)
    if (raw) return JSON.parse(raw) as Record<string, string>
  } catch { /* ignore */ }
  return {}
}

function saveEnrichments(map: Record<string, string>): void {
  localStorage.setItem(ENRICHMENT_KEY, JSON.stringify(map))
}

// Live analytics sentiments from the last "Run Claude Analytics" run
function loadPersistedSentiments(): SentimentResult[] | null {
  try {
    const raw = localStorage.getItem(SENTIMENTS_KEY)
    if (raw) return JSON.parse(raw) as SentimentResult[]
  } catch { /* ignore */ }
  return null
}

function saveSentiments(sentiments: SentimentResult[]): void {
  localStorage.setItem(SENTIMENTS_KEY, JSON.stringify(sentiments))
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface SentimentTooltipProps {
  active?: boolean
  payload?: { value: number }[]
  label?: number
  events: GeopoliticalEvent[]
}

function SentimentTooltipContent({ active, payload, label, events }: SentimentTooltipProps) {
  if (!active || !payload?.length) return null
  const score = payload[0].value
  const yearEvents = events.filter((e) => e.year === label)
  return (
    <div className="bg-celestial-indigo border border-celestial-gold/30 rounded-sm p-3 text-xs font-body shadow-panel max-w-xs">
      <p className="text-celestial-gold font-medium mb-1">{label}</p>
      <p className="text-celestial-star mb-1">
        Sentiment: <span className={score >= 0 ? 'text-emerald-400' : 'text-red-400'}>{score.toFixed(3)}</span>
      </p>
      {yearEvents.map((e) => (
        <p key={e.id} className="text-celestial-star-dim mt-1 leading-snug">
          <span style={{ color: EVENT_CATEGORY_COLORS[e.category] }}>&#9632;</span> {e.title}
        </p>
      ))}
    </div>
  )
}

interface KeywordTooltipProps {
  active?: boolean
  payload?: { value: number; payload: { word: string } }[]
}

function KeywordTooltipContent({ active, payload }: KeywordTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-celestial-indigo border border-celestial-gold/30 rounded-sm p-2 text-xs font-body shadow-panel">
      <p className="text-celestial-gold font-medium">{payload[0].payload.word}</p>
      <p className="text-celestial-star">{payload[0].value} occurrences</p>
    </div>
  )
}

// Hover tooltip wrapper for action buttons
function ButtonTooltip({ children, tip }: { children: React.ReactNode; tip: string }) {
  return (
    <div className="relative group inline-block">
      {children}
      <div className="absolute right-0 top-full mt-1.5 w-64 p-2.5 bg-celestial-indigo border border-celestial-gold/25 rounded-sm font-body text-xs text-celestial-star-dim leading-relaxed invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 pointer-events-none">
        {tip}
      </div>
    </div>
  )
}

interface MessageCardProps {
  message: MedjugorjeMessage
  isExpanded: boolean
  onToggle: () => void
}

function MessageCard({ message, isExpanded, onToggle }: MessageCardProps) {
  const RECIPIENT_COLORS: Record<MedjugorjeMessage['recipient'], string> = {
    marija:  'bg-celestial-gold/20 text-celestial-gold border-celestial-gold/40',
    mirjana: 'bg-celestial-blue/20 text-celestial-blue border-celestial-blue/40',
    group:   'bg-purple-500/20 text-purple-300 border-purple-500/40',
  }

  const preview = message.text.length > 120 ? message.text.slice(0, 120) + '…' : message.text

  return (
    <div className="border border-celestial-gold/10 rounded-sm bg-celestial-indigo/30 hover:bg-celestial-indigo/50 transition-colors">
      <button
        className="w-full text-left p-4 flex items-start gap-3 focus:outline-none focus:ring-1 focus:ring-celestial-gold/40 rounded-sm"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-body text-xs text-celestial-star-dim bg-celestial-navy/60 px-2 py-0.5 rounded-sm border border-celestial-gold/10">
              {message.date}
            </span>
            <span
              className={`font-body text-xs px-2 py-0.5 rounded-sm border capitalize ${RECIPIENT_COLORS[message.recipient]}`}
            >
              {message.recipient}
            </span>
          </div>
          <p className="font-body text-celestial-star text-sm leading-relaxed">
            {isExpanded ? message.text : preview}
          </p>
          {!isExpanded && message.text.length > 120 && (
            <p className="text-celestial-star-dim text-xs mt-1">Click to read more</p>
          )}
          {isExpanded && message.sourceUrl && (
            <a
              href={message.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-celestial-blue text-xs hover:text-celestial-star transition-colors mt-2 inline-block"
            >
              View Source &rarr;
            </a>
          )}
        </div>
        <span
          className="text-celestial-star-dim text-xs mt-0.5 flex-shrink-0 transition-transform duration-200"
          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          aria-hidden="true"
        >
          &#9660;
        </span>
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helper — build AnalyticsResult from a SentimentResult array (no API needed)
// ---------------------------------------------------------------------------

function buildAnalyticsFromSentiments(sentiments: SentimentResult[]): AnalyticsResult {
  const allKeywords = sentiments.flatMap((s) => s.keywords)
  const kwFreq: Record<string, number> = {}
  allKeywords.forEach((w) => { kwFreq[w] = (kwFreq[w] ?? 0) + 1 })
  const topKeywords = Object.entries(kwFreq)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
  const themeMap: Record<string, string[]> = {}
  sentiments.forEach((s) => {
    s.themes.forEach((t) => {
      themeMap[t] = themeMap[t] ?? []
      themeMap[t].push(s.messageId)
    })
  })
  const themes: ThemeCluster[] = Object.entries(themeMap).map(([name, messageIds], idx) => ({
    name,
    messageIds,
    description: `Messages themed around ${name}`,
    color: THEME_PALETTE[idx % THEME_PALETTE.length],
  }))
  return { sentiments, topKeywords, themes, summary: '' }
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function MedjugorjePage() {
  // Use persisted live sentiments if available, otherwise fall back to precomputed
  const [analytics, setAnalytics] = useState<AnalyticsResult>(() => {
    // Public build: always use curated precomputed data — ignore any visitor localStorage.
    const persisted = isPublicBuild ? null : loadPersistedSentiments()
    return buildAnalyticsFromSentiments(persisted ?? precomputedSentiments)
  })
  const [isPrecomputed, setIsPrecomputed] = useState(() => isPublicBuild || !loadPersistedSentiments())
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)

  const [selectedTheme, setSelectedTheme] = useState<string | null>(null)
  const [selectedRecipient, setSelectedRecipient] = useState<MedjugorjeMessage['recipient'] | null>(null)
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null)
  const [yearRange, setYearRange] = useState<[number, number]>([1981, 2026])
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // Enrichments: persisted map of windowLabel → narrative text.
  // Public build hides the AI Window section entirely, so it starts empty (no localStorage read).
  const [enrichments, setEnrichments] = useState<Record<string, string>>(
    isPublicBuild ? {} : loadEnrichments,
  )
  const [isLoadingEnrichment, setIsLoadingEnrichment] = useState(false)
  const [enrichmentError, setEnrichmentError] = useState<string | null>(null)

  const [keywordFreq, setKeywordFreq] = useState<{ word: string; count: number }[]>([])

  const [apiUsage, setApiUsage] = useState<UsageRecord>(loadUsage)
  const [budget, setBudget] = useState<number>(() => {
    const val = loadBudget()
    // Seed localStorage on first load so the value is persisted with a timestamp.
    // Public build never writes to a visitor's storage (the cost panel is hidden anyway).
    if (!isPublicBuild && !localStorage.getItem(BUDGET_KEY)) {
      const now = new Date().toISOString()
      localStorage.setItem(BUDGET_KEY, String(val))
      localStorage.setItem(BUDGET_SAVED_AT_KEY, now)
    }
    return val
  })
  const [budgetSavedAt, setBudgetSavedAt] = useState<string | null>(() => {
    // If no saved-at exists yet, set one now alongside the default balance seed
    const existing = loadBudgetSavedAt()
    if (!isPublicBuild && !existing) {
      const now = new Date().toISOString()
      localStorage.setItem(BUDGET_SAVED_AT_KEY, now)
      return now
    }
    return existing
  })

  const enrichmentRef = useRef<HTMLDivElement>(null)

  // Derived: current window label and its stored enrichment
  const windowLabel = `${yearRange[0]}–${yearRange[1]}`
  const currentEnrichment = enrichments[windowLabel] ?? null

  const latestMessage = useMemo(
    () => [...medjugorjeMessages].sort((a, b) => b.year - a.year || b.month - a.month)[0],
    [],
  )

  // Compute keyword frequency locally on mount — no API key needed
  useEffect(() => {
    setKeywordFreq(computeKeywordFrequency(medjugorjeMessages).slice(0, 20))
  }, [])

  // Hydrate from the server-side store (private build only) so analytics generated on any
  // device/origin are shared and survive rebuilds. Server data wins over local; falls back
  // silently to the localStorage-seeded state when the store is empty or unreachable.
  useEffect(() => {
    if (isPublicBuild) return
    let cancelled = false
    fetchSavedAnalytics().then(({ sentiments, enrichments: serverEnrichments }) => {
      if (cancelled) return
      if (sentiments && sentiments.length > 0) {
        setAnalytics(buildAnalyticsFromSentiments(sentiments))
        setIsPrecomputed(false)
        saveSentiments(sentiments) // keep localStorage cache in sync
      }
      if (serverEnrichments && Object.keys(serverEnrichments).length > 0) {
        setEnrichments((prev) => {
          const merged = { ...prev, ...serverEnrichments }
          saveEnrichments(merged) // keep localStorage cache in sync
          return merged
        })
      }
    })
    return () => { cancelled = true }
  }, [])

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [yearRange, selectedTheme, selectedRecipient])

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const sentimentByYear = useMemo<{ year: number; score: number }[]>(() => {
    const byYear: Record<number, number[]> = {}
    analytics.sentiments.forEach((s: SentimentResult) => {
      const msg = medjugorjeMessages.find((m) => m.id === s.messageId)
      if (!msg) return
      byYear[msg.year] = byYear[msg.year] ?? []
      byYear[msg.year].push(s.score)
    })
    return Object.entries(byYear)
      .map(([year, scores]) => ({
        year: +year,
        score: scores.reduce((a, b) => a + b, 0) / scores.length,
      }))
      .sort((a, b) => a.year - b.year)
  }, [analytics])

  const sentimentYearSet = useMemo(
    () => new Set(sentimentByYear.map((d) => d.year)),
    [sentimentByYear],
  )

  const filteredEvents = useMemo(
    () => geopoliticalEvents.filter((e) => e.year >= yearRange[0] && e.year <= yearRange[1]),
    [yearRange],
  )

  const chartEvents = useMemo(
    () => filteredEvents.filter((e) => sentimentYearSet.has(e.year)),
    [filteredEvents, sentimentYearSet],
  )

  // Messages filtered by year + theme (before recipient filter — used for recipient counts)
  const baseFilteredMessages = useMemo<MedjugorjeMessage[]>(() => {
    let msgs = medjugorjeMessages.filter(
      (m) => m.year >= yearRange[0] && m.year <= yearRange[1],
    )
    if (selectedTheme && analytics) {
      const cluster = analytics.themes.find((t: ThemeCluster) => t.name === selectedTheme)
      if (cluster) {
        const ids = new Set(cluster.messageIds)
        msgs = msgs.filter((m) => ids.has(m.id))
      }
    }
    return msgs.sort((a, b) => b.year - a.year || b.month - a.month)
  }, [yearRange, selectedTheme, analytics])

  const filteredMessages = useMemo<MedjugorjeMessage[]>(() => {
    if (!selectedRecipient) return baseFilteredMessages
    return baseFilteredMessages.filter((m) => m.recipient === selectedRecipient)
  }, [baseFilteredMessages, selectedRecipient])

  const paginatedMessages = filteredMessages.slice(0, visibleCount)

  const recipientCounts = useMemo(() => ({
    marija:  baseFilteredMessages.filter((m) => m.recipient === 'marija').length,
    mirjana: baseFilteredMessages.filter((m) => m.recipient === 'mirjana').length,
    group:   baseFilteredMessages.filter((m) => m.recipient === 'group').length,
  }), [baseFilteredMessages])

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function accumulateUsage(added: { inputTokens: number; outputTokens: number }) {
    setApiUsage((prev) => {
      const next: UsageRecord = {
        inputTokens:  prev.inputTokens  + added.inputTokens,
        outputTokens: prev.outputTokens + added.outputTokens,
        callCount:    prev.callCount    + 1,
      }
      saveUsage(next)
      return next
    })
  }

  async function handleRunAnalytics() {
    if (isLoadingAnalytics) return
    setIsLoadingAnalytics(true)
    setAnalyticsError(null)
    try {
      const { sentiments, usage } = await analyzeSentiments(medjugorjeMessages)

      const allKeywords = sentiments.flatMap((s) => s.keywords)
      const kwFreq: Record<string, number> = {}
      allKeywords.forEach((w) => { kwFreq[w] = (kwFreq[w] ?? 0) + 1 })
      const topKeywords = Object.entries(kwFreq)
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20)

      const themeMap: Record<string, string[]> = {}
      sentiments.forEach((s) => {
        s.themes.forEach((t) => {
          themeMap[t] = themeMap[t] ?? []
          themeMap[t].push(s.messageId)
        })
      })
      const themes: ThemeCluster[] = Object.entries(themeMap).map(([name, messageIds], idx) => ({
        name,
        messageIds,
        description: `Messages themed around ${name}`,
        color: THEME_PALETTE[idx % THEME_PALETTE.length],
      }))

      setAnalytics({ sentiments, topKeywords, themes, summary: '' })
      setIsPrecomputed(false)
      saveSentiments(sentiments)
      accumulateUsage(usage)
    } catch (err) {
      setAnalyticsError(err instanceof Error ? err.message : 'Analytics failed')
    } finally {
      setIsLoadingAnalytics(false)
    }
  }

  async function handleEnrichWindow() {
    if (isLoadingEnrichment) return
    setIsLoadingEnrichment(true)
    setEnrichmentError(null)
    try {
      const { text, usage } = await enrichTimeWindow(filteredMessages, filteredEvents, windowLabel)
      const updated = { ...enrichments, [windowLabel]: text }
      setEnrichments(updated)
      saveEnrichments(updated)
      accumulateUsage(usage)
      setTimeout(() => enrichmentRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err) {
      setEnrichmentError(err instanceof Error ? err.message : 'Enrichment failed')
    } finally {
      setIsLoadingEnrichment(false)
    }
  }

  function handleToggleMessage(id: string) {
    setExpandedMessageId((prev) => (prev === id ? null : id))
  }

  function handleThemeClick(name: string) {
    setSelectedTheme((prev) => (prev === name ? null : name))
  }

  function handleRecipientClick(recipient: MedjugorjeMessage['recipient']) {
    setSelectedRecipient((prev) => (prev === recipient ? null : recipient))
  }

  function handleResetUsage() {
    const reset: UsageRecord = { inputTokens: 0, outputTokens: 0, callCount: 0 }
    setApiUsage(reset)
    saveUsage(reset)
  }

  function handleBudgetChange(val: number) {
    if (!isNaN(val) && val >= 0) {
      const now = new Date().toISOString()
      setBudget(val)
      setBudgetSavedAt(now)
      localStorage.setItem(BUDGET_KEY, String(val))
      localStorage.setItem(BUDGET_SAVED_AT_KEY, now)
    }
  }

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  function renderAnalyticsButton() {
    const label = isPrecomputed ? 'Run Claude Analytics' : 'Re-run Analytics'
    const tip = 'Sends all 151 messages to Claude for live sentiment scoring, keyword extraction, and theme clustering. Results are saved and restored on your next visit. Estimated cost: $0.10–$0.20 per run.'
    return (
      <div className="flex flex-col items-end gap-1.5">
        <ButtonTooltip tip={tip}>
          <button
            onClick={handleRunAnalytics}
            disabled={isLoadingAnalytics}
            className="inline-flex items-center gap-2 px-4 py-2 border border-celestial-gold/60 text-celestial-gold bg-transparent hover:bg-celestial-gold/10 font-body text-sm rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-celestial-gold"
          >
            {isLoadingAnalytics ? (
              <>
                <span
                  className="inline-block w-4 h-4 border-2 border-celestial-gold border-t-transparent rounded-full animate-spin"
                  aria-hidden="true"
                />
                Analyzing…
              </>
            ) : (
              <>
                <span aria-hidden="true">✦</span>
                {label}
              </>
            )}
          </button>
        </ButtonTooltip>
        {isPrecomputed && (
          <span className="font-body text-xs text-celestial-star-dim">
            Showing pre-computed data
          </span>
        )}
        {!isPrecomputed && (
          <span className="font-body text-xs text-emerald-400/80">
            Live analytics active
          </span>
        )}
      </div>
    )
  }

  function renderUsagePanel() {
    const cost = apiUsage.inputTokens * INPUT_PRICE_PER_TOKEN + apiUsage.outputTokens * OUTPUT_PRICE_PER_TOKEN
    const remaining = budget - cost
    const depleted = remaining <= 0

    return (
      <div className="mt-3 p-3 border border-celestial-gold/10 rounded-sm bg-celestial-indigo/20 font-body text-xs text-celestial-star-dim space-y-2">
        {apiUsage.callCount === 0 ? (
          <p>No API calls recorded yet.</p>
        ) : (
          <div className="flex flex-wrap gap-x-5 gap-y-1 items-center">
            <span>
              Tokens:{' '}
              <span className="text-celestial-star">{apiUsage.inputTokens.toLocaleString()} in</span>
              {' · '}
              <span className="text-celestial-star">{apiUsage.outputTokens.toLocaleString()} out</span>
            </span>
            <span>
              Cost:{' '}
              <span className="text-celestial-star">${cost.toFixed(4)}</span>
            </span>
            <span>
              Balance:{' '}
              <span className="text-celestial-star">${budget.toFixed(2)}</span>
            </span>
            <span className={depleted ? 'text-red-400 font-medium' : 'text-emerald-400'}>
              Remaining: ${remaining.toFixed(2)}
            </span>
          </div>
        )}

        {depleted && (
          <p className="text-red-400 leading-snug">
            ⚠ Balance estimate depleted — add credits at{' '}
            <span className="text-red-300">console.anthropic.com</span>{' '}
            and update your balance below.
          </p>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-1.5">
            Balance $
            <input
              type="number"
              min="0"
              step="0.01"
              value={budget}
              onChange={(e) => handleBudgetChange(parseFloat(e.target.value))}
              className="w-20 bg-celestial-navy border border-celestial-gold/20 text-celestial-star rounded-sm px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-celestial-gold"
            />
          </label>
          {apiUsage.callCount > 0 && (
            <button
              onClick={handleResetUsage}
              className="text-celestial-star-dim hover:text-celestial-star underline focus:outline-none"
            >
              Reset usage
            </button>
          )}
          {budgetSavedAt && (
            <span className="text-celestial-star-dim opacity-60">
              Updated {formatSavedAt(budgetSavedAt)}
            </span>
          )}
        </div>
      </div>
    )
  }

  const yearOptions: number[] = []
  for (let y = 1981; y <= 2026; y++) yearOptions.push(y)

  const RECIPIENT_STYLE: Record<MedjugorjeMessage['recipient'], { active: string; base: string }> = {
    marija:  { active: 'border-celestial-gold bg-celestial-gold text-celestial-navy',  base: 'border-celestial-gold/40 text-celestial-gold bg-celestial-gold/10' },
    mirjana: { active: 'border-celestial-blue bg-celestial-blue text-celestial-navy',  base: 'border-celestial-blue/40 text-celestial-blue bg-celestial-blue/10' },
    group:   { active: 'border-purple-400 bg-purple-400 text-celestial-navy',          base: 'border-purple-400/40 text-purple-300 bg-purple-400/10' },
  }

  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------

  return (
    <div className="relative z-10 h-[calc(100vh-64px)] overflow-y-auto bg-celestial-navy">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-12">

        {/* ------------------------------------------------------------------ */}
        {/* Page header                                                         */}
        {/* ------------------------------------------------------------------ */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="font-heading text-celestial-gold text-2xl tracking-widest uppercase">
                Our Lady of Medjugorje
              </h2>
              <p className="font-body text-celestial-star-dim text-sm mt-1">
                Messages · Analytics · Geopolitical Timeline &mdash; 1981–2026
              </p>
            </div>
            {!isPublicBuild && <div>{renderAnalyticsButton()}</div>}
          </div>

          {!isPublicBuild && renderUsagePanel()}

          {!isPublicBuild && analyticsError && (
            <p className="mt-3 font-body text-xs text-red-400">{analyticsError}</p>
          )}
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Latest message featured card                                        */}
        {/* ------------------------------------------------------------------ */}
        {latestMessage && (
          <section>
            <p className="font-heading text-xs text-celestial-star-dim uppercase tracking-widest mb-2">
              Latest Message
            </p>
            <div className="border border-celestial-gold/40 rounded-sm bg-celestial-indigo/40 p-5 relative">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="font-body text-xs text-celestial-star-dim bg-celestial-navy/60 px-2 py-0.5 rounded-sm border border-celestial-gold/20">
                  {latestMessage.date}
                </span>
                <span
                  className={`font-body text-xs px-2 py-0.5 rounded-sm border capitalize ${
                    latestMessage.recipient === 'marija'
                      ? 'bg-celestial-gold/20 text-celestial-gold border-celestial-gold/40'
                      : latestMessage.recipient === 'mirjana'
                      ? 'bg-celestial-blue/20 text-celestial-blue border-celestial-blue/40'
                      : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  }`}
                >
                  {latestMessage.recipient}
                </span>
              </div>
              <p className="font-body text-celestial-star text-sm leading-relaxed">
                {latestMessage.text}
              </p>
              {latestMessage.sourceUrl && (
                <a
                  href={latestMessage.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-celestial-blue text-xs hover:text-celestial-star transition-colors mt-3 inline-block focus:outline-none focus:ring-2 focus:ring-celestial-gold rounded-sm"
                >
                  View Source &rarr;
                </a>
              )}
            </div>
          </section>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Stats overview                                                      */}
        {/* ------------------------------------------------------------------ */}
        <MedjugorjeStats messages={medjugorjeMessages} />

        {/* ------------------------------------------------------------------ */}
        {/* Claude enrichment panel (private build only — needs live AI)         */}
        {/* ------------------------------------------------------------------ */}
        {!isPublicBuild && (
        <section ref={enrichmentRef}>
          <div className="border border-celestial-gold/20 rounded-sm bg-celestial-indigo/30 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h3 className="font-heading text-celestial-gold text-sm tracking-widest uppercase">
                  AI Window Analysis
                </h3>
                <p className="font-body text-celestial-star-dim text-xs mt-1">
                  {currentEnrichment
                    ? <>Saved analysis for <span className="text-celestial-star">{windowLabel}</span> — click to refresh</>
                    : <>Claude will narrate correlations between messages and world events for{' '}<span className="text-celestial-star">{windowLabel}</span></>
                  }
                </p>
              </div>
              <ButtonTooltip tip="Claude reads the messages and world events in the selected year range and writes a 3–5 paragraph narrative on correlations and theological themes. Results are saved per time window and restored automatically. Estimated cost: ~$0.01 per run.">
                <button
                  onClick={handleEnrichWindow}
                  disabled={isLoadingEnrichment}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-celestial-gold/60 text-celestial-gold bg-transparent hover:bg-celestial-gold/10 font-body text-sm rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-celestial-gold whitespace-nowrap"
                >
                  {isLoadingEnrichment ? (
                    <>
                      <span
                        className="inline-block w-4 h-4 border-2 border-celestial-gold border-t-transparent rounded-full animate-spin"
                        aria-hidden="true"
                      />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <span aria-hidden="true">✦</span>
                      {currentEnrichment ? 'Re-analyze Window' : 'Analyze Window with AI'}
                    </>
                  )}
                </button>
              </ButtonTooltip>
            </div>

            {enrichmentError && (
              <p className="font-body text-xs text-red-400 mb-3">{enrichmentError}</p>
            )}

            {isLoadingEnrichment && (
              <p className="font-body text-celestial-star-dim text-xs">Generating analysis…</p>
            )}

            {currentEnrichment && !isLoadingEnrichment ? (
              <div className="border-t border-celestial-gold/10 pt-4">
                {currentEnrichment.split('\n\n').map((para, idx) => (
                  <p
                    key={idx}
                    className="font-body text-celestial-star text-sm leading-relaxed mb-3 last:mb-0"
                  >
                    {para}
                  </p>
                ))}
              </div>
            ) : !isLoadingEnrichment && !currentEnrichment ? (
              <p className="font-body text-celestial-star-dim text-xs">
                Click the button above to generate a narrative analysis of the selected time window.
              </p>
            ) : null}
          </div>
        </section>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Sentiment trend chart                                               */}
        {/* ------------------------------------------------------------------ */}
        <section>
          <h3 className="font-heading text-celestial-star text-sm tracking-widest uppercase mb-2">
            Sentiment Trend
          </h3>

          <p className="font-body text-xs text-celestial-star-dim mb-4 leading-relaxed max-w-2xl">
            Scores range from <span className="text-red-400 font-medium">–1</span> (urgent, warning) to{' '}
            <span className="text-emerald-400 font-medium">+1</span> (joyful, peaceful). Each year's dot
            is the average across all messages that year. Vertical lines mark concurrent world events —
            hover a dot to see the score and events for that year.
          </p>

          {sentimentByYear.length > 0 ? (
            <div className="border border-celestial-gold/10 rounded-sm bg-celestial-indigo/30 p-4">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={sentimentByYear} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(212,175,55,0.06)" strokeDasharray="4 4" />
                  <XAxis
                    dataKey="year"
                    type="number"
                    domain={[1981, 2026]}
                    tickCount={10}
                    tick={{ fill: '#9090b8', fontSize: 11, fontFamily: 'Inter, system-ui, sans-serif' }}
                    axisLine={{ stroke: 'rgba(212,175,55,0.2)' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[-1, 1]}
                    tickCount={5}
                    tick={{ fill: '#9090b8', fontSize: 11, fontFamily: 'Inter, system-ui, sans-serif' }}
                    axisLine={{ stroke: 'rgba(212,175,55,0.2)' }}
                    tickLine={false}
                    width={36}
                  />
                  <Tooltip
                    content={<SentimentTooltipContent events={chartEvents} />}
                    cursor={{ stroke: 'rgba(212,175,55,0.3)', strokeWidth: 1 }}
                  />
                  <ReferenceLine y={0} stroke="rgba(212,175,55,0.2)" strokeDasharray="4 4" />
                  {chartEvents.map((e) => (
                    <ReferenceLine
                      key={e.id}
                      x={e.year}
                      stroke={EVENT_CATEGORY_COLORS[e.category] + '66'}
                      strokeDasharray="3 3"
                      label={{
                        value: e.title.length > 18 ? e.title.slice(0, 18) + '…' : e.title,
                        position: 'top',
                        fill: EVENT_CATEGORY_COLORS[e.category],
                        fontSize: 9,
                        fontFamily: 'Inter, system-ui, sans-serif',
                      }}
                    />
                  ))}
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#d4af37"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#d4af37', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#f5c842', strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>

              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                {(Object.entries(EVENT_CATEGORY_COLORS) as [GeopoliticalEvent['category'], string][]).map(
                  ([cat, color]) => (
                    <span key={cat} className="font-body text-xs text-celestial-star-dim flex items-center gap-1">
                      <span style={{ color }} aria-hidden="true">&#9632;</span>
                      {cat}
                    </span>
                  ),
                )}
              </div>
            </div>
          ) : (
            <div className="border border-celestial-gold/10 rounded-sm bg-celestial-indigo/20 p-8 text-center">
              <p className="font-body text-celestial-star-dim text-sm">
                {isLoadingAnalytics ? 'Running sentiment analysis…' : 'No sentiment data available.'}
              </p>
            </div>
          )}
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Geopolitical timeline                                               */}
        {/* ------------------------------------------------------------------ */}
        <section>
          <h3 className="font-heading text-celestial-star text-sm tracking-widest uppercase mb-4">
            World Events Timeline
          </h3>
          <GeopoliticalTimeline events={geopoliticalEvents} />
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Keyword frequency bar chart                                         */}
        {/* ------------------------------------------------------------------ */}
        <section>
          <h3 className="font-heading text-celestial-star text-sm tracking-widest uppercase mb-4">
            Top Keywords
          </h3>

          {keywordFreq.length > 0 ? (
            <div className="border border-celestial-gold/10 rounded-sm bg-celestial-indigo/30 p-4">
              <ResponsiveContainer width="100%" height={360}>
                <BarChart
                  data={keywordFreq}
                  layout="vertical"
                  margin={{ top: 4, right: 24, left: 80, bottom: 4 }}
                >
                  <CartesianGrid
                    stroke="rgba(212,175,55,0.06)"
                    strokeDasharray="4 4"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fill: '#9090b8', fontSize: 11, fontFamily: 'Inter, system-ui, sans-serif' }}
                    axisLine={{ stroke: 'rgba(212,175,55,0.2)' }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="word"
                    width={76}
                    tick={{ fill: '#e8e8f8', fontSize: 11, fontFamily: 'Inter, system-ui, sans-serif' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<KeywordTooltipContent />} cursor={{ fill: 'rgba(212,175,55,0.05)' }} />
                  <Bar dataKey="count" radius={[0, 2, 2, 0]}>
                    {keywordFreq.map((entry, idx) => (
                      <Cell
                        key={entry.word}
                        fill={`rgba(212,175,55,${1 - idx * 0.035})`}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="border border-celestial-gold/10 rounded-sm bg-celestial-indigo/20 p-8 text-center">
              <p className="font-body text-celestial-star-dim text-sm">Loading keyword data…</p>
            </div>
          )}
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Theme clusters                                                      */}
        {/* ------------------------------------------------------------------ */}
        {analytics.themes.length > 0 && (
          <section>
            <h3 className="font-heading text-celestial-star text-sm tracking-widest uppercase mb-4">
              Theme Clusters
            </h3>
            <div className="flex flex-wrap gap-2">
              {analytics.themes.map((theme: ThemeCluster) => {
                const isActive = selectedTheme === theme.name
                return (
                  <button
                    key={theme.name}
                    onClick={() => handleThemeClick(theme.name)}
                    title={theme.description}
                    className="font-body text-xs px-3 py-1.5 rounded-full border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-celestial-gold capitalize"
                    style={{
                      borderColor: theme.color + (isActive ? 'cc' : '55'),
                      color: isActive ? '#0a0a1e' : theme.color,
                      backgroundColor: isActive ? theme.color : theme.color + '18',
                    }}
                  >
                    {theme.name}
                    <span className="ml-1.5 opacity-70">({theme.messageIds.length})</span>
                  </button>
                )
              })}
            </div>
            {selectedTheme && (
              <p className="font-body text-xs text-celestial-star-dim mt-3">
                Filtering by theme: <span className="text-celestial-gold">{selectedTheme}</span>
                {' '}—{' '}
                <button
                  onClick={() => setSelectedTheme(null)}
                  className="text-celestial-blue hover:text-celestial-star underline focus:outline-none"
                >
                  clear filter
                </button>
              </p>
            )}
          </section>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Message list                                                        */}
        {/* ------------------------------------------------------------------ */}
        <section className="pb-10">
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 className="font-heading text-celestial-star text-sm tracking-widest uppercase">
                Messages
                <span className="font-body text-celestial-star-dim text-xs normal-case tracking-normal ml-2">
                  ({filteredMessages.length.toLocaleString()} in range)
                </span>
              </h3>

              {/* Year range selectors */}
              <div className="flex items-center gap-2 font-body text-xs text-celestial-star-dim">
                <label htmlFor="year-from" className="sr-only">From year</label>
                <select
                  id="year-from"
                  value={yearRange[0]}
                  onChange={(e) => setYearRange([+e.target.value, yearRange[1]])}
                  className="bg-celestial-indigo border border-celestial-gold/20 text-celestial-star rounded-sm px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-celestial-gold"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y} disabled={y > yearRange[1]}>
                      {y}
                    </option>
                  ))}
                </select>
                <span>to</span>
                <label htmlFor="year-to" className="sr-only">To year</label>
                <select
                  id="year-to"
                  value={yearRange[1]}
                  onChange={(e) => setYearRange([yearRange[0], +e.target.value])}
                  className="bg-celestial-indigo border border-celestial-gold/20 text-celestial-star rounded-sm px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-celestial-gold"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y} disabled={y < yearRange[0]}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Recipient filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-body text-xs text-celestial-star-dim">Recipient:</span>
              {(['marija', 'mirjana', 'group'] as MedjugorjeMessage['recipient'][]).map((r) => {
                const isActive = selectedRecipient === r
                const style = RECIPIENT_STYLE[r]
                return (
                  <button
                    key={r}
                    onClick={() => handleRecipientClick(r)}
                    className={`font-body text-xs px-3 py-1 rounded-full border transition-all duration-150 capitalize focus:outline-none focus:ring-1 focus:ring-celestial-gold ${isActive ? style.active : style.base}`}
                  >
                    {r}
                    <span className="ml-1.5 opacity-70">({recipientCounts[r]})</span>
                  </button>
                )
              })}
              {selectedRecipient && (
                <button
                  onClick={() => setSelectedRecipient(null)}
                  className="font-body text-xs text-celestial-blue hover:text-celestial-star underline focus:outline-none"
                >
                  clear
                </button>
              )}
            </div>
          </div>

          {filteredMessages.length === 0 ? (
            <p className="font-body text-celestial-star-dim text-sm text-center py-8">
              No messages found for this range
              {selectedTheme ? ` and theme "${selectedTheme}"` : ''}
              {selectedRecipient ? ` and recipient "${selectedRecipient}"` : ''}.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                {paginatedMessages.map((msg) => (
                  <MessageCard
                    key={msg.id}
                    message={msg}
                    isExpanded={expandedMessageId === msg.id}
                    onToggle={() => handleToggleMessage(msg.id)}
                  />
                ))}
              </div>

              {visibleCount < filteredMessages.length && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    className="font-body text-xs text-celestial-gold border border-celestial-gold/30 hover:bg-celestial-gold/10 px-5 py-2 rounded-sm transition-colors focus:outline-none focus:ring-2 focus:ring-celestial-gold"
                  >
                    Load more ({filteredMessages.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </section>

      </div>
    </div>
  )
}
