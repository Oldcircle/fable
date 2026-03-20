import { describe, it, expect } from 'vitest'
import { translateMacros, reverseTranslateMacros } from './macro-translator'

describe('translateMacros', () => {
  it('translates {{char}} and {{user}}', () => {
    expect(translateMacros('{{char}} 对 {{user}} 说'))
      .toBe('${character.name} 对 ${player.name} 说')
  })

  it('translates {{personality}}', () => {
    expect(translateMacros('性格：{{personality}}'))
      .toBe('性格：${character.identity.personality}')
  })

  it('removes {{//注释}}', () => {
    expect(translateMacros('正文{{//这段不发送给AI}}结尾'))
      .toBe('正文结尾')
  })

  it('translates {{random:1:10}}', () => {
    expect(translateMacros('伤害 {{random:1:10}} 点'))
      .toBe('伤害 ${random(1, 10)} 点')
  })

  it('translates {{setvar::name::value}}', () => {
    expect(translateMacros('{{setvar::hp::100}}'))
      .toBe('${setFlag("hp", "100")}')
  })

  it('translates {{getvar::name}}', () => {
    expect(translateMacros('HP: {{getvar::hp}}'))
      .toBe('HP: ${getFlag("hp")}')
  })

  it('removes <START> markers', () => {
    expect(translateMacros('描述\n<START>\n对话'))
      .toBe('描述\n\n对话')
  })

  it('removes {{char_version}}', () => {
    expect(translateMacros('v{{char_version}}'))
      .toBe('v')
  })

  it('removes {{trim}}', () => {
    expect(translateMacros('text {{trim}} more'))
      .toBe('text  more')
  })

  it('handles empty string', () => {
    expect(translateMacros('')).toBe('')
  })

  it('handles null-ish input', () => {
    expect(translateMacros(undefined as unknown as string)).toBe('')
  })

  it('handles text with no macros', () => {
    expect(translateMacros('plain text')).toBe('plain text')
  })

  it('handles multiple macros in one string', () => {
    const input = '{{char}} 看着 {{user}}，{{char}} 微笑道'
    const expected = '${character.name} 看着 ${player.name}，${character.name} 微笑道'
    expect(translateMacros(input)).toBe(expected)
  })
})

describe('reverseTranslateMacros', () => {
  it('reverses ${character.name} to {{char}}', () => {
    expect(reverseTranslateMacros('${character.name} says'))
      .toBe('{{char}} says')
  })

  it('reverses ${player.name} to {{user}}', () => {
    expect(reverseTranslateMacros('Hello ${player.name}'))
      .toBe('Hello {{user}}')
  })

  it('handles empty string', () => {
    expect(reverseTranslateMacros('')).toBe('')
  })

  it('round-trips basic macros', () => {
    const original = '{{char}} greets {{user}}'
    const translated = translateMacros(original)
    const reversed = reverseTranslateMacros(translated)
    expect(reversed).toBe(original)
  })
})
