'use client'
import { useState } from 'react'
import { MONSTERS } from '@/lib/dnd5e/monsters'

type Tool = 'monsters' | 'notes' | 'xp'

export interface DMToolboxProps {
  campaignId: string
  characters: { id: string; name: string; xp: number }[]
}

export const DMToolbox = ({ campaignId, characters }: DMToolboxProps) => {
  const [activeTool, setActiveTool] = useState<Tool>('monsters')
  const [monsterSearch, setMonsterSearch] = useState('')
  const [selectedMonster, setSelectedMonster] = useState('')
  const [notes, setNotes] = useState('')
  const [xpAmount, setXpAmount] = useState('')
  const [xpSent, setXpSent] = useState(false)

  const filteredMonsters = Object.keys(MONSTERS).filter(name =>
    name.toLowerCase().includes(monsterSearch.toLowerCase())
  )

  async function awardXP() {
    const amount = parseInt(xpAmount)
    if (!amount || isNaN(amount)) return

    await fetch('/api/dm-console/narrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId,
        content: `⭐ The DM awards ${amount} XP to the party!`
      })
    })

    setXpAmount('')
    setXpSent(true)
    setTimeout(() => setXpSent(false), 2000)
  }

  const tools: { id: Tool; label: string }[] = [
    { id: 'monsters', label: 'Monsters' },
    { id: 'xp',       label: 'XP' },
    { id: 'notes',    label: 'Notes' },
  ]

  return (
    <div>
      <div className="flex gap-1 mb-3">
        {tools.map(tool => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
              activeTool === tool.id
                ? 'border-purple-400 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {tool.label}
          </button>
        ))}
      </div>

      {activeTool === 'monsters' && (
        <div className="space-y-2">
          <input
            value={monsterSearch}
            onChange={e => setMonsterSearch(e.target.value)}
            placeholder="Search monsters..."
            className="w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none"
          />
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {filteredMonsters.map(name => {
              const m = MONSTERS[name]
              return (
                <button
                  key={name}
                  onClick={() => setSelectedMonster(selectedMonster === name ? '' : name)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-900 dark:text-gray-100">{name}</p>
                    <p className="text-xs text-gray-400">CR {m.cr}</p>
                  </div>
                  {selectedMonster === name && (
                    <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                      <p>HP: {m.hp} · AC: {m.ac} · Speed: {m.speed}ft</p>
                      <p>XP: {m.xp}</p>
                      <p>Attacks: {m.attacks.map(a => `${a.name} (+${a.bonus}, ${a.damage})`).join(', ')}</p>
                      {m.special_abilities && (
                        <p>Special: {m.special_abilities.map(a => a.name).join(', ')}</p>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {activeTool === 'xp' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400">Award XP to the entire party</p>
          <div className="flex gap-2">
            <input
              value={xpAmount}
              onChange={e => setXpAmount(e.target.value)}
              placeholder="Amount"
              type="number"
              className="flex-1 text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none"
            />
            <button
              onClick={awardXP}
              disabled={!xpAmount}
              className="px-3 py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
            >
              {xpSent ? '✓' : 'Award'}
            </button>
          </div>
          <div className="space-y-1">
            {[50, 100, 200, 500, 1000].map(amount => (
              <button
                key={amount}
                onClick={() => setXpAmount(String(amount))}
                className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 mr-1"
              >
                +{amount}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTool === 'notes' && (
        <div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Private DM notes — only you can see these..."
            rows={6}
            className="w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">Notes are saved locally only.</p>
        </div>
      )}
    </div>
  )
}