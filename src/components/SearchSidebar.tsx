import { useState, useMemo } from 'react'
import type { Apparition } from '../data/types'

interface SearchSidebarProps {
  apparitions: Apparition[]
  selectedId: string | null
  onSelect: (a: Apparition) => void
}

export function SearchSidebar({ apparitions, selectedId, onSelect }: SearchSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q
      ? apparitions.filter(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            a.location.toLowerCase().includes(q) ||
            a.country.toLowerCase().includes(q) ||
            String(a.year).includes(q),
        )
      : [...apparitions]
    return list.sort((a, b) => a.year - b.year)
  }, [apparitions, query])

  const handleSelect = (a: Apparition) => {
    onSelect(a)
    setIsOpen(false)
  }

  return (
    <>
      {/* Sidebar panel */}
      <div
        className="fixed left-0 top-[64px] z-20 h-[calc(100vh-64px)] w-72 flex flex-col
          bg-celestial-indigo/95 backdrop-blur-sm border-r border-celestial-gold/20
          transition-transform duration-300 ease-in-out"
        style={{ transform: isOpen ? 'translateX(0)' : 'translateX(-100%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <span className="font-heading text-celestial-gold text-sm tracking-widest uppercase">
            Apparitions
          </span>
          <span className="text-celestial-star-dim text-xs">
            {query.trim()
              ? `${filtered.length} / ${apparitions.length}`
              : String(apparitions.length)}
          </span>
        </div>

        {/* Search input */}
        <div className="px-4 pb-3 shrink-0">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search apparitions…"
            className="w-full bg-celestial-navy border border-celestial-gold/30
              text-celestial-star font-body text-sm px-3 py-2 rounded-sm
              focus:outline-none focus:border-celestial-gold/60
              placeholder:text-celestial-star-dim"
          />
        </div>

        {/* Divider */}
        <div className="border-t border-celestial-gold/10 shrink-0" />

        {/* Apparition list */}
        <div className="overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-celestial-star-dim text-sm">No apparitions match</span>
            </div>
          ) : (
            <ul>
              {filtered.map((a) => {
                const isSelected = a.id === selectedId
                return (
                  <li
                    key={a.id}
                    onClick={() => handleSelect(a)}
                    className={[
                      'px-4 py-3 cursor-pointer transition-colors duration-150',
                      isSelected
                        ? 'bg-celestial-gold/10 border-l-2 border-celestial-gold'
                        : 'border-l-2 border-transparent hover:bg-celestial-indigo-light/50',
                    ].join(' ')}
                  >
                    <div
                      className={[
                        'font-body text-sm text-celestial-star leading-snug',
                        isSelected ? 'font-bold' : 'font-normal',
                      ].join(' ')}
                    >
                      {a.name}
                    </div>
                    <div className="font-body text-xs text-celestial-star-dim mt-0.5">
                      {a.country} · {a.year}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Toggle tab — always visible on the left edge */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        className="fixed z-30 flex items-center justify-center
          w-8 h-24 top-1/2 -translate-y-1/2
          bg-celestial-indigo/90 border-r border-t border-b border-celestial-gold/20
          text-celestial-gold hover:text-celestial-gold-bright
          rounded-r-sm transition-all duration-300 ease-in-out"
        style={{ left: isOpen ? '288px' : '0px' }}
      >
        <span className="text-lg leading-none select-none" aria-hidden="true">
          {isOpen ? '‹' : '›'}
        </span>
      </button>
    </>
  )
}
