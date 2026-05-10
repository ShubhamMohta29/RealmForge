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
  const { isDMThinking, myCharacter } = useGameStore()

  function handleSend() {
    const text = input.trim()
    if (!text || isDMThinking) return
    onAction(text)
    setInput('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="p-6">
      {/* Quick actions */}
      <div className="flex flex-wrap gap-2.5 mb-5 justify-center">
        {QUICK_ACTIONS.map(({ label, action }) => (
          <button
            key={label}
            onClick={() => onAction(action)}
            disabled={isDMThinking}
            className="text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded-xl border border-foreground/10 bg-background/20 text-foreground/60 hover:bg-background/40 hover:border-foreground/20 hover:text-foreground disabled:opacity-40 transition-all shadow-lg active:scale-95 backdrop-blur-md"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Text input */}
      <div className="max-w-4xl mx-auto">
        <div className="relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-amber-main/20 border border-amber-main/30 flex items-center justify-center text-amber-highlight font-bold text-xs">
            {myCharacter?.name?.charAt(0) || 'N'}
          </div>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isDMThinking}
            placeholder={isDMThinking ? 'The DM is considering your fate...' : 'What do you do next?'}
            className="w-full pl-14 pr-24 py-4 rounded-2xl border border-foreground/10 bg-background/40 backdrop-blur-2xl text-foreground placeholder-foreground/40 focus:outline-none focus:border-amber-highlight/50 transition-all shadow-2xl"
          />
          <button
            onClick={handleSend}
            disabled={isDMThinking || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 btn-amber px-6 py-2 rounded-xl text-sm font-bold disabled:opacity-50 transition-all shadow-lg active:scale-95"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}