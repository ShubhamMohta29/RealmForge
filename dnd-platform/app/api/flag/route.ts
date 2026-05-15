import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, getAuthenticatedUser } from '@/lib/supabaseServer'
import { parseBody, FlagContentSchema } from '@/lib/validation'

export async function POST(req: NextRequest) {
  try {
    const body = await parseBody(req, FlagContentSchema)
    if (body instanceof NextResponse) return body
    const { messageId, reason } = body

    const user = await getAuthenticatedUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify the message exists before inserting a flag
    const { data: message } = await supabaseAdmin
      .from('messages')
      .select('id')
      .eq('id', messageId)
      .single()

    if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 })

    const { error } = await supabaseAdmin.from('moderation_queue').insert({
      message_id: messageId,
      reported_by: user.id,
      reason,
    })

    if (error) {
      // Duplicate flag from same user — not an error worth surfacing
      if (error.code === '23505') {
        return NextResponse.json({ success: true })
      }
      console.error('Flag insert error:', error)
      return NextResponse.json({ error: 'Failed to submit flag' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Flag route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
