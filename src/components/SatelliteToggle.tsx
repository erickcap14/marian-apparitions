interface SatelliteToggleProps {
  mode: 'graphic' | 'satellite'
  onToggle: () => void
}

export function SatelliteToggle({ mode, onToggle }: SatelliteToggleProps) {
  const isGraphic = mode === 'graphic'

  const activeClass = [
    'bg-celestial-gold/20',
    'text-celestial-gold',
    'border-r border-celestial-gold/30',
    'px-3 py-1.5',
    'transition-colors',
    'cursor-pointer',
  ].join(' ')

  const inactiveClass = [
    'bg-transparent',
    'text-celestial-star-dim',
    'hover:text-celestial-star',
    'px-3 py-1.5',
    'transition-colors',
    'cursor-pointer',
  ].join(' ')

  return (
    <div className="inline-flex rounded-sm border border-celestial-gold/30 overflow-hidden font-body text-xs">
      {/* Map segment */}
      <button
        type="button"
        className={isGraphic ? activeClass : inactiveClass}
        onClick={isGraphic ? undefined : onToggle}
        aria-pressed={isGraphic}
        aria-label="Switch to map view"
      >
        Map
      </button>

      {/* Satellite segment */}
      <button
        type="button"
        className={!isGraphic ? activeClass : inactiveClass}
        onClick={!isGraphic ? undefined : onToggle}
        aria-pressed={!isGraphic}
        aria-label="Switch to satellite view"
      >
        Satellite
      </button>
    </div>
  )
}
