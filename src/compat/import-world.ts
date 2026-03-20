import type { STWorldInfo, STWorldInfoEntry } from '../types/compat'
import type { Location } from '../types/world'
import type { LoreEntry } from '../types/lore'
import { generateId } from '../utils/id'
import { translateMacros } from './macro-translator'

export interface WorldImportResult {
  locations: Location[]
  characterTraits: Map<string, string[]>
  loreEntries: LoreEntry[]
  rules: string[]
}

/** Heuristic: entry describes a location */
function isLocationEntry(entry: STWorldInfoEntry): boolean {
  const keywords = entry.key.map(k => k.toLowerCase())
  const content = (entry.content + ' ' + entry.comment).toLowerCase()

  const locationHints = [
    '城', '村', '镇', '山', '湖', '河', '森林', '洞穴', '废墟', '塔', '宫殿',
    'castle', 'village', 'town', 'forest', 'cave', 'mountain', 'lake', 'river',
    'tavern', 'tower', 'palace', 'city', 'temple', 'dungeon',
  ]

  return locationHints.some(hint =>
    keywords.some(k => k.includes(hint)) || content.includes(hint),
  )
}

/** Heuristic: entry describes a character */
function isCharacterEntry(entry: STWorldInfoEntry): boolean {
  const content = (entry.content + ' ' + entry.comment).toLowerCase()
  const characterHints = [
    'personality', 'appearance', 'backstory', '性格', '外貌', '背景',
    'hair', 'eyes', 'wears', '穿着', '发色', '眼睛',
  ]
  return characterHints.some(hint => content.includes(hint))
}

/** Heuristic: entry is a rule/instruction */
function isRuleEntry(entry: STWorldInfoEntry): boolean {
  const content = (entry.content + ' ' + entry.comment).toLowerCase()
  const ruleHints = [
    'rule', 'instruction', 'must', 'always', 'never', 'important',
    '规则', '必须', '不可以', '注意', '指令',
  ]
  return ruleHints.some(hint => content.includes(hint))
}

/** Detect character name from entry keywords/comment */
function detectCharacterName(entry: STWorldInfoEntry): string {
  return entry.comment || entry.key[0] || 'Unknown'
}

export function importSTWorldInfo(worldInfo: STWorldInfo): WorldImportResult {
  const locations: Location[] = []
  const characterTraits = new Map<string, string[]>()
  const loreEntries: LoreEntry[] = []
  const rules: string[] = []

  for (const [uid, entry] of Object.entries(worldInfo.entries)) {
    if (entry.disable) continue

    const translated = translateMacros(entry.content)

    if (isLocationEntry(entry)) {
      locations.push({
        id: generateId(),
        name: entry.comment || entry.key[0],
        baseDescription: translated,
        currentState: translated,
        stateModifiers: [],
        connectedTo: [],
        characters: [],
        tags: entry.key,
      })
    } else if (isCharacterEntry(entry)) {
      const charName = detectCharacterName(entry)
      if (!characterTraits.has(charName)) {
        characterTraits.set(charName, [])
      }
      characterTraits.get(charName)!.push(translated)
    } else if (isRuleEntry(entry)) {
      rules.push(translated)
    } else {
      loreEntries.push({
        id: generateId(),
        name: entry.comment || entry.key[0],
        content: translated,
        triggerKeywords: entry.key,
        isConstant: entry.constant,
        probability: entry.useProbability ? entry.probability / 100 : 1,
        group: entry.group || undefined,
        groupWeight: entry.groupWeight,
        sourceUid: uid,
      })
    }
  }

  return { locations, characterTraits, loreEntries, rules }
}
