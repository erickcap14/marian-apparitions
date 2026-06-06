import { useMemo } from 'react'
import type { MedjugorjeMessage } from '../data/medjugorjeTypes'

export interface MedjugorjeStatsProps {
  messages: MedjugorjeMessage[]
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'am', 'are', 'was', 'were', 'be', 'been',
  'to', 'you', 'i', 'in', 'of', 'dear', 'children', 'little',
  'with', 'and', 'for', 'this', 'that', 'my', 'your', 'me', 'we',
  'not', 'it', 'at', 'which', 'on', 'by', 'have', 'from', 'so',
  'do', 'can', 'all', 'as', 'through', 'also', 'today', 'call',
  'will', 'would', 'could', 'should',
  'their', 'them', 'they', 'who', 'what', 'when', 'how', 'or', 'if', 'but',
  'more', 'each', 'one', 'only', 'just', 'even', 'still', 'now', 'than',
])

const DECADES: { label: string; start: number; end: number }[] = [
  { label: '80s', start: 1981, end: 1989 },
  { label: '90s', start: 1990, end: 1999 },
  { label: '00s', start: 2000, end: 2009 },
  { label: '10s', start: 2010, end: 2019 },
  { label: '20s', start: 2020, end: 2024 },
]

const CARD = 'border border-celestial-gold/10 rounded-sm bg-celestial-indigo/30 p-3'
const LABEL = 'font-heading text-xs text-celestial-star-dim uppercase tracking-widest mb-1'
const VALUE = 'font-body text-celestial-star'

export function MedjugorjeStats({ messages }: MedjugorjeStatsProps) {
  const stats = useMemo(() => {
    if (messages.length === 0) {
      return null
    }

    // Year span
    const years = messages.map((m) => m.year)
    const minYear = Math.min(...years)
    const maxYear = Math.max(...years)

    // Recipient counts
    const marija = messages.filter((m) => m.recipient === 'marija').length
    const mirjana = messages.filter((m) => m.recipient === 'mirjana').length
    const group = messages.filter((m) => m.recipient === 'group').length

    // Top 5 keywords
    const freq: Record<string, number> = {}
    for (const msg of messages) {
      const words = msg.text.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/)
      for (const word of words) {
        if (!word || word.length < 2 || STOPWORDS.has(word)) continue
        freq[word] = (freq[word] ?? 0) + 1
      }
    }
    const topWords = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word)

    // Decade counts
    const decadeCounts = DECADES.map(({ label, start, end }) => ({
      label,
      count: messages.filter((m) => m.year >= start && m.year <= end).length,
    }))
    const maxDecadeCount = Math.max(...decadeCounts.map((d) => d.count), 1)

    return { minYear, maxYear, marija, mirjana, group, topWords, decadeCounts, maxDecadeCount }
  }, [messages])

  if (!stats) return null

  const { minYear, maxYear, marija, mirjana, group, topWords, decadeCounts, maxDecadeCount } = stats

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">

      {/* Card 1 — Total Messages */}
      <div className={CARD}>
        <p className={LABEL}>total</p>
        <p className="text-celestial-gold text-3xl font-heading leading-none">
          {messages.length.toLocaleString()}
        </p>
        <p className={`${VALUE} text-xs text-celestial-star-dim mt-0.5`}>messages</p>
      </div>

      {/* Card 2 — Year Span */}
      <div className={CARD}>
        <p className={LABEL}>year span</p>
        <p className={`${VALUE} text-base font-semibold`}>
          {minYear} – {maxYear}
        </p>
        <p className="font-body text-xs text-celestial-star-dim mt-0.5">
          {maxYear - minYear + 1}-year mission
        </p>
      </div>

      {/* Card 3 — Recipients */}
      <div className={CARD}>
        <p className={LABEL}>by recipient</p>
        <div className="flex flex-wrap gap-1.5 mt-1">
          <span className="inline-flex items-center gap-1 text-xs font-body rounded-sm px-1.5 py-0.5 bg-celestial-gold/10 text-celestial-gold border border-celestial-gold/20">
            <span className="font-semibold">{marija}</span>
            <span className="text-celestial-gold/70">Marija</span>
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-body rounded-sm px-1.5 py-0.5 bg-blue-500/10 text-blue-300 border border-blue-500/20">
            <span className="font-semibold">{mirjana}</span>
            <span className="text-blue-300/70">Mirjana</span>
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-body rounded-sm px-1.5 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20">
            <span className="font-semibold">{group}</span>
            <span className="text-purple-300/70">Group</span>
          </span>
        </div>
      </div>

      {/* Card 4 — Top Themes */}
      <div className={CARD}>
        <p className={LABEL}>top words</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {topWords.map((word) => (
            <span
              key={word}
              className="inline-block text-xs font-body rounded-sm px-1.5 py-0.5 bg-celestial-gold/10 text-celestial-gold border border-celestial-gold/20"
            >
              {word}
            </span>
          ))}
        </div>
      </div>

      {/* Card 5 — Decade bars (spans full width on 2-col, fits naturally on 4-col) */}
      <div className={`${CARD} col-span-2 sm:col-span-4`}>
        <p className={LABEL}>messages by decade</p>
        <div className="flex items-end gap-1.5 mt-2" style={{ height: 40 }}>
          {decadeCounts.map(({ label, count }) => {
            const heightPct = maxDecadeCount > 0 ? (count / maxDecadeCount) * 32 : 0
            return (
              <div key={label} className="flex flex-col items-center gap-1">
                <div
                  className="w-3 rounded-t-sm bg-celestial-gold/60"
                  style={{ height: Math.max(heightPct, 2) }}
                  title={`${label}: ${count}`}
                />
                <span className="font-heading text-celestial-star-dim uppercase tracking-widest"
                  style={{ fontSize: 9 }}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
