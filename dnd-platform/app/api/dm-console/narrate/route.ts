import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, getAuthenticatedUser } from '@/lib/supabaseServer'
import { applyEvents } from '@/lib/gameEventApplier'
import { parseGameEvents } from '@/lib/gameEvents'
import { parseBody, DMConsoleNarrateSchema } from '@/lib/validation'

export async function POST(req: NextRequest) {
  try {
    const body = await parseBody(req, DMConsoleNarrateSchema)
    if (body instanceof NextResponse) return body
    const { campaignId, content, targetCharacterId } = body

    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: campaign } = await supabaseAdmin
      .from('campaigns')
      .select('id, dm_user_id, dm_mode')
      .eq('id', campaignId)
      .single()

    if (!campaign || campaign.dm_user_id !== user.id || campaign.dm_mode !== 'human') {
      return NextResponse.json({ error: 'Forbidden: not the human DM of this campaign' }, { status: 403 })
    }

    const { narration, events, rollRequests } = parseGameEvents(content)

    const metadata: Record<string, unknown> = { events, rollRequests }
    if (targetCharacterId) {
      metadata.targetCharacterId = targetCharacterId
    }

    const { data: savedMessage } = await supabaseAdmin
      .from('messages')
      .insert({
        campaign_id: campaignId,
        character_id: targetCharacterId || null,
        type: 'narration',
        content: narration,
        metadata
      })
      .select()
      .single()

    if (!savedMessage) {
      return NextResponse.json({ error: 'Failed to save narration' }, { status: 500 })
    }

    const { data: characters } = await supabaseAdmin
      .from('characters')
      .select('id, name, class, level, hp, max_hp, temp_hp, xp, ability_scores, proficiency_bonus, conditions, inventory')
      .eq('campaign_id', campaignId)

    await applyEvents(events, campaignId, characters || [])

    return NextResponse.json({
      message: savedMessage,
      events,
      rollRequests
    })

  } catch (error) {
    console.error('DM narrate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

