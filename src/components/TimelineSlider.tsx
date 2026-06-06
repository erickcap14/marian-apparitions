interface TimelineSliderProps {
  minYear: number
  maxYear: number
  value: number
  onChange: (year: number) => void
  apparitionCount: number
}

function formatYear(year: number): string {
  return year <= 100 ? `${year} AD` : String(year)
}

export function TimelineSlider({
  minYear,
  maxYear,
  value,
  onChange,
  apparitionCount,
}: TimelineSliderProps) {
  const isAll = value === maxYear
  const countLabel = `${apparitionCount} apparition${apparitionCount !== 1 ? 's' : ''}`

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 h-14 bg-gradient-to-t from-celestial-navy/95 to-transparent backdrop-blur-sm">
      <div className="flex items-center justify-center h-full gap-4 px-4">
        {/* Left end label */}
        <span className="font-body text-celestial-star-dim text-xs hidden sm:inline select-none">
          {formatYear(minYear)}
        </span>

        {/* Slider */}
        <input
          type="range"
          min={minYear}
          max={maxYear}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-48 sm:w-64 cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-400/60 rounded"
          style={{ accentColor: '#d4af37' }}
          aria-label="Filter by year"
          aria-valuemin={minYear}
          aria-valuemax={maxYear}
          aria-valuenow={value}
          aria-valuetext={formatYear(value)}
        />

        {/* Right end label */}
        <span className="font-body text-celestial-star-dim text-xs hidden sm:inline select-none">
          All
        </span>

        {/* Year + count info */}
        <div className="flex flex-col items-start min-w-[6rem]">
          <span className="font-heading text-celestial-gold text-sm leading-tight">
            {isAll ? 'All years' : formatYear(value)}
          </span>
          <span className="font-body text-celestial-star-dim text-xs leading-tight">
            {isAll ? `Showing all — ${countLabel}` : countLabel}
          </span>
        </div>
      </div>
    </div>
  )
}
