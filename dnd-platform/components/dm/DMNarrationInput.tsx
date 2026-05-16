'use client'
import { useState } from 'react'

export interface DMNarrationInputProps {
  campaignId: string
  characters: { id: string; name: string }[]
  draft?: string
  onDraftChange?: (text: string) => void
}

export const DMNarrationInput = ({ campaignId, characters, draft, onDraftChange }: DMNarrationInputProps) => {
  const [content, setContent]           = useState('')

  // Sync external draft (from AI Copilot) into the textarea
  const externalContent = draft !== undefined ? draft : content
  const setExternalContent = onDraftChange ?? setContent
  const [whisperTarget, setWhisperTarget] = useState('')
  const [loading, setLoading]           = useState(false)
  const [sent, setSent]                 = useState(false)
  const [error, setError]               = useState('')

  async function handleSend() {
    if (!externalContent.trim()) return
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/dm-console/narrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          content: externalContent.trim(),
          targetCharacterId: whisperTarget || null
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send narration')
      }

      setExternalContent('')
      setWhisperTarget('')
      setSent(true)
      setTimeout(() => setSent(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        Narration
      </p>

      <textarea
        value={externalContent}
        onChange={e => setExternalContent(e.target.value)}
        placeholder="Type your narration here... Players will see this in their story log."
        rows={4}
        className="w-full text-sm px-3 py-2 border border-white/10 rounded-lg bg-white/5 dark:bg-black/20 text-white placeholder-gray-500 focus:outline-none focus:border-amber-highlight resize-none"
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center gap-2">
        <select
          value={whisperTarget}
          onChange={e => setWhisperTarget(e.target.value)}
          className="flex-1 text-sm px-3 py-2 border border-white/10 rounded-lg bg-white/5 dark:bg-black/20 text-white focus:outline-none"
        >
          <option value="">All players</option>
          {characters.map(c => (
            <option key={c.id} value={c.id}>Whisper to {c.name}</option>
          ))}
        </select>

        <button
          onClick={handleSend}
          disabled={loading || !externalContent.trim()}
          className="px-4 py-2 text-sm btn-amber rounded-lg disabled:opacity-50 transition-colors"
        >
          {sent ? '✓ Sent' : loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  )
}