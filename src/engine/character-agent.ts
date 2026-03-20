import type { Character, Relationship, CharacterGoal } from '../types/character'
import { generateId } from '../utils/id'

export type CharResult<T> = { ok: true; value: T } | { ok: false; error: string }

export function updateMood(character: Character, mood: string): void {
  character.state.mood = mood
}

export function addCondition(character: Character, condition: string): void {
  if (!character.state.conditions.includes(condition)) {
    character.state.conditions.push(condition)
  }
}

export function removeCondition(character: Character, condition: string): void {
  character.state.conditions = character.state.conditions.filter(c => c !== condition)
}

export function setRelationship(
  character: Character,
  targetId: string,
  updates: Partial<Omit<Relationship, 'characterId'>>,
): Relationship {
  const existing = character.state.relationships.get(targetId)
  const relationship: Relationship = {
    characterId: targetId,
    trust: existing?.trust ?? 50,
    disposition: existing?.disposition ?? '中立',
    history: existing?.history ?? [],
    ...existing,
    ...updates,
  }
  // Clamp trust to 0-100
  relationship.trust = Math.max(0, Math.min(100, relationship.trust))
  character.state.relationships.set(targetId, relationship)
  return relationship
}

export function adjustTrust(character: Character, targetId: string, delta: number, reason?: string): Relationship {
  const existing = character.state.relationships.get(targetId)
  const currentTrust = existing?.trust ?? 50
  const rel = setRelationship(character, targetId, { trust: currentTrust + delta })
  if (reason) {
    rel.history.push(reason)
  }
  return rel
}

export function addKnowledge(character: Character, fact: string): void {
  character.state.knowledge.knownFacts.add(fact)
}

export function removeKnowledge(character: Character, fact: string): void {
  character.state.knowledge.knownFacts.delete(fact)
}

export function addWitnessedScene(character: Character, sceneId: string): void {
  if (!character.state.knowledge.witnessedScenes.includes(sceneId)) {
    character.state.knowledge.witnessedScenes.push(sceneId)
  }
}

export function addHearsay(character: Character, content: string, source: string, trust: number): void {
  character.state.knowledge.hearsay.push({ content, source, trust })
}

export function knowsFact(character: Character, fact: string): boolean {
  return character.state.knowledge.knownFacts.has(fact)
}

export function addGoal(character: Character, description: string, priority: number = 5): CharacterGoal {
  const goal: CharacterGoal = {
    id: generateId(),
    description,
    status: 'active',
    priority: Math.max(1, Math.min(10, priority)),
    relatedScenes: [],
  }
  character.state.goals.push(goal)
  return goal
}

export function updateGoalStatus(
  character: Character,
  goalId: string,
  status: CharacterGoal['status'],
): CharResult<CharacterGoal> {
  const goal = character.state.goals.find(g => g.id === goalId)
  if (!goal) return { ok: false, error: `Goal ${goalId} not found` }
  goal.status = status
  return { ok: true, value: goal }
}

export function getActiveGoals(character: Character): CharacterGoal[] {
  return character.state.goals
    .filter(g => g.status === 'active')
    .sort((a, b) => b.priority - a.priority)
}

export function addInventoryItem(
  character: Character,
  name: string,
  description: string,
  properties?: Record<string, unknown>,
): void {
  character.state.inventory.push({ id: generateId(), name, description, properties })
}

export function removeInventoryItem(character: Character, itemId: string): CharResult<void> {
  const index = character.state.inventory.findIndex(i => i.id === itemId)
  if (index === -1) return { ok: false, error: `Item ${itemId} not found` }
  character.state.inventory.splice(index, 1)
  return { ok: true, value: undefined }
}
