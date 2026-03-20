export interface Character {
  id: string
  identity: CharacterIdentity
  state: CharacterState
  importSource?: {
    format: 'st-png-v2' | 'st-png-v3' | 'st-json' | 'risu' | 'native'
    originalData?: unknown
  }
}

export interface CharacterIdentity {
  name: string
  description: string
  personality: string
  appearance: string
  backstory: string
  speechStyle: string
  exampleDialogues: string
  tags: string[]
  avatar?: Blob
}

export interface CharacterState {
  location: string
  mood: string
  conditions: string[]
  inventory: Item[]
  relationships: Map<string, Relationship>
  knowledge: CharacterKnowledge
  goals: CharacterGoal[]
}

export interface Relationship {
  characterId: string
  trust: number
  disposition: string
  history: string[]
  lastInteraction?: string
}

export interface CharacterKnowledge {
  knownFacts: Set<string>
  witnessedScenes: string[]
  hearsay: Array<{ content: string; source: string; trust: number }>
}

export interface CharacterGoal {
  id: string
  description: string
  status: 'active' | 'completed' | 'failed' | 'abandoned'
  priority: number
  relatedScenes: string[]
}

export interface Item {
  id: string
  name: string
  description: string
  properties?: Record<string, unknown>
}
