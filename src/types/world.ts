export interface WorldState {
  locations: Map<string, Location>
  factions: Map<string, Faction>
  flags: Map<string, unknown>
  timeline: WorldEvent[]
  currentTime: {
    day: number
    timeOfDay: string
    season?: string
  }
}

export interface Location {
  id: string
  name: string
  baseDescription: string
  currentState: string
  stateModifiers: Array<{
    description: string
    causeSceneId: string
    timestamp: number
  }>
  connectedTo: string[]
  characters: string[]
  tags: string[]
}

export interface Faction {
  id: string
  name: string
  description: string
  disposition: Map<string, number>
  members: string[]
}

export interface WorldEvent {
  id: string
  description: string
  sceneId: string
  timestamp: number
  affectedEntities: string[]
}
