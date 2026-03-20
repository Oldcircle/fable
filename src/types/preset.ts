export interface LLMConfig {
  provider: string
  providerId: string
  model: string
  endpoint?: string
  apiKey?: string
  temperature: number
  topP: number
  topK?: number
  maxTokens: number
  maxContext: number
  frequencyPenalty: number
  presencePenalty: number
}

export interface DirectorPreset {
  id: string
  name: string
  llmConfig: LLMConfig
  narratorStyle: {
    voice: string
    tone: string
    customInstructions: string
  }
}
