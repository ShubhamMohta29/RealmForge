'use client'
import type { Character } from '@/types/character'

// Classes with no spell slots — no mana bar shown
const NON_SPELLCASTERS = new Set(['fighter', 'barbarian', 'monk', 'rogue'])

interface ManaBarProps {
  character: Character
  height?: string
}

function totalSlots(slots: Record<string, number>): number {
  return Object.values(slots).reduce((sum, v) => sum + (v || 0), 0)
}

export function ManaBar({ character, height = 'h-1.5' }: ManaBarProps) {
  const cls = character.class?.toLowerCase() ?? ''
  if (NON_SPELLCASTERS.has(cls)) return null

  const current = totalSlots(character.spells?.slots ?? {})
  const max = totalSlots(character.spells?.slot_max ?? {})

  if (max === 0) return null

  const pct = Math.max(0, Math.min(100, Math.round((current / max) * 100)))

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-medium text-gray-400">
        <span>Spell Slots</span>
        <span className="text-blue-400/80 font-mono">{current}/{max}</span>
      </div>
      <div className={`w-full bg-white/10 rounded-full ${height} overflow-hidden`}>
        <div
          className={`${height} rounded-full transition-all duration-500 ease-out`}
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(to right, #3b82f6, #60a5fa)',
            boxShadow: pct > 0 ? '0 0 6px rgba(96,165,250,0.4)' : 'none'
          }}
        />
      </div>
    </div>
  )
}
