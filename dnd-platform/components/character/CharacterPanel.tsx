'use client'
import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { HPBar } from '@/components/ui/HPBar'
import { Badge } from '@/components/ui/Badge'
import { CharacterSheet } from './CharacterSheet'

export function CharacterPanel() {
  const { myCharacter } = useGameStore()
  const [showSheet, setShowSheet] = useState(false)

  if (!myCharacter) return null

  const conditionColors: Record<string, 'red' | 'amber' | 'purple' | 'gray'> = {
    poisoned: 'red', unconscious: 'red', paralyzed: 'red',
    frightened: 'amber', stunned: 'amber', restrained: 'amber',
    invisible: 'purple', charmed: 'purple',
  }

  return (
    <>
      <div className="w-64 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 flex flex-col gap-4 overflow-y-auto">

        {/* Character header */}
        <div>
          <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-700 dark:text-purple-300 font-bold text-lg mb-2">
            {myCharacter.name.charAt(0)}
          </div>
          <p className="font-medium text-gray-900 dark:text-gray-100">{myCharacter.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {myCharacter.race} {myCharacter.class} · Level {myCharacter.level}
          </p>
        </div>

        {/* HP */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Hit Points</span>
            <span>{myCharacter.hp}/{myCharacter.max_hp}</span>
          </div>
          <HPBar current={myCharacter.hp} max={myCharacter.max_hp} showNumbers={false} height="h-3" />
          {myCharacter.temp_hp > 0 && (
            <p className="text-xs text-blue-500 mt-1">+{myCharacter.temp_hp} temp HP</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'AC',    value: myCharacter.ac },
            { label: 'Speed', value: `${myCharacter.speed}ft` },
            { label: 'Prof',  value: `+${myCharacter.proficiency_bonus}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{value}</p>
            </div>
          ))}
        </div>

        {/* XP */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>XP</span>
            <span>{myCharacter.xp}</span>
          </div>
        </div>

        {/* Conditions */}
        {myCharacter.conditions.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Conditions</p>
            <div className="flex flex-wrap gap-1">
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

        {/* Ability scores */}
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Ability Scores</p>
          <div className="grid grid-cols-3 gap-1.5">
            {Object.entries(myCharacter.ability_scores).map(([ability, score]) => {
              const mod = Math.floor((score - 10) / 2)
              return (
                <div key={ability} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-1.5 text-center">
                  <p className="text-xs text-gray-400 uppercase">{ability}</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{score}</p>
                  <p className="text-xs text-gray-500">{mod >= 0 ? '+' : ''}{mod}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Full sheet button */}
        <button
          onClick={() => setShowSheet(true)}
          className="text-xs text-purple-600 dark:text-purple-400 hover:underline text-left"
        >
          View full character sheet →
        </button>
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