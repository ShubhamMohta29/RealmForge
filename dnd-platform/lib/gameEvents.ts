export type GameEventType =
  | 'damage'
  | 'heal'
  | 'xp'
  | 'scene_update'
  | 'new_npc'
  | 'quest_update'
  | 'new_quest'
  | 'start_combat'
  | 'loot'
  | 'condition_add'
  | 'condition_remove'
  | 'inventory_add'
  | 'inventory_remove'
  | 'feature_add'
  | 'ability_update'
  | 'skill_update'
  | 'rest'
  | 'roll_request'

export interface GameEvent {
  type: GameEventType
  data: Record<string, string>
}

export interface RollRequest {
  character: string
  type: 'skill' | 'saving_throw' | 'attack' | 'ability'
  skill?: string
  ability?: string
  dc?: number
  target?: string
  reason?: string
}

export interface ParsedResponse {
  narration: string
  events: GameEvent[]
  rollRequests: RollRequest[]
}

export function parseGameEvents(raw: string): ParsedResponse {
  const events: GameEvent[] = []
  const rollRequests: RollRequest[] = []

  // Extract all XML-style game event tags
  const tagRegex = /<(game_event|roll_request|scene_update|new_npc|quest_update|new_quest|start_combat|loot)\s([^/]*?)\/>/g

  let match
  while ((match = tagRegex.exec(raw)) !== null) {
    const tagName = match[1]
    const attrString = match[2]

    // Parse attributes into key-value object
    const attrs: Record<string, string> = {}
    const attrRegex = /(\w+)=['"]([^'"]*)['"]/g
    let attrMatch
    while ((attrMatch = attrRegex.exec(attrString)) !== null) {
      attrs[attrMatch[1]] = attrMatch[2]
    }

    if (tagName === 'roll_request') {
      rollRequests.push({
        character: attrs.character || '',
        type: (attrs.type as RollRequest['type']) || 'skill',
        skill: attrs.skill,
        ability: attrs.ability,
        dc: attrs.dc ? parseInt(attrs.dc) : undefined,
        target: attrs.target,
        reason: attrs.reason
      })
    } else if (tagName === 'game_event') {
      events.push({
        type: attrs.type as GameEventType,
        data: attrs
      })
    } else {
      // scene_update, new_npc, etc. are shorthand game events
      events.push({
        type: tagName as GameEventType,
        data: attrs
      })
    }
  }

  // Strip all tags from narration text
  const narration = raw
    .replace(/<[^>]+\/>/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()

  return { narration, events, rollRequests }
}

export function buildEventSummary(events: GameEvent[]): string {
  return events.map(e => {
    switch (e.type) {
      case 'damage':  return `${e.data.target} takes ${e.data.amount} ${e.data.damage_type || ''} damage`
      case 'heal':    return `${e.data.target} heals ${e.data.amount} HP`
      case 'xp':      return `Party earns ${e.data.amount} XP`
      case 'loot':    return `Found: ${e.data.quantity}x ${e.data.item}`
      default:        return ''
    }
  }).filter(Boolean).join(', ')
}