import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, getAuthenticatedUser } from '@/lib/supabaseServer'
import { callGroq } from '@/lib/groq'
import { parseBody, DMConsoleAssistSchema } from '@/lib/validation'

export async function POST(req: NextRequest) {
  try {
    const body = await parseBody(req, DMConsoleAssistSchema)
    if (body instanceof NextResponse) return body
    const { campaignId, prompt } = body

    const user = await getAuthenticatedUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify the caller is the human DM
    const { data: campaignCheck } = await supabaseAdmin
      .from('campaigns')
      .select('dm_user_id, dm_mode')
      .eq('id', campaignId)
      .single()

    if (!campaignCheck || campaignCheck.dm_mode !== 'human' || campaignCheck.dm_user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [campaignRes, charactersRes, messagesRes] = await Promise.all([
      supabaseAdmin.from('campaigns').select('setting, current_scene, world_state').eq('id', campaignId).single(),
      supabaseAdmin.from('characters').select('name, class, level, hp, max_hp').eq('campaign_id', campaignId),
      supabaseAdmin.from('messages').select('type, content, character_id').eq('campaign_id', campaignId)
        .in('type', ['player_action', 'narration'])
        .order('created_at', { ascending: false })
        .limit(10)
    ])

    const campaign = campaignRes.data
    const characters = charactersRes.data
    const recentMessages = (messagesRes.data || []).reverse()

    const recentLog = recentMessages
      .map(m => m.type === 'player_action' ? `Player: "${m.content}"` : `DM: "${m.content}"`)
      .join('\n')

    const system = `You are a concise D&D assistant helping a human Dungeon Master run a ${campaign?.setting || 'fantasy'} campaign.
Current scene: ${campaign?.current_scene || 'Unknown'}
Party: ${characters?.map(c => `${c.name} (${c.class} lvl ${c.level}, HP: ${c.hp}/${c.max_hp})`).join(', ') || 'None'}
${recentLog ? `\nRecent story log:\n${recentLog}` : ''}

Give direct, immediately usable suggestions. Be concise — the DM can use your text as-is or lightly edit it.`

    const response = await callGroq({
      system,
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 400
    })

    return NextResponse.json({ suggestion: response.content })
  } catch (error) {
    console.error('Assist error:', error)
    return NextResponse.json({ error: 'Failed to get suggestion' }, { status: 500 })
  }
}