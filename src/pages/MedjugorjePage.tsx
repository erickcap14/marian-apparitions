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
} from '../api/medjugorjeAnalytics'
import { GeopoliticalTimeline } from '../components/GeopoliticalTimeline'
import { MedjugorjeStats } from '../components/MedjugorjeStats'

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
    <div
      className="border border-celestial-gold/10 rounded-sm bg-celestial-indigo/30 hover:bg-celestial-indigo/50 transition-colors"
    >
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
  const hasApiKey = Boolean(import.meta.env.VITE_ANTHROPIC_API_KEY)

  const [analytics, setAnalytics] = useState<AnalyticsResult>(() =>
    buildAnalyticsFromSentiments(precomputedSentiments),
  )
  const [isPrecomputed, setIsPrecomputed] = useState(true)
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)

  const [selectedTheme, setSelectedTheme] = useState<string | null>(null)
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null)
  const [yearRange, setYearRange] = useState<[number, number]>([1981, 2024])
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const [enrichment, setEnrichment] = useState<string | null>(null)
  const [isLoadingEnrichment, setIsLoadingEnrichment] = useState(false)
  const [enrichmentError, setEnrichmentError] = useState<string | null>(null)

  const [keywordFreq, setKeywordFreq] = useState<{ word: string; count: number }[]>([])

  const enrichmentRef = useRef<HTMLDivElement>(null)

  // Compute keyword frequency locally on mount — no API key needed
  useEffect(() => {
    setKeywordFreq(computeKeywordFrequency(medjugorjeMessages).slice(0, 20))
  }, [])

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [yearRange, selectedTheme])

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

  const filteredMessages = useMemo<MedjugorjeMessage[]>(() => {
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
    return msgs
  }, [yearRange, selectedTheme, analytics])

  const paginatedMessages = filteredMessages.slice(0, visibleCount)

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  async function handleRunAnalytics() {
    if (!hasApiKey || isLoadingAnalytics) return
    setIsLoadingAnalytics(true)
    setAnalyticsError(null)
    try {
      const sentiments = await analyzeSentiments(medjugorjeMessages)
      // Build analytics result locally from raw sentiments + pre-computed keywords
      const allKeywords = sentiments.flatMap((s) => s.keywords)
      const kwFreq: Record<string, number> = {}
      allKeywords.forEach((w) => { kwFreq[w] = (kwFreq[w] ?? 0) + 1 })
      const topKeywords = Object.entries(kwFreq)
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20)

      // Build theme clusters from themes arrays
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
    } catch (err) {
      setAnalyticsError(err instanceof Error ? err.message : 'Analytics failed')
    } finally {
      setIsLoadingAnalytics(false)
    }
  }

  async function handleEnrichWindow() {
    if (!hasApiKey || isLoadingEnrichment) return
    setIsLoadingEnrichment(true)
    setEnrichmentError(null)
    setEnrichment(null)
    try {
      const windowLabel = `${yearRange[0]}–${yearRange[1]}`
      const result = await enrichTimeWindow(filteredMessages, filteredEvents, windowLabel)
      setEnrichment(result)
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

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  function renderAnalyticsButton() {
    const label = isPrecomputed ? 'Run Claude Analytics' : 'Re-run Analytics'
    return (
      <div className="flex flex-col items-end gap-1.5">
      <button
        onClick={handleRunAnalytics}
        disabled={!hasApiKey || isLoadingAnalytics}
        title={hasApiKey ? undefined : 'Set VITE_ANTHROPIC_API_KEY to enable'}
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
      {isPrecomputed && (
        <span className="font-body text-xs text-celestial-star-dim">
          Showing pre-computed data
        </span>
      )}
      </div>
    )
  }

  const yearOptions: number[] = []
  for (let y = 1981; y <= 2024; y++) yearOptions.push(y)

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
                Messages · Analytics · Geopolitical Timeline &mdash; 1981–2024
              </p>
            </div>
            <div>{renderAnalyticsButton()}</div>
          </div>

          {!hasApiKey && (
            <div className="mt-4 px-4 py-3 border border-celestial-gold/30 bg-celestial-gold/5 rounded-sm font-body text-xs text-celestial-star-dim leading-relaxed">
              Charts use pre-computed data and load instantly. Set{' '}
              <code className="text-celestial-gold">VITE_ANTHROPIC_API_KEY</code> in{' '}
              <code className="text-celestial-gold">.env</code> to run live Claude analytics and AI window analysis.
            </div>
          )}

          {analyticsError && (
            <p className="mt-3 font-body text-xs text-red-400">{analyticsError}</p>
          )}
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Stats overview                                                      */}
        {/* ------------------------------------------------------------------ */}
        <MedjugorjeStats messages={medjugorjeMessages} />

        {/* ------------------------------------------------------------------ */}
        {/* Sentiment trend chart                                               */}
        {/* ------------------------------------------------------------------ */}
        <section>
          <h3 className="font-heading text-celestial-star text-sm tracking-widest uppercase mb-4">
            Sentiment Trend
          </h3>

          {sentimentByYear.length > 0 ? (
            <div className="border border-celestial-gold/10 rounded-sm bg-celestial-indigo/30 p-4">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={sentimentByYear} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(212,175,55,0.06)" strokeDasharray="4 4" />
                  <XAxis
                    dataKey="year"
                    type="number"
                    domain={[1981, 2024]}
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
                  {/* Zero baseline */}
                  <ReferenceLine y={0} stroke="rgba(212,175,55,0.2)" strokeDasharray="4 4" />
                  {/* Geopolitical event markers */}
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

              {/* Event legend */}
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
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
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

          {filteredMessages.length === 0 ? (
            <p className="font-body text-celestial-star-dim text-sm text-center py-8">
              No messages found for this range{selectedTheme ? ` and theme "${selectedTheme}"` : ''}.
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

        {/* ------------------------------------------------------------------ */}
        {/* Claude enrichment panel                                             */}
        {/* ------------------------------------------------------------------ */}
        <section ref={enrichmentRef} className="pb-10">
          <div className="border border-celestial-gold/20 rounded-sm bg-celestial-indigo/30 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h3 className="font-heading text-celestial-gold text-sm tracking-widest uppercase">
                  AI Window Analysis
                </h3>
                <p className="font-body text-celestial-star-dim text-xs mt-1">
                  Claude will narrate correlations between messages and world events for{' '}
                  <span className="text-celestial-star">{yearRange[0]}–{yearRange[1]}</span>
                </p>
              </div>
              <button
                onClick={handleEnrichWindow}
                disabled={!hasApiKey || isLoadingEnrichment}
                title={hasApiKey ? undefined : 'Set VITE_ANTHROPIC_API_KEY to enable'}
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
                    Analyze Window with AI
                  </>
                )}
              </button>
            </div>

            {enrichmentError && (
              <p className="font-body text-xs text-red-400 mb-3">{enrichmentError}</p>
            )}

            {enrichment ? (
              <div className="border-t border-celestial-gold/10 pt-4">
                {enrichment.split('\n\n').map((para, idx) => (
                  <p
                    key={idx}
                    className="font-body text-celestial-star text-sm leading-relaxed mb-3 last:mb-0"
                  >
                    {para}
                  </p>
                ))}
              </div>
            ) : !isLoadingEnrichment ? (
              <p className="font-body text-celestial-star-dim text-xs">
                Click the button above to generate a narrative analysis of the selected time window.
              </p>
            ) : null}
          </div>
        </section>

      </div>
    </div>
  )
}
