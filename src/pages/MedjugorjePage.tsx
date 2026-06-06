export function MedjugorjePage() {
  return (
    <div className="relative z-10 h-[calc(100vh-64px)] overflow-y-auto flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full mx-auto px-6 py-12 text-center">
        <h2 className="font-heading text-celestial-gold text-2xl tracking-widest uppercase mb-3">
          Our Lady of Medjugorje
        </h2>
        <p className="font-body text-celestial-star-dim text-sm mb-8">
          Messages · Analytics · Geopolitical Timeline
        </p>
        <div className="border border-celestial-gold/20 rounded-sm p-8 bg-celestial-indigo/40 backdrop-blur-sm">
          <p className="font-body text-celestial-star text-sm leading-relaxed">
            This page will feature the complete archive of Our Lady of Medjugorje's messages
            alongside Claude-powered NLP analytics — sentiment trends, keyword clusters, and theme
            evolution — overlaid on a timeline of major geopolitical events from 1981 to the present.
          </p>
          <p className="font-body text-celestial-star-dim text-xs mt-4">
            Feature in development — coming next session.
          </p>
        </div>
      </div>
    </div>
  )
}
