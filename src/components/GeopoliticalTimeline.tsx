import { useState, useRef } from 'react'
import type { GeopoliticalEvent } from '../data/medjugorjeTypes'

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

const CATEGORY_LABELS: Record<GeopoliticalEvent['category'], string> = {
  war:       'War',
  collapse:  'Collapse',
  disaster:  'Disaster',
  papal:     'Papal',
  terrorism: 'Terrorism',
  diplomacy: 'Diplomacy',
}

const ALL_CATEGORIES = Object.keys(EVENT_CATEGORY_COLORS) as GeopoliticalEvent['category'][]

const TIMELINE_START = 1981
const TIMELINE_END   = 2024
const TIMELINE_SPAN  = TIMELINE_END - TIMELINE_START

const DECADE_MARKERS = [1981, 1990, 2000, 2010, 2020, 2024]

const INNER_MIN_WIDTH = 1200 // px — enables horizontal scrolling on small viewports

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function yearToPercent(year: number): string {
  return `${((year - TIMELINE_START) / TIMELINE_SPAN) * 100}%`
}

function truncateTitle(title: string, max = 14): string {
  return title.length > max ? title.slice(0, max - 1) + '…' : title
}

// ---------------------------------------------------------------------------
// TooltipCard
// ---------------------------------------------------------------------------

interface TooltipCardProps {
  event: GeopoliticalEvent
}

function TooltipCard({ event }: TooltipCardProps) {
  const color = EVENT_CATEGORY_COLORS[event.category]
  const label = CATEGORY_LABELS[event.category]

  return (
    <div
      className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-50
                 w-52 bg-celestial-indigo border border-celestial-gold/30 rounded-sm
                 p-3 shadow-panel pointer-events-none"
      role="tooltip"
    >
      {/* Down-pointing arrow */}
      <div
        className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
        style={{
          borderLeft:  '5px solid transparent',
          borderRight: '5px solid transparent',
          borderTop:   '5px solid rgba(212,175,55,0.3)',
        }}
      />

      <p className="font-body text-celestial-gold font-medium text-[11px] leading-snug mb-1">
        {event.title}
      </p>
      <p className="font-body text-celestial-star-dim text-[10px] mb-1.5">
        {event.date}
      </p>
      <span
        className="inline-block font-body text-[9px] px-1.5 py-0.5 rounded-sm border mb-1.5"
        style={{
          color,
          borderColor:     `${color}66`,
          backgroundColor: `${color}22`,
        }}
      >
        {label}
      </span>
      <p className="font-body text-celestial-star text-[10px] leading-snug line-clamp-2">
        {event.description}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// EventDot
// ---------------------------------------------------------------------------

interface EventDotProps {
  event:       GeopoliticalEvent
  leftPercent: string
}

function EventDot({ event, leftPercent }: EventDotProps) {
  const [hovered, setHovered] = useState(false)
  const color = EVENT_CATEGORY_COLORS[event.category]

  return (
    <div
      className="absolute flex flex-col items-center"
      style={{
        left:      leftPercent,
        transform: 'translateX(-50%)',
        top:       0,
        bottom:    0,
      }}
    >
      {/* Truncated title — below the timeline line */}
      <span
        className="absolute font-body text-celestial-star-dim whitespace-nowrap leading-none select-none"
        style={{
          fontSize: '9px',
          top:      'calc(50% + 12px)',
        }}
      >
        {truncateTitle(event.title)}
      </span>

      {/* Dot + tooltip wrapper */}
      <div
        className="absolute"
        style={{ top: 'calc(50% - 4px)' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
      >
        {/* Tooltip — shown above the dot */}
        {hovered && (
          <div className="relative">
            <TooltipCard event={event} />
          </div>
        )}

        {/* The dot itself */}
        <button
          className="block rounded-full focus:outline-none focus:ring-1 focus:ring-celestial-gold
                     transition-transform hover:scale-150"
          style={{
            width:           '8px',
            height:          '8px',
            backgroundColor: color,
            boxShadow:       hovered ? `0 0 6px ${color}` : undefined,
          }}
          aria-label={`${event.title} (${event.date})`}
          tabIndex={0}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// DecadeMarker
// ---------------------------------------------------------------------------

interface DecadeMarkerProps {
  year:        number
  leftPercent: string
}

function DecadeMarker({ year, leftPercent }: DecadeMarkerProps) {
  return (
    <div
      className="absolute flex flex-col items-center pointer-events-none"
      style={{
        left:      leftPercent,
        transform: 'translateX(-50%)',
        top:       0,
        bottom:    0,
      }}
    >
      {/* Year label — above the tick */}
      <span
        className="absolute font-heading text-celestial-gold/50 whitespace-nowrap select-none"
        style={{
          fontSize: '9px',
          bottom:   'calc(50% + 10px)',
        }}
      >
        {year}
      </span>

      {/* Tick mark — taller than event dot */}
      <div
        className="absolute bg-celestial-gold/40"
        style={{
          width:  '1px',
          height: '12px',
          top:    'calc(50% - 6px)',
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// GeopoliticalTimeline — named export
// ---------------------------------------------------------------------------

export interface GeopoliticalTimelineProps {
  events: GeopoliticalEvent[]
}

export function GeopoliticalTimeline({ events }: GeopoliticalTimelineProps) {
  const [activeCategories, setActiveCategories] = useState<Set<GeopoliticalEvent['category']>>(
    new Set(ALL_CATEGORIES),
  )
  const scrollRef = useRef<HTMLDivElement>(null)

  function toggleCategory(cat: GeopoliticalEvent['category']) {
    setActiveCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) {
        // Keep at least one category visible
        if (next.size === 1) return prev
        next.delete(cat)
      } else {
        next.add(cat)
      }
      return next
    })
  }

  const visibleEvents = events.filter((e) => activeCategories.has(e.category))

  return (
    <div className="border border-celestial-gold/10 rounded-sm bg-celestial-indigo/30 p-4">
      {/* Section heading */}
      <h3 className="font-heading text-celestial-gold text-sm mb-3 tracking-wide uppercase">
        World Events Timeline
      </h3>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {ALL_CATEGORIES.map((cat) => {
          const active = activeCategories.has(cat)
          const color  = EVENT_CATEGORY_COLORS[cat]
          return (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className="font-body text-[10px] px-2 py-0.5 rounded-sm border transition-colors
                         focus:outline-none focus:ring-1 focus:ring-celestial-gold"
              style={
                active
                  ? {
                      backgroundColor: `${color}33`,
                      color,
                      borderColor: `${color}88`,
                    }
                  : {
                      backgroundColor: 'transparent',
                      color:           `${color}88`,
                      borderColor:     `${color}44`,
                    }
              }
              aria-pressed={active}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          )
        })}
      </div>

      {/* Scrollable timeline strip — webkit scrollbar via className hook */}
      <div
        ref={scrollRef}
        className="geo-timeline-scroll overflow-x-auto"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(212,175,55,0.2) transparent',
        }}
      >
        {/* Inner fixed-width div so the strip is scrollable on narrow viewports */}
        <div
          style={{
            minWidth: `${INNER_MIN_WIDTH}px`,
            height:   '100px',
            position: 'relative',
          }}
        >
          {/* Horizontal gold timeline line */}
          <div
            className="absolute bg-celestial-gold/30"
            style={{
              left:      0,
              right:     0,
              top:       '50%',
              height:    '1px',
              transform: 'translateY(-50%)',
            }}
          />

          {/* Decade markers */}
          {DECADE_MARKERS.map((yr) => (
            <DecadeMarker
              key={yr}
              year={yr}
              leftPercent={yearToPercent(yr)}
            />
          ))}

          {/* Event dots */}
          {visibleEvents.map((evt) => (
            <EventDot
              key={evt.id}
              event={evt}
              leftPercent={yearToPercent(evt.year)}
            />
          ))}
        </div>
      </div>

      {/* Legend strip */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-2 border-t border-celestial-gold/10">
        {ALL_CATEGORIES.map((cat) => {
          const color = EVENT_CATEGORY_COLORS[cat]
          const dim   = !activeCategories.has(cat)
          return (
            <span
              key={cat}
              className="flex items-center gap-1 font-body text-[10px] transition-opacity"
              style={{ opacity: dim ? 0.35 : 1 }}
            >
              <span
                className="inline-block rounded-full"
                style={{ width: '7px', height: '7px', backgroundColor: color }}
              />
              <span className="text-celestial-star-dim">{CATEGORY_LABELS[cat]}</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
