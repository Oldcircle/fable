import type { Character } from './character'
import type { WorldState } from './world'
import type { PlotGraph } from './plot'
import type { StoryEvent } from './events'
import type { StateChange } from './state-change'
import type { LoreEntry } from './lore'

export interface Story {
  id: string
  title: string
  synopsis: string
  narratorStyle: NarratorStyle
  chapters: Chapter[]
  characters: Map<string, Character>
  worldState: WorldState
  plotGraph: PlotGraph
  loreEntries: LoreEntry[]
  metadata: {
    createdAt: string
    updatedAt: string
    totalScenes: number
    currentSceneId: string
  }
}

export interface NarratorStyle {
  voice: string
  tone: string
  language: string
  customInstructions: string
}

export interface Chapter {
  id: string
  title: string
  synopsis: string
  scenes: Scene[]
  order: number
}

export interface Scene {
  id: string
  chapterId: string
  setting: SceneSetting
  participants: string[]
  events: StoryEvent[]
  stateChanges: StateChange[]
  possibleTransitions: SceneTransition[]
  metadata: {
    createdAt: string
    turnCount: number
    isCompleted: boolean
  }
}

export interface SceneSetting {
  location: string
  time: string
  atmosphere: string
  weatherOrCondition?: string
}

export interface SceneTransition {
  targetSceneId: string
  condition?: string
  label?: string
}

// Re-exports for convenience
export type { Character, CharacterState, Relationship, CharacterKnowledge, CharacterGoal, Item } from './character'
export type { WorldState, Location, Faction, WorldEvent } from './world'
export type { PlotGraph, PlotNode, PlotEdge } from './plot'
export type { StoryEvent, NarrationEvent, DialogueEvent, ActionEvent, ChoiceEvent, SceneChangeEvent, StateChangeEvent, InternalEvent, SystemEvent, ChoiceOption } from './events'
export type { StateChange } from './state-change'
export type { LoreEntry } from './lore'
