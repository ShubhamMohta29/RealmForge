import { supabaseAdmin } from './supabaseServer'

export async function applyEvents(
  events: any[],
  campaignId: string,
  initialCharacters: any[]
) {
  // Local cache to track changes across multiple events in the same batch
  const characterMap = new Map<string, any>()
  initialCharacters.forEach(c => characterMap.set(c.id, JSON.parse(JSON.stringify(c))))

  for (const event of events) {
    try {
      const targetName = event.data.target?.toLowerCase()
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
      } 
      else if (event.type === 'heal' && target) {
        const amount = parseInt(event.data.amount || '0', 10)
        target.hp = Math.min(target.max_hp || 10, (target.hp || 0) + amount)
        await supabaseAdmin.from('characters').update({ hp: target.hp }).eq('id', target.id)
      }
      else if (event.type === 'xp') {
        const amount = parseInt(event.data.amount || '0', 10)
        for (const c of characterMap.values()) {
          c.xp = (c.xp || 0) + amount
          await supabaseAdmin.from('characters').update({ xp: c.xp }).eq('id', c.id)
        }
      }
      else if (event.type === 'condition_add' && target) {
        const condition = event.data.condition
        if (condition && !target.conditions.includes(condition)) {
          target.conditions = [...(target.conditions || []), condition]
          await supabaseAdmin.from('characters').update({ conditions: target.conditions }).eq('id', target.id)
        }
      }
      else if (event.type === 'condition_remove' && target) {
        const condition = event.data.condition
        target.conditions = (target.conditions || []).filter((c: string) => c !== condition)
        await supabaseAdmin.from('characters').update({ conditions: target.conditions }).eq('id', target.id)
      }
      else if (event.type === 'inventory_add' && target) {
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
      }
      else if (event.type === 'feature_add' && target) {
        const name = event.data.name
        const desc = event.data.description
        const features = target.features || []
        if (name && !features.find((f: any) => f.name === name)) {
          features.push({ name, description: desc })
          target.features = features
          await supabaseAdmin.from('characters').update({ features: target.features }).eq('id', target.id)
        }
      }
      else if (event.type === 'skill_update' && target) {
        const skill = event.data.skill?.toLowerCase().replace(/ /g, '_')
        const val = event.data.value === 'true'
        if (skill) {
          target.skills = { ...(target.skills || {}), [skill]: val }
          await supabaseAdmin.from('characters').update({ skills: target.skills }).eq('id', target.id)
        }
      }
      else if (event.type === 'ability_update' && target) {
        const ability = event.data.ability?.toLowerCase()
        const val = parseInt(event.data.value || '10', 10)
        if (ability && target.ability_scores && target.ability_scores[ability] !== undefined) {
          target.ability_scores[ability] = val
          await supabaseAdmin.from('characters').update({ ability_scores: target.ability_scores }).eq('id', target.id)
        }
      }
      else if (event.type === 'rest' && target) {
        const isLong = event.data.rest_type === 'long'
        target.hp = target.max_hp
        if (isLong) {
          target.temp_hp = 0
          if (target.spells && target.spells.slot_max) {
             target.spells.slots = JSON.parse(JSON.stringify(target.spells.slot_max))
          }
        }
        await supabaseAdmin.from('characters').update({ 
          hp: target.hp, 
          temp_hp: target.temp_hp,
          spells: target.spells
        }).eq('id', target.id)
      }
      else if (event.type === 'new_npc') {
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
