import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, getAuthenticatedUser } from '@/lib/supabaseServer'
import { resolveAttack, applyDamage, applyHealing, advanceTurn, checkCombatEnd } from '@/lib/combatEngine'
import { rollDice } from '@/lib/dice'
import type { TurnAction, CombatEncounter, Combatant, ActionResult } from '@/types/combat'
import { parseBody, CombatActionSchema } from '@/lib/validation'

export async function POST(req: NextRequest) {
  try {
    const parsed = await parseBody(req, CombatActionSchema)
    if (parsed instanceof NextResponse) return parsed
    const { encounterId, action } = parsed

    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the encounter
    const { data: encounter, error: encounterError } = await supabaseAdmin
      .from('combat_encounters')
      .select('*')
      .eq('id', encounterId)
      .single()

    if (encounterError || !encounter) {
      return NextResponse.json({ error: 'Encounter not found' }, { status: 404 })
    }

    const typedEncounter = encounter as CombatEncounter

    if (typedEncounter.status !== 'active') {
      return NextResponse.json({ error: 'Encounter is not active' }, { status: 400 })
    }

    // Verify the user is a member of the campaign
    const { data: membership } = await supabaseAdmin
      .from('campaign_members')
      .select('id')
      .eq('campaign_id', typedEncounter.campaign_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this campaign' }, { status: 403 })
    }

    const turnOrder: Combatant[] = [...typedEncounter.turn_order]
    const monsters = typedEncounter.monsters

    const actorIndex = turnOrder.findIndex(c => c.id === action.actorId)
    if (actorIndex === -1) {
      return NextResponse.json({ error: 'Actor not found in encounter' }, { status: 400 })
    }

    const actor = turnOrder[actorIndex]
    let actionResult: ActionResult = {
      success: false,
      description: '',
      events: []
    }

    switch (action.type) {
      case 'attack': {
        if (!action.targetId) {
          return NextResponse.json({ error: 'Attack action requires targetId' }, { status: 400 })
        }
        const targetIndex = turnOrder.findIndex(c => c.id === action.targetId)
        if (targetIndex === -1) {
          return NextResponse.json({ error: 'Target not found in encounter' }, { status: 400 })
        }
        const target = turnOrder[targetIndex]

        // Determine attack bonus and damage dice
        // For monsters: look up their attack entry; for players: use a default melee weapon
        let attackBonus = 2
        let damageDice = '1d6'
        let monsterLookupFailed = false

        if (actor.type === 'monster') {
          const monsterData = monsters.find(m => m.name === actor.name)
          if (monsterData?.attacks?.length) {
            const chosenAttack = action.weaponName
              ? monsterData.attacks.find(a => a.name.toLowerCase() === action.weaponName!.toLowerCase()) ?? monsterData.attacks[0]
              : monsterData.attacks[0]
            attackBonus = chosenAttack.bonus
            damageDice = chosenAttack.damage
          } else if (!monsterData) {
            monsterLookupFailed = true
            console.warn(`Monster data not found for ${actor.name}, using default attack values`)
          }
        }

        const result = resolveAttack(actor, target, attackBonus, damageDice)
        actionResult = { ...actionResult, ...result }

        if (monsterLookupFailed) {
          actionResult.description = `${actionResult.description} (using fallback attack values: ${attackBonus} bonus, ${damageDice})`
        }

        if (result.success && result.damage !== undefined) {
          const { updatedTarget } = applyDamage(target, result.damage, monsters)
          turnOrder[targetIndex] = updatedTarget
        }
        break
      }

      case 'cast_spell': {
        // Generic spell: deal 2d6 damage or heal 2d4+2 depending on description
        if (action.targetId) {
          const targetIndex = turnOrder.findIndex(c => c.id === action.targetId)
          if (targetIndex === -1) {
            actionResult = {
              success: false,
              description: 'Target not found in combat.',
              events: []
            }
          } else {
            const target = turnOrder[targetIndex]
            const damageRoll = rollDice('2d6')
            const { updatedTarget } = applyDamage(target, damageRoll.total, monsters)
            turnOrder[targetIndex] = updatedTarget
            actionResult = {
              success: true,
              description: `${actor.name} casts ${action.spellName ?? 'a spell'} at ${target.name} for ${damageRoll.total} damage.`,
              damage: damageRoll.total,
              healing: undefined,
              roll: undefined,
              events: [`${target.name} takes ${damageRoll.total} damage`]
            }
          }
        } else {
          // Self-heal spell
          const healRoll = rollDice('2d4+2')
          const updatedActor = applyHealing(actor, healRoll.total)
          turnOrder[actorIndex] = updatedActor
          actionResult = {
            success: true,
            description: `${actor.name} casts ${action.spellName ?? 'a healing spell'} and regains ${healRoll.total} HP.`,
            damage: undefined,
            healing: healRoll.total,
            roll: undefined,
            events: [`${actor.name} heals ${healRoll.total} HP`]
          }
        }
        break
      }

      case 'use_item': {
        // Healing potion-style item: heal 2d4+2
        const healRoll = rollDice('2d4+2')
        const healTargetId = action.targetId ?? action.actorId
        const healTargetIndex = turnOrder.findIndex(c => c.id === healTargetId)
        if (healTargetIndex === -1) {
          actionResult = {
            success: false,
            description: 'Target not found in combat.',
            events: []
          }
        } else {
          const updatedTarget = applyHealing(turnOrder[healTargetIndex], healRoll.total)
          turnOrder[healTargetIndex] = updatedTarget
          actionResult = {
            success: true,
            description: `${actor.name} uses ${action.itemName ?? 'an item'} on ${turnOrder[healTargetIndex].name}, restoring ${healRoll.total} HP.`,
            damage: undefined,
            healing: healRoll.total,
            roll: undefined,
            events: [`${turnOrder[healTargetIndex].name} heals ${healRoll.total} HP`]
          }
        }
        break
      }

      case 'dash':
        actionResult = {
          success: true,
          description: `${actor.name} dashes, doubling their movement speed this turn.`,
          events: []
        }
        break

      case 'disengage':
        actionResult = {
          success: true,
          description: `${actor.name} disengages, avoiding opportunity attacks when moving away.`,
          events: []
        }
        break

      case 'dodge':
        actionResult = {
          success: true,
          description: `${actor.name} takes the Dodge action. Attacks against them have disadvantage until the start of their next turn.`,
          events: []
        }
        break

      case 'help': {
        const helpTargetIndex = action.targetId
          ? turnOrder.findIndex(c => c.id === action.targetId)
          : -1
        const helpTargetName = helpTargetIndex !== -1 ? turnOrder[helpTargetIndex].name : 'an ally'
        actionResult = {
          success: true,
          description: `${actor.name} helps ${helpTargetName}. Their next ability check or attack has advantage.`,
          events: []
        }
        break
      }

      case 'hide': {
        const stealthRoll = rollDice('1d20')
        actionResult = {
          success: true,
          description: `${actor.name} attempts to hide (Stealth roll: ${stealthRoll.total}).`,
          roll: stealthRoll.total,
          events: []
        }
        break
      }

      case 'grapple': {
        if (!action.targetId) {
          return NextResponse.json({ error: 'Grapple requires targetId' }, { status: 400 })
        }
        const grappleRoll = rollDice('1d20')
        const opposed = rollDice('1d20')
        const success = grappleRoll.total >= opposed.total
        actionResult = {
          success,
          description: success
            ? `${actor.name} grapples the target! (${grappleRoll.total} vs ${opposed.total})`
            : `${actor.name} fails to grapple. (${grappleRoll.total} vs ${opposed.total})`,
          roll: grappleRoll.total,
          events: success ? ['Target is grappled'] : []
        }
        break
      }

      case 'shove': {
        if (!action.targetId) {
          return NextResponse.json({ error: 'Shove requires targetId' }, { status: 400 })
        }
        const shoveRoll = rollDice('1d20')
        const opposed = rollDice('1d20')
        const success = shoveRoll.total >= opposed.total
        actionResult = {
          success,
          description: success
            ? `${actor.name} shoves the target! (${shoveRoll.total} vs ${opposed.total})`
            : `${actor.name} fails to shove. (${shoveRoll.total} vs ${opposed.total})`,
          roll: shoveRoll.total,
          events: success ? ['Target is knocked prone or pushed back'] : []
        }
        break
      }

      case 'end_turn':
        actionResult = {
          success: true,
          description: `${actor.name} ends their turn.`,
          events: []
        }
        break

      default:
        return NextResponse.json({ error: 'Unknown action type' }, { status: 400 })
    }

    // Mark actor as having acted
    turnOrder[actorIndex] = { ...turnOrder[actorIndex], has_acted: true }

    // Advance turn
    const { nextIndex, newRound, updatedTurnOrder } = advanceTurn(turnOrder, typedEncounter.current_turn_index)
    const newRoundNumber = newRound
      ? typedEncounter.round + 1
      : typedEncounter.round

    // Check if combat has ended
    const { ended, winner } = checkCombatEnd(updatedTurnOrder)
    const newStatus = ended ? 'completed' : 'active'

    // Build the update payload
    const updatePayload: Partial<CombatEncounter> & { status: string } = {
      turn_order: updatedTurnOrder,
      current_turn_index: ended ? typedEncounter.current_turn_index : nextIndex,
      round: newRoundNumber,
      status: newStatus
    }

    const { data: updatedEncounter, error: updateError } = await supabaseAdmin
      .from('combat_encounters')
      .update(updatePayload)
      .eq('id', encounterId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update encounter:', updateError)
      return NextResponse.json({ error: 'Failed to update encounter' }, { status: 500 })
    }

    // Post a system message summarising the action
    const messageLines: string[] = [actionResult.description]
    if (newRound && !ended) {
      messageLines.push(`--- Round ${newRoundNumber} begins ---`)
    }
    if (ended) {
      messageLines.push(
        winner === 'players'
          ? '🏆 Victory! All monsters have been defeated.'
          : '💀 Defeat. All players are down.'
      )
    }

    await supabaseAdmin.from('messages').insert({
      campaign_id: typedEncounter.campaign_id,
      type: 'system',
      content: messageLines.join('\n')
    })

    return NextResponse.json({
      result: actionResult,
      encounter: updatedEncounter,
      combatEnded: ended,
      winner: winner ?? undefined
    })

  } catch (error) {
    console.error('Combat action error:', error)
    return NextResponse.json({ error: 'Failed to process combat action' }, { status: 500 })
  }
}
