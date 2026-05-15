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
  dmError?: string | null
  onClearError?: () => void
  isHumanDM?: boolean
}

export function ActionPanel({ onAction, dmError, onClearError, isHumanDM }: ActionPanelProps) {
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const { isDMThinking, myCharacter } = useGameStore()

  const blocked = isHumanDM ? sending : isDMThinking

  async function handleSend() {
    const text = input.trim()
    if (!text || blocked) return
    if (isHumanDM) setSending(true)
    onAction(text)
    setInput('')
    if (isHumanDM) setTimeout(() => setSending(false), 600)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="p-6">
      {/* DM error banner */}
      {dmError && (
        <div className="mb-4 max-w-4xl mx-auto flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-xs">
          <span>{dmError}</span>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => { if (input.trim()) onAction(input.trim()); onClearError?.() }}
              className="text-xs font-semibold text-amber-highlight hover:text-amber-main transition-colors"
            >
              Retry
            </button>
            <button onClick={onClearError} className="text-gray-500 hover:text-gray-300 transition-colors">✕</button>
          </div>
        </div>
      )}

      {/* Quick actions — only shown for AI DM */}
      {!isHumanDM && (
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
      )}

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
            disabled={blocked}
            placeholder={
              isHumanDM
                ? (sending ? 'Message sent...' : 'Message your DM...')
                : (isDMThinking ? 'The DM is considering your fate...' : 'What do you do next?')
            }
            className="w-full pl-14 pr-24 py-4 rounded-2xl border border-foreground/10 bg-background/40 backdrop-blur-2xl text-foreground placeholder-foreground/40 focus:outline-none focus:border-amber-highlight/50 transition-all shadow-2xl"
          />
          <button
            onClick={handleSend}
            disabled={blocked || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 btn-amber px-6 py-2 rounded-xl text-sm font-bold disabled:opacity-50 transition-all shadow-lg active:scale-95"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}