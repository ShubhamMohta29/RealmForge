import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, getAuthenticatedUser } from '@/lib/supabaseServer'
import { parseBody, CampaignCreateSchema } from '@/lib/validation'

export async function POST(req: NextRequest) {
  try {
    const body = await parseBody(req, CampaignCreateSchema)
    if (body instanceof NextResponse) return body
    const { name, setting, dmMode } = body

    const user = await getAuthenticatedUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: campaign, error } = await supabaseAdmin
      .from('campaigns')
      .insert({
        name,
        setting,
        dm_mode: dmMode,
        dm_user_id: dmMode === 'human' ? user.id : null,
        current_scene: 'The adventure begins...',
        world_state: {}
      })
      .select()
      .single()

    if (error) {
      console.error('Campaign insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { error: memberError } = await supabaseAdmin.from('campaign_members').insert({
      campaign_id: campaign.id,
      user_id: user.id
    })

    if (memberError) {
      console.error('campaign_members INSERT failed:', memberError)
    }

    return NextResponse.json({ campaign })
  } catch (error) {
    console.error('Create campaign error:', error)
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }
}