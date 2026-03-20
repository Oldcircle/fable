import { describe, it, expect } from 'vitest'
import { createTestStory, createTestCharacter } from '../test-utils/fixtures'
import { buildScenePrompt, getRelevantLore, formatEventsForPrompt } from './prompt-builder'
import { findScene } from './scene-manager'
import type { LoreEntry } from '../types/lore'
import type { StoryEvent } from '../types/events'
import { generateId } from '../utils/id'

describe('buildScenePrompt', () => {
  it('produces a non-empty message array', () => {
    const story = createTestStory()
    const scene = findScene(story, story.metadata.currentSceneId)!
    const messages = buildScenePrompt(story, scene)
    expect(messages.length).toBeGreaterThan(0)
    expect(messages[0].role).toBe('system')
  })

  it('includes narrator style in system prompt', () => {
    const story = createTestStory()
    const scene = findScene(story, story.metadata.currentSceneId)!
    const messages = buildScenePrompt(story, scene)
    const systemContent = messages[0].content
    expect(systemContent).toContain('第三人称全知')
    expect(systemContent).toContain('黑暗奇幻')
  })

  it('includes scene setting', () => {
    const story = createTestStory()
    const scene = findScene(story, story.metadata.currentSceneId)!
    const messages = buildScenePrompt(story, scene)
    const allContent = messages.map(m => m.content).join('\n')
    expect(allContent).toContain('城门')
    expect(allContent).toContain('黎明')
  })

  it('includes character snapshots for participants', () => {
    const story = createTestStory()
    const scene = findScene(story, story.metadata.currentSceneId)!
    const messages = buildScenePrompt(story, scene)
    const allContent = messages.map(m => m.content).join('\n')
    expect(allContent).toContain('Seraphina')
  })

  it('includes generation instructions', () => {
    const story = createTestStory()
    const scene = findScene(story, story.metadata.currentSceneId)!
    const messages = buildScenePrompt(story, scene)
    const lastMessage = messages[messages.length - 1]
    expect(lastMessage.role).toBe('user')
    expect(lastMessage.content).toContain('继续推进故事')
  })

  it('only injects facts the character knows', () => {
    const story = createTestStory()
    const scene = findScene(story, story.metadata.currentSceneId)!

    // Find a character
    const chars = [...story.characters.values()]
    const seraphina = chars.find(c => c.identity.name === 'Seraphina')!
    seraphina.state.knowledge.knownFacts = new Set(['城堡东翼被摧毁'])

    const messages = buildScenePrompt(story, scene, seraphina)
    const allContent = messages.map(m => m.content).join('\n')

    expect(allContent).toContain('城堡东翼被摧毁')
  })

  it('includes character mood and goals in snapshot', () => {
    const story = createTestStory()
    const scene = findScene(story, story.metadata.currentSceneId)!
    const seraphina = [...story.characters.values()].find(c => c.identity.name === 'Seraphina')!
    seraphina.state.mood = '警觉'
    seraphina.state.goals = [{ id: 'g1', description: '寻找弟弟', status: 'active', priority: 8, relatedScenes: [] }]

    const messages = buildScenePrompt(story, scene, seraphina)
    const allContent = messages.map(m => m.content).join('\n')

    expect(allContent).toContain('警觉')
    expect(allContent).toContain('寻找弟弟')
  })
})

describe('getRelevantLore', () => {
  const baseLore: LoreEntry[] = [
    {
      id: '1', name: 'Magic', content: '魔法系统的规则', triggerKeywords: ['魔法', 'magic'],
      isConstant: false, probability: 1,
    },
    {
      id: '2', name: 'History', content: '古代历史', triggerKeywords: ['历史', 'ancient'],
      isConstant: false, probability: 1,
    },
    {
      id: '3', name: 'Rules', content: '世界规则', triggerKeywords: [],
      isConstant: true, probability: 1,
    },
  ]

  it('returns constant entries regardless of keywords', () => {
    const story = createTestStory()
    const scene = findScene(story, story.metadata.currentSceneId)!
    const relevant = getRelevantLore(scene, undefined, baseLore)
    expect(relevant).toContain('世界规则')
  })

  it('matches entries by keyword in scene text', () => {
    const story = createTestStory()
    const scene = findScene(story, story.metadata.currentSceneId)!
    scene.setting.atmosphere = '一股魔法的气息弥漫'
    const relevant = getRelevantLore(scene, undefined, baseLore)
    expect(relevant).toContain('魔法系统的规则')
  })

  it('filters by character knowledge when requiresKnowledge is true', () => {
    const story = createTestStory()
    const scene = findScene(story, story.metadata.currentSceneId)!
    scene.setting.atmosphere = '一股魔法的气息弥漫'

    const lore: LoreEntry[] = [{
      id: '1', name: 'Secret Magic', content: '秘密魔法',
      triggerKeywords: ['魔法'], isConstant: false, probability: 1,
      requiresKnowledge: true,
    }]

    const charWithKnowledge = createTestCharacter()
    charWithKnowledge.state.knowledge.knownFacts.add('懂得魔法')
    const relevant1 = getRelevantLore(scene, charWithKnowledge, lore)
    expect(relevant1).toContain('秘密魔法')

    const charWithout = createTestCharacter()
    charWithout.state.knowledge.knownFacts = new Set(['只知道剑术'])
    const relevant2 = getRelevantLore(scene, charWithout, lore)
    expect(relevant2).not.toContain('秘密魔法')
  })
})

describe('formatEventsForPrompt', () => {
  it('formats different event types', () => {
    const events: StoryEvent[] = [
      { type: 'narration', id: generateId(), content: '月光洒落', timestamp: 1 },
      { type: 'dialogue', id: generateId(), characterId: 'npc', content: '你好', mood: '友好', timestamp: 2 },
      { type: 'action', id: generateId(), characterId: 'player', content: '拔剑', timestamp: 3 },
    ]
    const formatted = formatEventsForPrompt(events)
    expect(formatted).toContain('[旁白] 月光洒落')
    expect(formatted).toContain('[对话:npc (友好)] 你好')
    expect(formatted).toContain('[动作:player] 拔剑')
  })

  it('formats choice events', () => {
    const events: StoryEvent[] = [
      {
        type: 'choice', id: generateId(), prompt: '怎么做？',
        options: [{ id: 'o1', label: '战斗', isGenerated: true }],
        allowFreeInput: true, timestamp: 1,
      },
    ]
    const formatted = formatEventsForPrompt(events)
    expect(formatted).toContain('[选择] 怎么做？')
    expect(formatted).toContain('(待选)')
  })

  it('formats scene_change events', () => {
    const events: StoryEvent[] = [
      {
        type: 'scene_change', id: generateId(),
        fromLocation: '城门', toLocation: '集市',
        transitionText: '穿过人群', timestamp: 1,
      },
    ]
    const formatted = formatEventsForPrompt(events)
    expect(formatted).toContain('城门 → 集市')
    expect(formatted).toContain('穿过人群')
  })
})
