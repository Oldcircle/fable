import type { LLMAdapter, LLMMessage, LLMResponse } from '../../types/adapter'
import type { LLMConfig } from '../../types/preset'
import { sanitizeErrorMessage } from '../../utils/format'

interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string | Array<{ type: 'text'; text: string }>
}

/**
 * Convert LLMMessage[] to Anthropic Messages API format.
 * System messages are extracted to a separate field.
 */
function convertMessages(messages: LLMMessage[]): {
  system: string | undefined
  messages: AnthropicMessage[]
} {
  const systemParts: string[] = []
  const converted: AnthropicMessage[] = []

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemParts.push(msg.content)
    } else {
      converted.push({ role: msg.role, content: msg.content })
    }
  }

  // Anthropic requires messages to start with 'user' and alternate roles.
  // Merge consecutive same-role messages.
  const merged: AnthropicMessage[] = []
  for (const msg of converted) {
    const last = merged[merged.length - 1]
    if (last && last.role === msg.role) {
      last.content = `${typeof last.content === 'string' ? last.content : last.content.map(p => p.text).join('\n')}\n\n${typeof msg.content === 'string' ? msg.content : msg.content.map(p => p.text).join('\n')}`
    } else {
      merged.push({ ...msg })
    }
  }

  return {
    system: systemParts.length > 0 ? systemParts.join('\n\n') : undefined,
    messages: merged,
  }
}

export function createAnthropicAdapter(config: LLMConfig): LLMAdapter {
  return {
    async generate(messages: LLMMessage[]): Promise<LLMResponse> {
      const endpoint = config.endpoint?.replace(/\/+$/, '') || 'https://api.anthropic.com'
      const url = `${endpoint}/v1/messages`

      const { system, messages: converted } = convertMessages(messages)

      const body: Record<string, unknown> = {
        model: config.model,
        messages: converted,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        top_p: config.topP,
      }

      if (system) body.system = system
      if (config.topK) body.top_k = config.topK

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      }
      if (config.apiKey) {
        headers['x-api-key'] = config.apiKey
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(sanitizeErrorMessage(`Anthropic API error ${response.status}: ${errorText}`))
      }

      const data = await response.json()
      const text = data.content?.find((c: { type: string }) => c.type === 'text')?.text ?? ''

      return {
        content: text,
        usage: data.usage ? {
          promptTokens: data.usage.input_tokens ?? 0,
          completionTokens: data.usage.output_tokens ?? 0,
        } : undefined,
      }
    },

    async *stream(messages: LLMMessage[]): AsyncIterable<string> {
      const endpoint = config.endpoint?.replace(/\/+$/, '') || 'https://api.anthropic.com'
      const url = `${endpoint}/v1/messages`

      const { system, messages: converted } = convertMessages(messages)

      const body: Record<string, unknown> = {
        model: config.model,
        messages: converted,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        top_p: config.topP,
        stream: true,
      }

      if (system) body.system = system
      if (config.topK) body.top_k = config.topK

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      }
      if (config.apiKey) {
        headers['x-api-key'] = config.apiKey
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(sanitizeErrorMessage(`Anthropic API error ${response.status}: ${errorText}`))
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
            // Anthropic SSE: content_block_delta with type text_delta
            if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
              yield parsed.delta.text
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    },
  }
}
