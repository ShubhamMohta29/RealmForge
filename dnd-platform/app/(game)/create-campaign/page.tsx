'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const SETTINGS = [
  { value: 'classic high fantasy',    label: 'Classic High Fantasy',    emoji: '🏰' },
  { value: 'dark gothic horror',      label: 'Dark Gothic Horror',      emoji: '🦇' },
  { value: 'nautical pirate adventure', label: 'Pirate Adventure',      emoji: '🏴‍☠️' },
  { value: 'ancient egyptian mystery', label: 'Ancient Mystery',        emoji: '🏺' },
  { value: 'post-apocalyptic wasteland', label: 'Post-Apocalyptic',     emoji: '☢️' },
  { value: 'urban intrigue and politics', label: 'Urban Intrigue',      emoji: '🗡️' },
]

export default function CreateCampaignPage() {
  const [name, setName]       = useState('')
  const [setting, setSetting] = useState('classic high fantasy')
  const [dmMode, setDmMode]   = useState<'ai' | 'human'>('ai')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCreate() {
  if (!name.trim()) return
  setLoading(true)

  const response = await fetch('/api/campaign/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: name.trim(),
      setting,
      dmMode
    })
  })

  const data = await response.json()

  if (!response.ok || !data.campaign) {
    alert('Failed to create campaign: ' + (data.error || 'Unknown error'))
    setLoading(false)
    return
  }

  router.push(dmMode === 'human'
    ? `/campaign/${data.campaign.id}/dm-console`
    : `/campaign/${data.campaign.id}/create-character`)
}

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="glass rounded-2xl p-8 w-full max-w-lg">

        <button
          onClick={() => router.push('/dashboard')}
          className="text-sm text-gray-400 hover:text-gray-600 mb-6 block"
        >
          ← Back
        </button>

        <h1 className="text-2xl font-bold text-white mb-6">
          New campaign
        </h1>

        {/* Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Campaign name
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="The Lost Mines of Phandelver"
            className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 dark:bg-black/20 text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-highlight"
          />
        </div>

        {/* Setting */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Setting & tone
          </label>
          <div className="grid grid-cols-2 gap-2">
            {SETTINGS.map(s => (
              <button
                key={s.value}
                onClick={() => setSetting(s.value)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-left transition-all ${
                  setting === s.value
                    ? 'border-amber-highlight bg-amber-main/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <span>{s.emoji}</span>
                <span className="text-sm text-gray-300">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* DM mode */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Dungeon Master
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setDmMode('ai')}
              className={`p-4 rounded-xl border text-left transition-all ${
                dmMode === 'ai'
                  ? 'border-amber-highlight bg-amber-main/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <p className="font-medium text-white text-sm">AI Dungeon Master</p>
              <p className="text-xs text-gray-400 mt-1">AI runs the world autonomously</p>
            </button>
            <button
              onClick={() => setDmMode('human')}
              className={`p-4 rounded-xl border text-left transition-all ${
                dmMode === 'human'
                  ? 'border-amber-highlight bg-amber-main/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <p className="font-medium text-white text-sm">Human DM</p>
              <p className="text-xs text-gray-400 mt-1">You run the game with AI assist</p>
            </button>
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={!name.trim() || loading}
          className="w-full btn-amber disabled:opacity-50 font-medium rounded-xl py-3 transition-colors"
        >
          {loading ? 'Creating...' : 'Create campaign'}
        </button>
      </div>
    </div>
  )
}