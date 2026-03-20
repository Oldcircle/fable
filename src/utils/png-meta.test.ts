import { describe, it, expect } from 'vitest'
import { isPNG, readTextChunks, extractCharacterCard } from './png-meta'

// Helper: create a minimal PNG with a tEXt chunk
function createTestPNG(keyword: string, text: string): Uint8Array {
  const encoder = new TextEncoder()
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])

  // Build tEXt chunk data: keyword + null + text
  const keywordBytes = encoder.encode(keyword)
  const textBytes = encoder.encode(text)
  const chunkData = new Uint8Array(keywordBytes.length + 1 + textBytes.length)
  chunkData.set(keywordBytes, 0)
  chunkData[keywordBytes.length] = 0 // null separator
  chunkData.set(textBytes, keywordBytes.length + 1)

  const typeBytes = encoder.encode('tEXt')

  // Build IEND chunk
  const iendType = encoder.encode('IEND')

  // Assemble: sig + tEXt chunk + IEND chunk
  // chunk = 4(length) + 4(type) + data + 4(crc)
  const textChunkLen = chunkData.length
  const totalLen = sig.length + (12 + textChunkLen) + 12
  const result = new Uint8Array(totalLen)
  let offset = 0

  // Signature
  result.set(sig, offset)
  offset += sig.length

  // tEXt chunk length (big-endian)
  result[offset] = (textChunkLen >> 24) & 0xff
  result[offset + 1] = (textChunkLen >> 16) & 0xff
  result[offset + 2] = (textChunkLen >> 8) & 0xff
  result[offset + 3] = textChunkLen & 0xff
  offset += 4

  // tEXt type
  result.set(typeBytes, offset)
  offset += 4

  // tEXt data
  result.set(chunkData, offset)
  offset += textChunkLen

  // CRC (we'll use zeros for testing — our reader doesn't validate CRC)
  offset += 4

  // IEND chunk: length=0
  result[offset] = 0
  result[offset + 1] = 0
  result[offset + 2] = 0
  result[offset + 3] = 0
  offset += 4
  result.set(iendType, offset)
  offset += 4
  // CRC
  offset += 4

  return result
}

describe('isPNG', () => {
  it('returns true for valid PNG signature', () => {
    const data = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0])
    expect(isPNG(data)).toBe(true)
  })

  it('returns false for non-PNG data', () => {
    const data = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7])
    expect(isPNG(data)).toBe(false)
  })

  it('returns false for short data', () => {
    expect(isPNG(new Uint8Array([137, 80]))).toBe(false)
  })
})

describe('readTextChunks', () => {
  it('reads a tEXt chunk from a PNG', () => {
    const png = createTestPNG('chara', 'hello world')
    const chunks = readTextChunks(png)
    expect(chunks.length).toBe(1)
    expect(chunks[0].keyword).toBe('chara')
    expect(chunks[0].text).toBe('hello world')
  })

  it('returns empty for non-PNG data', () => {
    const chunks = readTextChunks(new Uint8Array([0, 1, 2, 3]))
    expect(chunks).toEqual([])
  })
})

describe('extractCharacterCard', () => {
  it('extracts V3 card (ccv3 plaintext JSON)', () => {
    const cardData = { name: 'Seraphina', spec: 'chara_card_v3' }
    const png = createTestPNG('ccv3', JSON.stringify(cardData))
    const result = extractCharacterCard(png)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.version).toBe('v3')
      expect((result.data as Record<string, unknown>).name).toBe('Seraphina')
    }
  })

  it('extracts V2 card (chara base64 JSON)', () => {
    const cardData = { name: 'Guard', description: 'A city guard' }
    const base64 = btoa(JSON.stringify(cardData))
    const png = createTestPNG('chara', base64)
    const result = extractCharacterCard(png)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.version).toBe('v2')
      expect((result.data as Record<string, unknown>).name).toBe('Guard')
    }
  })

  it('returns error for PNG without card data', () => {
    const png = createTestPNG('other', 'some data')
    const result = extractCharacterCard(png)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('No character card data found')
    }
  })

  it('returns error for invalid JSON in ccv3', () => {
    const png = createTestPNG('ccv3', 'not json {{{')
    const result = extractCharacterCard(png)
    expect(result.ok).toBe(false)
  })

  it('returns error for invalid base64 in chara', () => {
    const png = createTestPNG('chara', '!!!not-base64!!!')
    const result = extractCharacterCard(png)
    expect(result.ok).toBe(false)
  })
})
