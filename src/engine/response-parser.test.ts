import { describe, it, expect } from 'vitest'
import { parseStoryboardResponse } from './response-parser'

describe('parseStoryboardResponse', () => {
  it('parses a clean JSON array', () => {
    const response = JSON.stringify([
      { type: 'narration', content: '月光洒落在城堡的废墟上...' },
      { type: 'dialogue', characterId: 'seraphina', content: '小心，前方有危险。', mood: '警觉' },
    ])
    const result = parseStoryboardResponse(response)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.length).toBe(2)
      expect(result.value[0].type).toBe('narration')
      expect(result.value[1].type).toBe('dialogue')
      if (result.value[1].type === 'dialogue') {
        expect(result.value[1].mood).toBe('警觉')
      }
    }
  })

  it('extracts JSON from markdown code fence', () => {
    const response = `Here's the continuation:

\`\`\`json
[
  {"type": "narration", "content": "风吹过树梢..."},
  {"type": "action", "characterId": "guard", "content": "拔出长剑"}
]
\`\`\`

I hope this continues the story well!`

    const result = parseStoryboardResponse(response)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.length).toBe(2)
    }
  })

  it('extracts JSON from surrounding text', () => {
    const response = 'The story continues: [{"type": "narration", "content": "天亮了"}] End.'
    const result = parseStoryboardResponse(response)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.length).toBe(1)
    }
  })

  it('parses choice events with options', () => {
    const response = JSON.stringify([
      {
        type: 'choice',
        prompt: '你要怎么做？',
        options: [
          { label: '拔剑迎战' },
          { label: '尝试谈判', description: '用外交手段解决' },
        ],
        allowFreeInput: true,
      },
    ])
    const result = parseStoryboardResponse(response)
    expect(result.ok).toBe(true)
    if (result.ok) {
      const event = result.value[0]
      expect(event.type).toBe('choice')
      if (event.type === 'choice') {
        expect(event.options.length).toBe(2)
        expect(event.options[0].isGenerated).toBe(true)
        expect(event.allowFreeInput).toBe(true)
      }
    }
  })

  it('parses scene_change events', () => {
    const response = JSON.stringify([
      {
        type: 'scene_change',
        fromLocation: '城门',
        toLocation: '集市',
        transitionText: '穿过拥挤的人群',
        timePassed: '半小时后',
      },
    ])
    const result = parseStoryboardResponse(response)
    expect(result.ok).toBe(true)
    if (result.ok) {
      const event = result.value[0]
      if (event.type === 'scene_change') {
        expect(event.fromLocation).toBe('城门')
        expect(event.toLocation).toBe('集市')
        expect(event.timePassed).toBe('半小时后')
      }
    }
  })

  it('parses state_change events', () => {
    const response = JSON.stringify([
      { type: 'state_change', displayText: '你获得了「国王之剑」', changes: [] },
    ])
    const result = parseStoryboardResponse(response)
    expect(result.ok).toBe(true)
    if (result.ok && result.value[0].type === 'state_change') {
      expect(result.value[0].displayText).toBe('你获得了「国王之剑」')
    }
  })

  it('parses internal events', () => {
    const response = JSON.stringify([
      { type: 'internal', characterId: 'seraphina', content: '我不能让他知道真相...' },
    ])
    const result = parseStoryboardResponse(response)
    expect(result.ok).toBe(true)
    if (result.ok && result.value[0].type === 'internal') {
      expect(result.value[0].content).toContain('真相')
    }
  })

  it('skips invalid events but keeps valid ones', () => {
    const response = JSON.stringify([
      { type: 'narration', content: '有效事件' },
      { type: 'dialogue' }, // missing content and characterId
      { type: 'unknown_type', content: 'blah' },
      { type: 'action', characterId: 'guard', content: '有效动作' },
    ])
    const result = parseStoryboardResponse(response)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.length).toBe(2)
      expect(result.value[0].type).toBe('narration')
      expect(result.value[1].type).toBe('action')
    }
  })

  it('returns error for no JSON', () => {
    const result = parseStoryboardResponse('Just a plain text response with no JSON')
    expect(result.ok).toBe(false)
  })

  it('returns error for non-array JSON', () => {
    const result = parseStoryboardResponse('{"type": "narration", "content": "not an array"}')
    expect(result.ok).toBe(false)
  })

  it('returns error for empty array', () => {
    const result = parseStoryboardResponse('[]')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('No valid events')
    }
  })

  it('assigns unique IDs to each event', () => {
    const response = JSON.stringify([
      { type: 'narration', content: 'A' },
      { type: 'narration', content: 'B' },
    ])
    const result = parseStoryboardResponse(response)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value[0].id).not.toBe(result.value[1].id)
    }
  })
})
