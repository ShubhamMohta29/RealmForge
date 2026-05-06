'use client'
import { useState } from 'react'

export interface DMNarrationInputProps {
  campaignId: string
  characters: { id: string; name: string }[]
}

export const DMNarrationInput = ({ campaignId, characters }: DMNarrationInputProps) => {
  const [content, setContent]           = useState('')
  const [whisperTarget, setWhisperTarget] = useState('')
  const [loading, setLoading]           = useState(false)
  const [sent, setSent]                 = useState(false)

  async function handleSend() {
    if (!content.trim()) return
    setLoading(true)

    await fetch('/api/dm-console/narrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId,
        content: content.trim(),
        targetCharacterId: whisperTarget || null
      })
    })

    setContent('')
    setWhisperTarget('')
    setLoading(false)
    setSent(true)
    setTimeout(() => setSent(false), 2000)
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        Narration
      </p>

      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Type your narration here... Players will see this in their story log."
        rows={4}
        className="w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-400 resize-none"
      />

      <div className="flex items-center gap-2">
        <select
          value={whisperTarget}
          onChange={e => setWhisperTarget(e.target.value)}
          className="flex-1 text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none"
        >
          <option value="">All players</option>
          {characters.map(c => (
            <option key={c.id} value={c.id}>Whisper to {c.name}</option>
          ))}
        </select>

        <button
          onClick={handleSend}
          disabled={loading || !content.trim()}
          className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {sent ? '✓ Sent' : loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  )
}