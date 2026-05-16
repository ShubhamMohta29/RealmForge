import { supabaseAdmin } from './supabaseServer'
import { getLevelFromXP } from './dnd5e/leveling'
import { getProficiencyBonus } from './dnd5e/abilities'

type EventCharacter = {
  id: string
  name: string
  hp: number
  max_hp: number
  temp_hp: number
  xp: number
}

type GameEventRecord = {
  type: string
  data: Record<string, string>
}

function getHitDieForClass(className: string): number {
  const dice: Record<string, number> = {
    'barbarian': 12,
    'fighter': 10, 'paladin': 10, 'ranger': 10,
    'bard': 8, 'cleric': 8, 'druid': 8, 'monk': 8, 'rogue': 8, 'warlock': 8,
    'sorcerer': 6, 'wizard': 6
  }
  return dice[className.toLowerCase()] || 8
}

function calculateHpIncrease(c: any, levelsGained: number): number {
  const conScore = c.ability_scores?.con || 10
  const conMod = Math.floor((conScore - 10) / 2)
  const hitDie = getHitDieForClass(c.class || '')
  const avgRoll = Math.floor(hitDie / 2) + 1
  return levelsGained * Math.max(1, avgRoll + conMod)
}

export async function applyEvents(
  events: GameEventRecord[],
  campaignId: string,
  characters: EventCharacter[]
) {
  // Local cache to track changes across multiple events in the same batch
  const characterMap = new Map<string, any>()
  characters.forEach(c => characterMap.set(c.id, JSON.parse(JSON.stringify(c))))

  // Proactively sync level-ups for all characters before processing events
  for (const target of characterMap.values()) {
    const correctLevel = getLevelFromXP(target.xp || 0)
    if (correctLevel > target.level) {
      const levelsGained = correctLevel - target.level
      console.log(`Syncing level for ${target.name}: ${target.level} -> ${correctLevel}`)

      const hpIncrease = calculateHpIncrease(target, levelsGained)
      target.level = correctLevel
      target.proficiency_bonus = getProficiencyBonus(correctLevel)
      target.max_hp = (target.max_hp || 10) + hpIncrease
      target.hp = (target.hp || 0) + hpIncrease

      await supabaseAdmin.from('characters').update({
        level: target.level,
        proficiency_bonus: target.proficiency_bonus,
        max_hp: target.max_hp,
        hp: target.hp
      }).eq('id', target.id)
    }
  }

  for (const event of events) {
    try {
      const targetName = event.data?.target?.toLowerCase()
      const target = Array.from(characterMap.values()).find(
        c => c.name.toLowerCase() === targetName
      )

      if (event.type === 'damage' && target) {
        const amount = parseInt(event.data.amount || '0', 10)
        const remaining = amount - (target.temp_hp || 0)
        target.hp = remaining > 0 ? Math.max(0, (target.hp || 0) - remaining) : target.hp
        target.temp_hp = remaining > 0 ? 0 : (target.temp_hp || 0) - amount
        await supabaseAdmin
          .from('characters')
          .update({ hp: target.hp, temp_hp: target.temp_hp })
          .eq('id', target.id)

      } else if (event.type === 'heal' && target) {
        const amount = parseInt(event.data.amount || '0', 10)
        target.hp = Math.min(target.max_hp || 10, (target.hp || 0) + amount)
        await supabaseAdmin.from('characters').update({ hp: target.hp }).eq('id', target.id)

      } else if (event.type === 'xp') {
        const amount = parseInt(event.data.amount || '0', 10)
        for (const c of characterMap.values()) {
          c.xp = (c.xp || 0) + amount

          const newLevel = getLevelFromXP(c.xp)
          if (newLevel > c.level) {
            const levelsGained = newLevel - c.level
            console.log(`Character ${c.name} leveled up from ${c.level} to ${newLevel}!`)

            const hpIncrease = calculateHpIncrease(c, levelsGained)
            c.level = newLevel
            c.proficiency_bonus = getProficiencyBonus(newLevel)
            c.max_hp = (c.max_hp || 10) + hpIncrease
            c.hp = (c.hp || 0) + hpIncrease

            await supabaseAdmin.from('characters').update({
              xp: c.xp,
              level: c.level,
              proficiency_bonus: c.proficiency_bonus,
              max_hp: c.max_hp,
              hp: c.hp
            }).eq('id', c.id)
          } else {
            await supabaseAdmin.from('characters').update({ xp: c.xp }).eq('id', c.id)
          }
        }

      } else if (event.type === 'condition_add' && target) {
        const condition = event.data.condition
        if (condition && !(target.conditions || []).includes(condition)) {
          target.conditions = [...(target.conditions || []), condition]
          await supabaseAdmin.from('characters').update({ conditions: target.conditions }).eq('id', target.id)
        }

      } else if (event.type === 'condition_remove' && target) {
        const condition = event.data.condition
        target.conditions = (target.conditions || []).filter((c: string) => c !== condition)
        await supabaseAdmin.from('characters').update({ conditions: target.conditions }).eq('id', target.id)

      } else if (event.type === 'inventory_add' && target) {
        const item = event.data.item
        const qty = parseInt(event.data.quantity || '1', 10)
        const inventory = target.inventory || []
        const existing = inventory.find((i: any) => i.name === item)
        if (existing) {
          existing.quantity += qty
        } else {
          inventory.push({ name: item, quantity: qty, equipped: false, attuned: false, weight: 0, value: 0 })
        }
        target.inventory = inventory
        await supabaseAdmin.from('characters').update({ inventory: target.inventory }).eq('id', target.id)

      } else if (event.type === 'new_npc') {
        await supabaseAdmin.from('npcs').insert({
          campaign_id: campaignId,
          name: event.data.name,
          description: event.data.description,
          disposition: event.data.disposition || 'unknown'
        })

      } else if (event.type === 'new_quest') {
        await supabaseAdmin.from('quests').insert({
          campaign_id: campaignId,
          title: event.data.title,
          description: event.data.description,
          xp_reward: parseInt(event.data.xp_reward || '0', 10),
          status: 'active',
          objectives: []
        })

      } else if (event.type === 'spell_learn' && target) {
        const spell = event.data.spell
        if (spell) {
          const { data: char } = await supabaseAdmin
            .from('characters').select('spells').eq('id', target.id).single()
          if (char) {
            const spells = char.spells || { known: [], prepared: [], slots: {}, slot_max: {} }
            if (!spells.known.includes(spell)) {
              spells.known = [...spells.known, spell]
              await supabaseAdmin.from('characters').update({ spells }).eq('id', target.id)
            }
          }
        }

      } else if (event.type === 'scene_update' && event.data.description) {
        await supabaseAdmin
          .from('campaigns')
          .update({ current_scene: event.data.description })
          .eq('id', campaignId)
      }
    } catch (err) {
      console.error(`Failed to apply event ${event.type}:`, err)
    }
  }
}
