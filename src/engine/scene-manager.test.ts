import { describe, it, expect } from 'vitest'
import { createTestStory } from '../test-utils/fixtures'
import {
  recordPlayerAction,
  recordPlayerDialogue,
  appendGeneratedEvents,
  recordStateChanges,
  transitionToNewScene,
  findScene,
  getRecentEvents,
  hasPendingChoice,
  resolveChoice,
} from './scene-manager'
import type { StoryEvent } from '../types/events'
import { generateId } from '../utils/id'

function getCurrentScene(story: ReturnType<typeof createTestStory>) {
  return findScene(story, story.metadata.currentSceneId)!
}

describe('recordPlayerAction', () => {
  it('adds an action event to the scene', () => {
    const story = createTestStory()
    const scene = getCurrentScene(story)
    const event = recordPlayerAction(scene, '向城门走去')
    expect(event.type).toBe('action')
    expect(scene.events.length).toBe(1)
    expect(scene.metadata.turnCount).toBe(1)
  })
})

describe('recordPlayerDialogue', () => {
  it('adds a dialogue event', () => {
    const story = createTestStory()
    const scene = getCurrentScene(story)
    const event = recordPlayerDialogue(scene, '你好，请问这里是王城吗？')
    expect(event.type).toBe('dialogue')
    if (event.type === 'dialogue') {
      expect(event.characterId).toBe('player')
    }
  })
})

describe('appendGeneratedEvents', () => {
  it('appends multiple events', () => {
    const story = createTestStory()
    const scene = getCurrentScene(story)
    const events: StoryEvent[] = [
      { type: 'narration', id: generateId(), content: '月光洒落...', timestamp: Date.now() },
      { type: 'dialogue', id: generateId(), characterId: 'npc', content: '小心前方', mood: '警觉', timestamp: Date.now() },
    ]
    appendGeneratedEvents(scene, events)
    expect(scene.events.length).toBe(2)
  })
})

describe('recordStateChanges', () => {
  it('records state changes', () => {
    const story = createTestStory()
    const scene = getCurrentScene(story)
    recordStateChanges(scene, [
      { type: 'relationship', characterA: 'player', characterB: 'npc', field: 'trust', delta: 10, reason: '帮助' },
    ])
    expect(scene.stateChanges.length).toBe(1)
  })
})

describe('transitionToNewScene', () => {
  it('creates a new scene and updates story state', () => {
    const story = createTestStory()
    const oldSceneId = story.metadata.currentSceneId
    const chapter = story.chapters[0]

    const result = transitionToNewScene(
      story,
      chapter,
      { location: '集市', time: '正午', atmosphere: '熙熙攘攘' },
      [],
      '穿过城门，来到集市',
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.setting.location).toBe('集市')
      expect(story.metadata.currentSceneId).toBe(result.value.id)
      expect(story.metadata.currentSceneId).not.toBe(oldSceneId)
      expect(story.metadata.totalScenes).toBe(2)

      // Old scene should be marked completed
      const oldScene = findScene(story, oldSceneId)
      expect(oldScene?.metadata.isCompleted).toBe(true)

      // Old scene should have a scene_change event
      const changeEvent = oldScene?.events.find(e => e.type === 'scene_change')
      expect(changeEvent).toBeTruthy()
    }
  })

  it('updates plot graph', () => {
    const story = createTestStory()
    const chapter = story.chapters[0]
    const nodesBefore = story.plotGraph.nodes.size

    transitionToNewScene(
      story,
      chapter,
      { location: '集市', time: '正午', atmosphere: '热闹' },
      [],
    )

    expect(story.plotGraph.nodes.size).toBe(nodesBefore + 1)
  })
})

describe('getRecentEvents', () => {
  it('returns last N events', () => {
    const story = createTestStory()
    const scene = getCurrentScene(story)
    for (let i = 0; i < 20; i++) {
      recordPlayerAction(scene, `动作 ${i}`)
    }
    const recent = getRecentEvents(scene, 5)
    expect(recent.length).toBe(5)
  })

  it('returns all events if less than N', () => {
    const story = createTestStory()
    const scene = getCurrentScene(story)
    recordPlayerAction(scene, '唯一的动作')
    const recent = getRecentEvents(scene, 15)
    expect(recent.length).toBe(1)
  })
})

describe('hasPendingChoice / resolveChoice', () => {
  it('detects pending choice', () => {
    const story = createTestStory()
    const scene = getCurrentScene(story)
    expect(hasPendingChoice(scene)).toBe(false)

    const choiceEvent: StoryEvent = {
      type: 'choice',
      id: generateId(),
      prompt: '你要怎么做？',
      options: [
        { id: 'opt-1', label: '拔剑', isGenerated: true },
        { id: 'opt-2', label: '谈判', isGenerated: true },
      ],
      allowFreeInput: true,
      timestamp: Date.now(),
    }
    scene.events.push(choiceEvent)
    expect(hasPendingChoice(scene)).toBe(true)
  })

  it('resolves a choice', () => {
    const story = createTestStory()
    const scene = getCurrentScene(story)
    const choiceEvent: StoryEvent = {
      type: 'choice',
      id: generateId(),
      prompt: '你要怎么做？',
      options: [
        { id: 'opt-1', label: '拔剑', isGenerated: true },
        { id: 'opt-2', label: '谈判', isGenerated: true },
      ],
      allowFreeInput: true,
      timestamp: Date.now(),
    }
    scene.events.push(choiceEvent)

    const result = resolveChoice(scene, 'opt-1')
    expect(result.ok).toBe(true)
    expect(hasPendingChoice(scene)).toBe(false)
  })

  it('fails for non-existent option', () => {
    const story = createTestStory()
    const scene = getCurrentScene(story)
    const choiceEvent: StoryEvent = {
      type: 'choice',
      id: generateId(),
      prompt: '选择',
      options: [{ id: 'opt-1', label: '唯一选项', isGenerated: true }],
      allowFreeInput: false,
      timestamp: Date.now(),
    }
    scene.events.push(choiceEvent)

    const result = resolveChoice(scene, 'fake-option')
    expect(result.ok).toBe(false)
  })

  it('fails when no pending choice', () => {
    const story = createTestStory()
    const scene = getCurrentScene(story)
    const result = resolveChoice(scene, 'opt-1')
    expect(result.ok).toBe(false)
  })
})
