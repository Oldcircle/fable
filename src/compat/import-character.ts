import type { STCharacterCard } from '../types/compat'
import type { Character } from '../types/character'
import { createCharacter, createDefaultCharacterState } from '../engine/defaults'
import { translateMacros } from './macro-translator'
import { extractCharacterCard } from '../utils/png-meta'

export type ImportResult<T> = { ok: true; value: T } | { ok: false; error: string }

/**
 * Extract structured personality from ST description field.
 * Common format: [Name's Personality= "trait1", "trait2", ...]
 */
export function extractPersonality(description: string): string {
  const match = description.match(/\[.*?personality\s*=\s*"?([^[\]]*)"?\s*\]/i)
  if (match) return match[1].trim()

  // Also try standalone personality field format
  const personalityMatch = description.match(/personality\s*[:：]\s*(.+)/i)
  if (personalityMatch) return personalityMatch[1].trim()

  return ''
}

/**
 * Extract appearance from ST description field.
 * Common format: [Name's body= "feature1", "feature2", ...]
 */
export function extractAppearance(description: string): string {
  const patterns = [
    /\[.*?(?:body|appearance|looks?)\s*=\s*"?([^[\]]*)"?\s*\]/i,
    /(?:body|appearance|外貌)\s*[:：]\s*(.+)/i,
  ]
  for (const pattern of patterns) {
    const match = description.match(pattern)
    if (match) return match[1].trim()
  }
  return ''
}

/**
 * Extract speech style hints from example dialogues.
 */
export function extractSpeechStyle(mesExample: string): string {
  if (!mesExample) return ''
  // Look for patterns like {{char}}: *action* "speech"
  const lines = mesExample.split('\n').filter(l => l.includes('{{char}}'))
  if (lines.length === 0) return ''
  // Return first few lines as style reference
  return lines.slice(0, 3).join('\n')
}

/**
 * Import a SillyTavern character card JSON object into a Fable Character.
 */
export function importSTCharacterFromJson(card: STCharacterCard): ImportResult<Character> {
  try {
    const data = card.data ?? card
    const name = data.name || card.name
    if (!name) {
      return { ok: false, error: 'Character card has no name' }
    }

    const description = data.description || card.description || ''
    const personality = data.personality || extractPersonality(description)
    const appearance = extractAppearance(description)
    const backstory = data.scenario || card.scenario || ''
    const mesExample = data.mes_example || card.mes_example || ''
    const speechStyle = extractSpeechStyle(mesExample)
    const tags = data.tags || []

    const character = createCharacter({
      identity: {
        name,
        description: translateMacros(description),
        personality: translateMacros(personality),
        appearance: translateMacros(appearance),
        backstory: translateMacros(backstory),
        speechStyle: translateMacros(speechStyle),
        exampleDialogues: translateMacros(mesExample),
        tags,
      },
      state: createDefaultCharacterState(),
      importSource: {
        format: card.spec === 'chara_card_v3' ? 'st-png-v3' : 'st-png-v2',
        originalData: card,
      },
    })

    return { ok: true, value: character }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to import character' }
  }
}

/**
 * Import a character from a PNG file (reads tEXt chunk, parses JSON, maps to Character).
 */
export function importSTCharacterFromPNG(pngData: Uint8Array): ImportResult<Character> {
  const cardResult = extractCharacterCard(pngData)
  if (!cardResult.ok) {
    return { ok: false, error: cardResult.error }
  }
  return importSTCharacterFromJson(cardResult.data as STCharacterCard)
}
