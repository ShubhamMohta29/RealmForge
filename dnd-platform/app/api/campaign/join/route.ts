import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, getAuthenticatedUser } from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json()

    const user = await getAuthenticatedUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: campaign } = await supabaseAdmin
      .from('campaigns')
      .select('id, dm_mode, dm_user_id')
      .eq('invite_code', code.trim().toLowerCase())
      .single()

    if (!campaign) {
      return NextResponse.json({ error: "That code doesn't exist. Check it with your host and try again." }, { status: 404 })
    }

    await supabaseAdmin.from('campaign_members').upsert({
      campaign_id: campaign.id,
      user_id: user.id
    })

    const { data: existingCharacter } = await supabaseAdmin
      .from('characters')
      .select('id')
      .eq('campaign_id', campaign.id)
      .eq('user_id', user.id)
      .maybeSingle()

    return NextResponse.json({
      campaignId: campaign.id,
      dmMode: campaign.dm_mode,
      dmUserId: campaign.dm_user_id,
      hasCharacter: !!existingCharacter
    })
  } catch (error) {
    console.error('Join campaign error:', error)
    return NextResponse.json({ error: 'Failed to join campaign' }, { status: 500 })
  }
}
