import { describe, it, expect } from 'vitest'
import { extractStateChanges, applySingleChange, applyStateChanges } from './state-updater'
import { createTestStory } from '../test-utils/fixtures'
import { addFaction } from './world-state'
import { generateId } from '../utils/id'
import type { StoryEvent } from '../types/events'
import type { StateChange } from '../types/state-change'

function getFirstCharId(story: ReturnType<typeof createTestStory>): string {
  return story.characters.keys().next().value!
}

function getSecondCharId(story: ReturnType<typeof createTestStory>): string {
  const iter = story.characters.keys()
  iter.next()
  return iter.next().value!
}

describe('extractStateChanges', () => {
  it('extracts from ActionEvent.consequences', () => {
    const events: StoryEvent[] = [
      {
        type: 'action',
        id: '1',
        characterId: 'a',
        content: '挥剑',
        consequences: [{ type: 'world_flag', key: 'battle', value: true, reason: '战斗开始' }],
        timestamp: 1,
      },
    ]
    expect(extractStateChanges(events)).toHaveLength(1)
    expect(extractStateChanges(events)[0].type).toBe('world_flag')
  })

  it('extracts from StateChangeEvent.changes', () => {
    const events: StoryEvent[] = [
      {
        type: 'state_change',
        id: '1',
        changes: [
          { type: 'character_state', characterId: 'a', field: 'mood', value: '愤怒', reason: '' },
          { type: 'world_flag', key: 'alert', value: true, reason: '' },
        ],
        displayText: '状态变化',
        timestamp: 1,
      },
    ]
    expect(extractStateChanges(events)).toHaveLength(2)
  })

  it('extracts from selected ChoiceOption', () => {
    const events: StoryEvent[] = [
      {
        type: 'choice',
        id: '1',
        prompt: '怎么做？',
        options: [
          {
            id: 'opt1',
            label: '战斗',
            isGenerated: true,
            stateChanges: [{ type: 'world_flag', key: 'combat', value: true, reason: '选择战斗' }],
          },
          { id: 'opt2', label: '逃跑', isGenerated: true },
        ],
        selectedOptionId: 'opt1',
        allowFreeInput: false,
        timestamp: 1,
      },
    ]
    expect(extractStateChanges(events)).toHaveLength(1)
  })

  it('ignores unselected choice options', () => {
    const events: StoryEvent[] = [
      {
        type: 'choice',
        id: '1',
        prompt: '怎么做？',
        options: [
          {
            id: 'opt1',
            label: '战斗',
            isGenerated: true,
            stateChanges: [{ type: 'world_flag', key: 'combat', value: true, reason: '' }],
          },
        ],
        allowFreeInput: false,
        timestamp: 1,
      },
    ]
    expect(extractStateChanges(events)).toHaveLength(0)
  })

  it('returns empty for events with no changes', () => {
    const events: StoryEvent[] = [
      { type: 'narration', id: '1', content: '月光洒落', timestamp: 1 },
      { type: 'dialogue', id: '2', characterId: 'a', content: '你好', timestamp: 2 },
    ]
    expect(extractStateChanges(events)).toHaveLength(0)
  })
})

describe('applySingleChange', () => {
  it('applies relationship change', () => {
    const story = createTestStory()
    const charA = getFirstCharId(story)
    const charB = getSecondCharId(story)

    const change: StateChange = {
      type: 'relationship',
      characterA: charA,
      characterB: charB,
      field: 'trust',
      delta: 10,
      reason: '并肩作战',
    }

    const error = applySingleChange(story, change)
    expect(error).toBeUndefined()

    const rel = story.characters.get(charA)!.state.relationships.get(charB)
    expect(rel).toBeDefined()
    expect(rel!.trust).toBe(60) // default 50 + 10
    expect(rel!.history).toContain('并肩作战')
  })

  it('applies character mood change', () => {
    const story = createTestStory()
    const charId = getFirstCharId(story)

    const error = applySingleChange(story, {
      type: 'character_state',
      characterId: charId,
      field: 'mood',
      value: '警觉',
      reason: '',
    })

    expect(error).toBeUndefined()
    expect(story.characters.get(charId)!.state.mood).toBe('警觉')
  })

  it('applies character location change', () => {
    const story = createTestStory()
    const charId = getFirstCharId(story)

    applySingleChange(story, {
      type: 'character_state',
      characterId: charId,
      field: 'location',
      value: '集市',
      reason: '',
    })

    expect(story.characters.get(charId)!.state.location).toBe('集市')
  })

  it('applies addCondition', () => {
    const story = createTestStory()
    const charId = getFirstCharId(story)

    applySingleChange(story, {
      type: 'character_state',
      characterId: charId,
      field: 'addCondition',
      value: '中毒',
      reason: '',
    })

    expect(story.characters.get(charId)!.state.conditions).toContain('中毒')
  })

  it('applies removeCondition', () => {
    const story = createTestStory()
    const charId = getFirstCharId(story)
    story.characters.get(charId)!.state.conditions.push('中毒')

    applySingleChange(story, {
      type: 'character_state',
      characterId: charId,
      field: 'removeCondition',
      value: '中毒',
      reason: '',
    })

    expect(story.characters.get(charId)!.state.conditions).not.toContain('中毒')
  })

  it('applies world_flag change', () => {
    const story = createTestStory()

    applySingleChange(story, {
      type: 'world_flag',
      key: 'dragon_awake',
      value: true,
      reason: '龙被唤醒',
    })

    expect(story.worldState.flags.get('dragon_awake')).toBe(true)
  })

  it('applies location_state modifier', () => {
    const story = createTestStory()
    const locationId = story.worldState.locations.keys().next().value!

    applySingleChange(story, {
      type: 'location_state',
      locationId,
      modifier: '浓烟弥漫',
      reason: '火灾',
    })

    const loc = story.worldState.locations.get(locationId)!
    expect(loc.stateModifiers).toHaveLength(1)
    expect(loc.stateModifiers[0].description).toBe('浓烟弥漫')
  })

  it('applies inventory add', () => {
    const story = createTestStory()
    const charId = getFirstCharId(story)

    applySingleChange(story, {
      type: 'inventory',
      characterId: charId,
      action: 'add',
      item: { id: 'sword1', name: '铁剑', description: '普通的铁剑' },
      reason: '拾取',
    })

    const char = story.characters.get(charId)!
    expect(char.state.inventory.some(i => i.name === '铁剑')).toBe(true)
  })

  it('applies inventory remove', () => {
    const story = createTestStory()
    const charId = getFirstCharId(story)
    const char = story.characters.get(charId)!
    const itemId = generateId()
    char.state.inventory.push({ id: itemId, name: '铁剑', description: '普通的铁剑' })

    applySingleChange(story, {
      type: 'inventory',
      characterId: charId,
      action: 'remove',
      item: { id: itemId, name: '铁剑', description: '普通的铁剑' },
      reason: '丢弃',
    })

    expect(char.state.inventory.find(i => i.id === itemId)).toBeUndefined()
  })

  it('applies goal status change', () => {
    const story = createTestStory()
    const charId = getFirstCharId(story)

    applySingleChange(story, {
      type: 'goal',
      characterId: charId,
      goalId: 'g1',
      newStatus: 'completed',
      reason: '找到了弟弟',
    })

    const goal = story.characters.get(charId)!.state.goals.find(g => g.id === 'g1')
    expect(goal!.status).toBe('completed')
  })

  it('applies knowledge (witnessed)', () => {
    const story = createTestStory()
    const charId = getFirstCharId(story)

    applySingleChange(story, {
      type: 'knowledge',
      characterId: charId,
      fact: '国王已死',
      source: 'witnessed',
    })

    expect(story.characters.get(charId)!.state.knowledge.knownFacts.has('国王已死')).toBe(true)
  })

  it('applies knowledge (told) — adds hearsay too', () => {
    const story = createTestStory()
    const charId = getFirstCharId(story)

    applySingleChange(story, {
      type: 'knowledge',
      characterId: charId,
      fact: '北方有叛乱',
      source: 'told',
    })

    const char = story.characters.get(charId)!
    expect(char.state.knowledge.knownFacts.has('北方有叛乱')).toBe(true)
    expect(char.state.knowledge.hearsay.some(h => h.content === '北方有叛乱')).toBe(true)
  })

  it('applies faction change — addMember', () => {
    const story = createTestStory()
    const faction = addFaction(story.worldState, '守卫团', '城堡的守卫力量')
    const charId = getFirstCharId(story)

    applySingleChange(story, {
      type: 'faction',
      factionId: faction.id,
      field: 'addMember',
      value: charId,
      reason: '加入守卫团',
    })

    expect(faction.members).toContain(charId)
  })

  it('applies faction change — removeMember', () => {
    const story = createTestStory()
    const charId = getFirstCharId(story)
    const faction = addFaction(story.worldState, '守卫团', '城堡的守卫力量')
    faction.members.push(charId)

    applySingleChange(story, {
      type: 'faction',
      factionId: faction.id,
      field: 'removeMember',
      value: charId,
      reason: '退出守卫团',
    })

    expect(faction.members).not.toContain(charId)
  })

  it('returns error for missing character', () => {
    const story = createTestStory()
    const error = applySingleChange(story, {
      type: 'character_state',
      characterId: 'nonexistent',
      field: 'mood',
      value: '愤怒',
      reason: '',
    })
    expect(error).toContain('not found')
  })

  it('returns error for missing faction', () => {
    const story = createTestStory()
    const error = applySingleChange(story, {
      type: 'faction',
      factionId: 'nonexistent',
      field: 'name',
      value: 'test',
      reason: '',
    })
    expect(error).toContain('not found')
  })
})

describe('applyStateChanges', () => {
  it('applies all changes from events', () => {
    const story = createTestStory()
    const charId = getFirstCharId(story)

    const events: StoryEvent[] = [
      {
        type: 'state_change',
        id: '1',
        changes: [
          { type: 'character_state', characterId: charId, field: 'mood', value: '兴奋', reason: '' },
          { type: 'world_flag', key: 'quest_started', value: true, reason: '' },
        ],
        displayText: '冒险开始',
        timestamp: 1,
      },
    ]

    const result = applyStateChanges(story, events)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.applied).toBe(2)

    expect(story.characters.get(charId)!.state.mood).toBe('兴奋')
    expect(story.worldState.flags.get('quest_started')).toBe(true)
  })

  it('returns applied 0 for no changes', () => {
    const story = createTestStory()
    const events: StoryEvent[] = [
      { type: 'narration', id: '1', content: '风吹过', timestamp: 1 },
    ]

    const result = applyStateChanges(story, events)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.applied).toBe(0)
  })

  it('continues on partial failures', () => {
    const story = createTestStory()
    const charId = getFirstCharId(story)

    const events: StoryEvent[] = [
      {
        type: 'state_change',
        id: '1',
        changes: [
          { type: 'character_state', characterId: charId, field: 'mood', value: '恐惧', reason: '' },
          { type: 'character_state', characterId: 'nonexistent', field: 'mood', value: '愤怒', reason: '' },
        ],
        displayText: '',
        timestamp: 1,
      },
    ]

    const result = applyStateChanges(story, events)
    // At least one applied, so ok: true
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.applied).toBe(1)
    expect(story.characters.get(charId)!.state.mood).toBe('恐惧')
  })

  it('returns error when all changes fail', () => {
    const story = createTestStory()

    const events: StoryEvent[] = [
      {
        type: 'state_change',
        id: '1',
        changes: [
          { type: 'character_state', characterId: 'nonexistent', field: 'mood', value: '愤怒', reason: '' },
        ],
        displayText: '',
        timestamp: 1,
      },
    ]

    const result = applyStateChanges(story, events)
    expect(result.ok).toBe(false)
  })
})
