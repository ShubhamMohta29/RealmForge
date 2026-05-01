'use client'
import { useState } from 'react'

const QUICK_PROMPTS = [
  'Describe this room dramatically in 2 sentences',
  'Generate 3 NPC names and one-line descriptions for a tavern',
  'What would this monster do tactically right now?',
  'Suggest a surprising complication for this scene',
  'Write a threatening speech for the villain',
  'What are 3 consequences of the players\' last decision?',
  'Generate a random encounter appropriate for this setting',
  'Describe the weather and atmosphere dramatically',
]

interface AICopilotProps {
  campaignId: string
  onInsert: (text: string) => void
}

export function AICopilot({ campaignId, onInsert }: AICopilotProps) {
  const [prompt, setPrompt]         = useState('')
  const [suggestion, setSuggestion] = useState('')
  const [loading, setLoading]       = useState(false)

  async function askAI(text: string) {
    setLoading(true)
    setSuggestion('')
    try {
      const response = await fetch('/api/dm-console/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, prompt: text })
      })
      const data = await response.json()
      setSuggestion(data.suggestion || '')
    } catch {
      setSuggestion('Failed to get suggestion.')
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        AI Co-pilot
      </p>

      {/* Quick prompts */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_PROMPTS.map(p => (
          <button
            key={p}
            onClick={() => { setPrompt(p); askAI(p) }}
            className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Custom prompt */}
      <div className="flex gap-2">
        <input
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && prompt.trim() && askAI(prompt)}
          placeholder="Ask AI for help..."
          className="flex-1 text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-emerald-400"
        />
        <button
          onClick={() => prompt.trim() && askAI(prompt)}
          disabled={loading || !prompt.trim()}
          className="text-sm px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          Ask
        </button>
      </div>

      {/* Suggestion output */}
      {loading && (
        <p className="text-sm text-gray-400 italic animate-pulse">AI is thinking...</p>
      )}
      {suggestion && !loading && (
        <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
            {suggestion}
          </p>
          <button
            onClick={() => onInsert(suggestion)}
            className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Insert into narration →
          </button>
        </div>
      )}
    </div>
  )
}