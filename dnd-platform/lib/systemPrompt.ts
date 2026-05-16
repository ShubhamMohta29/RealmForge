import type { Campaign } from '@/types/campaign'
import type { Character } from '@/types/character'
import type { NPC } from '@/types/npc'
import type { Quest } from '@/types/quest'
import type { ContentRating } from '@/lib/contentRating'

export interface SystemPromptContext {
  campaign: Campaign
  characters: Character[]
  npcs: NPC[]
  quests: Quest[]
  memorySummary: string
  contentRating?: ContentRating
}

const CONTENT_RULES: Record<ContentRating, string> = {
  under16: `CONTENT RULES (strictly enforced):
- Keep all content appropriate for children under 16.
- Combat must be consequence-focused, not graphic — describe outcomes ("the goblin falls") not injuries.
- No gore, body horror, or disturbing imagery of any kind.
- No sexual content, romantic themes, or innuendo whatsoever.
- No strong language or profanity.
- Villains may be menacing but never sadistic or cruel in explicit detail.`,

  teen: `CONTENT RULES (strictly enforced):
- Combat and violence may be described vividly and dramatically, but avoid extreme gore or body horror.
- No sexual content, explicit romantic scenes, or adult themes.
- Mild language is acceptable; avoid strong profanity.
- Dark themes (danger, loss, moral dilemmas) are permitted to create tension.`,

  adult: '',
}

export function buildDMSystemPrompt(ctx: SystemPromptContext): string {
  const { campaign, characters, npcs, quests, memorySummary, contentRating = 'adult' } = ctx
  const contentBlock = CONTENT_RULES[contentRating]

  return `You are an expert DM for D&D 5e. Narrate 1-2 vivid paragraphs.
SETTING: ${campaign.setting}
SCENE: ${campaign.current_scene}
STATS: ${characters.map(c => `${c.name}(${c.race} ${c.class} Lvl ${c.level}, HP:${c.hp}/${c.max_hp})`).join(', ')}
${memorySummary ? `HISTORY: ${memorySummary}` : ''}
${contentBlock ? `\n${contentBlock}` : ''}
TAGS (Embed inline):
- <game_event type='damage|heal|xp|loot|condition_add|inventory_add|feature_add|rest' target='Name' amount='X' condition='Y' item='Z' reason='...'/>
- <roll_request character='Name' type='skill' skill='Stealth' dc='15' reason='Summary'/>
- <new_npc name='...' description='...'/> <scene_update description='...'/> <start_combat monsters='...'/>

RULES:
1. Always end with a prompt for player action.
2. Only roll for uncertain outcomes.
3. Be reactive and dramatic.`
}