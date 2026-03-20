import { describe, it, expect } from 'vitest'
import type { STWorldInfoEntry } from '../types/compat'
import { importSTWorldInfo } from './import-world'

function createEntry(overrides: Partial<STWorldInfoEntry>): STWorldInfoEntry {
  return {
    uid: 0,
    key: ['test'],
    keysecondary: [],
    comment: '',
    content: 'test content',
    constant: false,
    selective: false,
    selectiveLogic: 0,
    order: 0,
    position: 0,
    disable: false,
    excludeRecursion: false,
    preventRecursion: false,
    delayUntilRecursion: false,
    probability: 100,
    useProbability: false,
    depth: 4,
    group: '',
    groupOverride: false,
    groupWeight: 100,
    scanDepth: null,
    caseSensitive: null,
    matchWholeWords: null,
    useGroupScoring: null,
    automationId: '',
    role: null,
    sticky: null,
    cooldown: null,
    delay: null,
    displayIndex: 0,
    vectorized: false,
    ...overrides,
  }
}

describe('importSTWorldInfo', () => {
  it('classifies location entries', () => {
    const worldInfo = {
      entries: {
        '1': createEntry({
          uid: 1,
          key: ['Ancient Forest', '古代森林'],
          comment: 'Ancient Forest',
          content: 'A dark forest with ancient trees',
        }),
      },
    }
    const result = importSTWorldInfo(worldInfo)
    expect(result.locations.length).toBe(1)
    expect(result.locations[0].name).toBe('Ancient Forest')
    expect(result.locations[0].tags).toContain('Ancient Forest')
  })

  it('classifies character entries', () => {
    const worldInfo = {
      entries: {
        '1': createEntry({
          uid: 1,
          key: ['Seraphina'],
          comment: 'Seraphina',
          content: 'Personality: kind and cautious. Has pink hair and amber eyes.',
        }),
      },
    }
    const result = importSTWorldInfo(worldInfo)
    expect(result.characterTraits.has('Seraphina')).toBe(true)
    expect(result.characterTraits.get('Seraphina')![0]).toContain('kind and cautious')
  })

  it('classifies rule entries', () => {
    const worldInfo = {
      entries: {
        '1': createEntry({
          uid: 1,
          key: ['combat_rules'],
          comment: 'Combat Rules',
          content: 'Important rule: characters must always roll for initiative.',
        }),
      },
    }
    const result = importSTWorldInfo(worldInfo)
    expect(result.rules.length).toBe(1)
    expect(result.rules[0]).toContain('roll for initiative')
  })

  it('puts unclassified entries in loreEntries', () => {
    const worldInfo = {
      entries: {
        '1': createEntry({
          uid: 1,
          key: ['magic_system'],
          comment: 'Magic System',
          content: 'Mana flows through ley lines beneath the earth.',
        }),
      },
    }
    const result = importSTWorldInfo(worldInfo)
    expect(result.loreEntries.length).toBe(1)
    expect(result.loreEntries[0].name).toBe('Magic System')
    expect(result.loreEntries[0].triggerKeywords).toContain('magic_system')
  })

  it('skips disabled entries', () => {
    const worldInfo = {
      entries: {
        '1': createEntry({ uid: 1, disable: true, content: '不该出现' }),
        '2': createEntry({ uid: 2, disable: false, content: 'Should appear as lore' }),
      },
    }
    const result = importSTWorldInfo(worldInfo)
    const allContent = [
      ...result.loreEntries.map(e => e.content),
      ...result.locations.map(e => e.baseDescription),
      ...result.rules,
    ].join(' ')

    expect(allContent).not.toContain('不该出现')
    expect(allContent).toContain('Should appear')
  })

  it('handles probability correctly', () => {
    const worldInfo = {
      entries: {
        '1': createEntry({ uid: 1, useProbability: true, probability: 50, content: 'A rare herb grows here' }),
        '2': createEntry({ uid: 2, useProbability: false, probability: 50, content: 'Mana flows through ley lines' }),
      },
    }
    const result = importSTWorldInfo(worldInfo)
    expect(result.loreEntries[0].probability).toBe(0.5)
    expect(result.loreEntries[1].probability).toBe(1)
  })

  it('handles constant entries', () => {
    const worldInfo = {
      entries: {
        '1': createEntry({ uid: 1, constant: true, content: 'The sky glows with two moons' }),
      },
    }
    const result = importSTWorldInfo(worldInfo)
    expect(result.loreEntries[0].isConstant).toBe(true)
  })

  it('translates macros in content', () => {
    const worldInfo = {
      entries: {
        '1': createEntry({
          uid: 1,
          content: '{{char}} lives in this magical place',
        }),
      },
    }
    const result = importSTWorldInfo(worldInfo)
    expect(result.loreEntries[0].content).toContain('${character.name}')
  })

  it('handles empty entries object', () => {
    const result = importSTWorldInfo({ entries: {} })
    expect(result.locations).toEqual([])
    expect(result.loreEntries).toEqual([])
    expect(result.rules).toEqual([])
    expect(result.characterTraits.size).toBe(0)
  })
})
