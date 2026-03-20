/**
 * PNG tEXt chunk reader.
 * Reads tEXt chunks from PNG files to extract character card metadata.
 *
 * PNG structure: 8-byte signature + chunks (length[4] + type[4] + data[length] + crc[4])
 * tEXt chunk: keyword + null byte + text value
 */

export interface PNGTextChunk {
  keyword: string
  text: string
}

const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])

export function isPNG(data: Uint8Array): boolean {
  if (data.length < 8) return false
  for (let i = 0; i < 8; i++) {
    if (data[i] !== PNG_SIGNATURE[i]) return false
  }
  return true
}

function readUint32(data: Uint8Array, offset: number): number {
  return (
    ((data[offset] << 24) |
      (data[offset + 1] << 16) |
      (data[offset + 2] << 8) |
      data[offset + 3]) >>>
    0
  )
}

export function readTextChunks(data: Uint8Array): PNGTextChunk[] {
  if (!isPNG(data)) {
    return []
  }

  const chunks: PNGTextChunk[] = []
  let offset = 8 // skip signature

  const decoder = new TextDecoder('latin1')

  while (offset < data.length - 12) {
    const length = readUint32(data, offset)
    const typeBytes = data.slice(offset + 4, offset + 8)
    const type = decoder.decode(typeBytes)

    if (type === 'tEXt') {
      const chunkData = data.slice(offset + 8, offset + 8 + length)
      // Find null separator between keyword and text
      const nullIndex = chunkData.indexOf(0)
      if (nullIndex !== -1) {
        const keyword = decoder.decode(chunkData.slice(0, nullIndex))
        const text = decoder.decode(chunkData.slice(nullIndex + 1))
        chunks.push({ keyword, text })
      }
    }

    if (type === 'IEND') break

    // Move to next chunk: 4(length) + 4(type) + length(data) + 4(crc)
    offset += 12 + length
  }

  return chunks
}

/**
 * Extract character card JSON from a PNG file.
 * Supports V2 (base64 encoded in "chara" keyword) and V3 (plaintext JSON in "ccv3" keyword).
 */
export type CardParseResult =
  | { ok: true; version: 'v2' | 'v3'; data: unknown }
  | { ok: false; error: string }

export function extractCharacterCard(pngData: Uint8Array): CardParseResult {
  const chunks = readTextChunks(pngData)

  // Try V3 first (ccv3 keyword, plaintext JSON)
  const ccv3Chunk = chunks.find(c => c.keyword === 'ccv3')
  if (ccv3Chunk) {
    try {
      const data = JSON.parse(ccv3Chunk.text)
      return { ok: true, version: 'v3', data }
    } catch {
      return { ok: false, error: 'Failed to parse ccv3 JSON' }
    }
  }

  // Try V2 (chara keyword, base64-encoded JSON)
  const charaChunk = chunks.find(c => c.keyword === 'chara')
  if (charaChunk) {
    try {
      const decoded = atob(charaChunk.text)
      const data = JSON.parse(decoded)
      return { ok: true, version: 'v2', data }
    } catch {
      return { ok: false, error: 'Failed to decode/parse chara base64 JSON' }
    }
  }

  return { ok: false, error: 'No character card data found in PNG (expected "ccv3" or "chara" tEXt chunk)' }
}
