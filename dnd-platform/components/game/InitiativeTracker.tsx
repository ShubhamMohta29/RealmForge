'use client'
import { useGameStore } from '@/store/gameStore'
import { HPBar } from '@/components/ui/HPBar'
import type { Combatant } from '@/types/combat'

export function InitiativeTracker() {
  const { encounter } = useGameStore()
  if (!encounter || encounter.status !== 'active') return null

  const current = encounter.turn_order[encounter.current_turn_index]

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-amber-50 dark:bg-amber-950/30 px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wide">
          ⚔️ Combat · Round {encounter.round}
        </span>
        <span className="text-xs text-amber-600 dark:text-amber-500">
          · {current?.name}&apos;s turn
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {encounter.turn_order.map((combatant: Combatant, index: number) => {
          const isActive = index === encounter.current_turn_index
          const isDead = combatant.hp <= 0

          return (
            <div
              key={combatant.id}
              className={`flex-shrink-0 rounded-lg p-2 min-w-[100px] border transition-all ${
                isActive
                  ? 'border-amber-400 bg-amber-100 dark:bg-amber-900/50'
                  : isDead
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-40'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-medium truncate ${
                  combatant.type === 'monster'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {combatant.name}
                </span>
                <span className="text-xs text-gray-400 ml-1">{combatant.initiative}</span>
              </div>
              <HPBar
                current={combatant.hp}
                max={combatant.max_hp}
                showNumbers={combatant.type === 'player'}
                height="h-1.5"
              />
              {combatant.conditions.length > 0 && (
                <p className="text-xs text-gray-400 mt-1 truncate">
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