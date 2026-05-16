import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, getAuthenticatedUser } from '@/lib/supabaseServer'
import { parseBody, CampaignArchiveSchema } from '@/lib/validation'

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await parseBody(req, CampaignArchiveSchema)
    if (body instanceof NextResponse) return body
    const { campaignId } = body

    // Only the DM or campaign creator can archive
    const { data: campaign } = await supabaseAdmin
      .from('campaigns')
      .select('id, dm_user_id, dm_mode')
      .eq('id', campaignId)
      .single()

    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

    // For AI-DM campaigns, any member can archive; for human-DM, only the DM
    if (campaign.dm_mode === 'human' && campaign.dm_user_id !== user.id) {
      const { data: membership } = await supabaseAdmin
        .from('campaign_members')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('user_id', user.id)
        .single()

      if (!membership) return NextResponse.json({ error: 'Not a member' }, { status: 403 })
    } else {
      const { data: membership } = await supabaseAdmin
        .from('campaign_members')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('user_id', user.id)
        .single()

      if (!membership) return NextResponse.json({ error: 'Not a member' }, { status: 403 })
    }

    await supabaseAdmin
      .from('campaigns')
      .update({ status: 'completed' })
      .eq('id', campaignId)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Archive error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
