import { describe, it, expect } from 'vitest'
import { createCharacter } from './defaults'
import {
  updateMood,
  addCondition,
  removeCondition,
  setRelationship,
  adjustTrust,
  addKnowledge,
  knowsFact,
  addWitnessedScene,
  addHearsay,
  addGoal,
  updateGoalStatus,
  getActiveGoals,
  addInventoryItem,
  removeInventoryItem,
} from './character-agent'

describe('mood', () => {
  it('updates character mood', () => {
    const char = createCharacter()
    updateMood(char, '警觉')
    expect(char.state.mood).toBe('警觉')
  })
})

describe('conditions', () => {
  it('adds and removes conditions', () => {
    const char = createCharacter()
    addCondition(char, '受伤')
    addCondition(char, '中毒')
    expect(char.state.conditions).toEqual(['受伤', '中毒'])

    removeCondition(char, '受伤')
    expect(char.state.conditions).toEqual(['中毒'])
  })

  it('does not add duplicate conditions', () => {
    const char = createCharacter()
    addCondition(char, '受伤')
    addCondition(char, '受伤')
    expect(char.state.conditions.length).toBe(1)
  })
})

describe('relationships', () => {
  it('creates a new relationship', () => {
    const char = createCharacter()
    const rel = setRelationship(char, 'player', { trust: 70, disposition: '友好' })
    expect(rel.trust).toBe(70)
    expect(rel.disposition).toBe('友好')
    expect(char.state.relationships.get('player')).toBe(rel)
  })

  it('updates existing relationship preserving history', () => {
    const char = createCharacter()
    setRelationship(char, 'player', { trust: 50, history: ['首次相遇'] })
    setRelationship(char, 'player', { trust: 70 })
    const rel = char.state.relationships.get('player')!
    expect(rel.trust).toBe(70)
    expect(rel.history).toContain('首次相遇')
  })

  it('clamps trust to 0-100', () => {
    const char = createCharacter()
    setRelationship(char, 'enemy', { trust: 150 })
    expect(char.state.relationships.get('enemy')?.trust).toBe(100)

    setRelationship(char, 'enemy', { trust: -50 })
    expect(char.state.relationships.get('enemy')?.trust).toBe(0)
  })
})

describe('adjustTrust', () => {
  it('adjusts trust by delta with reason', () => {
    const char = createCharacter()
    setRelationship(char, 'npc', { trust: 50 })
    adjustTrust(char, 'npc', 15, '帮助了 NPC')
    const rel = char.state.relationships.get('npc')!
    expect(rel.trust).toBe(65)
    expect(rel.history).toContain('帮助了 NPC')
  })

  it('creates relationship if not exists', () => {
    const char = createCharacter()
    adjustTrust(char, 'stranger', -10)
    expect(char.state.relationships.get('stranger')?.trust).toBe(40)
  })
})

describe('knowledge', () => {
  it('adds and checks facts', () => {
    const char = createCharacter()
    addKnowledge(char, '城堡东翼被摧毁')
    expect(knowsFact(char, '城堡东翼被摧毁')).toBe(true)
    expect(knowsFact(char, '国王已死')).toBe(false)
  })

  it('tracks witnessed scenes', () => {
    const char = createCharacter()
    addWitnessedScene(char, 'scene-1')
    addWitnessedScene(char, 'scene-1') // duplicate
    expect(char.state.knowledge.witnessedScenes).toEqual(['scene-1'])
  })

  it('tracks hearsay', () => {
    const char = createCharacter()
    addHearsay(char, '据说国王逃走了', 'tavern-npc', 0.3)
    expect(char.state.knowledge.hearsay.length).toBe(1)
    expect(char.state.knowledge.hearsay[0].trust).toBe(0.3)
  })
})

describe('goals', () => {
  it('adds goals with priority', () => {
    const char = createCharacter()
    const goal = addGoal(char, '寻找弟弟', 8)
    expect(goal.status).toBe('active')
    expect(goal.priority).toBe(8)
  })

  it('clamps priority to 1-10', () => {
    const char = createCharacter()
    const g1 = addGoal(char, 'low', 0)
    const g2 = addGoal(char, 'high', 15)
    expect(g1.priority).toBe(1)
    expect(g2.priority).toBe(10)
  })

  it('updates goal status', () => {
    const char = createCharacter()
    const goal = addGoal(char, '找到宝藏')
    const result = updateGoalStatus(char, goal.id, 'completed')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.status).toBe('completed')
  })

  it('getActiveGoals returns sorted by priority', () => {
    const char = createCharacter()
    addGoal(char, '低优先级', 2)
    addGoal(char, '高优先级', 9)
    addGoal(char, '已完成', 10)
    updateGoalStatus(char, char.state.goals[2].id, 'completed')

    const active = getActiveGoals(char)
    expect(active.length).toBe(2)
    expect(active[0].description).toBe('高优先级')
    expect(active[1].description).toBe('低优先级')
  })
})

describe('inventory', () => {
  it('adds items', () => {
    const char = createCharacter()
    addInventoryItem(char, '国王之剑', '一把闪闪发光的剑', { damage: 10 })
    expect(char.state.inventory.length).toBe(1)
    expect(char.state.inventory[0].name).toBe('国王之剑')
    expect(char.state.inventory[0].properties?.damage).toBe(10)
  })

  it('removes items', () => {
    const char = createCharacter()
    addInventoryItem(char, '药水', '回复药水')
    const itemId = char.state.inventory[0].id
    const result = removeInventoryItem(char, itemId)
    expect(result.ok).toBe(true)
    expect(char.state.inventory.length).toBe(0)
  })

  it('fails to remove non-existent item', () => {
    const char = createCharacter()
    const result = removeInventoryItem(char, 'fake')
    expect(result.ok).toBe(false)
  })
})
