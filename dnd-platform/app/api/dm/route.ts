import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabaseServer'
import { callClaude } from '@/lib/groq'
import { parseGameEvents } from '@/lib/gameEvents'
import { buildDMSystemPrompt } from '@/lib/systemPrompt'
import { getContextForDM, shouldSummarize, summarizeSession } from '@/lib/worldMemory'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { campaignId, action, characterId } = body

    if (!campaignId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Auth check
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => req.cookies.getAll(),
          setAll: () => {}
        }
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a member of this campaign
    const { data: membership } = await supabaseAdmin
      .from('campaign_members')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this campaign' }, { status: 403 })
    }

    // Fetch all context
    const [
      { data: campaign },
      { data: characters },
      { data: npcs },
      { data: quests },
      dmContext
    ] = await Promise.all([
      supabaseAdmin.from('campaigns').select('*').eq('id', campaignId).single(),
      supabaseAdmin.from('characters').select('*').eq('campaign_id', campaignId),
      supabaseAdmin.from('npcs').select('*').eq('campaign_id', campaignId),
      supabaseAdmin.from('quests').select('*').eq('campaign_id', campaignId),
      getContextForDM(campaignId)
    ])

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Build system prompt
    const systemPrompt = buildDMSystemPrompt({
      campaign,
      characters: characters || [],
      npcs: npcs || [],
      quests: quests || [],
      memorySummary: dmContext.latestSummary
    })

    // Build message history from recent messages
    const messageHistory = dmContext.recentMessages.map(m => ({
      role: (m.type === 'player_action' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content
    }))

    // Add current player action
    messageHistory.push({ role: 'user', content: action })

    // Call Claude
    const response = await callClaude({
      system: systemPrompt,
      messages: messageHistory,
      maxTokens: 1000
    })

    // Parse game events from response
    const { narration, events, rollRequests } = parseGameEvents(response.content)

    // Save player action to messages
    await supabaseAdmin.from('messages').insert({
      campaign_id: campaignId,
      character_id: characterId || null,
      type: 'player_action',
      content: action
    })

    // Save DM narration to messages
    const { data: savedMessage } = await supabaseAdmin
      .from('messages')
      .insert({
        campaign_id: campaignId,
        character_id: null,
        type: 'narration',
        content: narration,
        metadata: { events, rollRequests }
      })
      .select()
      .single()

    // Apply game events
    await applyEvents(events, campaignId, characters || [])

    // Update scene if scene_update event present
    const sceneUpdate = events.find(e => e.type === 'scene_update')
    if (sceneUpdate?.data.description) {
      await supabaseAdmin
        .from('campaigns')
        .update({ current_scene: sceneUpdate.data.description })
        .eq('id', campaignId)
    }

    // Trigger background summarization if needed
    const needsSummary = await shouldSummarize(campaignId)
    if (needsSummary) {
      summarizeSession(campaignId, dmContext.recentMessages).catch(console.error)
    }

    return NextResponse.json({
      narration,
      events,
      rollRequests,
      messageId: savedMessage?.id
    })

  } catch (error) {
    console.error('DM API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function applyEvents(
  events: { type: string; data: Record<string, string> }[],
  campaignId: string,
  characters: { id: string; name: string; hp: number; max_hp: number; xp: number }[]
) {
  for (const event of events) {
    try {
      if (event.type === 'damage') {
        const target = characters.find(
          c => c.name.toLowerCase() === event.data.target?.toLowerCase()
        )
        if (target) {
          const newHp = Math.max(0, target.hp - parseInt(event.data.amount || '0'))
          await supabaseAdmin
            .from('characters')
            .update({ hp: newHp })
            .eq('id', target.id)
        }
      }

      if (event.type === 'heal') {
        const target = characters.find(
          c => c.name.toLowerCase() === event.data.target?.toLowerCase()
        )
        if (target) {
          const newHp = Math.min(target.max_hp, target.hp + parseInt(event.data.amount || '0'))
          await supabaseAdmin
            .from('characters')
            .update({ hp: newHp })
            .eq('id', target.id)
        }
      }

      if (event.type === 'xp') {
        const amount = parseInt(event.data.amount || '0')
        for (const character of characters) {
          await supabaseAdmin
            .from('characters')
            .update({ xp: character.xp + amount })
            .eq('id', character.id)
        }
      }

      if (event.type === 'new_npc') {
        await supabaseAdmin.from('npcs').insert({
          campaign_id: campaignId,
          name: event.data.name,
          description: event.data.description,
          disposition: event.data.disposition || 'unknown'
        })
      }

      if (event.type === 'new_quest') {
        await supabaseAdmin.from('quests').insert({
          campaign_id: campaignId,
          title: event.data.title,
          description: event.data.description,
          xp_reward: parseInt(event.data.xp_reward || '0'),
          status: 'active',
          objectives: []
        })
      }

    } catch (err) {
      console.error(`Failed to apply event ${event.type}:`, err)
    }
  }
}