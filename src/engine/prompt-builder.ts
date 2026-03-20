import type { Story, Scene, NarratorStyle } from '../types/story'
import type { Character } from '../types/character'
import type { LoreEntry } from '../types/lore'
import type { LLMMessage } from '../types/adapter'
import type { StoryEvent } from '../types/events'

/**
 * Build a scene prompt for the LLM.
 * Key difference from ST: only injects what the target character knows,
 * includes current state snapshots (not full history), and gives explicit
 * generation instructions.
 */
export function buildScenePrompt(
  story: Story,
  scene: Scene,
  targetCharacter?: Character,
): LLMMessage[] {
  const messages: LLMMessage[] = []

  // 1. System instructions
  messages.push({
    role: 'system',
    content: buildSystemInstructions(story.narratorStyle),
  })

  // 2. Current scene setting
  messages.push({
    role: 'system',
    content: buildSceneSetting(story, scene),
  })

  // 3. Character state snapshots (only for participants)
  for (const charId of scene.participants) {
    const char = story.characters.get(charId)
    if (char) {
      messages.push({
        role: 'system',
        content: buildCharacterSnapshot(char),
      })
    }
  }

  // 4. Location details with state modifiers
  const locationContent = buildLocationContext(story, scene)
  if (locationContent) {
    messages.push({ role: 'system', content: locationContent })
  }

  // 5. Lore injection (keyword matched + knowledge filtered)
  const loreContent = buildLoreContext(scene, targetCharacter, story.loreEntries)
  if (loreContent) {
    messages.push({ role: 'system', content: loreContent })
  }

  // 6. Recent events (only current scene, not full history)
  const recentEvents = scene.events.slice(-15)
  if (recentEvents.length > 0) {
    messages.push({
      role: 'user',
      content: `## 本场景近期事件\n${formatEventsForPrompt(recentEvents)}`,
    })
  }

  // 7. Generation instructions
  messages.push({
    role: 'user',
    content: '请继续推进故事。根据角色的性格、当前状态和目标，生成接下来的 2-5 个事件。',
  })

  return messages
}

function buildSystemInstructions(style: NarratorStyle): string {
  return `你是一个互动叙事引擎。请以${style.voice}视角，${style.tone}的风格推进故事。
${style.customInstructions ? `\n${style.customInstructions}\n` : ''}
## 输出格式
以 JSON 数组返回事件序列，每个事件有 type 和 content 字段。可用的事件类型：
- narration: 旁白/环境描写
- dialogue: 角色对话（需指定 characterId 和 mood）
- action: 角色动作（需指定 characterId）
- choice: 给玩家的选择（提供 2-4 个选项）
- state_change: 状态变更（需指定 changes 数组和 displayText）
- internal: 角色内心独白（需指定 characterId）`
}

function buildSceneSetting(story: Story, scene: Scene): string {
  const participantNames = scene.participants
    .map(id => story.characters.get(id)?.identity.name)
    .filter(Boolean)
    .join('、')

  return `## 当前场景
地点：${scene.setting.location}
时间：${scene.setting.time}
氛围：${scene.setting.atmosphere}${scene.setting.weatherOrCondition ? `\n天气/状况：${scene.setting.weatherOrCondition}` : ''}
在场角色：${participantNames || '无'}`
}

function buildCharacterSnapshot(char: Character): string {
  const activeGoals = char.state.goals
    .filter(g => g.status === 'active')
    .map(g => g.description)
    .join('；')

  const playerRel = char.state.relationships.get('player')
  const relInfo = playerRel
    ? `${playerRel.disposition}（信任度 ${playerRel.trust}/100）`
    : '陌生'

  const knownFacts = [...char.state.knowledge.knownFacts].slice(0, 10).join('；')

  let content = `## ${char.identity.name}
性格：${char.identity.personality}
当前情绪：${char.state.mood}
当前目标：${activeGoals || '无明确目标'}
与玩家的关系：${relInfo}
已知事实：${knownFacts || '无特殊信息'}`

  if (char.state.conditions.length > 0) {
    content += `\n状态：${char.state.conditions.join('、')}`
  }

  return content
}

function buildLocationContext(story: Story, scene: Scene): string | null {
  // Find location by name (since scene stores location name, not ID)
  let location = null
  for (const loc of story.worldState.locations.values()) {
    if (loc.name === scene.setting.location) {
      location = loc
      break
    }
  }
  if (!location) return null

  let desc = location.baseDescription
  if (location.stateModifiers.length > 0) {
    desc += '\n\n当前变化：\n' + location.stateModifiers.map(m => `- ${m.description}`).join('\n')
  }
  return `## 地点详情\n${desc}`
}

/** Get lore entries relevant to the current scene, filtered by character knowledge */
export function getRelevantLore(
  scene: Scene,
  character: Character | undefined,
  loreEntries: LoreEntry[],
): string[] {
  const sceneText = [
    scene.setting.location,
    scene.setting.atmosphere,
    ...scene.events.map(e => 'content' in e ? (e as { content: string }).content : ''),
  ].join(' ')

  return loreEntries
    .filter(entry => {
      // Constant entries always match
      if (entry.isConstant) return true

      // Keyword matching
      const matches = entry.triggerKeywords.some(k =>
        sceneText.toLowerCase().includes(k.toLowerCase()),
      )
      if (!matches) return false

      // Probability check
      if (entry.probability < 1 && Math.random() > entry.probability) return false

      // Character knowledge filter
      if (entry.requiresKnowledge && character) {
        const hasRelevantKnowledge = entry.triggerKeywords.some(k =>
          [...character.state.knowledge.knownFacts].some(fact =>
            fact.toLowerCase().includes(k.toLowerCase()),
          ),
        )
        if (!hasRelevantKnowledge) return false
      }

      return true
    })
    .sort((a, b) => (b.groupWeight || 0) - (a.groupWeight || 0))
    .map(e => e.content)
}

function buildLoreContext(
  scene: Scene,
  character: Character | undefined,
  loreEntries: LoreEntry[],
): string | null {
  const relevant = getRelevantLore(scene, character, loreEntries)
  if (relevant.length === 0) return null
  return `## 背景知识\n${relevant.join('\n\n')}`
}

/** Format events for inclusion in the prompt */
export function formatEventsForPrompt(events: StoryEvent[]): string {
  return events.map(event => {
    switch (event.type) {
      case 'narration':
        return `[旁白] ${event.content}`
      case 'dialogue':
        return `[对话:${event.characterId}${event.mood ? ` (${event.mood})` : ''}] ${event.content}`
      case 'action':
        return `[动作:${event.characterId}] ${event.content}`
      case 'choice':
        return `[选择] ${event.prompt}${event.selectedOptionId ? ` → ${event.selectedOptionId}` : ' (待选)'}`
      case 'scene_change':
        return `[场景切换] ${event.fromLocation} → ${event.toLocation}${event.transitionText ? `: ${event.transitionText}` : ''}`
      case 'state_change':
        return `[状态变更] ${event.displayText}`
      case 'internal':
        return `[内心:${event.characterId}] ${event.content}`
      case 'system':
        return `[系统] ${event.content}`
      default:
        return ''
    }
  }).join('\n')
}
