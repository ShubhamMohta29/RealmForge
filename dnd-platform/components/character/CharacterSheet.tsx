'use client'
import { useState } from 'react'
import type { Character } from '@/types/character'
import { Button } from '@/components/ui/Button'

const SKILLS = [
  { name: 'Acrobatics', ability: 'dex' },
  { name: 'Animal Handling', ability: 'wis' },
  { name: 'Arcana', ability: 'int' },
  { name: 'Athletics', ability: 'str' },
  { name: 'Deception', ability: 'cha' },
  { name: 'History', ability: 'int' },
  { name: 'Insight', ability: 'wis' },
  { name: 'Intimidation', ability: 'cha' },
  { name: 'Investigation', ability: 'int' },
  { name: 'Medicine', ability: 'wis' },
  { name: 'Nature', ability: 'int' },
  { name: 'Perception', ability: 'wis' },
  { name: 'Performance', ability: 'cha' },
  { name: 'Persuasion', ability: 'cha' },
  { name: 'Religion', ability: 'int' },
  { name: 'Sleight of Hand', ability: 'dex' },
  { name: 'Stealth', ability: 'dex' },
  { name: 'Survival', ability: 'wis' },
]

function mod(score: number) {
  const m = Math.floor((score - 10) / 2)
  return m >= 0 ? `+${m}` : `${m}`
}

interface CharacterSheetProps {
  character: Character
  onClose: () => void
}

export function CharacterSheet({ character, onClose }: CharacterSheetProps) {
  const [tab, setTab] = useState<'core' | 'skills' | 'spells' | 'inventory' | 'features'>('core')

  const tabs = ['core', 'skills', 'spells', 'inventory', 'features'] as const

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {character.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {character.race} {character.class} · Level {character.level} · {character.xp} XP
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm capitalize border-b-2 transition-colors ${
                tab === t
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {tab === 'core' && (
            <div className="space-y-6">
              {/* Ability scores */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">Ability Scores</h3>
                <div className="grid grid-cols-6 gap-3">
                  {Object.entries(character.ability_scores).map(([ability, score]) => (
                    <div key={ability} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-400 uppercase font-medium">{ability}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 my-1">{score}</p>
                      <p className="text-sm text-gray-500">{mod(score)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Combat stats */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">Combat</h3>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'HP', value: `${character.hp}/${character.max_hp}` },
                    { label: 'AC', value: character.ac },
                    { label: 'Speed', value: `${character.speed}ft` },
                    { label: 'Initiative', value: mod(character.ability_scores.dex) },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-400 uppercase font-medium">{label}</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Saving throws */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">Saving Throws</h3>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(character.saving_throws).map(([ability, proficient]) => {
                    const base = Math.floor((character.ability_scores[ability as keyof typeof character.ability_scores] - 10) / 2)
                    const total = proficient ? base + character.proficiency_bonus : base
                    return (
                      <div key={ability} className="flex items-center gap-2 text-sm">
                        <span className={`w-2 h-2 rounded-full ${proficient ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                        <span className="text-gray-600 dark:text-gray-400 capitalize flex-1">{ability}</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{total >= 0 ? '+' : ''}{total}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'skills' && (
            <div className="space-y-1">
              {SKILLS.map(({ name, ability }) => {
                const key = name.toLowerCase().replace(/\s+/g, '_')
                const proficient = character.skills[key]
                const abilityScore = character.ability_scores[ability as keyof typeof character.ability_scores]
                const base = Math.floor((abilityScore - 10) / 2)
                const total = proficient ? base + character.proficiency_bonus : base
                return (
                  <div key={name} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${proficient ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                    <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{name}</span>
                    <span className="text-xs text-gray-400 uppercase">{ability}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-8 text-right">
                      {total >= 0 ? '+' : ''}{total}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {tab === 'spells' && (
            <div>
              {character.spells.known.length === 0 ? (
                <p className="text-sm text-gray-400 text-center mt-8">No spells known.</p>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {Object.entries(character.spells.slot_max).map(([level, max]) => (
                      <div key={level} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-400">Level {level}</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {character.spells.slots[level] || 0}/{max}
                        </p>
                      </div>
                    ))}
                  </div>
                  {character.spells.known.map(spell => (
                    <div key={spell} className="text-sm text-gray-700 dark:text-gray-300 py-1 border-b border-gray-100 dark:border-gray-800">
                      {spell}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'inventory' && (
            <div className="space-y-2">
              {character.inventory.length === 0 ? (
                <p className="text-sm text-gray-400 text-center mt-8">No items.</p>
              ) : (
                character.inventory.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.weight}lb · {item.value}gp</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.equipped && <span className="text-xs text-green-600 dark:text-green-400">Equipped</span>}
                      <span className="text-sm text-gray-500">×{item.quantity}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'features' && (
            <div className="space-y-3">
              {character.features.length === 0 ? (
                <p className="text-sm text-gray-400 text-center mt-8">No features.</p>
              ) : (
                character.features.map((feature, i) => (
                  <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">{feature.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{feature.description}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}