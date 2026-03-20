import { describe, it, expect } from 'vitest'
import { createDefaultWorldState } from './defaults'
import {
  addLocation,
  connectLocations,
  addLocationModifier,
  moveCharacter,
  setFlag,
  getFlag,
  advanceTime,
  addFaction,
  getCharactersAtLocation,
} from './world-state'

describe('addLocation', () => {
  it('adds a location to world state', () => {
    const world = createDefaultWorldState()
    const loc = addLocation(world, '城门', '高大的石门', ['gate', '入口'])
    expect(world.locations.has(loc.id)).toBe(true)
    expect(loc.name).toBe('城门')
    expect(loc.tags).toContain('gate')
  })
})

describe('connectLocations', () => {
  it('creates bidirectional connections', () => {
    const world = createDefaultWorldState()
    const gate = addLocation(world, '城门', '城门')
    const market = addLocation(world, '集市', '集市')
    const result = connectLocations(world, gate.id, market.id)
    expect(result.ok).toBe(true)
    expect(gate.connectedTo).toContain(market.id)
    expect(market.connectedTo).toContain(gate.id)
  })

  it('is idempotent', () => {
    const world = createDefaultWorldState()
    const a = addLocation(world, 'A', 'A')
    const b = addLocation(world, 'B', 'B')
    connectLocations(world, a.id, b.id)
    connectLocations(world, a.id, b.id)
    expect(a.connectedTo.filter(id => id === b.id).length).toBe(1)
  })

  it('fails for non-existent location', () => {
    const world = createDefaultWorldState()
    const a = addLocation(world, 'A', 'A')
    const result = connectLocations(world, a.id, 'fake')
    expect(result.ok).toBe(false)
  })
})

describe('addLocationModifier', () => {
  it('appends modifier and updates currentState', () => {
    const world = createDefaultWorldState()
    const castle = addLocation(world, '王城', '巍峨的城堡')
    addLocationModifier(world, castle.id, '东翼倒塌', 'scene-1')
    expect(castle.stateModifiers.length).toBe(1)
    expect(castle.currentState).toContain('东翼倒塌')
    expect(castle.currentState).toContain('巍峨的城堡')
  })
})

describe('moveCharacter', () => {
  it('moves character between locations', () => {
    const world = createDefaultWorldState()
    const gate = addLocation(world, '城门', '城门')
    const market = addLocation(world, '集市', '集市')
    gate.characters.push('char-1')

    const result = moveCharacter(world, 'char-1', gate.id, market.id)
    expect(result.ok).toBe(true)
    expect(gate.characters).not.toContain('char-1')
    expect(market.characters).toContain('char-1')
  })

  it('is idempotent for target', () => {
    const world = createDefaultWorldState()
    const a = addLocation(world, 'A', 'A')
    const b = addLocation(world, 'B', 'B')
    a.characters.push('c1')
    moveCharacter(world, 'c1', a.id, b.id)
    moveCharacter(world, 'c1', a.id, b.id) // second move, already there
    expect(b.characters.filter(id => id === 'c1').length).toBe(1)
  })
})

describe('flags', () => {
  it('sets and gets flags', () => {
    const world = createDefaultWorldState()
    setFlag(world, 'war_started', true)
    expect(getFlag(world, 'war_started')).toBe(true)
    expect(getFlag(world, 'nonexistent')).toBeUndefined()
  })
})

describe('advanceTime', () => {
  it('progresses through time of day', () => {
    const world = createDefaultWorldState()
    world.currentTime.timeOfDay = '正午'
    advanceTime(world)
    expect(world.currentTime.timeOfDay).toBe('下午')
  })

  it('wraps to next day after 深夜', () => {
    const world = createDefaultWorldState()
    world.currentTime.timeOfDay = '深夜'
    world.currentTime.day = 3
    advanceTime(world)
    expect(world.currentTime.day).toBe(4)
    expect(world.currentTime.timeOfDay).toBe('黎明')
  })
})

describe('addFaction', () => {
  it('adds a faction', () => {
    const world = createDefaultWorldState()
    const faction = addFaction(world, '王国守卫', '守护王城的骑士团')
    expect(world.factions.has(faction.id)).toBe(true)
    expect(faction.disposition).toBeInstanceOf(Map)
  })
})

describe('getCharactersAtLocation', () => {
  it('returns characters at a location', () => {
    const world = createDefaultWorldState()
    const loc = addLocation(world, '城门', '城门')
    loc.characters.push('c1', 'c2')
    expect(getCharactersAtLocation(world, loc.id)).toEqual(['c1', 'c2'])
  })

  it('returns empty array for unknown location', () => {
    const world = createDefaultWorldState()
    expect(getCharactersAtLocation(world, 'fake')).toEqual([])
  })
})
