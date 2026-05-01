'use client'
import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { Button } from '@/components/ui/Button'

const QUICK_ACTIONS = [
  { label: 'Look around',  action: 'I look around carefully and examine my surroundings.' },
  { label: 'Inventory',    action: 'I check my inventory and assess what I have.' },
  { label: 'Sneak',        action: 'I attempt to move stealthily and hide in the shadows.' },
  { label: 'Attack',       action: 'I attack the nearest threat.' },
  { label: 'Persuade',     action: 'I attempt to persuade or negotiate.' },
  { label: 'Investigate',  action: 'I investigate the area for clues or hidden things.' },
  { label: 'Rest',         action: 'I take a short rest to catch my breath.' },
  { label: 'Help ally',    action: 'I move to help my ally.' },
]

interface ActionPanelProps {
  onAction: (action: string) => void
}

export function ActionPanel({ onAction }: ActionPanelProps) {
  const [input, setInput] = useState('')
  const [rollingInline, setRollingInline] = useState(false)
  const { isDMThinking, pendingRollRequest, setPendingRollRequest, setLastRollResult } = useGameStore()

  function handleSend() {
    const text = input.trim()
    if (!text || isDMThinking) return
    onAction(text)
    setInput('')
    setLastRollResult(null)
  }

  function handleActionClick(actionText: string) {
    onAction(actionText)
    setLastRollResult(null)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  async function handleInlineRoll() {
    if (!pendingRollRequest) return
    setRollingInline(true)
    try {
      const response = await fetch('/api/dice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notation: '1d20' })
      })
      const data = await response.json()
      const roll = data.rolls[0]
      const total = roll + 3 // TODO actual modifier
      const success = pendingRollRequest.dc ? total >= pendingRollRequest.dc : true
      
      setLastRollResult({
        roll, total, dc: pendingRollRequest.dc, success, type: pendingRollRequest.skill || pendingRollRequest.ability || 'Roll'
      })
      
      onAction(`I rolled a ${total} — ${success ? 'success' : 'failure'}.`)
      
    } catch {
      setLastRollResult({ roll: 10, total: 13, success: true, type: 'Roll' })
      onAction(`I rolled a 13 — success.`)
    }
    setPendingRollRequest(null)
    setRollingInline(false)
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      {/* Quick actions */}
      <div className="flex flex-wrap gap-2 mb-3">
        {pendingRollRequest && (
          <button
            onClick={handleInlineRoll}
            disabled={isDMThinking || rollingInline}
            className="text-xs px-4 py-1.5 rounded-lg border border-emerald-500 bg-emerald-500 text-white font-bold hover:bg-emerald-600 shadow-md animate-pulse disabled:animate-none disabled:opacity-50"
          >
            {rollingInline ? 'Rolling...' : `🎲 Roll ${pendingRollRequest.skill || pendingRollRequest.ability || 'Dice'} (DC ${pendingRollRequest.dc})`}
          </button>
        )}
        {QUICK_ACTIONS.map(({ label, action }) => (
          <button
            key={label}
            onClick={() => handleActionClick(action)}
            disabled={isDMThinking || rollingInline || !!pendingRollRequest}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Text input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isDMThinking || rollingInline || !!pendingRollRequest}
          placeholder={isDMThinking ? 'The DM is responding...' : pendingRollRequest ? 'Roll required before proceeding...' : 'What do you do?'}
          className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-emerald-400 disabled:opacity-50"
        />
        <Button
          onClick={handleSend}
          disabled={isDMThinking || rollingInline || !!pendingRollRequest || !input.trim()}
          variant="primary"
        >
          Send
        </Button>
      </div>
    </div>
  )
}