import { useState } from 'react'
import type { Apparition } from '../data/types'

interface TodayFeastBannerProps {
  matches: Apparition[]
  onSelectApparition: (a: Apparition) => void
}

export function TodayFeastBanner({ matches, onSelectApparition }: TodayFeastBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || matches.length === 0) return null

  return (
    <div
      className="relative z-30 flex items-center justify-between gap-3 px-5 py-2.5
        border-b border-celestial-gold/30"
      style={{ background: 'linear-gradient(to right, rgba(18,18,58,0.97), rgba(26,20,70,0.97))' }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-celestial-gold text-base shrink-0" aria-hidden="true">✦</span>
        <p className="font-body text-sm text-celestial-star leading-snug">
          <span className="text-celestial-gold font-semibold">Today's Feast · </span>
          {matches.map((a, i) => (
            <span key={a.id}>
              {i > 0 && <span className="text-celestial-star-dim"> &amp; </span>}
              <button
                onClick={() => onSelectApparition(a)}
                className="text-celestial-gold/90 hover:text-celestial-gold underline underline-offset-2
                  decoration-celestial-gold/40 hover:decoration-celestial-gold transition-colors"
              >
                {a.name}
              </button>
            </span>
          ))}
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss feast day banner"
        className="shrink-0 text-celestial-star-dim hover:text-celestial-star transition-colors text-lg leading-none"
      >
        ×
      </button>
    </div>
  )
}

export function getTodayFeastMatches(apparitions: Apparition[]): Apparition[] {
  const now = new Date()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const today = `${mm}-${dd}`
  return apparitions.filter((a) => a.feastDay === today)
}
