import { describe, it, expect } from 'vitest'
import { serializeJson, deserializeJson, storyToRecord, recordToStory } from './serialization'
import { createStory, createCharacter } from '../engine/defaults'

describe('serializeJson / deserializeJson', () => {
  it('round-trips a Map', () => {
    const map = new Map([['a', 1], ['b', 2]])
    const json = serializeJson(map)
    const restored = deserializeJson<Map<string, number>>(json)
    expect(restored).toBeInstanceOf(Map)
    expect(restored.get('a')).toBe(1)
    expect(restored.get('b')).toBe(2)
  })

  it('round-trips a Set', () => {
    const set = new Set(['x', 'y', 'z'])
    const json = serializeJson(set)
    const restored = deserializeJson<Set<string>>(json)
    expect(restored).toBeInstanceOf(Set)
    expect(restored.has('x')).toBe(true)
    expect(restored.size).toBe(3)
  })

  it('round-trips nested Map/Set in objects', () => {
    const data = {
      items: new Map([['key', new Set([1, 2, 3])]]),
    }
    const json = serializeJson(data)
    const restored = deserializeJson<typeof data>(json)
    expect(restored.items).toBeInstanceOf(Map)
    const inner = restored.items.get('key')
    expect(inner).toBeInstanceOf(Set)
    expect(inner!.has(2)).toBe(true)
  })

  it('handles plain objects and arrays normally', () => {
    const data = { name: 'test', tags: [1, 2, 3] }
    const json = serializeJson(data)
    const restored = deserializeJson<typeof data>(json)
    expect(restored).toEqual(data)
  })
})

describe('storyToRecord / recordToStory', () => {
  it('round-trips a story with characters', () => {
    const story = createStory({ title: '测试故事' })
    const char = createCharacter({
      identity: {
        name: 'Seraphina',
        description: 'Elf guide',
        personality: 'Kind',
        appearance: 'Pink hair',
        backstory: 'Guardian',
        speechStyle: 'Formal',
        exampleDialogues: '',
        tags: ['elf'],
      },
    })
    char.state.knowledge.knownFacts.add('城堡东翼被摧毁')
    char.state.relationships.set('player', {
      characterId: 'player',
      trust: 60,
      disposition: '友好',
      history: ['首次相遇'],
    })
    story.characters.set(char.id, char)

    const record = storyToRecord(story)
    expect(typeof record.charactersJson).toBe('string')

    const restored = recordToStory(record)
    expect(restored.title).toBe('测试故事')
    expect(restored.characters).toBeInstanceOf(Map)
    expect(restored.characters.size).toBe(1)

    const restoredChar = restored.characters.get(char.id)!
    expect(restoredChar.identity.name).toBe('Seraphina')
    expect(restoredChar.state.knowledge.knownFacts).toBeInstanceOf(Set)
    expect(restoredChar.state.knowledge.knownFacts.has('城堡东翼被摧毁')).toBe(true)
    expect(restoredChar.state.relationships).toBeInstanceOf(Map)
    expect(restoredChar.state.relationships.get('player')?.trust).toBe(60)
  })

  it('round-trips world state with locations', () => {
    const story = createStory()
    story.worldState.locations.set('castle', {
      id: 'castle',
      name: '王城',
      baseDescription: '巍峨的城堡',
      currentState: '战后废墟',
      stateModifiers: [{ description: '东翼倒塌', causeSceneId: 's1', timestamp: 100 }],
      connectedTo: ['village'],
      characters: ['guard-1'],
      tags: ['castle', '王城'],
    })
    story.worldState.flags.set('war_started', true)

    const record = storyToRecord(story)
    const restored = recordToStory(record)

    expect(restored.worldState.locations).toBeInstanceOf(Map)
    expect(restored.worldState.locations.get('castle')?.name).toBe('王城')
    expect(restored.worldState.flags).toBeInstanceOf(Map)
    expect(restored.worldState.flags.get('war_started')).toBe(true)
  })
})
