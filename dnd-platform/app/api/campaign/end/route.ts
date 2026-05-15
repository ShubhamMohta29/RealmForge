import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, getAuthenticatedUser } from '@/lib/supabaseServer'
import { callGroq } from '@/lib/groq'
import { parseBody, CampaignEndSchema } from '@/lib/validation'

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await parseBody(req, CampaignEndSchema)
    if (body instanceof NextResponse) return body
    const { campaignId } = body

    const { data: membership } = await supabaseAdmin
      .from('campaign_members')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (!membership) return NextResponse.json({ error: 'Not a member' }, { status: 403 })

    const [
      { data: campaign },
      { data: characters },
      { data: messages },
      { data: summaries },
      { data: quests }
    ] = await Promise.all([
      supabaseAdmin.from('campaigns').select('*').eq('id', campaignId).single(),
      supabaseAdmin.from('characters').select('name, class, race, level, xp').eq('campaign_id', campaignId),
      supabaseAdmin.from('messages').select('content, type').eq('campaign_id', campaignId)
        .eq('type', 'narration').order('created_at', { ascending: false }).limit(10),
      supabaseAdmin.from('world_memory_summaries').select('content').eq('campaign_id', campaignId)
        .order('created_at', { ascending: false }).limit(3),
      supabaseAdmin.from('quests').select('title, status').eq('campaign_id', campaignId)
    ])

    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

    const partyDesc = (characters || [])
      .map(c => `${c.name} (Level ${c.level} ${c.race} ${c.class})`)
      .join(', ')

    const questSummary = (quests || [])
      .map(q => `${q.title} [${q.status}]`)
      .join(', ') || 'none'

    const recentNarration = (messages || [])
      .map(m => m.content)
      .reverse()
      .join('\n\n')

    const memoryContext = (summaries || [])
      .map(s => s.content)
      .join('\n\n')

    const systemPrompt = `You are a masterful storyteller. You are writing the epilogue for a completed D&D campaign.

Campaign: "${campaign.name}"
Setting: ${campaign.setting}
Party: ${partyDesc}
Quests: ${questSummary}

Session memory:
${memoryContext || 'No session summaries available.'}

Recent narration:
${recentNarration || 'No recent narration.'}

Write a compelling 3–4 paragraph campaign epilogue. Cover: the major story beats, the party's journey and growth, key NPCs and conflicts, and the ultimate fate of the party. Write in a warm, epic tone — like the final pages of a fantasy novel. Do not include XML tags or game mechanics. Pure narrative prose only.`

    const response = await callGroq({
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Write the campaign epilogue now.' }],
      maxTokens: 600
    })

    if (response.error) {
      return NextResponse.json({ error: response.error }, { status: 500 })
    }

    return NextResponse.json({ summary: response.content })

  } catch (error) {
    console.error('Campaign end error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
