import { describe, it, expect, vi } from 'vitest'
import { createGeminiAdapter } from './google-gemini'
import type { LLMConfig } from '../../types/preset'

const mockConfig: LLMConfig = {
  provider: 'google-gemini',
  providerId: 'gemini',
  model: 'gemini-2.5-flash',
  endpoint: 'https://generativelanguage.googleapis.com',
  apiKey: 'test-gemini-key',
  temperature: 0.8,
  topP: 0.95,
  maxTokens: 2048,
  maxContext: 1000000,
  frequencyPenalty: 0,
  presencePenalty: 0,
}

describe('createGeminiAdapter', () => {
  it('sends correct Gemini API format', async () => {
    const mockResponse = {
      candidates: [{
        content: {
          role: 'model',
          parts: [{ text: '月光洒落在废墟上...' }],
        },
      }],
      usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 50 },
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const adapter = createGeminiAdapter(mockConfig)
    const result = await adapter.generate([
      { role: 'system', content: '你是叙事引擎' },
      { role: 'user', content: '开始冒险' },
    ])

    expect(result.content).toBe('月光洒落在废墟上...')
    expect(result.usage?.promptTokens).toBe(100)
    expect(result.usage?.completionTokens).toBe(50)

    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    // API key as query parameter
    expect(fetchCall[0]).toContain('key=test-gemini-key')
    expect(fetchCall[0]).toContain('generateContent')
    // Should NOT use Bearer token
    expect(fetchCall[1].headers['Authorization']).toBeUndefined()

    const body = JSON.parse(fetchCall[1].body)
    // System instruction as separate field
    expect(body.systemInstruction.parts[0].text).toBe('你是叙事引擎')
    // Messages use 'user'/'model' roles, not 'assistant'
    expect(body.contents).toHaveLength(1)
    expect(body.contents[0].role).toBe('user')
    // Safety settings present
    expect(body.safetySettings).toBeDefined()
    expect(body.safetySettings.length).toBeGreaterThan(0)
  })

  it('maps assistant role to model', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{ content: { parts: [{ text: 'ok' }] } }],
      }),
    })

    const adapter = createGeminiAdapter(mockConfig)
    await adapter.generate([
      { role: 'user', content: '你好' },
      { role: 'assistant', content: '你好！' },
      { role: 'user', content: '继续' },
    ])

    const body = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body)
    expect(body.contents[1].role).toBe('model')
  })

  it('merges consecutive same-role messages', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{ content: { parts: [{ text: 'ok' }] } }],
      }),
    })

    const adapter = createGeminiAdapter(mockConfig)
    await adapter.generate([
      { role: 'user', content: '第一段' },
      { role: 'user', content: '第二段' },
    ])

    const body = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body)
    expect(body.contents).toHaveLength(1)
    expect(body.contents[0].parts).toHaveLength(2)
  })

  it('omits systemInstruction when no system messages', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{ content: { parts: [{ text: 'ok' }] } }],
      }),
    })

    const adapter = createGeminiAdapter(mockConfig)
    await adapter.generate([{ role: 'user', content: '你好' }])

    const body = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body)
    expect(body.systemInstruction).toBeUndefined()
  })

  it('throws on safety block', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        promptFeedback: { blockReason: 'SAFETY' },
        candidates: [],
      }),
    })

    const adapter = createGeminiAdapter(mockConfig)
    await expect(
      adapter.generate([{ role: 'user', content: 'test' }]),
    ).rejects.toThrow('blocked')
  })

  it('throws on HTTP error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: () => Promise.resolve('API key invalid'),
    })

    const adapter = createGeminiAdapter(mockConfig)
    await expect(
      adapter.generate([{ role: 'user', content: 'test' }]),
    ).rejects.toThrow('403')
  })
})
