import type { LLMConfig } from '../types/preset'
import { db } from '../db/index'

interface SettingsState {
  llmConfig: LLMConfig
  playerName: string
  language: string
  loaded: boolean
}

const defaultLLMConfig: LLMConfig = {
  provider: 'openai-compatible',
  providerId: 'deepseek',
  model: 'deepseek-chat',
  endpoint: 'https://api.deepseek.com/v1',
  apiKey: '',
  temperature: 0.8,
  topP: 0.95,
  maxTokens: 2048,
  maxContext: 8192,
  frequencyPenalty: 0,
  presencePenalty: 0,
}

let state = $state<SettingsState>({
  llmConfig: { ...defaultLLMConfig },
  playerName: '旅者',
  language: 'zh-CN',
  loaded: false,
})

async function persist(): Promise<void> {
  await db.settings.put({ key: 'llmConfig', value: JSON.stringify(state.llmConfig) })
  await db.settings.put({ key: 'playerName', value: state.playerName })
  await db.settings.put({ key: 'language', value: state.language })
}

export function useSettingsStore() {
  return {
    get llmConfig() { return state.llmConfig },
    get playerName() { return state.playerName },
    get language() { return state.language },
    get loaded() { return state.loaded },
    get isConfigured() { return !!state.llmConfig.model && !!state.llmConfig.endpoint },

    async load(): Promise<void> {
      const llmRecord = await db.settings.get('llmConfig')
      if (llmRecord) {
        state.llmConfig = { ...defaultLLMConfig, ...JSON.parse(llmRecord.value) }
      }
      const nameRecord = await db.settings.get('playerName')
      if (nameRecord) state.playerName = nameRecord.value
      const langRecord = await db.settings.get('language')
      if (langRecord) state.language = langRecord.value
      state.loaded = true
    },

    async updateLLMConfig(updates: Partial<LLMConfig>): Promise<void> {
      state.llmConfig = { ...state.llmConfig, ...updates }
      await persist()
    },

    async setPlayerName(name: string): Promise<void> {
      state.playerName = name
      await persist()
    },
  }
}
