import { describe, it, expect, vi } from 'vitest'
import { createOpenAICompatibleAdapter } from './openai-compatible'
import type { LLMConfig } from '../../types/preset'

const mockConfig: LLMConfig = {
  provider: 'openai-compatible',
  model: 'gpt-4',
  endpoint: 'https://api.example.com/v1',
  apiKey: 'test-key',
  temperature: 0.8,
  topP: 0.95,
  maxTokens: 2048,
  maxContext: 8192,
  frequencyPenalty: 0,
  presencePenalty: 0,
}

describe('createOpenAICompatibleAdapter', () => {
  it('sends correct request format', async () => {
    const mockResponse = {
      choices: [{ message: { content: 'Hello from LLM' } }],
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const adapter = createOpenAICompatibleAdapter(mockConfig)
    const result = await adapter.generate([
      { role: 'system', content: 'You are helpful' },
      { role: 'user', content: 'Hello' },
    ])

    expect(result.content).toBe('Hello from LLM')
    expect(result.usage?.promptTokens).toBe(10)
    expect(result.usage?.completionTokens).toBe(5)

    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(fetchCall[0]).toBe('https://api.example.com/v1/chat/completions')

    const body = JSON.parse(fetchCall[1].body)
    expect(body.model).toBe('gpt-4')
    expect(body.messages).toHaveLength(2)
    expect(body.temperature).toBe(0.8)

    const headers = fetchCall[1].headers
    expect(headers['Authorization']).toBe('Bearer test-key')
  })

  it('throws on HTTP error with sanitized message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Invalid API key: sk-abcdefghijklmnopqrstuvwxyz'),
    })

    const adapter = createOpenAICompatibleAdapter(mockConfig)
    await expect(
      adapter.generate([{ role: 'user', content: 'test' }]),
    ).rejects.toThrow('[REDACTED]')
  })

  it('throws on missing content in response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: {} }] }),
    })

    const adapter = createOpenAICompatibleAdapter(mockConfig)
    await expect(
      adapter.generate([{ role: 'user', content: 'test' }]),
    ).rejects.toThrow('missing content')
  })

  it('strips trailing slash from endpoint', async () => {
    const config = { ...mockConfig, endpoint: 'https://api.example.com/v1/' }
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { content: 'ok' } }] }),
    })

    const adapter = createOpenAICompatibleAdapter(config)
    await adapter.generate([{ role: 'user', content: 'test' }])

    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(fetchCall[0]).toBe('https://api.example.com/v1/chat/completions')
  })

  it('omits Authorization header when no apiKey', async () => {
    const config = { ...mockConfig, apiKey: '' }
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { content: 'ok' } }] }),
    })

    const adapter = createOpenAICompatibleAdapter(config)
    await adapter.generate([{ role: 'user', content: 'test' }])

    const headers = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers
    expect(headers['Authorization']).toBeUndefined()
  })
})
