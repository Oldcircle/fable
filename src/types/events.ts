import type { StateChange } from './state-change'

export type StoryEvent =
  | NarrationEvent
  | DialogueEvent
  | ActionEvent
  | ChoiceEvent
  | SceneChangeEvent
  | StateChangeEvent
  | InternalEvent
  | SystemEvent

export interface NarrationEvent {
  type: 'narration'
  id: string
  content: string
  timestamp: number
}

export interface DialogueEvent {
  type: 'dialogue'
  id: string
  characterId: string
  content: string
  mood?: string
  isWhisper?: boolean
  timestamp: number
}

export interface ActionEvent {
  type: 'action'
  id: string
  characterId: string
  content: string
  consequences?: StateChange[]
  timestamp: number
}

export interface ChoiceEvent {
  type: 'choice'
  id: string
  prompt: string
  options: ChoiceOption[]
  selectedOptionId?: string
  allowFreeInput: boolean
  timestamp: number
}

export interface ChoiceOption {
  id: string
  label: string
  description?: string
  nextSceneId?: string
  stateChanges?: StateChange[]
  isGenerated: boolean
}

export interface SceneChangeEvent {
  type: 'scene_change'
  id: string
  fromLocation: string
  toLocation: string
  transitionText?: string
  timePassed?: string
  timestamp: number
}

export interface StateChangeEvent {
  type: 'state_change'
  id: string
  changes: StateChange[]
  displayText: string
  timestamp: number
}

export interface InternalEvent {
  type: 'internal'
  id: string
  characterId: string
  content: string
  timestamp: number
}

export interface SystemEvent {
  type: 'system'
  id: string
  content: string
  timestamp: number
}
