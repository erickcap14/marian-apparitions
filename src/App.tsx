import { useState, useCallback, useMemo } from 'react'
import { StarField } from './components/StarField'
import { MapView } from './map/MapView'
import { DetailPanel } from './components/DetailPanel'
import { SearchSidebar } from './components/SearchSidebar'
import { FilterControls } from './components/FilterControls'
import { MapLegend } from './components/MapLegend'
import { TimelineSlider } from './components/TimelineSlider'
import { SatelliteToggle } from './components/SatelliteToggle'
import { TodayFeastBanner, getTodayFeastMatches } from './components/TodayFeastBanner'
import { MedjugorjePage } from './pages/MedjugorjePage'
import type { Apparition } from './data/types'
import { apparitions } from './data/apparitions'
import { getCentury } from './data/types'

const MIN_YEAR = Math.min(...apparitions.map((a) => a.year))
const MAX_YEAR = Math.max(...apparitions.map((a) => a.year))

function App() {
  const [selectedApparition, setSelectedApparition] = useState<Apparition | null>(null)
  const [century, setCentury] = useState<number | null>(null)
  const [country, setCountry] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [timelineYear, setTimelineYear] = useState(MAX_YEAR)
  const [isSatellite, setIsSatellite] = useState(false)
  const [flyToId, setFlyToId] = useState<string | null>(null)
  const [page, setPage] = useState<'map' | 'medjugorje'>('map')

  const todayMatches = useMemo(() => getTodayFeastMatches(apparitions), [])
  const todayIds = useMemo(() => new Set(todayMatches.map((a) => a.id)), [todayMatches])

  const handleMapSelect = useCallback((a: Apparition) => {
    setSelectedApparition(a)
  }, [])

  const handleSidebarSelect = useCallback((a: Apparition) => {
    setSelectedApparition(a)
    setFlyToId(a.id)
  }, [])

  const handleReset = useCallback(() => {
    setCentury(null)
    setCountry(null)
    setStatusFilter(null)
  }, [])

  const visibleCount = apparitions.filter((a) => {
    if (a.year > timelineYear) return false
    if (century !== null && getCentury(a.year) !== century) return false
    if (country !== null && a.country !== country) return false
    if (statusFilter !== null && a.status !== statusFilter) return false
    return true
  }).length

  return (
    <div className="relative h-full w-full bg-celestial-navy overflow-hidden">
      <StarField />

      <SearchSidebar
        apparitions={apparitions}
        selectedId={selectedApparition?.id ?? null}
        onSelect={handleSidebarSelect}
        century={century}
        country={country}
        timelineYear={timelineYear}
        todayIds={todayIds}
      />

      {/* Header */}
      <header
        className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-celestial-gold/20"
        style={{ background: 'linear-gradient(to bottom, rgba(18,18,58,0.95), rgba(10,10,30,0.8))' }}
      >
        <div>
          <h1 className="font-heading text-celestial-gold text-xl tracking-widest uppercase">
            Marian Apparitions
          </h1>
          <p className="font-body text-celestial-star-dim text-xs tracking-wider mt-0.5">
            Apparitions of Our Lady
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-end">
          <FilterControls
            apparitions={apparitions}
            century={century}
            country={country}
            status={statusFilter}
            onCenturyChange={setCentury}
            onCountryChange={setCountry}
            onStatusChange={setStatusFilter}
            onReset={handleReset}
          />
          <SatelliteToggle
            mode={isSatellite ? 'satellite' : 'graphic'}
            onToggle={() => setIsSatellite((prev) => !prev)}
          />
          <button
            onClick={() => setPage(page === 'medjugorje' ? 'map' : 'medjugorje')}
            className={[
              'font-body text-xs tracking-widest uppercase px-3 py-1.5 rounded-sm border transition-colors duration-150',
              page === 'medjugorje'
                ? 'bg-celestial-gold/20 border-celestial-gold text-celestial-gold'
                : 'border-celestial-gold/40 text-celestial-star-dim hover:border-celestial-gold/70 hover:text-celestial-star',
            ].join(' ')}
          >
            Medjugorje
          </button>
        </div>
      </header>

      <TodayFeastBanner
        matches={todayMatches}
        onSelectApparition={(a) => { handleSidebarSelect(a); setPage('map') }}
      />

      {/* Main content */}
      {page === 'medjugorje' ? (
        <MedjugorjePage />
      ) : (
        <>
          <main className="relative z-10 h-[calc(100%-64px)]">
            <MapView
              onSelect={handleMapSelect}
              flyToId={flyToId}
              century={century}
              country={country}
              maxYear={timelineYear}
              isSatellite={isSatellite}
              statusFilter={statusFilter}
            />
            <DetailPanel
              apparition={selectedApparition}
              onClose={() => setSelectedApparition(null)}
            />
            <MapLegend />
          </main>

          <TimelineSlider
            minYear={MIN_YEAR}
            maxYear={MAX_YEAR}
            value={timelineYear}
            onChange={setTimelineYear}
            apparitionCount={visibleCount}
          />
        </>
      )}
    </div>
  )
}

export default App
