import { describe, it, expect } from 'vitest'
import {
  createStory,
  createCharacter,
  createChapter,
  createScene,
  createDefaultCharacterState,
  createDefaultWorldState,
  createDefaultPlotGraph,
  createDefaultNarratorStyle,
} from './defaults'

describe('createStory', () => {
  it('creates a story with all required fields', () => {
    const story = createStory()
    expect(story.id).toBeTruthy()
    expect(story.title).toBe('未命名故事')
    expect(story.chapters).toEqual([])
    expect(story.characters).toBeInstanceOf(Map)
    expect(story.worldState.locations).toBeInstanceOf(Map)
    expect(story.plotGraph.nodes).toBeInstanceOf(Map)
    expect(story.metadata.createdAt).toBeTruthy()
  })

  it('accepts overrides', () => {
    const story = createStory({ title: '幽暗森林' })
    expect(story.title).toBe('幽暗森林')
    expect(story.id).toBeTruthy()
  })
})

describe('createCharacter', () => {
  it('creates a character with default state', () => {
    const char = createCharacter()
    expect(char.id).toBeTruthy()
    expect(char.state.mood).toBe('平静')
    expect(char.state.relationships).toBeInstanceOf(Map)
    expect(char.state.knowledge.knownFacts).toBeInstanceOf(Set)
  })

  it('accepts identity overrides', () => {
    const char = createCharacter({
      identity: {
        name: 'Seraphina',
        description: 'A wise elven guide',
        personality: 'Kind but cautious',
        appearance: 'Pink hair, amber eyes',
        backstory: 'Guardian of Eldoria',
        speechStyle: 'Gentle and formal',
        exampleDialogues: '',
        tags: ['elf', 'guide'],
      },
    })
    expect(char.identity.name).toBe('Seraphina')
    expect(char.identity.tags).toContain('elf')
  })
})

describe('createChapter', () => {
  it('creates a chapter with empty scenes', () => {
    const chapter = createChapter({ title: '序章', order: 0 })
    expect(chapter.title).toBe('序章')
    expect(chapter.scenes).toEqual([])
    expect(chapter.order).toBe(0)
  })
})

describe('createScene', () => {
  it('creates a scene linked to a chapter', () => {
    const scene = createScene('ch-1')
    expect(scene.chapterId).toBe('ch-1')
    expect(scene.events).toEqual([])
    expect(scene.metadata.isCompleted).toBe(false)
    expect(scene.metadata.turnCount).toBe(0)
  })

  it('accepts setting overrides', () => {
    const scene = createScene('ch-1', {
      setting: { location: '城门', time: '黎明', atmosphere: '薄雾弥漫' },
    })
    expect(scene.setting.location).toBe('城门')
    expect(scene.setting.time).toBe('黎明')
  })
})

describe('createDefaultCharacterState', () => {
  it('has empty collections', () => {
    const state = createDefaultCharacterState()
    expect(state.conditions).toEqual([])
    expect(state.inventory).toEqual([])
    expect(state.goals).toEqual([])
    expect(state.knowledge.witnessedScenes).toEqual([])
  })
})

describe('createDefaultWorldState', () => {
  it('starts at day 1 noon', () => {
    const world = createDefaultWorldState()
    expect(world.currentTime.day).toBe(1)
    expect(world.currentTime.timeOfDay).toBe('正午')
  })
})

describe('createDefaultPlotGraph', () => {
  it('has empty nodes and edges', () => {
    const graph = createDefaultPlotGraph()
    expect(graph.nodes.size).toBe(0)
    expect(graph.edges).toEqual([])
    expect(graph.currentNodeId).toBe('')
  })
})

describe('createDefaultNarratorStyle', () => {
  it('defaults to third person omniscient', () => {
    const style = createDefaultNarratorStyle()
    expect(style.voice).toBe('第三人称全知')
    expect(style.language).toBe('zh-CN')
  })

  it('accepts overrides', () => {
    const style = createDefaultNarratorStyle({ tone: '轻松日常' })
    expect(style.tone).toBe('轻松日常')
    expect(style.voice).toBe('第三人称全知')
  })
})
