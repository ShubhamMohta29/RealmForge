'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CLASSES } from '@/lib/dnd5e/classes'
import { RACES } from '@/lib/dnd5e/races'
import { calculateMaxHp, getSpellSlots } from '@/lib/dnd5e/leveling'
import { getProficiencyBonus, getModifier } from '@/lib/dnd5e/abilities'

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8]
const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const

export default function CreateCharacterPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string

  const [step, setStep]           = useState(1)
  const [name, setName]           = useState('')
  const [race, setRace]           = useState('')
  const [cls, setCls]             = useState('')
  const [scores, setScores]       = useState<Record<string, number>>({})
  const [assignments, setAssignments] = useState<Record<string, number>>({})
  const [loading, setLoading]     = useState(false)

  // Step 1: race & class
  // Step 2: ability scores
  // Step 3: name & confirm

  function assignScore(ability: string, value: number) {
    // Remove this value from any other ability first
    const newAssignments = { ...assignments }
    Object.keys(newAssignments).forEach(key => {
      if (newAssignments[key] === value) delete newAssignments[key]
    })
    newAssignments[ability] = value
    setAssignments(newAssignments)
  }

  function getFinalScore(ability: string): number {
    const base = assignments[ability] || 8
    const racial = RACES[race]?.abilityBonuses[ability] || 0
    return base + racial
  }

  const allAssigned = ABILITIES.every(a => assignments[a] !== undefined)

  async function handleCreate() {
    if (!name.trim() || !race || !cls || !allAssigned) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const abilityScores = Object.fromEntries(
      ABILITIES.map(a => [a, getFinalScore(a)])
    ) as Record<string, number>

    const maxHp = calculateMaxHp(cls, 1, abilityScores.con)
    const dexMod = getModifier(abilityScores.dex)
    const profBonus = getProficiencyBonus(1)
    const classDef = CLASSES[cls]
    const spellSlots = getSpellSlots(cls, 1)

    const { error } = await supabase.from('characters').insert({
      campaign_id: campaignId,
      user_id: user.id,
      name: name.trim(),
      race,
      class: cls,
      level: 1,
      xp: 0,
      hp: maxHp,
      max_hp: maxHp,
      temp_hp: 0,
      ac: 10 + dexMod,
      speed: RACES[race]?.speed || 30,
      initiative_bonus: dexMod,
      proficiency_bonus: profBonus,
      ability_scores: abilityScores,
      saving_throws: Object.fromEntries(
        ABILITIES.map(a => [a, classDef?.savingThrows.includes(a) || false])
      ),
      skills: {},
      death_saves: { successes: 0, failures: 0 },
      conditions: [],
      inventory: [],
      spells: {
        known: [],
        prepared: [],
        slots: spellSlots,
        slot_max: spellSlots
      },
      features: (classDef?.features[1] || []).map((f: string) => ({
        name: f,
        description: `${f} — a class feature of the ${cls}.`
      })),
      backstory: '',
      notes: ''
    })

    if (error) {
      alert('Failed to create character: ' + error.message)
      setLoading(false)
      return
    }

    router.push(`/campaign/${campaignId}/play`)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-8">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 w-full max-w-2xl">

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 h-1.5 rounded-full ${
              s <= step ? 'bg-purple-500' : 'bg-gray-200 dark:bg-gray-700'
            }`} />
          ))}
        </div>

        {/* Step 1: Race & Class */}
        {step === 1 && (
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Choose your race & class
            </h1>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Race</label>
              <div className="grid grid-cols-4 gap-2">
                {Object.keys(RACES).map(r => (
                  <button
                    key={r}
                    onClick={() => setRace(r)}
                    className={`p-3 rounded-xl border text-sm transition-all ${
                      race === r
                        ? 'border-purple-400 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {race && (
                <p className="text-xs text-gray-400 mt-2">
                  Bonuses: {Object.entries(RACES[race].abilityBonuses)
                    .map(([a, v]) => `+${v} ${a.toUpperCase()}`).join(', ')} ·
                  Speed: {RACES[race].speed}ft ·
                  Traits: {RACES[race].traits.slice(0, 3).join(', ')}
                </p>
              )}
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Class</label>
              <div className="grid grid-cols-4 gap-2">
                {Object.keys(CLASSES).map(c => (
                  <button
                    key={c}
                    onClick={() => setCls(c)}
                    className={`p-3 rounded-xl border text-sm transition-all ${
                      cls === c
                        ? 'border-purple-400 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              {cls && (
                <p className="text-xs text-gray-400 mt-2">
                  Hit die: d{CLASSES[cls].hitDie} ·
                  Saves: {CLASSES[cls].savingThrows.join(', ').toUpperCase()} ·
                  {CLASSES[cls].isSpellcaster ? ' Spellcaster' : ' Non-spellcaster'}
                </p>
              )}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!race || !cls}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-xl py-3 transition-colors"
            >
              Next →
            </button>
          </div>
        )}

        {/* Step 2: Ability scores */}
        {step === 2 && (
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Assign ability scores
            </h1>
            <p className="text-sm text-gray-400 mb-6">
              Standard array: {STANDARD_ARRAY.join(', ')} — click a score then click an ability to assign it.
            </p>

            {/* Score buttons */}
            <div className="flex gap-2 flex-wrap mb-6">
              {STANDARD_ARRAY.map(score => {
                const used = Object.values(assignments).includes(score)
                return (
                  <button
                    key={score}
                    onClick={() => setScores(prev => ({ ...prev, selected: score }))}
                    className={`w-12 h-12 rounded-xl border font-bold text-lg transition-all ${
                      used
                        ? 'border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-default'
                        : (scores as Record<string, number>).selected === score
                          ? 'border-purple-400 bg-purple-50 dark:bg-purple-950 text-purple-700'
                          : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-purple-300'
                    }`}
                  >
                    {score}
                  </button>
                )
              })}
            </div>

            {/* Ability assignment */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {ABILITIES.map(ability => {
                const assigned = assignments[ability]
                const racial = RACES[race]?.abilityBonuses[ability] || 0
                const final = (assigned || 0) + racial
                const selected = (scores as Record<string, number>).selected

                return (
                  <button
                    key={ability}
                    onClick={() => {
                      if (selected) assignScore(ability, selected)
                    }}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      assigned
                        ? 'border-purple-400 bg-purple-50 dark:bg-purple-950'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                    }`}
                  >
                    <p className="text-xs text-gray-400 uppercase font-medium">{ability}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 my-1">
                      {assigned ? final : '—'}
                    </p>
                    {assigned && racial > 0 && (
                      <p className="text-xs text-purple-500">
                        {assigned} +{racial} racial
                      </p>
                    )}
                    {assigned && racial === 0 && (
                      <p className="text-xs text-gray-400">{assigned} base</p>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!allAssigned}
                className="flex-2 flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-xl py-3 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Name & confirm */}
        {step === 3 && (
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Name your character
            </h1>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Character name
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Aelindra Swiftbow"
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-400"
                autoFocus
              />
            </div>

            {/* Summary */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-8">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                {name || 'Your character'} — {race} {cls}, Level 1
              </p>
              <div className="grid grid-cols-6 gap-2">
                {ABILITIES.map(ability => (
                  <div key={ability} className="text-center">
                    <p className="text-xs text-gray-400 uppercase">{ability}</p>
                    <p className="font-bold text-gray-900 dark:text-gray-100">{getFinalScore(ability)}</p>
                    <p className="text-xs text-gray-500">
                      {getModifier(getFinalScore(ability)) >= 0 ? '+' : ''}
                      {getModifier(getFinalScore(ability))}
                    </p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <p className="text-xs text-gray-400">HP</p>
                  <p className="font-bold text-gray-900 dark:text-gray-100">
                    {calculateMaxHp(cls, 1, getFinalScore('con'))}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">AC</p>
                  <p className="font-bold text-gray-900 dark:text-gray-100">
                    {10 + getModifier(getFinalScore('dex'))}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Speed</p>
                  <p className="font-bold text-gray-900 dark:text-gray-100">
                    {RACES[race]?.speed || 30}ft
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleCreate}
                disabled={!name.trim() || loading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-xl py-3 transition-colors"
              >
                {loading ? 'Creating...' : 'Begin adventure'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}