'use client'
import { useState } from 'react'
import type { Character } from '@/types/character'
import { CLASSES } from '@/lib/dnd5e/classes'
import { getSpellDescription } from '@/lib/dnd5e/spells'

const SKILLS = [
  { name: 'Acrobatics',     ability: 'dex' },
  { name: 'Animal Handling',ability: 'wis' },
  { name: 'Arcana',         ability: 'int' },
  { name: 'Athletics',      ability: 'str' },
  { name: 'Deception',      ability: 'cha' },
  { name: 'History',        ability: 'int' },
  { name: 'Insight',        ability: 'wis' },
  { name: 'Intimidation',   ability: 'cha' },
  { name: 'Investigation',  ability: 'int' },
  { name: 'Medicine',       ability: 'wis' },
  { name: 'Nature',         ability: 'int' },
  { name: 'Perception',     ability: 'wis' },
  { name: 'Performance',    ability: 'cha' },
  { name: 'Persuasion',     ability: 'cha' },
  { name: 'Religion',       ability: 'int' },
  { name: 'Sleight of Hand',ability: 'dex' },
  { name: 'Stealth',        ability: 'dex' },
  { name: 'Survival',       ability: 'wis' },
]

const RARITY_STYLES: Record<string, string> = {
  common:    'text-gray-300 border-gray-500/30',
  uncommon:  'text-green-400 border-green-500/30',
  rare:      'text-blue-400 border-blue-500/30',
  very_rare: 'text-purple-400 border-purple-500/30',
  legendary: 'text-amber-highlight border-amber-main/40',
}

const ABILITY_LABELS: Record<string, string> = {
  str: 'Strength', dex: 'Dexterity', con: 'Constitution',
  int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma',
}

function statMod(score: number): string {
  const m = Math.floor((score - 10) / 2)
  return m >= 0 ? `+${m}` : `${m}`
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-white/5 pb-2 mb-3">
      {children}
    </p>
  )
}

interface CharacterSheetProps {
  character: Character
  onClose: () => void
}

export function CharacterSheet({ character, onClose }: CharacterSheetProps) {
  const [tab, setTab] = useState<'core' | 'skills' | 'spells' | 'inventory' | 'features'>('core')
  const tabs = ['core', 'skills', 'spells', 'inventory', 'features'] as const

  const classDef = CLASSES[character.class]
  const isSpellcaster = classDef?.isSpellcaster ?? false
  const spellAbility = classDef?.spellAbility

  const spellModifier = spellAbility
    ? Math.floor((character.ability_scores[spellAbility as keyof typeof character.ability_scores] - 10) / 2) + character.proficiency_bonus
    : null

  const totalSlotMax = Object.values(character.spells.slot_max).reduce((s, v) => s + (v || 0), 0)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="glass rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        style={{ animation: 'modalIn 150ms ease-out' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: '"Ibarra Real Nova", serif' }}>
              {character.name}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {character.race} {character.class}
              {character.subclass ? ` · ${character.subclass}` : ''}
              {' '}· Level {character.level} · {character.xp.toLocaleString()} XP
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-2xl leading-none transition-colors">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 px-6 flex-shrink-0">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors capitalize ${
                tab === t
                  ? 'border-amber-main text-amber-highlight'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">

          {/* ── Core Tab ── */}
          {tab === 'core' && (
            <div className="space-y-6">
              <div>
                <SectionLabel>Ability Scores</SectionLabel>
                <div className="grid grid-cols-6 gap-2">
                  {Object.entries(character.ability_scores).map(([ab, score]) => (
                    <div key={ab} className="bg-white/5 rounded-xl p-3 text-center border border-white/5 hover:border-amber-main/30 transition-colors">
                      <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">{ab}</p>
                      <p className="text-2xl font-bold text-white leading-none">{score}</p>
                      <p className="text-xs text-amber-highlight/70 mt-1">{statMod(score)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel>Combat</SectionLabel>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'HP',         value: `${character.hp}/${character.max_hp}` },
                    { label: 'AC',         value: character.ac },
                    { label: 'Speed',      value: `${character.speed}ft` },
                    { label: 'Initiative', value: statMod(character.ability_scores.dex) },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                      <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">{label}</p>
                      <p className="text-lg font-bold text-white">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel>Saving Throws</SectionLabel>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(character.saving_throws).map(([ab, prof]) => {
                    const base = Math.floor((character.ability_scores[ab as keyof typeof character.ability_scores] - 10) / 2)
                    const total = prof ? base + character.proficiency_bonus : base
                    return (
                      <div key={ab} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/5">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${prof ? 'bg-amber-highlight' : 'bg-white/15'}`} />
                        <span className="text-sm text-gray-300 flex-1">{ABILITY_LABELS[ab] || ab}</span>
                        <span className="text-sm font-semibold text-white">{total >= 0 ? '+' : ''}{total}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {character.conditions.length > 0 && (
                <div>
                  <SectionLabel>Active Conditions</SectionLabel>
                  <div className="flex flex-wrap gap-2">
                    {character.conditions.map(c => (
                      <span key={c} className="text-xs px-2 py-1 rounded-full bg-red-500/15 text-red-300 border border-red-500/30 capitalize">{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Skills Tab ── */}
          {tab === 'skills' && (
            <div className="space-y-0.5">
              {SKILLS.map(({ name, ability }) => {
                const key = name.toLowerCase().replace(/\s+/g, '_')
                const prof = character.skills[key]
                const score = character.ability_scores[ability as keyof typeof character.ability_scores]
                const base = Math.floor((score - 10) / 2)
                const total = prof ? base + character.proficiency_bonus : base
                return (
                  <div key={name} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-white/5 transition-colors">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${prof ? 'bg-amber-highlight' : 'bg-white/15'}`} />
                    <span className="flex-1 text-sm text-gray-300">{name}</span>
                    <span className="text-[10px] text-gray-600 uppercase w-6 text-center">{ability}</span>
                    <span className="font-semibold text-white w-8 text-right text-sm">
                      {total >= 0 ? '+' : ''}{total}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Spells Tab ── */}
          {tab === 'spells' && (
            <div className="space-y-5">
              {!isSpellcaster ? (
                <div className="py-8 text-center">
                  <p className="text-gray-400 text-sm">Your class does not use spells.</p>
                </div>
              ) : totalSlotMax === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-400 text-sm">Spells will appear as you discover or learn them.</p>
                </div>
              ) : (
                <>
                  {/* Spell ability stats */}
                  {spellAbility && spellModifier !== null && (
                    <div>
                      <SectionLabel>Spellcasting</SectionLabel>
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {[
                          { label: 'Ability',      value: spellAbility.toUpperCase() },
                          { label: 'Spell Attack',  value: `+${spellModifier}` },
                          { label: 'Save DC',       value: 8 + spellModifier },
                        ].map(({ label, value }) => (
                          <div key={label} className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                            <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">{label}</p>
                            <p className="text-lg font-bold text-white">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Spell slot grid */}
                  {Object.keys(character.spells.slot_max).length > 0 && (
                    <div>
                      <SectionLabel>Spell Slots</SectionLabel>
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        {Object.entries(character.spells.slot_max)
                          .sort(([a], [b]) => Number(a) - Number(b))
                          .map(([level, maxVal]) => {
                            const cur = character.spells.slots[level] ?? 0
                            const pct = maxVal > 0 ? (cur / maxVal) * 100 : 0
                            return (
                              <div key={level} className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                                <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Level {level}</p>
                                <p className={`text-base font-bold ${cur === 0 ? 'text-gray-600' : 'text-blue-300'}`}>
                                  {cur}/{maxVal}
                                </p>
                                <div className="w-full bg-white/10 rounded-full h-1 mt-2 overflow-hidden">
                                  <div className="h-1 rounded-full bg-blue-400/70 transition-all duration-300"
                                    style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  )}

                  {/* Known spells */}
                  {character.spells.known.length > 0 && (
                    <div>
                      <SectionLabel>Known Spells ({character.spells.known.length})</SectionLabel>
                      <div className="space-y-1">
                        {character.spells.known.map(spell => {
                          const isPrepared = character.spells.prepared.includes(spell)
                          const desc = getSpellDescription(spell)
                          return (
                            <div key={spell}
                              className="py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isPrepared ? 'bg-blue-400' : 'bg-white/15'}`} />
                                <span className="text-sm text-gray-300 flex-1">{spell}</span>
                                {isPrepared && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/25 uppercase font-bold">
                                    Prepared
                                  </span>
                                )}
                              </div>
                              {desc && (
                                <p className="text-xs text-gray-500 mt-0.5 ml-4 leading-snug">{desc}</p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {character.spells.known.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4 italic">No spells known yet.</p>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Inventory Tab ── */}
          {tab === 'inventory' && (
            <div className="space-y-2">
              {character.inventory.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-400 text-sm">Your inventory is empty.</p>
                  <p className="text-gray-600 text-xs mt-1">Items appear as you find them in your adventure.</p>
                </div>
              ) : (
                <>
                  {character.inventory.map((item, i) => {
                    const rarityStyle = RARITY_STYLES[item.rarity ?? 'common'] ?? RARITY_STYLES.common
                    return (
                      <div key={`${item.name}-${i}`}
                        className={`flex items-center justify-between py-2.5 px-4 rounded-xl border bg-white/5 transition-colors hover:bg-white/8 ${rarityStyle}`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white truncate">{item.name}</p>
                            {item.rarity && item.rarity !== 'common' && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase border ${rarityStyle}`}>
                                {item.rarity.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {item.weight > 0 ? `${item.weight} lb · ` : ''}{item.value > 0 ? `${item.value} gp` : ''}
                            {item.description ? ` · ${item.description}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                          {item.equipped && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 border border-green-500/25 uppercase font-bold">
                              Equipped
                            </span>
                          )}
                          {item.attuned && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/25 uppercase font-bold">
                              Attuned
                            </span>
                          )}
                          <span className="text-sm font-semibold text-gray-400">×{item.quantity}</span>
                        </div>
                      </div>
                    )
                  })}
                  <div className="pt-2 border-t border-white/5 text-xs text-gray-500 text-right">
                    {character.inventory.reduce((s, i) => s + i.weight * i.quantity, 0).toFixed(1)} lb total
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Features Tab ── */}
          {tab === 'features' && (
            <div className="space-y-3">
              {character.features.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-400 text-sm">No class features yet.</p>
                </div>
              ) : (
                character.features.map((feature, i) => (
                  <div key={`${feature.name}-${i}`} className="border border-white/8 rounded-xl p-4 bg-white/3">
                    <p className="text-sm font-semibold text-amber-highlight/90 mb-1">{feature.name}</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{feature.description}</p>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
