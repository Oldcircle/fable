import type { LLMAdapter, LLMMessage, LLMResponse } from '../../types/adapter'
import type { LLMConfig } from '../../types/preset'
import { sanitizeErrorMessage } from '../../utils/format'

export function createOpenAICompatibleAdapter(config: LLMConfig): LLMAdapter {
  return {
    async generate(messages: LLMMessage[]): Promise<LLMResponse> {
      const endpoint = config.endpoint?.replace(/\/+$/, '') || 'https://api.openai.com/v1'
      const url = `${endpoint}/chat/completions`

      const body: Record<string, unknown> = {
        model: config.model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        top_p: config.topP,
      }

      if (config.frequencyPenalty) body.frequency_penalty = config.frequencyPenalty
      if (config.presencePenalty) body.presence_penalty = config.presencePenalty
      if (config.topK) body.top_k = config.topK

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(sanitizeErrorMessage(`LLM API error ${response.status}: ${errorText}`))
      }

      const data = await response.json()
      const choice = data.choices?.[0]
      if (!choice?.message?.content) {
        throw new Error('LLM response missing content')
      }

      return {
        content: choice.message.content,
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens ?? 0,
          completionTokens: data.usage.completion_tokens ?? 0,
        } : undefined,
      }
    },

    async *stream(messages: LLMMessage[]): AsyncIterable<string> {
      const endpoint = config.endpoint?.replace(/\/+$/, '') || 'https://api.openai.com/v1'
      const url = `${endpoint}/chat/completions`

      const body: Record<string, unknown> = {
        model: config.model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        top_p: config.topP,
        stream: true,
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(sanitizeErrorMessage(`LLM API error ${response.status}: ${errorText}`))
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue
          const data = trimmed.slice(6)
          if (data === '[DONE]') return

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content
            if (content) yield content
          } catch {
            // skip malformed chunks
          }
        }
      }
    },
  }
}
