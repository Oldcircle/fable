import type { Story, Scene } from '../types/story'
import type { StoryEvent } from '../types/events'
import type { LLMAdapter } from '../types/adapter'
import { buildScenePrompt } from './prompt-builder'
import { parseStoryboardResponse } from './response-parser'
import { appendGeneratedEvents } from './scene-manager'
import { applyStateChanges } from './state-updater'

export type GenerateResult =
  | { ok: true; events: StoryEvent[] }
  | { ok: false; error: string }

/**
 * Generate the next story events for a scene.
 * This is the main orchestration function:
 * 1. Build prompt from current story state
 * 2. Call LLM adapter
 * 3. Parse response into events
 * 4. Append events to scene
 */
export async function generateNextEvents(
  story: Story,
  scene: Scene,
  adapter: LLMAdapter,
): Promise<GenerateResult> {
  // Find the first participant character for knowledge-filtered prompt
  const targetChar = scene.participants.length > 0
    ? story.characters.get(scene.participants[0])
    : undefined

  // 1. Build prompt
  const messages = buildScenePrompt(story, scene, targetChar)

  // 2. Call LLM
  let responseText: string
  try {
    const response = await adapter.generate(messages)
    responseText = response.content
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'LLM call failed' }
  }

  // 3. Parse response
  const parseResult = parseStoryboardResponse(responseText)
  if (!parseResult.ok) {
    return { ok: false, error: parseResult.error }
  }

  // 4. Append events to scene
  appendGeneratedEvents(scene, parseResult.value)

  // 5. Apply state changes from events to story
  applyStateChanges(story, parseResult.value)

  return { ok: true, events: parseResult.value }
}

/**
 * Generate with streaming — yields partial text, then returns parsed events.
 */
export async function generateNextEventsStreaming(
  story: Story,
  scene: Scene,
  adapter: LLMAdapter,
  onChunk: (text: string) => void,
): Promise<GenerateResult> {
  if (!adapter.stream) {
    return generateNextEvents(story, scene, adapter)
  }

  const targetChar = scene.participants.length > 0
    ? story.characters.get(scene.participants[0])
    : undefined

  const messages = buildScenePrompt(story, scene, targetChar)

  let fullText = ''
  try {
    for await (const chunk of adapter.stream(messages)) {
      fullText += chunk
      onChunk(chunk)
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'LLM stream failed' }
  }

  const parseResult = parseStoryboardResponse(fullText)
  if (!parseResult.ok) {
    return { ok: false, error: parseResult.error }
  }

  appendGeneratedEvents(scene, parseResult.value)

  // Apply state changes from events to story
  applyStateChanges(story, parseResult.value)

  return { ok: true, events: parseResult.value }
}
