import type { Story, Scene, Chapter } from '../types/story'
import type { StoryEvent } from '../types/events'
import type { StateChange } from '../types/state-change'
import { createScene } from './defaults'
import { addNode, addEdge, traverseEdge } from './plot-graph'
import { generateId } from '../utils/id'

export type SceneResult<T> = { ok: true; value: T } | { ok: false; error: string }

/** Record a player action as an event in the current scene */
export function recordPlayerAction(scene: Scene, content: string): StoryEvent {
  const event: StoryEvent = {
    type: 'action',
    id: generateId(),
    characterId: 'player',
    content,
    timestamp: Date.now(),
  }
  scene.events.push(event)
  scene.metadata.turnCount += 1
  return event
}

/** Record a player dialogue as an event */
export function recordPlayerDialogue(scene: Scene, content: string): StoryEvent {
  const event: StoryEvent = {
    type: 'dialogue',
    id: generateId(),
    characterId: 'player',
    content,
    timestamp: Date.now(),
  }
  scene.events.push(event)
  scene.metadata.turnCount += 1
  return event
}

/** Append LLM-generated events to the scene */
export function appendGeneratedEvents(scene: Scene, events: StoryEvent[]): void {
  for (const event of events) {
    scene.events.push(event)
  }
}

/** Apply state changes from events to the scene's stateChanges log */
export function recordStateChanges(scene: Scene, changes: StateChange[]): void {
  scene.stateChanges.push(...changes)
}

/** Create a new scene in the given chapter and transition to it */
export function transitionToNewScene(
  story: Story,
  chapter: Chapter,
  setting: Scene['setting'],
  participants: string[],
  transitionText?: string,
): SceneResult<Scene> {
  const currentSceneId = story.metadata.currentSceneId
  const currentScene = findScene(story, currentSceneId)

  // Create new scene
  const newScene = createScene(chapter.id, { setting, participants })
  chapter.scenes.push(newScene)
  story.metadata.totalScenes += 1

  // Add scene_change event to the old scene (if exists)
  if (currentScene) {
    currentScene.metadata.isCompleted = true
    const changeEvent: StoryEvent = {
      type: 'scene_change',
      id: generateId(),
      fromLocation: currentScene.setting.location,
      toLocation: setting.location,
      transitionText,
      timestamp: Date.now(),
    }
    currentScene.events.push(changeEvent)
  }

  // Update plot graph
  const newNode = addNode(story.plotGraph, newScene.id, setting.location || '新场景')
  if (newNode.ok) {
    const currentNode = findPlotNodeBySceneId(story, currentSceneId)
    if (currentNode) {
      addEdge(story.plotGraph, currentNode, newNode.value.id, transitionText)
    }
    traverseEdge(story.plotGraph, currentNode || '', newNode.value.id)
  }

  // Update current scene pointer
  story.metadata.currentSceneId = newScene.id

  return { ok: true, value: newScene }
}

/** Find a scene by ID across all chapters */
export function findScene(story: Story, sceneId: string): Scene | null {
  for (const chapter of story.chapters) {
    const scene = chapter.scenes.find(s => s.id === sceneId)
    if (scene) return scene
  }
  return null
}

/** Find the plot node ID associated with a scene */
function findPlotNodeBySceneId(story: Story, sceneId: string): string | null {
  for (const [nodeId, node] of story.plotGraph.nodes) {
    if (node.sceneId === sceneId) return nodeId
  }
  return null
}

/** Get the most recent events from the current scene */
export function getRecentEvents(scene: Scene, count: number = 15): StoryEvent[] {
  return scene.events.slice(-count)
}

/** Check if the scene has a pending choice (last event is an unresolved choice) */
export function hasPendingChoice(scene: Scene): boolean {
  if (scene.events.length === 0) return false
  const last = scene.events[scene.events.length - 1]
  return last.type === 'choice' && !last.selectedOptionId
}

/** Resolve a pending choice */
export function resolveChoice(
  scene: Scene,
  optionId: string,
): SceneResult<void> {
  const lastChoice = [...scene.events].reverse().find(
    e => e.type === 'choice' && !e.selectedOptionId,
  )
  if (!lastChoice || lastChoice.type !== 'choice') {
    return { ok: false, error: 'No pending choice to resolve' }
  }

  const option = lastChoice.options.find(o => o.id === optionId)
  if (!option) {
    return { ok: false, error: `Option ${optionId} not found` }
  }

  lastChoice.selectedOptionId = optionId
  return { ok: true, value: undefined }
}
