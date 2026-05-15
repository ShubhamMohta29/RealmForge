'use client'
import { useEffect, useCallback, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useGameStore } from '@/store/gameStore'
import { useToastStore } from '@/store/toastStore'
import type { Character } from '@/types/character'
import type { CombatEncounter } from '@/types/combat'
import type { Message } from '@/types/message'

import { StoryLog } from '@/components/game/StoryLog'
import { ActionPanel } from '@/components/game/ActionPanel'
import { CharacterPanel } from '@/components/character/CharacterPanel'
import { InitiativeTracker } from '@/components/game/InitiativeTracker'
import { DiceLog } from '@/components/game/DiceLog'
import { CampaignEndModal } from '@/components/game/CampaignEndModal'
import { ToastContainer } from '@/components/ui/ToastContainer'

const END_CAMPAIGN_RE = /\b(end|finish|conclude|close|archive)\b.{0,20}\bcampaign\b/i

export default function PlayPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dmError, setDmError] = useState<string | null>(null)
  const [showEndModal, setShowEndModal] = useState(false)

  const {
    campaign, setCampaign, setCharacters, setMyCharacter,
    addMessage, setEncounter, updateCharacter,
    setDMThinking, setMessages
  } = useGameStore()

  const { addToast } = useToastStore()

  // ── Initial data load ────────────────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        // Step 1: verify campaign membership using the simple direct-equality
        // RLS policy (auth.uid() = user_id) — same pattern as the dashboard.
        // Retry up to 5× with 500ms gaps to handle the case where the
        // campaign_members INSERT hasn't fully committed yet after character
        // creation.
        let isMember = false
        for (let attempt = 0; attempt < 5; attempt++) {
          if (attempt > 0) await new Promise(r => setTimeout(r, 500))
          const { data: memberRow } = await supabase
            .from('campaign_members')
            .select('campaign_id')
            .eq('campaign_id', campaignId)
            .eq('user_id', user.id)
            .maybeSingle()
          if (memberRow) { isMember = true; break }
        }
        if (!isMember) { router.push('/dashboard'); return }

        // Step 2: now that membership is confirmed, fetch campaign + other data
        // in parallel. The is_campaign_member() RLS function will pass because
        // we just confirmed the row exists and auth.uid() is already set.
        const [campaignRes, charactersRes, messagesRes] = await Promise.all([
          supabase.from('campaigns').select('*').eq('id', campaignId).maybeSingle(),
          supabase.from('characters').select('*').eq('campaign_id', campaignId),
          supabase.from('messages').select('*').eq('campaign_id', campaignId)
            .order('created_at', { ascending: true }).limit(50)
        ])

        if (!campaignRes.data) {
          console.error('Campaign fetch returned null despite confirmed membership', campaignRes)
          router.push('/dashboard')
          return
        }

        setCampaign(campaignRes.data)

        if (charactersRes.data) {
          setCharacters(charactersRes.data)
          const mine = charactersRes.data.find(c => c.user_id === user.id)
          if (mine) setMyCharacter(mine)
        }

        if (messagesRes.data) setMessages(messagesRes.data)
      } catch (err) {
        console.error('Failed to load campaign data:', err)
        setError('Failed to load campaign data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [campaignId, setCampaign, setCharacters, setMyCharacter, setMessages, router])

  // ── Realtime subscriptions ───────────────────────────────────────────────
  useEffect(() => {
    const messagesSub = supabase
      .channel(`messages:${campaignId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `campaign_id=eq.${campaignId}`
      }, payload => {
        const msg = payload.new as Message
        addMessage(msg)

        // Toast for loot events embedded in narration metadata
        if (msg.type === 'narration' && msg.metadata) {
          const events: any[] = (msg.metadata as any).events || []
          events.forEach(e => {
            if (e.type === 'loot' && e.data?.item) {
              addToast({ type: 'loot', title: 'Item Found', message: e.data.item })
            }
            if (e.type === 'new_quest' && e.data?.title) {
              addToast({ type: 'quest', title: 'New Quest', message: e.data.title })
            }
          })
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data } = await supabase.from('messages').select('*')
            .eq('campaign_id', campaignId)
            .order('created_at', { ascending: true }).limit(50)
          if (data) setMessages(data)
        }
      })

    const charactersSub = supabase
      .channel(`characters:${campaignId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'characters',
        filter: `campaign_id=eq.${campaignId}`
      }, payload => {
        const updated = payload.new as Character
        const prev = useGameStore.getState().characters.find(c => c.id === updated.id)

        // XP gain toast
        if (prev && updated.xp > prev.xp) {
          const gained = updated.xp - prev.xp
          addToast({ type: 'xp', title: `+${gained} XP`, message: `${updated.name} · ${updated.xp} total` })
        }

        // Level-up toast
        if (prev && updated.level > prev.level) {
          addToast({ type: 'levelup', title: `Level Up! Level ${updated.level}`, message: `${updated.name} grows stronger` })
        }

        updateCharacter(updated.id, updated)
      })
      .subscribe()

    const combatSub = supabase
      .channel(`combat:${campaignId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'combat_encounters',
        filter: `campaign_id=eq.${campaignId}`
      }, payload => {
        if (payload.eventType === 'DELETE') setEncounter(null)
        else setEncounter(payload.new as CombatEncounter)
      })
      .subscribe()

    const campaignSub = supabase
      .channel(`campaign:${campaignId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'campaigns',
        filter: `id=eq.${campaignId}`
      }, payload => { setCampaign(payload.new as any) })
      .subscribe()

    return () => {
      supabase.removeChannel(messagesSub)
      supabase.removeChannel(charactersSub)
      supabase.removeChannel(combatSub)
      supabase.removeChannel(campaignSub)
    }
  }, [campaignId, addMessage, updateCharacter, setEncounter, setMessages, setCampaign, addToast])

  // ── Action handler ───────────────────────────────────────────────────────
  const handleAction = useCallback(async (action: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (END_CAMPAIGN_RE.test(action)) {
      setShowEndModal(true)
      return
    }

    setDmError(null)
    const { myCharacter, campaign: currentCampaign } = useGameStore.getState()
    const isHumanDM = currentCampaign?.dm_mode === 'human'

    if (!isHumanDM) setDMThinking(true)
    try {
      const response = await fetch('/api/dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, action, characterId: myCharacter?.id })
      })
      const data = await response.json()

      if (!response.ok) {
        setDmError(data.error || "The Dungeon Master's voice fades...")
        return
      }
    } catch {
      setDmError("The Dungeon Master's voice fades... Please try again.")
    } finally {
      if (!isHumanDM) setDMThinking(false)
    }
  }, [campaignId, setDMThinking])

  // ── Loading / error screens ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-main/30 border-t-amber-highlight rounded-full animate-spin mx-auto mb-4" />
          <p className="text-foreground/60 text-sm">Loading campaign...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center glass rounded-2xl p-8">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button onClick={() => router.push('/dashboard')} className="btn-amber px-6 py-2 rounded-lg text-sm font-semibold">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const isArchived = campaign?.status === 'completed'

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="h-screen w-full overflow-hidden flex flex-col">

      {/* Top bar */}
      <div className="h-14 glass border-b border-white/10 flex items-center px-6 gap-4 flex-shrink-0 z-30">
        <div className="flex-1">
          <span className="text-amber-highlight font-semibold italic"
            style={{ fontFamily: '"Ibarra Real Nova", serif' }}>
            {campaign?.name || 'Campaign'}
          </span>
        </div>
        {campaign?.current_scene && (
          <p className="text-xs text-gray-400 hidden md:block max-w-xs truncate text-center flex-1">
            {campaign.current_scene}
          </p>
        )}
        <div className="flex-1 flex justify-end items-center gap-3">
          {isArchived && (
            <span className="text-xs px-2 py-1 rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30">
              Archived
            </span>
          )}
          <button onClick={() => router.push('/dashboard')}
            className="text-xs text-gray-400 hover:text-amber-highlight transition-colors">
            ← Dashboard
          </button>
        </div>
      </div>

      {/* Archived banner */}
      {isArchived && (
        <div className="bg-gray-800/60 border-b border-gray-600/30 px-6 py-2 flex items-center justify-between flex-shrink-0">
          <p className="text-xs text-gray-300">This campaign has been archived. The story log is read-only.</p>
          <button onClick={() => router.push('/dashboard')} className="text-xs text-amber-highlight hover:underline">
            Back to Dashboard
          </button>
        </div>
      )}

      {/* Three-column layout */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left: Dice Log + Initiative Tracker */}
        <div className="w-64 flex-shrink-0 flex flex-col overflow-hidden border-r border-white/10">
          <InitiativeTracker />
          <div className="flex-1 overflow-hidden">
            <DiceLog />
          </div>
        </div>

        {/* Center: Story Log + Action Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <StoryLog />
          </div>
          {!isArchived && (
            <div className="flex-shrink-0">
              <ActionPanel
                onAction={handleAction}
                dmError={dmError}
                onClearError={() => setDmError(null)}
                isHumanDM={campaign?.dm_mode === 'human'}
              />
            </div>
          )}
        </div>

        {/* Right: Character Panel */}
        <CharacterPanel />
      </div>

      {showEndModal && campaign && (
        <CampaignEndModal
          campaignId={campaign.id}
          campaignName={campaign.name}
          onClose={() => setShowEndModal(false)}
        />
      )}

      <ToastContainer />
    </div>
  )
}
