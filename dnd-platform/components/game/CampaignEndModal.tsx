'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface CampaignEndModalProps {
  campaignId: string
  campaignName: string
  onClose: () => void
}

type Step = 'summary' | 'confirm'

export function CampaignEndModal({ campaignId, campaignName, onClose }: CampaignEndModalProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('summary')
  const [summary, setSummary] = useState<string | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadSummary() {
    setLoadingSummary(true)
    setError(null)
    try {
      const res = await fetch('/api/campaign/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to generate summary'); return }
      setSummary(data.summary)
    } catch {
      setError('Failed to generate campaign summary. You can still archive the campaign.')
      setSummary(null)
    } finally {
      setLoadingSummary(false)
    }
  }

  // Load the summary on first render
  useEffect(() => { loadSummary() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleArchive() {
    setArchiving(true)
    try {
      const res = await fetch('/api/campaign/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId })
      })
      if (!res.ok) { setError('Failed to archive campaign'); setArchiving(false); return }
      router.push('/dashboard')
    } catch {
      setError('Failed to archive campaign')
      setArchiving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div
        className="glass rounded-2xl w-full max-w-2xl flex flex-col"
        style={{ animation: 'modalIn 150ms ease-out', maxHeight: '85vh' }}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex-shrink-0">
          <h2
            className="text-2xl font-bold text-white"
            style={{ fontFamily: '"Ibarra Real Nova", serif' }}
          >
            {step === 'summary' ? 'Your Campaign Has Ended' : 'Archive This Campaign?'}
          </h2>
          <p className="text-sm text-gray-400 mt-1">{campaignName}</p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {step === 'summary' && (
            <>
              {loadingSummary ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="w-8 h-8 border-2 border-amber-main/30 border-t-amber-highlight rounded-full animate-spin" />
                  <p className="text-sm text-gray-400 italic">The bard is composing your epic tale...</p>
                </div>
              ) : error && !summary ? (
                <div className="py-4">
                  <p className="text-red-400 text-sm mb-3">{error}</p>
                  <button onClick={loadSummary} className="text-xs text-amber-highlight hover:underline">
                    Try again
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {summary?.split('\n\n').map((para, i) => (
                    <p
                      key={i}
                      className="text-sm text-foreground leading-relaxed"
                      style={{ fontFamily: '"Ibarra Real Nova", serif', lineHeight: '1.8' }}
                    >
                      {para}
                    </p>
                  ))}
                </div>
              )}
            </>
          )}

          {step === 'confirm' && (
            <div className="py-2">
              <p className="text-sm text-foreground leading-relaxed mb-4">
                This will archive <strong className="text-white">{campaignName}</strong>. You can still read the story log, but no new actions can be taken.
              </p>
              <p className="text-sm text-gray-400">This action cannot be undone.</p>
              {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex gap-3 justify-end flex-shrink-0">
          {step === 'summary' ? (
            <>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg border border-white/12 text-gray-300 hover:text-white hover:border-white/24 text-sm transition-colors"
              >
                Keep Playing
              </button>
              <button
                onClick={() => setStep('confirm')}
                disabled={loadingSummary}
                className="btn-amber px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40"
              >
                Archive Campaign
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep('summary')}
                className="px-5 py-2.5 rounded-lg border border-white/12 text-gray-300 hover:text-white hover:border-white/24 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleArchive}
                disabled={archiving}
                className="px-5 py-2.5 rounded-lg border border-red-500/40 text-red-400 hover:border-red-500/70 hover:text-red-300 text-sm font-semibold transition-colors disabled:opacity-40"
              >
                {archiving ? 'Archiving...' : 'Confirm Archive'}
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
