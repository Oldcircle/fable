import type { LLMAdapter, LLMMessage, LLMResponse } from '../../types/adapter'
import type { LLMConfig } from '../../types/preset'
import { sanitizeErrorMessage } from '../../utils/format'

interface GeminiPart {
  text: string
}

interface GeminiContent {
  role: 'user' | 'model'
  parts: GeminiPart[]
}

interface GeminiSafetySetting {
  category: string
  threshold: string
}

const SAFETY_SETTINGS: GeminiSafetySetting[] = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'OFF' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'OFF' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'OFF' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'OFF' },
  { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'OFF' },
]

/**
 * Convert LLMMessage[] to Gemini contents[] format.
 * System messages are extracted to systemInstruction.
 * Consecutive same-role messages are merged.
 */
function convertMessages(messages: LLMMessage[]): {
  systemInstruction: { parts: GeminiPart[] } | undefined
  contents: GeminiContent[]
} {
  const systemParts: GeminiPart[] = []
  const contents: GeminiContent[] = []

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemParts.push({ text: msg.content })
      continue
    }

    // Gemini uses 'model' instead of 'assistant'
    const role = msg.role === 'assistant' ? 'model' as const : 'user' as const
    const last = contents[contents.length - 1]

    // Merge consecutive same-role messages
    if (last && last.role === role) {
      last.parts.push({ text: msg.content })
    } else {
      contents.push({ role, parts: [{ text: msg.content }] })
    }
  }

  return {
    systemInstruction: systemParts.length > 0 ? { parts: systemParts } : undefined,
    contents,
  }
}

export function createGeminiAdapter(config: LLMConfig): LLMAdapter {
  return {
    async generate(messages: LLMMessage[]): Promise<LLMResponse> {
      const endpoint = config.endpoint?.replace(/\/+$/, '') || 'https://generativelanguage.googleapis.com'
      const url = `${endpoint}/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`

      const { systemInstruction, contents } = convertMessages(messages)

      const body: Record<string, unknown> = {
        contents,
        safetySettings: SAFETY_SETTINGS,
        generationConfig: {
          maxOutputTokens: config.maxTokens,
          temperature: config.temperature,
          topP: config.topP,
          topK: config.topK,
          candidateCount: 1,
        },
      }

      if (systemInstruction) body.systemInstruction = systemInstruction

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(sanitizeErrorMessage(`Gemini API error ${response.status}: ${errorText}`))
      }

      const data = await response.json()

      // Check for safety blocks
      if (data.promptFeedback?.blockReason) {
        throw new Error(`Gemini blocked request: ${data.promptFeedback.blockReason}`)
      }

      const candidate = data.candidates?.[0]
      if (!candidate?.content?.parts) {
        throw new Error('Gemini response missing content')
      }

      const text = candidate.content.parts
        .filter((p: Record<string, unknown>) => typeof p.text === 'string')
        .map((p: { text: string }) => p.text)
        .join('')

      return {
        content: text,
        usage: data.usageMetadata ? {
          promptTokens: data.usageMetadata.promptTokenCount ?? 0,
          completionTokens: data.usageMetadata.candidatesTokenCount ?? 0,
        } : undefined,
      }
    },

    async *stream(messages: LLMMessage[]): AsyncIterable<string> {
      const endpoint = config.endpoint?.replace(/\/+$/, '') || 'https://generativelanguage.googleapis.com'
      const url = `${endpoint}/v1beta/models/${config.model}:streamGenerateContent?key=${config.apiKey}&alt=sse`

      const { systemInstruction, contents } = convertMessages(messages)

      const body: Record<string, unknown> = {
        contents,
        safetySettings: SAFETY_SETTINGS,
        generationConfig: {
          maxOutputTokens: config.maxTokens,
          temperature: config.temperature,
          topP: config.topP,
          topK: config.topK,
          candidateCount: 1,
        },
      }

      if (systemInstruction) body.systemInstruction = systemInstruction

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(sanitizeErrorMessage(`Gemini API error ${response.status}: ${errorText}`))
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

          try {
            const parsed = JSON.parse(data)
            const parts = parsed.candidates?.[0]?.content?.parts
            if (parts) {
              for (const part of parts) {
                if (typeof part.text === 'string') {
                  yield part.text
                }
              }
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    },
  }
}
