import type { Item } from './character'

export type StateChange =
  | { type: 'relationship'; characterA: string; characterB: string; field: string; delta: number; reason: string }
  | { type: 'character_state'; characterId: string; field: string; value: unknown; reason: string }
  | { type: 'world_flag'; key: string; value: unknown; reason: string }
  | { type: 'location_state'; locationId: string; modifier: string; reason: string }
  | { type: 'inventory'; characterId: string; action: 'add' | 'remove'; item: Item; reason: string }
  | { type: 'goal'; characterId: string; goalId: string; newStatus: string; reason: string }
  | { type: 'knowledge'; characterId: string; fact: string; source: 'witnessed' | 'told' | 'discovered' }
  | { type: 'faction'; factionId: string; field: string; value: unknown; reason: string }
