'use client'
import { useGameStore } from '@/store/gameStore'
import { HPBar } from '@/components/ui/HPBar'
import type { Combatant } from '@/types/combat'

export function InitiativeTracker() {
  const { encounter } = useGameStore()
  if (!encounter || encounter.status !== 'active') return null

  const current = encounter.turn_order[encounter.current_turn_index]

  return (
    <div className="flex-shrink-0 border-b border-white/10 bg-black/20">
      {/* Header */}
      <div className="px-4 py-2.5 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-highlight">
          ⚔ Combat
        </span>
        <span className="text-[10px] text-gray-400 font-mono">Round {encounter.round}</span>
      </div>

      {/* Active combatant callout */}
      {current && (
        <div className="px-4 pb-2">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Active</p>
          <p className="text-sm font-semibold text-white truncate">{current.name}</p>
        </div>
      )}

      {/* Turn order list */}
      <div className="px-3 pb-3 space-y-1 max-h-52 overflow-y-auto custom-scrollbar">
        {encounter.turn_order.map((combatant: Combatant, index: number) => {
          const isActive = index === encounter.current_turn_index
          const isDead = combatant.hp <= 0

          return (
            <div
              key={combatant.id}
              className={`rounded-lg px-3 py-2 border transition-all ${
                isActive
                  ? 'border-amber-main/50 bg-amber-main/10 border-l-2 border-l-amber-main'
                  : isDead
                    ? 'border-white/5 bg-white/5 opacity-40'
                    : 'border-white/8 bg-white/3'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-medium truncate ${
                  isDead ? 'line-through' :
                  combatant.type === 'monster' ? 'text-red-400/80' : 'text-foreground'
                }`}>
                  {combatant.name}
                </span>
                <span className="text-[10px] text-gray-500 font-mono ml-1 flex-shrink-0">
                  {combatant.initiative}
                </span>
              </div>
              <HPBar
                current={combatant.hp}
                max={combatant.max_hp}
                showNumbers={combatant.type === 'player'}
                height="h-1"
              />
              {combatant.conditions.length > 0 && (
                <p className="text-[9px] text-amber-highlight/60 mt-1 truncate">
                  {combatant.conditions.join(', ')}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
