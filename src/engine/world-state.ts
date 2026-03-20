import type { WorldState, Location, Faction } from '../types/world'
import { generateId } from '../utils/id'

export type WorldResult<T> = { ok: true; value: T } | { ok: false; error: string }

export function addLocation(world: WorldState, name: string, description: string, tags: string[] = []): Location {
  const location: Location = {
    id: generateId(),
    name,
    baseDescription: description,
    currentState: description,
    stateModifiers: [],
    connectedTo: [],
    characters: [],
    tags,
  }
  world.locations.set(location.id, location)
  return location
}

export function connectLocations(world: WorldState, locationA: string, locationB: string): WorldResult<void> {
  const a = world.locations.get(locationA)
  const b = world.locations.get(locationB)
  if (!a) return { ok: false, error: `Location ${locationA} not found` }
  if (!b) return { ok: false, error: `Location ${locationB} not found` }

  if (!a.connectedTo.includes(locationB)) a.connectedTo.push(locationB)
  if (!b.connectedTo.includes(locationA)) b.connectedTo.push(locationA)
  return { ok: true, value: undefined }
}

export function addLocationModifier(
  world: WorldState,
  locationId: string,
  description: string,
  causeSceneId: string,
): WorldResult<void> {
  const location = world.locations.get(locationId)
  if (!location) return { ok: false, error: `Location ${locationId} not found` }

  location.stateModifiers.push({
    description,
    causeSceneId,
    timestamp: Date.now(),
  })

  // Update currentState to reflect modifiers
  const modifierText = location.stateModifiers.map(m => m.description).join('；')
  location.currentState = `${location.baseDescription}（${modifierText}）`

  return { ok: true, value: undefined }
}

export function moveCharacter(
  world: WorldState,
  characterId: string,
  fromLocationId: string,
  toLocationId: string,
): WorldResult<void> {
  const from = world.locations.get(fromLocationId)
  const to = world.locations.get(toLocationId)
  if (!from) return { ok: false, error: `Location ${fromLocationId} not found` }
  if (!to) return { ok: false, error: `Location ${toLocationId} not found` }

  from.characters = from.characters.filter(id => id !== characterId)
  if (!to.characters.includes(characterId)) {
    to.characters.push(characterId)
  }
  return { ok: true, value: undefined }
}

export function setFlag(world: WorldState, key: string, value: unknown): void {
  world.flags.set(key, value)
}

export function getFlag(world: WorldState, key: string): unknown {
  return world.flags.get(key)
}

export function advanceTime(world: WorldState): void {
  const timeProgression = ['黎明', '上午', '正午', '下午', '黄昏', '夜晚', '深夜']
  const currentIndex = timeProgression.indexOf(world.currentTime.timeOfDay)
  if (currentIndex === timeProgression.length - 1) {
    world.currentTime.day += 1
    world.currentTime.timeOfDay = timeProgression[0]
  } else if (currentIndex >= 0) {
    world.currentTime.timeOfDay = timeProgression[currentIndex + 1]
  }
}

export function addFaction(world: WorldState, name: string, description: string): Faction {
  const faction: Faction = {
    id: generateId(),
    name,
    description,
    disposition: new Map(),
    members: [],
  }
  world.factions.set(faction.id, faction)
  return faction
}

export function getCharactersAtLocation(world: WorldState, locationId: string): string[] {
  const location = world.locations.get(locationId)
  return location ? location.characters : []
}
