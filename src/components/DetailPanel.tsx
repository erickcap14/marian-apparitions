import { useState, useEffect } from 'react'
import type { Apparition } from '../data/types'
import { generateSummary, fetchAllSummaries, updateSummaryCache } from '../api/claudeApi'
import { isPublicBuild } from '../config'

const AI_SUMMARIES_KEY = 'apparition-ai-summaries'

function loadAiSummaries(): Record<string, string> {
  try {
    const raw = localStorage.getItem(AI_SUMMARIES_KEY)
    if (raw) return JSON.parse(raw) as Record<string, string>
  } catch { /* ignore */ }
  return {}
}

function saveAiSummary(id: string, summary: string): void {
  try {
    const existing = loadAiSummaries()
    existing[id] = summary
    localStorage.setItem(AI_SUMMARIES_KEY, JSON.stringify(existing))
  } catch { /* ignore */ }
}

interface DetailPanelProps {
  apparition: Apparition | null
  onClose: () => void
}

export function DetailPanel({ apparition, onClose }: DetailPanelProps) {
  const [displayedSummary, setDisplayedSummary] = useState<string>('')
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [hasSavedSummary, setHasSavedSummary] = useState(false)
  const isOpen = apparition !== null

  useEffect(() => {
    if (!apparition) return
    setIsRegenerating(false)
    // Public build: show only the curated static summary — no network, deterministic for all visitors.
    if (isPublicBuild) {
      setDisplayedSummary(apparition.summary)
      setHasSavedSummary(false)
      return
    }
    fetchAllSummaries().then((serverSummaries) => {
      const serverSummary = serverSummaries[apparition.id]
      const localSummary = loadAiSummaries()[apparition.id]
      const best = serverSummary ?? localSummary ?? apparition.summary
      setDisplayedSummary(best)
      setHasSavedSummary(!!(serverSummary ?? localSummary))
    })
  }, [apparition?.id])

  async function handleRegenerate() {
    if (!apparition || isRegenerating) return
    setIsRegenerating(true)
    try {
      const newSummary = await generateSummary(apparition)
      setDisplayedSummary(newSummary)
      setHasSavedSummary(true)
      saveAiSummary(apparition.id, newSummary)     // local cache
      updateSummaryCache(apparition.id, newSummary) // module cache
    } catch (err) {
      console.error('Failed to regenerate summary:', err)
    } finally {
      setIsRegenerating(false)
    }
  }

  return (
    <>
      {/* Mobile backdrop overlay — dims the map when panel is open */}
      <div
        className="fixed inset-0 z-[19] bg-celestial-navy/60 sm:hidden transition-opacity duration-300"
        style={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Detail panel */}
      <div
        className={[
          'fixed right-0 top-[64px]',
          'w-full max-w-full sm:w-96',
          'h-[calc(100vh-64px)]',
          'overflow-y-auto',
          'z-20',
          'flex flex-col',
          'p-6',
          'transition-transform duration-300 ease-in-out',
          'border border-celestial-gold/20 shadow-panel',
          isOpen
            ? 'bg-celestial-indigo/95 backdrop-blur-sm'
            : 'bg-celestial-indigo/95 pointer-events-none',
        ].join(' ')}
        style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}
        role="region"
        aria-label={apparition ? `Details for ${apparition.name}` : 'Apparition details'}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl leading-none text-celestial-star-dim hover:text-celestial-gold transition-colors focus:outline-none focus:ring-2 focus:ring-celestial-gold rounded-sm"
          aria-label="Close apparition detail panel"
        >
          &times;
        </button>

        {apparition && (
          <>
            {/* Title */}
            <h2 className="font-heading text-celestial-gold text-xl pr-8 mb-1">
              {apparition.name}
            </h2>

            {/* Subtitle */}
            <p className="font-body text-celestial-star-dim text-sm mb-3">
              {apparition.location}, {apparition.country}&nbsp;&middot;&nbsp;{apparition.year}
            </p>

            {/* Badge */}
            <div className="mb-4">
              {apparition.status === 'approved' && (
                <span className="badge-approved">&#10003; Nihil Obstat / Approved</span>
              )}
              {apparition.status === 'approved_for_devotion' && (
                <span className="badge-devotion">&#9676; Approved for Devotion</span>
              )}
              {apparition.status === 'under_investigation' && (
                <span className="badge-investigating">&#8943; Under Investigation</span>
              )}
              {apparition.status === 'not_approved' && (
                <span className="badge-not-approved">&#10007; Not Approved</span>
              )}
            </div>

            {/* Divider */}
            <hr className="border-celestial-gold/20 mb-4" />

            {/* Summary section */}
            <div className="flex-1">
              <p className="text-xs font-body tracking-widest text-celestial-star-dim uppercase mb-2">
                Summary
              </p>
              {isRegenerating ? (
                <p className="font-body text-celestial-star-dim text-sm leading-relaxed italic">
                  Generating summary&hellip;
                </p>
              ) : (
                <p className="font-body text-celestial-star text-sm leading-relaxed">
                  {displayedSummary}
                </p>
              )}

              {/* Regenerate button (private build only) */}
              {!isPublicBuild && (
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  aria-label={isRegenerating ? 'Generating AI summary…' : 'Regenerate summary with AI'}
                  className="w-full mt-3 py-2 text-sm font-body font-medium border border-celestial-gold/40 text-celestial-gold bg-transparent hover:bg-celestial-gold/10 rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-celestial-gold"
                >
                  {isRegenerating ? 'Generating…' : hasSavedSummary ? '❆ Regenerate with AI' : '❆ Generate with AI'}
                </button>
              )}
            </div>

            {/* Divider */}
            <hr className="border-celestial-gold/20 my-4" />

            {/* Source link */}
            <a
              href={apparition.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-celestial-blue text-sm hover:text-celestial-star transition-colors focus:outline-none focus:ring-2 focus:ring-celestial-gold rounded-sm"
            >
              View Source &rarr;
            </a>
          </>
        )}
      </div>
    </>
  )
}
