import { describe, it, expect } from 'vitest'
import { generateId } from './id'

describe('generateId', () => {
  it('returns a non-empty string', () => {
    const id = generateId()
    expect(id).toBeTruthy()
    expect(typeof id).toBe('string')
  })

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
  })

  it('contains expected format (timestamp-random-counter)', () => {
    const id = generateId()
    const parts = id.split('-')
    expect(parts.length).toBe(3)
  })
})
