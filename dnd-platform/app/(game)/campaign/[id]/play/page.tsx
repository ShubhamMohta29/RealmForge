'use client'
import { useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useGameStore } from '@/store/gameStore'
import { StoryLog } from '@/components/game/StoryLog'
import { ActionPanel } from '@/components/game/ActionPanel'
import { CharacterPanel } from '@/components/character/CharacterPanel'
import { InitiativeTracker } from '@/components/game/InitiativeTracker'
import { DiceRollModal } from '@/components/game/DiceRollModal'

export default function PlayPage() {
  const params = useParams()
  const campaignId = params.id as string

  const {
    setCampaign, setCharacters, setMyCharacter,
    setMessages, addMessage, setEncounter,
    updateCharacterHp, setDMThinking, setPendingRollRequest
  } = useGameStore()

  // Load initial data
  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [campaignRes, charactersRes, messagesRes] = await Promise.all([
        supabase.from('campaigns').select('*').eq('id', campaignId).single(),
        supabase.from('characters').select('*').eq('campaign_id', campaignId),
        supabase.from('messages').select('*').eq('campaign_id', campaignId)
          .order('created_at', { ascending: true }).limit(50)
      ])

      if (campaignRes.data) setCampaign(campaignRes.data)
      if (charactersRes.data) {
        setCharacters(charactersRes.data)
        const mine = charactersRes.data.find(c => c.user_id === user.id)
        if (mine) setMyCharacter(mine)
      }
      if (messagesRes.data) setMessages(messagesRes.data)
    }

    loadData()
  }, [campaignId, setCampaign, setCharacters, setMyCharacter, setMessages])

  // Realtime subscriptions
  useEffect(() => {
    const messagesSub = supabase
      .channel(`messages:${campaignId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `campaign_id=eq.${campaignId}`
      }, payload => {
        addMessage(payload.new as never)
      })
      .subscribe()

    const charactersSub = supabase
      .channel(`characters:${campaignId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'characters',
        filter: `campaign_id=eq.${campaignId}`
      }, payload => {
        updateCharacterHp(payload.new.id, payload.new.hp)
      })
      .subscribe()

    const combatSub = supabase
      .channel(`combat:${campaignId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'combat_encounters',
        filter: `campaign_id=eq.${campaignId}`
      }, payload => {
        setEncounter(payload.new as never)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(messagesSub)
      supabase.removeChannel(charactersSub)
      supabase.removeChannel(combatSub)
    }
  }, [campaignId, addMessage, updateCharacterHp, setEncounter])

  const handleAction = useCallback(async (action: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { myCharacter } = useGameStore.getState()

    setDMThinking(true)
    try {
      const response = await fetch('/api/dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          action,
          characterId: myCharacter?.id
        })
      })

      const data = await response.json()

      if (data.rollRequests?.length > 0) {
        setPendingRollRequest(data.rollRequests[0])
      }
    } catch (error) {
      console.error('Action failed:', error)
    } finally {
      setDMThinking(false)
    }
  }, [campaignId, setDMThinking, setPendingRollRequest])

  async function handleRollComplete(result: number, success: boolean) {
    await handleAction(
      `I rolled a ${result} — ${success ? 'success' : 'failure'}.`
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950">
      <InitiativeTracker />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col flex-1 overflow-hidden">
          <StoryLog />
          <ActionPanel onAction={handleAction} />
        </div>
        <CharacterPanel />
      </div>
      <DiceRollModal onRollComplete={handleRollComplete} />
    </div>
  )
}