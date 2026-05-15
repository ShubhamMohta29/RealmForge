import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, getAuthenticatedUser } from '@/lib/supabaseServer'
import { buildCombatants } from '@/lib/combatEngine'
import type { Combatant } from '@/types/combat'
import { parseBody, CombatStartSchema } from '@/lib/validation'

export async function POST(req: NextRequest) {
  try {
    const body = await parseBody(req, CombatStartSchema)
    if (body instanceof NextResponse) return body
    const { campaignId, monsterNames } = body

    const user = await getAuthenticatedUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

    const { data: characters } = await supabaseAdmin
      .from('characters')
      .select('*')
      .eq('campaign_id', campaignId)

    const turnOrder = buildCombatants(characters || [], monsterNames)

    const { data: encounter } = await supabaseAdmin
      .from('combat_encounters')
      .insert({
        campaign_id: campaignId,
        status: 'active',
        round: 1,
        turn_order: turnOrder,
        current_turn_index: 0,
        monsters: monsterNames.map((name: string) => ({ name })),
        loot_table: []
      })
      .select()
      .single()

    await supabaseAdmin.from('messages').insert({
      campaign_id: campaignId,
      type: 'system',
      content: `⚔️ Combat begins! Initiative order: ${turnOrder.map((c: Combatant) => `${c.name} (${c.initiative})`).join(', ')}. Round 1.`
    })

    return NextResponse.json({ encounter })
  } catch (error) {
    console.error('Combat start error:', error)
    return NextResponse.json({ error: 'Failed to start combat' }, { status: 500 })
  }
}