export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
  }
}

export interface LLMAdapter {
  generate(messages: LLMMessage[]): Promise<LLMResponse>
  stream?(messages: LLMMessage[]): AsyncIterable<string>
}
