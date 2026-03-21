import { describe, it, expect, vi } from 'vitest'
import { createAnthropicAdapter } from './anthropic'
import type { LLMConfig } from '../../types/preset'

const mockConfig: LLMConfig = {
  provider: 'anthropic',
  providerId: 'anthropic',
  model: 'claude-sonnet-4-20250514',
  endpoint: 'https://api.anthropic.com',
  apiKey: 'test-key',
  temperature: 0.8,
  topP: 0.95,
  maxTokens: 2048,
  maxContext: 200000,
  frequencyPenalty: 0,
  presencePenalty: 0,
}

describe('createAnthropicAdapter', () => {
  it('sends correct Anthropic Messages API format', async () => {
    const mockResponse = {
      content: [{ type: 'text', text: '月光洒落在废墟上...' }],
      usage: { input_tokens: 100, output_tokens: 50 },
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const adapter = createAnthropicAdapter(mockConfig)
    const result = await adapter.generate([
      { role: 'system', content: '你是叙事引擎' },
      { role: 'user', content: '开始冒险' },
    ])

    expect(result.content).toBe('月光洒落在废墟上...')
    expect(result.usage?.promptTokens).toBe(100)
    expect(result.usage?.completionTokens).toBe(50)

    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(fetchCall[0]).toBe('https://api.anthropic.com/v1/messages')

    const body = JSON.parse(fetchCall[1].body)
    expect(body.model).toBe('claude-sonnet-4-20250514')
    expect(body.system).toBe('你是叙事引擎')
    // System messages should NOT appear in messages array
    expect(body.messages).toHaveLength(1)
    expect(body.messages[0].role).toBe('user')

    const headers = fetchCall[1].headers
    expect(headers['x-api-key']).toBe('test-key')
    expect(headers['anthropic-version']).toBe('2023-06-01')
    // Should NOT use Bearer token
    expect(headers['Authorization']).toBeUndefined()
  })

  it('extracts system prompt from multiple system messages', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ content: [{ type: 'text', text: 'ok' }] }),
    })

    const adapter = createAnthropicAdapter(mockConfig)
    await adapter.generate([
      { role: 'system', content: '系统指令1' },
      { role: 'system', content: '系统指令2' },
      { role: 'user', content: '你好' },
    ])

    const body = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body)
    expect(body.system).toBe('系统指令1\n\n系统指令2')
    expect(body.messages).toHaveLength(1)
  })

  it('merges consecutive same-role messages', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ content: [{ type: 'text', text: 'ok' }] }),
    })

    const adapter = createAnthropicAdapter(mockConfig)
    await adapter.generate([
      { role: 'user', content: '第一段' },
      { role: 'user', content: '第二段' },
    ])

    const body = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body)
    expect(body.messages).toHaveLength(1)
    expect(body.messages[0].content).toContain('第一段')
    expect(body.messages[0].content).toContain('第二段')
  })

  it('omits system field when no system messages', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ content: [{ type: 'text', text: 'ok' }] }),
    })

    const adapter = createAnthropicAdapter(mockConfig)
    await adapter.generate([{ role: 'user', content: '你好' }])

    const body = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body)
    expect(body.system).toBeUndefined()
  })

  it('throws on HTTP error with sanitized message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Invalid API key: sk-ant-abcdefghijklmnop'),
    })

    const adapter = createAnthropicAdapter(mockConfig)
    await expect(
      adapter.generate([{ role: 'user', content: 'test' }]),
    ).rejects.toThrow('[REDACTED]')
  })
})
