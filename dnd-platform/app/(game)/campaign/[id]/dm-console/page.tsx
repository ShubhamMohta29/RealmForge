'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useGameStore } from '@/store/gameStore'
import type { Character } from '@/types/character'
import type { Message } from '@/types/message'
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

  const { setCampaign, setCharacters, setMessages, addMessage, updateCharacter, characters } = useGameStore()

  const [activePanel, setActivePanel] = useState<Panel>('party')
  const [narrationDraft, setNarrationDraft] = useState('')
  const [campaign, setCampaignLocal] = useState<{ name: string; setting: string; dm_mode: string } | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        console.log('DM Console: Fetching data for campaign:', campaignId)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.warn('DM Console: No authenticated user found')
          router.push('/login')
          setAuthChecked(true)
          return
        }

        const [campaignRes, charactersRes, messagesRes] = await Promise.all([
          supabase.from('campaigns').select('*').eq('id', campaignId).single(),
          supabase.from('characters').select('*').eq('campaign_id', campaignId),
          supabase.from('messages').select('*').eq('campaign_id', campaignId)
            .order('created_at', { ascending: true }).limit(50)
        ])

        if (campaignRes.error) console.error('DM Console: Campaign load error:', campaignRes.error)
        if (charactersRes.error) console.error('DM Console: Characters load error:', charactersRes.error)
        if (messagesRes.error) console.error('DM Console: Messages load error:', messagesRes.error)

        if (campaignRes.data) {
          console.log('DM Console: Campaign loaded:', campaignRes.data.name)
          setCampaign(campaignRes.data)
          setCampaignLocal(campaignRes.data)

          // Redirect if not human DM campaign
          if (campaignRes.data.dm_mode !== 'human' || campaignRes.data.dm_user_id !== user.id) {
            console.warn('DM Console: User is not the DM or mode is not human. Redirecting to play page.')
            router.push(`/campaign/${campaignId}/play`)
            setAuthChecked(true)
            return
          }
        }

        if (charactersRes.data) {
          console.log('DM Console: Characters loaded:', charactersRes.data.length)
          setCharacters(charactersRes.data)
        }
        
        if (messagesRes.data) {
          console.log('DM Console: Messages loaded:', messagesRes.data.length)
          setMessages(messagesRes.data)
        }
        
        setAuthChecked(true)
      } catch (err) {
        console.error('DM Console: Critical error during load:', err)
        setAuthChecked(true)
      }
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
      }, payload => addMessage(payload.new as Message))
      .subscribe()

    const charactersSub = supabase
      .channel(`dm-characters:${campaignId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public',
        table: 'characters', filter: `campaign_id=eq.${campaignId}`
      }, payload => updateCharacter(payload.new.id, payload.new as Partial<Character>))
      .subscribe()

    return () => {
      supabase.removeChannel(messagesSub)
      supabase.removeChannel(charactersSub)
    }
  }, [campaignId, addMessage, updateCharacter])

  const panels: { id: Panel; label: string }[] = [
    { id: 'party',   label: '👥 Party' },
    { id: 'tools',   label: '🎲 Tools' },
    { id: 'copilot', label: '🤖 AI Assist' },
  ]

  if (!authChecked) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex h-screen">

      {/* Left: story log + narration input (what players see) */}
      <div className="flex flex-col flex-1 min-w-0 border-r border-white/10">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 glass">
          <div>
            <p className="font-medium text-white text-sm">
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

        <div className="border-t border-white/10 glass p-4">
          <DMNarrationInput
            campaignId={campaignId}
            characters={characters.map(c => ({ id: c.id, name: c.name }))}
            draft={narrationDraft}
            onDraftChange={setNarrationDraft}
          />
        </div>
      </div>

      {/* Right: DM tools panel */}
      <div className="w-80 flex flex-col glass overflow-hidden">

        {/* Panel tabs */}
        <div className="flex border-b border-white/10">
          {panels.map(panel => (
            <button
              key={panel.id}
              onClick={() => setActivePanel(panel.id)}
              className={`flex-1 text-xs py-3 transition-colors ${
                activePanel === panel.id
                  ? 'text-amber-highlight border-b-2 border-amber-main'
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