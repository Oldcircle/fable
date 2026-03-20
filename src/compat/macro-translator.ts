/**
 * SillyTavern macro translator.
 * Translates ST macros ({{char}}, {{user}}, etc.) to Fable template variables.
 */

const MACRO_MAP: Record<string, string> = {
  '{{char}}': '${character.name}',
  '{{user}}': '${player.name}',
  '{{charPrompt}}': '${character.identity.description}',
  '{{personality}}': '${character.identity.personality}',
  '{{scenario}}': '${scene.setting.atmosphere}',
  '{{mesExamples}}': '${character.identity.exampleDialogues}',
  '{{char_version}}': '',
  '{{group}}': '${scene.participants.join(", ")}',
  '{{trim}}': '',
  '{{lastMessage}}': '${scene.events.last.content}',
  '{{lastCharMessage}}': '${scene.events.lastByCharacter.content}',
  '{{lastUserMessage}}': '${scene.events.lastByPlayer.content}',
}

export function translateMacros(text: string): string {
  if (!text) return ''

  let result = text

  // Static macro replacements
  for (const [stMacro, fableVar] of Object.entries(MACRO_MAP)) {
    result = result.replaceAll(stMacro, fableVar)
  }

  // Dynamic macros
  result = result.replace(/\{\{random:(\d+):(\d+)\}\}/g, '${random($1, $2)}')
  result = result.replace(/\{\{setvar::(\w+)::([^}]+)\}\}/g, '${setFlag("$1", "$2")}')
  result = result.replace(/\{\{getvar::(\w+)\}\}/g, '${getFlag("$1")}')

  // Remove comments {{//...}}
  result = result.replace(/\{\{\/\/[^}]*\}\}/g, '')

  // Remove <START> markers
  result = result.replace(/<START>/g, '')

  return result.trim()
}

/** Reverse translate Fable variables back to ST macros (for export) */
export function reverseTranslateMacros(text: string): string {
  if (!text) return ''

  let result = text

  // Reverse static macros
  for (const [stMacro, fableVar] of Object.entries(MACRO_MAP)) {
    if (fableVar) {
      result = result.replaceAll(fableVar, stMacro)
    }
  }

  return result
}
