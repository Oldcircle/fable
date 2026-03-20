import { describe, it, expect, vi } from 'vitest'
import { generateNextEvents } from './generate'
import { createTestStory } from '../test-utils/fixtures'
import { findScene } from './scene-manager'
import type { LLMAdapter } from '../types/adapter'

function createMockAdapter(responseContent: string): LLMAdapter {
  return {
    generate: vi.fn().mockResolvedValue({ content: responseContent }),
  }
}

describe('generateNextEvents', () => {
  it('generates events from LLM response', async () => {
    const story = createTestStory()
    const scene = findScene(story, story.metadata.currentSceneId)!

    const adapter = createMockAdapter(JSON.stringify([
      { type: 'narration', content: '月光洒落在城堡的废墟上...' },
      { type: 'dialogue', characterId: 'seraphina', content: '小心，前方有危险。', mood: '警觉' },
    ]))

    const result = await generateNextEvents(story, scene, adapter)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.events.length).toBe(2)
      expect(result.events[0].type).toBe('narration')
      // Events should be appended to scene
      expect(scene.events.length).toBe(2)
    }
  })

  it('calls LLM with proper messages', async () => {
    const story = createTestStory()
    const scene = findScene(story, story.metadata.currentSceneId)!

    const adapter = createMockAdapter(JSON.stringify([
      { type: 'narration', content: 'test' },
    ]))

    await generateNextEvents(story, scene, adapter)

    expect(adapter.generate).toHaveBeenCalledTimes(1)
    const messages = (adapter.generate as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(messages.length).toBeGreaterThan(0)
    expect(messages[0].role).toBe('system')
  })

  it('returns error on LLM failure', async () => {
    const story = createTestStory()
    const scene = findScene(story, story.metadata.currentSceneId)!

    const adapter: LLMAdapter = {
      generate: vi.fn().mockRejectedValue(new Error('Network error')),
    }

    const result = await generateNextEvents(story, scene, adapter)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe('Network error')
    }
  })

  it('returns error on unparseable LLM response', async () => {
    const story = createTestStory()
    const scene = findScene(story, story.metadata.currentSceneId)!

    const adapter = createMockAdapter('This is not JSON at all, just a plain text response.')
    const result = await generateNextEvents(story, scene, adapter)
    expect(result.ok).toBe(false)
  })

  it('handles choice events in response', async () => {
    const story = createTestStory()
    const scene = findScene(story, story.metadata.currentSceneId)!

    const adapter = createMockAdapter(JSON.stringify([
      { type: 'narration', content: '守卫拦住了你的去路。' },
      {
        type: 'choice',
        prompt: '你要怎么做？',
        options: [
          { label: '拔剑迎战' },
          { label: '出示通行证' },
          { label: '尝试贿赂' },
        ],
      },
    ]))

    const result = await generateNextEvents(story, scene, adapter)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.events.length).toBe(2)
      const choice = result.events[1]
      if (choice.type === 'choice') {
        expect(choice.options.length).toBe(3)
      }
    }
  })
})
