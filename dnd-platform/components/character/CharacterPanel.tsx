'use client'
import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { HPBar } from '@/components/ui/HPBar'
import { XPBar } from '@/components/ui/XPBar'
import { ManaBar } from '@/components/ui/ManaBar'
import { Badge } from '@/components/ui/Badge'
import { CharacterSheet } from './CharacterSheet'

export function CharacterPanel() {
  const { myCharacter } = useGameStore()
  const [showSheet, setShowSheet] = useState(false)

  if (!myCharacter) {
    return (
      <div className="w-80 border-l border-white/10 glass p-6 flex flex-col items-center justify-center gap-3 text-center">
        <p className="text-gray-400 text-sm">No character found</p>
        <p className="text-gray-600 text-xs">Create a character to see your stats here.</p>
      </div>
    )
  }

  const conditionColors: Record<string, 'red' | 'amber' | 'gold' | 'gray'> = {
    poisoned: 'red', unconscious: 'red', paralyzed: 'red',
    frightened: 'amber', stunned: 'amber', restrained: 'amber',
    invisible: 'gold', charmed: 'gold',
  }

  return (
    <>
      <div className="w-80 border-l border-white/10 glass p-6 flex flex-col gap-6 overflow-y-auto">

        {/* Character header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-amber-main/20 flex items-center justify-center text-amber-highlight font-bold text-2xl mb-3 shadow-lg border border-amber-main/30">
            {myCharacter.name.charAt(0)}
          </div>
          <h2 className="text-xl font-bold text-white leading-tight">{myCharacter.name}</h2>
          <p className="text-sm text-gray-400 mt-1">
            {myCharacter.race} {myCharacter.class} · Level {myCharacter.level}
          </p>
        </div>

        {/* HP */}
        <div>
          <div className="flex justify-between text-xs font-medium text-gray-400 mb-2">
            <span>Hit Points</span>
            <span className="text-white">{myCharacter.hp}/{myCharacter.max_hp}</span>
          </div>
          <HPBar current={myCharacter.hp} max={myCharacter.max_hp} showNumbers={false} height="h-2.5" />
          {myCharacter.temp_hp > 0 && (
            <p className="text-xs text-blue-400 mt-2 font-medium">+{myCharacter.temp_hp} temp HP</p>
          )}
        </div>

        {/* Mana / Spell Slots */}
        <ManaBar character={myCharacter} />

        {/* Primary Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'AC',    value: myCharacter.ac },
            { label: 'Speed', value: `${myCharacter.speed}ft` },
            { label: 'Prof',  value: `+${myCharacter.proficiency_bonus}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/5 dark:bg-black/40 rounded-xl p-3 text-center border border-white/5">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">{label}</p>
              <p className="font-bold text-white text-base">{value}</p>
            </div>
          ))}
        </div>

        {/* XP */}
        <div>
          <XPBar currentXp={myCharacter.xp} level={myCharacter.level} />
        </div>

        {/* Ability scores */}
        <div>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Ability Scores</p>
          <div className="grid grid-cols-3 gap-2.5">
            {['cha', 'con', 'dex', 'int', 'str', 'wis'].map((ability) => {
              const score = myCharacter.ability_scores[ability as keyof typeof myCharacter.ability_scores] || 10
              const mod = Math.floor((score - 10) / 2)
              return (
                <div key={ability} className="bg-white/5 dark:bg-black/40 rounded-xl p-2.5 text-center border border-white/5 transition-colors hover:border-amber-main/30">
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">{ability}</p>
                  <p className="text-base font-bold text-white">{score}</p>
                  <p className="text-[11px] font-medium text-amber-highlight/70">{mod >= 0 ? '+' : ''}{mod}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Conditions */}
        {myCharacter.conditions.length > 0 && (
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Conditions</p>
            <div className="flex flex-wrap gap-1.5">
              {myCharacter.conditions.map(condition => (
                <Badge
                  key={condition}
                  color={conditionColors[condition] || 'gray'}
                >
                  {condition}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Settings & Full sheet button */}
        <div className="mt-auto pt-6 flex flex-col gap-4 border-t border-white/5">
          <button
            onClick={() => setShowSheet(true)}
            className="text-xs text-amber-highlight hover:text-amber-main transition-colors text-center font-medium"
          >
            View full character sheet →
          </button>
          
        </div>
      </div>

      {showSheet && (
        <CharacterSheet
          character={myCharacter}
          onClose={() => setShowSheet(false)}
        />
      )}
    </>
  )
}