import type { StoryEvent, ChoiceOption } from '../types/events'
import type { StateChange } from '../types/state-change'
import { generateId } from '../utils/id'

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string }

interface RawEvent {
  type: string
  content?: string
  characterId?: string
  mood?: string
  isWhisper?: boolean
  prompt?: string
  options?: Array<{ label: string; description?: string }>
  allowFreeInput?: boolean
  fromLocation?: string
  toLocation?: string
  transitionText?: string
  timePassed?: string
  displayText?: string
  changes?: unknown[]
}

/**
 * Parse LLM response text into a sequence of StoryEvents.
 * Expects a JSON array of event objects.
 * Handles common LLM quirks: markdown code fences, trailing text, etc.
 */
export function parseStoryboardResponse(responseText: string): ParseResult<StoryEvent[]> {
  const cleaned = extractJson(responseText)
  if (!cleaned) {
    return { ok: false, error: 'No JSON array found in response' }
  }

  let raw: unknown
  try {
    raw = JSON.parse(cleaned)
  } catch {
    return { ok: false, error: 'Failed to parse JSON from response' }
  }

  if (!Array.isArray(raw)) {
    return { ok: false, error: 'Response is not a JSON array' }
  }

  const events: StoryEvent[] = []
  for (const item of raw) {
    const event = rawToStoryEvent(item as RawEvent)
    if (event) events.push(event)
  }

  if (events.length === 0) {
    return { ok: false, error: 'No valid events parsed from response' }
  }

  return { ok: true, value: events }
}

/** Extract a JSON array from LLM response, handling code fences and surrounding text */
function extractJson(text: string): string | null {
  // Try to extract from markdown code fence
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
  if (fenceMatch) {
    return fenceMatch[1].trim()
  }

  // Try to find a raw JSON array
  const arrayMatch = text.match(/\[[\s\S]*\]/)
  if (arrayMatch) {
    return arrayMatch[0]
  }

  return null
}

function rawToStoryEvent(raw: RawEvent): StoryEvent | null {
  const timestamp = Date.now()
  const id = generateId()

  switch (raw.type) {
    case 'narration':
      if (!raw.content) return null
      return { type: 'narration', id, content: raw.content, timestamp }

    case 'dialogue':
      if (!raw.content || !raw.characterId) return null
      return {
        type: 'dialogue', id,
        characterId: raw.characterId,
        content: raw.content,
        mood: raw.mood,
        isWhisper: raw.isWhisper,
        timestamp,
      }

    case 'action':
      if (!raw.content || !raw.characterId) return null
      return {
        type: 'action', id,
        characterId: raw.characterId,
        content: raw.content,
        timestamp,
      }

    case 'choice':
      if (!raw.prompt || !raw.options?.length) return null
      return {
        type: 'choice', id,
        prompt: raw.prompt,
        options: raw.options.map((opt): ChoiceOption => ({
          id: generateId(),
          label: opt.label,
          description: opt.description,
          isGenerated: true,
        })),
        allowFreeInput: raw.allowFreeInput ?? true,
        timestamp,
      }

    case 'scene_change':
      if (!raw.fromLocation || !raw.toLocation) return null
      return {
        type: 'scene_change', id,
        fromLocation: raw.fromLocation,
        toLocation: raw.toLocation,
        transitionText: raw.transitionText,
        timePassed: raw.timePassed,
        timestamp,
      }

    case 'state_change':
      if (!raw.displayText) return null
      return {
        type: 'state_change', id,
        changes: (raw.changes || []) as StateChange[],
        displayText: raw.displayText,
        timestamp,
      }

    case 'internal':
      if (!raw.content || !raw.characterId) return null
      return {
        type: 'internal', id,
        characterId: raw.characterId,
        content: raw.content,
        timestamp,
      }

    default:
      return null
  }
}
