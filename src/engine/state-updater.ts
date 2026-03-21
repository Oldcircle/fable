import type { Story } from '../types/story'
import type { StoryEvent } from '../types/events'
import type { StateChange } from '../types/state-change'
import * as charAgent from './character-agent'
import * as worldState from './world-state'

export type UpdateResult = { ok: true; applied: number } | { ok: false; error: string }

/**
 * Extract all StateChanges from a list of story events.
 * Sources: ActionEvent.consequences, StateChangeEvent.changes, selected ChoiceOption.stateChanges
 */
export function extractStateChanges(events: StoryEvent[]): StateChange[] {
  const changes: StateChange[] = []

  for (const event of events) {
    if (event.type === 'action' && event.consequences) {
      changes.push(...event.consequences)
    }
    if (event.type === 'state_change') {
      changes.push(...event.changes)
    }
    if (event.type === 'choice' && event.selectedOptionId) {
      const selected = event.options.find(o => o.id === event.selectedOptionId)
      if (selected?.stateChanges) {
        changes.push(...selected.stateChanges)
      }
    }
  }

  return changes
}

/**
 * Apply a single StateChange to the story.
 * Returns an error string if the change could not be applied, undefined on success.
 */
export function applySingleChange(story: Story, change: StateChange): string | undefined {
  switch (change.type) {
    case 'relationship': {
      const charA = story.characters.get(change.characterA)
      if (!charA) return `Character ${change.characterA} not found`
      charAgent.adjustTrust(charA, change.characterB, change.delta, change.reason)
      return undefined
    }

    case 'character_state': {
      const char = story.characters.get(change.characterId)
      if (!char) return `Character ${change.characterId} not found`

      const field = change.field
      if (field === 'mood') {
        charAgent.updateMood(char, change.value as string)
      } else if (field === 'location') {
        char.state.location = change.value as string
      } else if (field === 'conditions' && Array.isArray(change.value)) {
        for (const c of change.value as string[]) {
          charAgent.addCondition(char, c)
        }
      } else if (field === 'addCondition') {
        charAgent.addCondition(char, change.value as string)
      } else if (field === 'removeCondition') {
        charAgent.removeCondition(char, change.value as string)
      } else {
        // Generic state field update
        ;(char.state as unknown as Record<string, unknown>)[field] = change.value
      }
      return undefined
    }

    case 'world_flag': {
      worldState.setFlag(story.worldState, change.key, change.value)
      return undefined
    }

    case 'location_state': {
      const result = worldState.addLocationModifier(
        story.worldState,
        change.locationId,
        change.modifier,
        '', // causeSceneId filled by caller if needed
      )
      if (!result.ok) return result.error
      return undefined
    }

    case 'inventory': {
      const char = story.characters.get(change.characterId)
      if (!char) return `Character ${change.characterId} not found`

      if (change.action === 'add') {
        charAgent.addInventoryItem(char, change.item.name, change.item.description, change.item.properties)
      } else {
        const removeResult = charAgent.removeInventoryItem(char, change.item.id)
        if (!removeResult.ok) return removeResult.error
      }
      return undefined
    }

    case 'goal': {
      const char = story.characters.get(change.characterId)
      if (!char) return `Character ${change.characterId} not found`

      const validStatuses = ['active', 'completed', 'failed', 'abandoned'] as const
      const status = validStatuses.find(s => s === change.newStatus)
      if (!status) return `Invalid goal status: ${change.newStatus}`

      const goalResult = charAgent.updateGoalStatus(char, change.goalId, status)
      if (!goalResult.ok) return goalResult.error
      return undefined
    }

    case 'knowledge': {
      const char = story.characters.get(change.characterId)
      if (!char) return `Character ${change.characterId} not found`

      charAgent.addKnowledge(char, change.fact)
      if (change.source === 'told') {
        charAgent.addHearsay(char, change.fact, 'told', 0.7)
      }
      return undefined
    }

    case 'faction': {
      const faction = story.worldState.factions.get(change.factionId)
      if (!faction) return `Faction ${change.factionId} not found`

      if (change.field === 'description') {
        faction.description = change.value as string
      } else if (change.field === 'name') {
        faction.name = change.value as string
      } else if (change.field === 'addMember') {
        const memberId = change.value as string
        if (!faction.members.includes(memberId)) {
          faction.members.push(memberId)
        }
      } else if (change.field === 'removeMember') {
        faction.members = faction.members.filter(m => m !== (change.value as string))
      } else if (change.field === 'disposition') {
        const { targetId, value: dispValue } = change.value as { targetId: string; value: number }
        faction.disposition.set(targetId, dispValue)
      }
      return undefined
    }
  }
}

/**
 * Apply all state changes from generated events to the story.
 * Collects errors but continues applying remaining changes.
 */
export function applyStateChanges(story: Story, events: StoryEvent[]): UpdateResult {
  const changes = extractStateChanges(events)
  if (changes.length === 0) return { ok: true, applied: 0 }

  const errors: string[] = []
  let applied = 0

  for (const change of changes) {
    const error = applySingleChange(story, change)
    if (error) {
      errors.push(error)
    } else {
      applied++
    }
  }

  if (errors.length > 0 && applied === 0) {
    return { ok: false, error: errors.join('; ') }
  }

  return { ok: true, applied }
}
