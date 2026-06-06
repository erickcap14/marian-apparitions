import { StarField } from './components/StarField'

function App() {
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

      {/* Map placeholder */}
      <main className="relative z-10 flex-1 h-[calc(100%-64px)] flex items-center justify-center">
        <div className="text-center">
          <p className="font-heading text-celestial-gold/60 text-sm tracking-widest uppercase">
            Map loading in T009
          </p>
        </div>
      </main>
    </div>
  )
}

export default App
