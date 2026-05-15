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
      if (!response.ok) {
        setSuggestion(`Error: ${data.error || 'Request failed'}`)
      } else {
        setSuggestion(data.suggestion || 'No suggestion returned.')
      }
    } catch (err) {
      setSuggestion(`Failed to reach AI: ${err instanceof Error ? err.message : 'Unknown error'}`)
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
          className="flex-1 text-sm px-3 py-2 border border-white/10 rounded-lg bg-white/5 dark:bg-black/20 text-white placeholder-gray-500 focus:outline-none focus:border-amber-highlight"
        />
        <button
          onClick={() => prompt.trim() && askAI(prompt)}
          disabled={loading || !prompt.trim()}
          className="text-sm px-3 py-2 btn-amber rounded-lg disabled:opacity-50 transition-colors"
        >
          Ask
        </button>
      </div>

      {/* Suggestion output */}
      {loading && (
        <p className="text-sm text-gray-400 italic animate-pulse">AI is thinking...</p>
      )}
      {suggestion && !loading && (
        <div className="bg-amber-main/20 border border-amber-main/30 rounded-lg p-3">
          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
            {suggestion}
          </p>
          <button
            onClick={() => onInsert(suggestion)}
            className="mt-2 text-xs text-amber-highlight hover:underline"
          >
            Insert into narration →
          </button>
        </div>
      )}
    </div>
  )
}