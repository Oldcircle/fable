import { generateId } from '../utils/id'
import type { Story, NarratorStyle, Chapter, Scene, SceneSetting } from '../types/story'
import type { Character, CharacterState, CharacterIdentity } from '../types/character'
import type { WorldState } from '../types/world'
import type { PlotGraph } from '../types/plot'

export function createDefaultNarratorStyle(overrides?: Partial<NarratorStyle>): NarratorStyle {
  return {
    voice: '第三人称全知',
    tone: '黑暗奇幻',
    language: 'zh-CN',
    customInstructions: '',
    ...overrides,
  }
}

export function createDefaultCharacterState(overrides?: Partial<CharacterState>): CharacterState {
  return {
    location: '',
    mood: '平静',
    conditions: [],
    inventory: [],
    relationships: new Map(),
    knowledge: { knownFacts: new Set(), witnessedScenes: [], hearsay: [] },
    goals: [],
    ...overrides,
  }
}

export function createDefaultIdentity(overrides?: Partial<CharacterIdentity>): CharacterIdentity {
  return {
    name: '',
    description: '',
    personality: '',
    appearance: '',
    backstory: '',
    speechStyle: '',
    exampleDialogues: '',
    tags: [],
    ...overrides,
  }
}

export function createCharacter(overrides?: Partial<Character>): Character {
  return {
    id: generateId(),
    identity: createDefaultIdentity(),
    state: createDefaultCharacterState(),
    ...overrides,
  }
}

export function createSceneSetting(overrides?: Partial<SceneSetting>): SceneSetting {
  return {
    location: '',
    time: '正午',
    atmosphere: '',
    ...overrides,
  }
}

export function createScene(chapterId: string, overrides?: Partial<Scene>): Scene {
  return {
    id: generateId(),
    chapterId,
    setting: createSceneSetting(),
    participants: [],
    events: [],
    stateChanges: [],
    possibleTransitions: [],
    metadata: {
      createdAt: new Date().toISOString(),
      turnCount: 0,
      isCompleted: false,
    },
    ...overrides,
  }
}

export function createChapter(overrides?: Partial<Chapter>): Chapter {
  return {
    id: generateId(),
    title: '',
    synopsis: '',
    scenes: [],
    order: 0,
    ...overrides,
  }
}

export function createDefaultWorldState(overrides?: Partial<WorldState>): WorldState {
  return {
    locations: new Map(),
    factions: new Map(),
    flags: new Map(),
    timeline: [],
    currentTime: { day: 1, timeOfDay: '正午' },
    ...overrides,
  }
}

export function createDefaultPlotGraph(): PlotGraph {
  return {
    nodes: new Map(),
    edges: [],
    currentNodeId: '',
  }
}

export function createStory(overrides?: Partial<Story>): Story {
  const id = generateId()
  const now = new Date().toISOString()
  return {
    id,
    title: '未命名故事',
    synopsis: '',
    narratorStyle: createDefaultNarratorStyle(),
    chapters: [],
    characters: new Map(),
    worldState: createDefaultWorldState(),
    plotGraph: createDefaultPlotGraph(),
    loreEntries: [],
    metadata: {
      createdAt: now,
      updatedAt: now,
      totalScenes: 0,
      currentSceneId: '',
    },
    ...overrides,
  }
}
