import type { Story } from '../types/story'
import type { Character } from '../types/character'
import type { WorldState } from '../types/world'
import type { PlotGraph } from '../types/plot'
import type { StoryRecord } from './index'

/**
 * Replacer for JSON.stringify that handles Map and Set.
 * Maps become ["__MAP__", [...entries]], Sets become ["__SET__", [...values]].
 */
function mapSetReplacer(_key: string, value: unknown): unknown {
  if (value instanceof Map) {
    return ['__MAP__', [...value.entries()]]
  }
  if (value instanceof Set) {
    return ['__SET__', [...value.values()]]
  }
  return value
}

/**
 * Reviver for JSON.parse that restores Map and Set.
 */
function mapSetReviver(_key: string, value: unknown): unknown {
  if (Array.isArray(value) && value.length === 2) {
    if (value[0] === '__MAP__' && Array.isArray(value[1])) {
      return new Map(value[1] as Iterable<readonly [unknown, unknown]>)
    }
    if (value[0] === '__SET__' && Array.isArray(value[1])) {
      return new Set(value[1] as Iterable<unknown>)
    }
  }
  return value
}

export function serializeJson(data: unknown): string {
  return JSON.stringify(data, mapSetReplacer)
}

export function deserializeJson<T>(json: string): T {
  return JSON.parse(json, mapSetReviver) as T
}

export function storyToRecord(story: Story): StoryRecord {
  return {
    id: story.id,
    title: story.title,
    synopsis: story.synopsis,
    narratorStyleJson: serializeJson(story.narratorStyle),
    chaptersJson: serializeJson(story.chapters),
    charactersJson: serializeJson(story.characters),
    worldStateJson: serializeJson(story.worldState),
    plotGraphJson: serializeJson(story.plotGraph),
    loreEntriesJson: serializeJson(story.loreEntries),
    createdAt: story.metadata.createdAt,
    updatedAt: story.metadata.updatedAt,
    currentSceneId: story.metadata.currentSceneId,
  }
}

export function recordToStory(record: StoryRecord): Story {
  return {
    id: record.id,
    title: record.title,
    synopsis: record.synopsis,
    narratorStyle: deserializeJson(record.narratorStyleJson),
    chapters: deserializeJson(record.chaptersJson),
    characters: deserializeJson<Map<string, Character>>(record.charactersJson),
    worldState: deserializeJson<WorldState>(record.worldStateJson),
    plotGraph: deserializeJson<PlotGraph>(record.plotGraphJson),
    loreEntries: deserializeJson(record.loreEntriesJson),
    metadata: {
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      totalScenes: 0,
      currentSceneId: record.currentSceneId,
    },
  }
}
