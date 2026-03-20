import type { Character } from '../types/character'
import type { Story } from '../types/story'
import { createStory, createCharacter, createChapter, createScene, createDefaultWorldState } from '../engine/defaults'
import { addLocation, connectLocations } from '../engine/world-state'
import { addNode } from '../engine/plot-graph'

export function createTestCharacter(overrides?: Partial<Character>): Character {
  return createCharacter({
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
    state: {
      location: '城门',
      mood: '平静',
      conditions: [],
      inventory: [],
      relationships: new Map(),
      knowledge: { knownFacts: new Set(['城堡东翼被摧毁']), witnessedScenes: [], hearsay: [] },
      goals: [{ id: 'g1', description: '寻找弟弟', status: 'active', priority: 8, relatedScenes: [] }],
    },
    ...overrides,
  })
}

export function createTestStory(): Story {
  const story = createStory({ title: '幽暗森林冒险' })

  // Add characters
  const seraphina = createTestCharacter()
  const guard = createCharacter({
    identity: {
      name: '守卫',
      description: '城门守卫',
      personality: '严肃负责',
      appearance: '铁甲，高大',
      backstory: '忠诚的王城守卫',
      speechStyle: '简洁直接',
      exampleDialogues: '',
      tags: ['guard', 'npc'],
    },
  })
  story.characters.set(seraphina.id, seraphina)
  story.characters.set(guard.id, guard)

  // Build world
  const world = createDefaultWorldState()
  const gate = addLocation(world, '城门', '高大的石门，刻有古老的符文')
  const market = addLocation(world, '集市', '熙熙攘攘的市场')
  const castle = addLocation(world, '王城', '巍峨的城堡，已部分损毁')
  connectLocations(world, gate.id, market.id)
  connectLocations(world, market.id, castle.id)
  gate.characters.push(seraphina.id, guard.id)
  story.worldState = world

  // Build chapter and scene
  const chapter = createChapter({ title: '第一章：相遇', order: 0 })
  const scene = createScene(chapter.id, {
    setting: { location: gate.name, time: '黎明', atmosphere: '薄雾弥漫，城门缓缓打开' },
    participants: [seraphina.id, guard.id],
  })
  chapter.scenes.push(scene)
  story.chapters.push(chapter)
  story.metadata.currentSceneId = scene.id
  story.metadata.totalScenes = 1

  // Build plot graph
  const n1 = addNode(story.plotGraph, scene.id, '城门相遇')
  if (n1.ok) n1.value.isVisited = true

  return story
}
