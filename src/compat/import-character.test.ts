import { describe, it, expect } from 'vitest'
import type { STCharacterCard } from '../types/compat'
import {
  importSTCharacterFromJson,
  extractPersonality,
  extractAppearance,
  extractSpeechStyle,
} from './import-character'

function createMinimalSTCard(overrides?: Partial<STCharacterCard>): STCharacterCard {
  return {
    name: 'Test Character',
    description: 'A test character',
    personality: '',
    scenario: '',
    first_mes: 'Hello!',
    mes_example: '',
    creatorcomment: '',
    talkativeness: '0.5',
    avatar: '',
    data: {
      name: 'Test Character',
      description: 'A test character',
      personality: 'Brave and kind',
      scenario: 'A fantasy world',
      first_mes: 'Hello!',
      mes_example: '{{char}}: *smiles* "Welcome, traveler."',
      creator_notes: '',
      system_prompt: '',
      post_history_instructions: '',
      alternate_greetings: [],
      tags: ['fantasy', 'elf'],
      extensions: {
        talkativeness: 0.5,
        fav: false,
        world: '',
      },
    },
    ...overrides,
  }
}

describe('extractPersonality', () => {
  it('extracts from bracket format', () => {
    const desc = '[Seraphina\'s Personality= "Kind", "Cautious", "Wise"]'
    expect(extractPersonality(desc)).toContain('Kind')
  })

  it('extracts from colon format', () => {
    const desc = 'Personality: Brave and strong'
    expect(extractPersonality(desc)).toBe('Brave and strong')
  })

  it('returns empty for no match', () => {
    expect(extractPersonality('just a regular description')).toBe('')
  })
})

describe('extractAppearance', () => {
  it('extracts from body= format', () => {
    const desc = '[Name\'s body= "Tall", "Pink hair"]'
    expect(extractAppearance(desc)).toContain('Tall')
  })

  it('extracts from appearance: format', () => {
    const desc = 'Appearance: Slim build with amber eyes'
    expect(extractAppearance(desc)).toBe('Slim build with amber eyes')
  })

  it('returns empty for no match', () => {
    expect(extractAppearance('no appearance info here')).toBe('')
  })
})

describe('extractSpeechStyle', () => {
  it('extracts lines with {{char}}', () => {
    const example = '{{user}}: Hello\n{{char}}: *bows* "Greetings, traveler."\n{{char}}: "How may I help?"'
    const style = extractSpeechStyle(example)
    expect(style).toContain('Greetings')
    expect(style).toContain('How may I help')
  })

  it('returns empty for no examples', () => {
    expect(extractSpeechStyle('')).toBe('')
  })
})

describe('importSTCharacterFromJson', () => {
  it('imports a basic character card', () => {
    const card = createMinimalSTCard()
    const result = importSTCharacterFromJson(card)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.identity.name).toBe('Test Character')
      expect(result.value.identity.personality).toBe('Brave and kind')
      expect(result.value.identity.backstory).toBe('A fantasy world')
      expect(result.value.identity.tags).toContain('fantasy')
    }
  })

  it('translates macros in fields', () => {
    const card = createMinimalSTCard({
      data: {
        ...createMinimalSTCard().data,
        description: '{{char}} is a brave warrior who fights for {{user}}',
      },
    })
    const result = importSTCharacterFromJson(card)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.identity.description).toContain('${character.name}')
      expect(result.value.identity.description).toContain('${player.name}')
    }
  })

  it('records import source', () => {
    const card = createMinimalSTCard()
    const result = importSTCharacterFromJson(card)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.importSource?.format).toBe('st-png-v2')
    }
  })

  it('records V3 format when spec is set', () => {
    const card = createMinimalSTCard({ spec: 'chara_card_v3', spec_version: '3.0' })
    const result = importSTCharacterFromJson(card)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.importSource?.format).toBe('st-png-v3')
    }
  })

  it('fails for card with no name', () => {
    const card = createMinimalSTCard({ name: '', data: { ...createMinimalSTCard().data, name: '' } })
    const result = importSTCharacterFromJson(card)
    expect(result.ok).toBe(false)
  })

  it('creates default character state', () => {
    const card = createMinimalSTCard()
    const result = importSTCharacterFromJson(card)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.state.mood).toBe('平静')
      expect(result.value.state.relationships).toBeInstanceOf(Map)
      expect(result.value.state.knowledge.knownFacts).toBeInstanceOf(Set)
    }
  })

  it('extracts speech style from mes_example', () => {
    const card = createMinimalSTCard()
    const result = importSTCharacterFromJson(card)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.identity.speechStyle.length).toBeGreaterThan(0)
    }
  })
})
