/** SillyTavern 角色卡原始格式 */
export interface STCharacterCard {
  name: string
  description: string
  personality: string
  scenario: string
  first_mes: string
  mes_example: string
  creatorcomment: string
  talkativeness: string
  avatar: string

  data: {
    name: string
    description: string
    personality: string
    scenario: string
    first_mes: string
    mes_example: string
    creator_notes: string
    system_prompt: string
    post_history_instructions: string
    alternate_greetings: string[]
    tags: string[]

    character_book?: {
      name: string
      entries: STWorldInfoEntry[]
    }

    extensions: {
      talkativeness: number
      fav: boolean
      world: string
      depth_prompt?: {
        prompt: string
        depth: number
        role: 'system' | 'user' | 'assistant'
      }
    }
  }

  spec?: 'chara_card_v3'
  spec_version?: '3.0'
}

/** SillyTavern 世界书格式 */
export interface STWorldInfo {
  entries: {
    [uid: string]: STWorldInfoEntry
  }
}

export interface STWorldInfoEntry {
  uid: number
  key: string[]
  keysecondary: string[]
  comment: string
  content: string
  constant: boolean
  selective: boolean
  selectiveLogic: number
  order: number
  position: number
  disable: boolean
  excludeRecursion: boolean
  preventRecursion: boolean
  delayUntilRecursion: boolean
  probability: number
  useProbability: boolean
  depth: number
  group: string
  groupOverride: boolean
  groupWeight: number
  scanDepth: number | null
  caseSensitive: boolean | null
  matchWholeWords: boolean | null
  useGroupScoring: boolean | null
  automationId: string
  role: number | null
  sticky: number | null
  cooldown: number | null
  delay: number | null
  displayIndex: number
  vectorized: boolean
}

/** SillyTavern 预设格式 */
export interface STPreset {
  chat_completion_source: string
  openai_model: string
  claude_model: string
  custom_model: string
  custom_url: string

  temperature: number
  frequency_penalty: number
  presence_penalty: number
  top_p: number
  top_k: number
  top_a: number
  min_p: number
  repetition_penalty: number
  openai_max_context: number
  openai_max_tokens: number

  prompts: STPromptEntry[]

  prompt_order: Array<{
    character_id: string
    order: Array<{
      identifier: string
      enabled: boolean
    }>
  }>
}

export interface STPromptEntry {
  identifier: string
  name: string
  role: 'system' | 'user' | 'assistant'
  content: string
  system_prompt: boolean
  enabled: boolean
  marker: boolean
  injection_position: number
  injection_depth: number
  forbid_overrides: boolean
}
