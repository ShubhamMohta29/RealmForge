import { supabaseAdmin } from './supabaseServer'
import { callClaudeHaiku } from './claude'
import type { Message } from '@/types/message'
import type { WorldState } from '@/types/campaign'

const MAX_RECENT_MESSAGES = 10
const SUMMARIZE_AFTER = 20

export interface DMContext {
  recentMessages: Message[]
  latestSummary: string
  worldState: WorldState
}

export async function getContextForDM(campaignId: string): Promise<DMContext> {
  // Get recent messages
  const { data: messages } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })
    .limit(MAX_RECENT_MESSAGES)

  // Get latest summary
  const { data: summaries } = await supabaseAdmin
    .from('world_memory_summaries')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })
    .limit(1)

  // Get world state
  const { data: campaign } = await supabaseAdmin
    .from('campaigns')
    .select('world_state')
    .eq('id', campaignId)
    .single()

  return {
    recentMessages: (messages || []).reverse(),
    latestSummary: summaries?.[0]?.content || '',
    worldState: campaign?.world_state || {}
  }
}

export async function shouldSummarize(campaignId: string): Promise<boolean> {
  const { data: lastSummary } = await supabaseAdmin
    .from('world_memory_summaries')
    .select('message_range_end')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })
    .limit(1)

  const { count } = await supabaseAdmin
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .eq('type', 'narration')

  return (count || 0) % SUMMARIZE_AFTER === 0 && (count || 0) > 0
}

export async function summarizeSession(
  campaignId: string,
  messages: Message[]
): Promise<void> {
  if (messages.length === 0) return

  const transcript = messages
    .map(m => `[${m.type}]: ${m.content}`)
    .join('\n')

  const response = await callClaudeHaiku({
    system: 'You are a D&D session historian. Summarize concisely in 150-200 words. Focus on: decisions made, characters met, locations visited, quests updated, items found, combat outcomes. Write in past tense.',
    messages: [{ role: 'user', content: `Summarize this session:\n\n${transcript}` }]
  })

  await supabaseAdmin
    .from('world_memory_summaries')
    .insert({
      campaign_id: campaignId,
      summary_type: 'session',
      content: response.content,
      message_range_start: messages[0].id,
      message_range_end: messages[messages.length - 1].id
    })
}