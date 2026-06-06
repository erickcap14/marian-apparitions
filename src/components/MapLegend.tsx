import { PIN_COLORS, STATUS_LABELS } from '../constants'

const STATUS_ORDER = [
  'approved',
  'approved_for_devotion',
  'under_investigation',
  'not_approved',
  'unapproved',
] as const

export function MapLegend() {
  return (
    <div className="absolute bottom-16 left-4 z-10 bg-celestial-navy/80 backdrop-blur-sm border border-celestial-gold/20 rounded-sm px-3 py-2">
      <p className="font-heading text-celestial-gold text-xs tracking-widest uppercase mb-2">
        Status
      </p>
      <ul className="flex flex-col gap-1.5">
        {STATUS_ORDER.map((status) => (
          <li key={status} className="flex items-center gap-2">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: PIN_COLORS[status] }}
            />
            <span className="font-body text-celestial-star text-xs">
              {STATUS_LABELS[status]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
