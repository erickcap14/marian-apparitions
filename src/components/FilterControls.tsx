import { useMemo } from 'react'
import type { Apparition } from '../data/types'
import { getCentury } from '../data/types'

interface FilterControlsProps {
  apparitions: Apparition[]
  century: number | null
  country: string | null
  onCenturyChange: (century: number | null) => void
  onCountryChange: (country: string | null) => void
  onReset: () => void
}

function ordinalSuffix(n: number): string {
  const abs = Math.abs(n)
  const lastTwo = abs % 100
  const lastOne = abs % 10
  if (lastTwo >= 11 && lastTwo <= 13) return `${n}th`
  if (lastOne === 1) return `${n}st`
  if (lastOne === 2) return `${n}nd`
  if (lastOne === 3) return `${n}rd`
  return `${n}th`
}

export function centuryLabel(c: number): string {
  return `${ordinalSuffix(c)} c.`
}

const SELECT_CLASS = [
  'bg-celestial-navy/80',
  'border border-celestial-gold/30',
  'text-celestial-star',
  'font-body text-xs',
  'px-2 py-1.5',
  'rounded-sm',
  'cursor-pointer',
  'focus:outline-none focus:border-celestial-gold/60 focus:ring-2 focus:ring-yellow-400/50',
  'hover:border-celestial-gold/50',
  'transition-colors',
].join(' ')

const RESET_CLASS = [
  'text-celestial-star-dim hover:text-celestial-gold',
  'font-body text-xs',
  'px-2 py-1',
  'border border-celestial-star-dim/20',
  'rounded-sm',
  'hover:border-celestial-gold/40',
  'transition-colors',
  'focus:outline-none focus:ring-2 focus:ring-yellow-400/50',
].join(' ')

export function FilterControls({
  apparitions,
  century,
  country,
  onCenturyChange,
  onCountryChange,
  onReset,
}: FilterControlsProps) {
  const centuries = useMemo(() => {
    return [...new Set(apparitions.map(a => getCentury(a.year)))].sort(
      (a, b) => a - b,
    )
  }, [apparitions])

  const countries = useMemo(() => {
    return [...new Set(apparitions.map(a => a.country))].sort((a, b) =>
      a.localeCompare(b),
    )
  }, [apparitions])

  const hasFilter = century !== null || country !== null

  function handleCenturyChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    onCenturyChange(val === '' ? null : Number(val))
  }

  function handleCountryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    onCountryChange(val === '' ? null : val)
  }

  return (
    <div className="flex items-center gap-2">
      {/* Century select */}
      <label className="sr-only" htmlFor="filter-century">
        Century
      </label>
      <select
        id="filter-century"
        className={SELECT_CLASS}
        value={century ?? ''}
        onChange={handleCenturyChange}
      >
        <option value="">All Centuries</option>
        {centuries.map(c => (
          <option key={c} value={c}>
            {centuryLabel(c)}
          </option>
        ))}
      </select>

      {/* Country select */}
      <label className="sr-only" htmlFor="filter-country">
        Country
      </label>
      <select
        id="filter-country"
        className={SELECT_CLASS}
        value={country ?? ''}
        onChange={handleCountryChange}
      >
        <option value="">All Countries</option>
        {countries.map(c => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {/* Reset button — only shown when a filter is active */}
      {hasFilter && (
        <button className={RESET_CLASS} onClick={onReset} type="button">
          &times;&nbsp;Reset
        </button>
      )}
    </div>
  )
}
