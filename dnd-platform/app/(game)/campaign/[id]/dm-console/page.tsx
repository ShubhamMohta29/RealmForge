'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useGameStore } from '@/store/gameStore'
import { StoryLog } from '@/components/game/StoryLog'
import { DMNarrationInput } from '@/components/dm/DMNarrationInput'
import { AICopilot } from '@/components/dm/AICopilot'
import { PartyOverview } from '@/components/dm/PartyOverview'
import { DMToolbox } from '@/components/dm/DMToolbox'

type Panel = 'party' | 'tools' | 'copilot'

export default function DMConsolePage() {
  const params   = useParams()
  const router   = useRouter()
  const campaignId = params.id as string

  const { setCampaign, setCharacters, setMessages, addMessage, updateCharacterHp, characters } = useGameStore()

  const [activePanel, setActivePanel] = useState<Panel>('party')
  const [narrationDraft, setNarrationDraft] = useState('')
  const [campaign, setCampaignLocal] = useState<{ name: string; setting: string; dm_mode: string } | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [campaignRes, charactersRes, messagesRes] = await Promise.all([
        supabase.from('campaigns').select('*').eq('id', campaignId).single(),
        supabase.from('characters').select('*').eq('campaign_id', campaignId),
        supabase.from('messages').select('*').eq('campaign_id', campaignId)
          .order('created_at', { ascending: true }).limit(50)
      ])

      if (campaignRes.data) {
        setCampaign(campaignRes.data)
        setCampaignLocal(campaignRes.data)

        // Redirect if not human DM campaign
        if (campaignRes.data.dm_mode !== 'human' || campaignRes.data.dm_user_id !== user.id) {
          router.push(`/campaign/${campaignId}/play`)
          return
        }
      }

      if (charactersRes.data) setCharacters(charactersRes.data)
      if (messagesRes.data) setMessages(messagesRes.data)
    }

    load()
  }, [campaignId, router, setCampaign, setCharacters, setMessages])

  // Realtime subscriptions
  useEffect(() => {
    const messagesSub = supabase
      .channel(`dm-messages:${campaignId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public',
        table: 'messages', filter: `campaign_id=eq.${campaignId}`
      }, payload => addMessage(payload.new as never))
      .subscribe()

    const charactersSub = supabase
      .channel(`dm-characters:${campaignId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public',
        table: 'characters', filter: `campaign_id=eq.${campaignId}`
      }, payload => updateCharacterHp(payload.new.id, payload.new.hp))
      .subscribe()

    return () => {
      supabase.removeChannel(messagesSub)
      supabase.removeChannel(charactersSub)
    }
  }, [campaignId, addMessage, updateCharacterHp])

  const panels: { id: Panel; label: string }[] = [
    { id: 'party',   label: '👥 Party' },
    { id: 'tools',   label: '🎲 Tools' },
    { id: 'copilot', label: '🤖 AI Assist' },
  ]

  return (
    <div className="flex h-screen bg-transparent">

      {/* Left: story log + narration input (what players see) */}
      <div className="flex flex-col flex-1 min-w-0 border-r border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
              {campaign?.name || 'Campaign'}
            </p>
            <p className="text-xs text-gray-400">DM Console · Players see this log</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            ← Dashboard
          </button>
        </div>

        <StoryLog />

        <div className="border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-4">
          <DMNarrationInput
            campaignId={campaignId}
            characters={characters.map(c => ({ id: c.id, name: c.name }))}
          />
        </div>
      </div>

      {/* Right: DM tools panel */}
      <div className="w-80 flex flex-col bg-white/80 dark:bg-gray-900/80 backdrop-blur-md overflow-hidden">

        {/* Panel tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {panels.map(panel => (
            <button
              key={panel.id}
              onClick={() => setActivePanel(panel.id)}
              className={`flex-1 text-xs py-3 transition-colors ${
                activePanel === panel.id
                  ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              {panel.label}
            </button>
          ))}
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activePanel === 'party' && <PartyOverview />}

          {activePanel === 'tools' && (
            <DMToolbox
              campaignId={campaignId}
              characters={characters.map(c => ({ id: c.id, name: c.name, xp: c.xp }))}
            />
          )}

          {activePanel === 'copilot' && (
            <AICopilot
              campaignId={campaignId}
              onInsert={(text: string) => setNarrationDraft(text)}
            />
          )}
        </div>
      </div>
    </div>
  )
}