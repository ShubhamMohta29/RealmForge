import { NextRequest, NextResponse } from 'next/server'
import { z, ZodSchema } from 'zod'

// Shared primitive schemas
export const uuidSchema = z.string().uuid()
export const uuidOptional = z.string().uuid().optional()

// Reusable field shapes across routes
export const campaignIdField = { campaignId: uuidSchema }

// Parses and validates the request JSON body against a Zod schema.
// Returns the parsed value on success, or a 422 NextResponse on failure.
// Usage:
//   const body = await parseBody(req, MySchema)
//   if (body instanceof NextResponse) return body
export async function parseBody<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<T | NextResponse> {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 })
  }

  const result = schema.safeParse(raw)
  if (!result.success) {
    const message = result.error.issues
      .map(e => `${e.path.map(String).join('.')}: ${e.message}`)
      .join(', ')
    return NextResponse.json({ error: `Validation failed: ${message}` }, { status: 422 })
  }

  return result.data
}

// Route-specific schemas — one per API route so they're easy to find and update

export const DMSchema = z.object({
  campaignId: uuidSchema,
  action: z.string().min(1, 'Action cannot be empty').max(2000, 'Action too long'),
  characterId: uuidOptional,
})

export const DMConsoleNarrateSchema = z.object({
  campaignId: uuidSchema,
  content: z.string().min(1).max(4000),
  targetCharacterId: uuidOptional,
})

export const DMConsoleAssistSchema = z.object({
  campaignId: uuidSchema,
  prompt: z.string().min(1).max(1000),
})

export const CampaignCreateSchema = z.object({
  name: z.string().min(1).max(100),
  setting: z.string().min(1).max(500),
  dmMode: z.enum(['ai', 'human']),
})

export const CampaignJoinSchema = z.object({
  code: z.string().min(1).max(20),
})

export const CampaignEndSchema = z.object({
  campaignId: uuidSchema,
})

export const CampaignArchiveSchema = z.object({
  campaignId: uuidSchema,
})

export const CombatStartSchema = z.object({
  campaignId: uuidSchema,
  monsterNames: z.array(z.string().min(1).max(100)).min(1).max(20),
})

export const CombatActionSchema = z.object({
  encounterId: uuidSchema,
  action: z.object({
    type: z.enum(['attack', 'cast_spell', 'use_item', 'dash', 'disengage', 'dodge', 'help', 'hide', 'ready', 'grapple', 'shove', 'end_turn']),
    actorId: uuidSchema,
    targetId: uuidOptional,
    spellName: z.string().max(100).optional(),
    itemName: z.string().max(100).optional(),
    weaponName: z.string().max(100).optional(),
  }),
})

export const DiceSchema = z.object({
  notation: z.string().max(50).optional(),
  advantage: z.boolean().optional(),
  disadvantage: z.boolean().optional(),
})

export const FlagContentSchema = z.object({
  messageId: uuidSchema,
  reason: z.string().min(1).max(500),
})
