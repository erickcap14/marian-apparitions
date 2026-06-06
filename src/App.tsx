import { useState } from 'react'
import { StarField } from './components/StarField'
import { MapView } from './map/MapView'
import type { Apparition } from './data/types'

function App() {
  const [selectedApparition, setSelectedApparition] = useState<Apparition | null>(null)

  return (
    <div className="relative h-full w-full bg-celestial-navy overflow-hidden">
      <StarField />

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
            Church-Approved Apparitions of Our Lady
          </p>
        </div>
        <span className="badge-approved">Nihil Obstat Only</span>
      </header>

      {/* Map */}
      <main className="relative z-10 flex-1 h-[calc(100%-64px)]">
        <MapView onSelect={setSelectedApparition} />
        {/* T014 detail panel will render here */}
        {selectedApparition && null}
      </main>
    </div>
  )
}

export default App
