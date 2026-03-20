# Fable 数据模型与技术规范

> 本文档定义所有核心数据结构、ST 兼容格式规范、字段映射和 Prompt 组装流程。
> 架构设计和开发路线图见 `PLAN.md`。

---

## 1. 核心数据模型

### 1.1 Story（故事）

```typescript
interface Story {
  id: string
  title: string
  synopsis: string                    // 故事简介
  narratorStyle: NarratorStyle        // 叙事风格配置
  chapters: Chapter[]
  characters: Map<string, Character>  // 所有参与角色
  worldState: WorldState              // 当前世界状态
  plotGraph: PlotGraph                // 剧情分支图
  loreEntries: LoreEntry[]           // 知识库条目（从世界书导入或手动创建）
  metadata: {
    createdAt: string
    updatedAt: string
    totalScenes: number
    currentSceneId: string            // 当前游玩位置
  }
}

interface NarratorStyle {
  voice: string          // "第三人称全知" | "第一人称" | "第二人称" | 自定义
  tone: string           // "黑暗奇幻" | "轻松日常" | "悬疑" | 自定义
  language: string       // "zh-CN" | "en" | "ja"
  customInstructions: string  // 用户自定义叙事指令
}
```

### 1.2 Chapter & Scene（章节 & 场景）

```typescript
interface Chapter {
  id: string
  title: string
  synopsis: string
  scenes: Scene[]
  order: number
}

interface Scene {
  id: string
  chapterId: string
  setting: SceneSetting
  participants: string[]              // 角色 ID 列表
  events: StoryEvent[]                // 场景内事件序列
  stateChanges: StateChange[]         // 场景产生的状态变更
  possibleTransitions: SceneTransition[]  // 可跳转的下一场景
  metadata: {
    createdAt: string
    turnCount: number                 // 交互轮次
    isCompleted: boolean
  }
}

interface SceneSetting {
  location: string          // 地点名称，关联 WorldState.locations
  time: string              // "黎明" | "正午" | "黄昏" | "深夜" | 自定义
  atmosphere: string        // 氛围描述（供 prompt 使用）
  weatherOrCondition?: string
}
```

### 1.3 StoryEvent（故事事件）

场景内的原子单元。**不是聊天消息**，每种类型有独立的数据结构和渲染方式。

```typescript
type StoryEvent =
  | NarrationEvent       // 旁白/环境描写
  | DialogueEvent        // 角色对话
  | ActionEvent          // 角色动作
  | ChoiceEvent          // 玩家选择点
  | SceneChangeEvent     // 场景切换
  | StateChangeEvent     // 状态变更通知
  | InternalEvent        // 角色内心独白
  | SystemEvent          // 系统信息（存档提示等）

interface NarrationEvent {
  type: 'narration'
  id: string
  content: string         // 叙述文本
  timestamp: number       // 故事内时间（非现实时间）
}

interface DialogueEvent {
  type: 'dialogue'
  id: string
  characterId: string     // 说话的角色
  content: string         // 对话内容
  mood?: string           // 情绪标记（可用于表情图切换）
  isWhisper?: boolean     // 是否为悄悄话（其他角色不可知）
  timestamp: number
}

interface ActionEvent {
  type: 'action'
  id: string
  characterId: string
  content: string         // 动作描述
  consequences?: StateChange[]  // 该动作直接导致的状态变更
  timestamp: number
}

interface ChoiceEvent {
  type: 'choice'
  id: string
  prompt: string          // 提示文本 "你要怎么做？"
  options: ChoiceOption[]
  selectedOptionId?: string  // 玩家已选择的选项（null 表示待选）
  allowFreeInput: boolean    // 是否允许自由输入（不限于预设选项）
  timestamp: number
}

interface ChoiceOption {
  id: string
  label: string           // 选项显示文本
  description?: string    // 选项的补充说明
  nextSceneId?: string    // 选择后跳转到哪个场景
  stateChanges?: StateChange[]  // 选择直接触发的状态变更
  isGenerated: boolean    // 是否由 AI 生成（vs 作者预设）
}

interface SceneChangeEvent {
  type: 'scene_change'
  id: string
  fromLocation: string
  toLocation: string
  transitionText?: string  // 过渡叙述
  timePassed?: string      // "两小时后" | "第二天清晨"
  timestamp: number
}

interface StateChangeEvent {
  type: 'state_change'
  id: string
  changes: StateChange[]
  displayText: string      // "你获得了「国王之剑」" / "与 Seraphina 的关系提升了"
  timestamp: number
}

interface InternalEvent {
  type: 'internal'
  id: string
  characterId: string
  content: string          // 内心独白
  timestamp: number
}
```

### 1.4 Character（角色）

**核心创新：静态身份 + 动态运行时状态。**

```typescript
interface Character {
  id: string

  // ====== 静态身份（从角色卡导入，不随游玩变化）======
  identity: {
    name: string
    description: string       // 角色描述
    personality: string       // 性格特征
    appearance: string        // 外貌描述
    backstory: string         // 背景故事
    speechStyle: string       // 说话风格/口头禅
    exampleDialogues: string  // 对话示例（用于 few-shot）
    tags: string[]
    avatar?: Blob             // 头像图片
  }

  // ====== 动态状态（随故事推进实时变化）======
  state: CharacterState

  // ====== 导入来源（记录兼容性信息）======
  importSource?: {
    format: 'st-png-v2' | 'st-png-v3' | 'st-json' | 'risu' | 'native'
    originalData?: any        // 保留原始数据用于回导出
  }
}

interface CharacterState {
  location: string            // 当前所在地点
  mood: string                // 当前情绪
  conditions: string[]        // 状态效果 ["受伤", "中毒", "疲惫"]
  inventory: Item[]           // 持有物品
  relationships: Map<string, Relationship>
  knowledge: CharacterKnowledge
  goals: CharacterGoal[]
}

interface Relationship {
  characterId: string
  trust: number               // 0-100
  disposition: string         // "友好" | "警惕" | "敌对" | "暧昧" | 自定义
  history: string[]           // 关系发展的关键事件摘要
  lastInteraction?: string    // 上次互动场景 ID
}

interface CharacterKnowledge {
  knownFacts: Set<string>     // "玩家偷了国王的剑"、"东翼城堡已被摧毁"
  witnessedScenes: string[]   // 亲历事件的 scene ID 列表
  hearsay: Array<{ content: string; source: string; trust: number }>
}

interface CharacterGoal {
  id: string
  description: string         // "找到失踪的弟弟"
  status: 'active' | 'completed' | 'failed' | 'abandoned'
  priority: number            // 1-10
  relatedScenes: string[]
}

interface Item {
  id: string
  name: string
  description: string
  properties?: Record<string, any>
}
```

### 1.5 WorldState（世界状态）

```typescript
interface WorldState {
  locations: Map<string, Location>
  factions: Map<string, Faction>
  flags: Map<string, any>     // "war_started": true, "king_alive": false
  timeline: WorldEvent[]
  currentTime: {
    day: number               // 故事第几天
    timeOfDay: string         // "黎明" | "上午" | "正午" | "下午" | "黄昏" | "夜晚" | "深夜"
    season?: string
  }
}

interface Location {
  id: string
  name: string
  baseDescription: string     // 基础描述（可从 ST 世界书导入）
  currentState: string        // 当前状态描述（会随事件变化）
  stateModifiers: Array<{
    description: string       // "东翼在战斗中被摧毁"
    causeSceneId: string
    timestamp: number
  }>
  connectedTo: string[]       // 相邻地点 ID
  characters: string[]        // 当前在此地点的角色 ID
  tags: string[]              // 用于世界书关键词匹配
}

interface Faction {
  id: string
  name: string
  description: string
  disposition: Map<string, number>  // 对各角色的态度 (-100 ~ +100)
  members: string[]
}

interface WorldEvent {
  id: string
  description: string
  sceneId: string
  timestamp: number
  affectedEntities: string[]
}
```

### 1.6 PlotGraph（剧情分支图）

```typescript
interface PlotGraph {
  nodes: Map<string, PlotNode>
  edges: PlotEdge[]
  currentNodeId: string
}

interface PlotNode {
  id: string
  sceneId: string
  label: string               // 节点显示名（场景标题）
  type: 'normal' | 'choice' | 'merge' | 'ending'
  isVisited: boolean
}

interface PlotEdge {
  from: string
  to: string
  label?: string              // 边的描述（选择了什么）
  choiceOptionId?: string
  isTraversed: boolean
}
```

### 1.7 StateChange（状态变更）

所有状态变更的统一表达，可由事件、选择、场景推进触发。

```typescript
type StateChange =
  | { type: 'relationship'; characterA: string; characterB: string; field: string; delta: number; reason: string }
  | { type: 'character_state'; characterId: string; field: string; value: any; reason: string }
  | { type: 'world_flag'; key: string; value: any; reason: string }
  | { type: 'location_state'; locationId: string; modifier: string; reason: string }
  | { type: 'inventory'; characterId: string; action: 'add' | 'remove'; item: Item; reason: string }
  | { type: 'goal'; characterId: string; goalId: string; newStatus: string; reason: string }
  | { type: 'knowledge'; characterId: string; fact: string; source: 'witnessed' | 'told' | 'discovered' }
  | { type: 'faction'; factionId: string; field: string; value: any; reason: string }
```

### 1.8 LoreEntry（知识库条目）

从 ST 世界书导入但不属于结构化实体的通用知识。

```typescript
interface LoreEntry {
  id: string
  name: string
  content: string
  triggerKeywords: string[]
  isConstant: boolean         // true = 始终注入
  probability: number         // 0-1
  group?: string
  groupWeight?: number
  requiresKnowledge?: boolean // true = 需要角色认知过滤
  sourceUid?: string          // ST 世界书原始 UID（用于溯源）
}
```

---

## 2. SillyTavern 资产格式规范

### 2.1 角色卡格式

**PNG 角色卡 (V2)：**
- PNG 文件的 `tEXt` chunk 中 keyword 为 `chara`
- value 为 Base64 编码的 JSON

**PNG 角色卡 (V3)：**
- `tEXt` chunk 中 keyword 为 `ccv3`
- value 为明文 JSON

```typescript
// ST 角色卡原始格式
interface STCharacterCard {
  name: string
  description: string       // 含角色描述、性格、外貌等，格式化为 [Name's Personality= "..."]
  personality: string       // 有时为空（内容在 description 里）
  scenario: string          // 场景描述，有时为空
  first_mes: string         // 开场白
  mes_example: string       // 对话示例
  creatorcomment: string
  talkativeness: string     // "0.5" 等数值字符串
  avatar: string

  data: {
    name: string
    description: string
    personality: string
    scenario: string
    first_mes: string
    mes_example: string
    creator_notes: string
    system_prompt: string
    post_history_instructions: string
    alternate_greetings: string[]
    tags: string[]

    character_book?: {
      name: string
      entries: STWorldInfoEntry[]
    }

    extensions: {
      talkativeness: number
      fav: boolean
      world: string              // 关联的外部世界书名称
      depth_prompt?: {
        prompt: string
        depth: number
        role: 'system' | 'user' | 'assistant'
      }
    }
  }

  spec?: 'chara_card_v3'
  spec_version?: '3.0'
}
```

### 2.2 世界书格式

```typescript
interface STWorldInfo {
  entries: {
    [uid: string]: STWorldInfoEntry
  }
}

interface STWorldInfoEntry {
  uid: number
  key: string[]                    // 触发关键词列表
  keysecondary: string[]           // 次要关键词
  comment: string                  // 条目名称/注释
  content: string                  // 注入文本（支持 {{char}} {{user}} 等宏）
  constant: boolean                // true = 始终注入
  selective: boolean               // 是否启用选择性逻辑
  selectiveLogic: number           // 0=AND_ANY, 1=NOT_ALL, 2=NOT_ANY, 3=AND_ALL
  order: number                    // 注入顺序
  position: number                 // 0=角色描述前, 1=角色描述后
  disable: boolean
  excludeRecursion: boolean
  preventRecursion: boolean
  delayUntilRecursion: boolean
  probability: number              // 0-100 触发概率
  useProbability: boolean
  depth: number                    // 扫描深度
  group: string
  groupOverride: boolean
  groupWeight: number
  scanDepth: number | null
  caseSensitive: boolean | null
  matchWholeWords: boolean | null
  useGroupScoring: boolean | null
  automationId: string
  role: number | null              // 0=system, 1=user, 2=assistant
  sticky: number | null
  cooldown: number | null
  delay: number | null
  displayIndex: number
  vectorized: boolean
}
```

### 2.3 预设格式

```typescript
interface STPreset {
  chat_completion_source: string       // "openai" | "deepseek" | "openrouter" | "custom"
  openai_model: string
  claude_model: string
  custom_model: string
  custom_url: string

  temperature: number
  frequency_penalty: number
  presence_penalty: number
  top_p: number
  top_k: number
  top_a: number
  min_p: number
  repetition_penalty: number
  openai_max_context: number
  openai_max_tokens: number

  prompts: STPromptEntry[]

  prompt_order: Array<{
    character_id: string
    order: Array<{
      identifier: string
      enabled: boolean
    }>
  }>
}

interface STPromptEntry {
  identifier: string
  name: string
  role: 'system' | 'user' | 'assistant'
  content: string
  system_prompt: boolean
  enabled: boolean
  marker: boolean
  injection_position: number
  injection_depth: number
  forbid_overrides: boolean
}
```

---

## 3. ST → Fable 字段映射

### 3.1 角色卡映射

```typescript
function importSTCharacter(card: STCharacterCard): Character {
  return {
    id: generateId(),
    identity: {
      name: card.data.name || card.name,
      description: card.data.description || card.description,
      personality: card.data.personality || extractPersonality(card.data.description),
      appearance: extractAppearance(card.data.description),
      backstory: card.data.scenario || card.scenario,
      speechStyle: extractSpeechStyle(card.data.mes_example || card.mes_example),
      exampleDialogues: translateMacros(card.data.mes_example || card.mes_example),
      tags: card.data.tags || [],
      avatar: extractAvatarFromPNG(pngBuffer),
    },
    state: createDefaultState(),
    importSource: {
      format: card.spec === 'chara_card_v3' ? 'st-png-v3' : 'st-png-v2',
      originalData: card,
    }
  }
}

// ST description 字段解析（提取结构化信息）
// 常见格式：
//   [Name's Personality= "trait1", "trait2", ...]
//   [Name's body= "feature1", "feature2", ...]
//   <START>
//   {{user}}: "example"
//   {{char}}: *action* "speech"
function extractPersonality(desc: string): string {
  const match = desc.match(/\[.*?Personality\s*=\s*"([^"]*(?:"[^"]*)*)/i)
  return match ? match[1] : ''
}

function extractAppearance(desc: string): string {
  const match = desc.match(/\[.*?body\s*=\s*"([^"]*(?:"[^"]*)*)/i)
  return match ? match[1] : ''
}
```

### 3.2 世界书映射

世界书条目按内容语义分类转换：

```typescript
function importSTWorldInfo(worldInfo: STWorldInfo): WorldImportResult {
  const locations: Location[] = []
  const characterTraits: Map<string, string[]> = new Map()
  const loreEntries: LoreEntry[] = []
  const rules: string[] = []

  for (const [uid, entry] of Object.entries(worldInfo.entries)) {
    if (entry.disable) continue
    const translated = translateMacros(entry.content)

    if (isLocationEntry(entry)) {
      locations.push({
        id: generateId(),
        name: entry.comment || entry.key[0],
        baseDescription: translated,
        currentState: translated,
        stateModifiers: [],
        connectedTo: [],
        characters: [],
        tags: entry.key,
      })
    } else if (isCharacterEntry(entry)) {
      const charName = detectCharacterName(entry)
      if (!characterTraits.has(charName)) characterTraits.set(charName, [])
      characterTraits.get(charName)!.push(translated)
    } else if (isRuleEntry(entry)) {
      rules.push(translated)
    } else {
      loreEntries.push({
        id: generateId(),
        name: entry.comment || entry.key[0],
        content: translated,
        triggerKeywords: entry.key,
        isConstant: entry.constant,
        probability: entry.useProbability ? entry.probability / 100 : 1,
        group: entry.group || undefined,
        groupWeight: entry.groupWeight,
        sourceUid: uid,
      })
    }
  }

  return { locations, characterTraits, loreEntries, rules }
}
```

### 3.3 预设映射

```typescript
function importSTPreset(preset: STPreset): FablePresetImport {
  return {
    llmConfig: {
      provider: mapProvider(preset.chat_completion_source),
      model: preset.openai_model || preset.claude_model || preset.custom_model,
      endpoint: preset.custom_url || undefined,
      temperature: preset.temperature,
      topP: preset.top_p,
      topK: preset.top_k,
      maxTokens: preset.openai_max_tokens,
      maxContext: preset.openai_max_context,
      frequencyPenalty: preset.frequency_penalty,
      presencePenalty: preset.presence_penalty,
    },
    narrativeInstructions: preset.prompts
      .filter(p => p.enabled && !p.marker && p.content.trim())
      .map(p => translateMacros(p.content)),
  }
}
```

### 3.4 宏翻译器

```typescript
const MACRO_MAP: Record<string, string> = {
  '{{char}}':           '${character.name}',
  '{{user}}':           '${player.name}',
  '{{charPrompt}}':     '${character.identity.description}',
  '{{personality}}':    '${character.identity.personality}',
  '{{scenario}}':       '${scene.setting.atmosphere}',
  '{{mesExamples}}':    '${character.identity.exampleDialogues}',
  '{{char_version}}':   '',
  '{{group}}':          '${scene.participants.join(", ")}',
  '{{trim}}':           '',
  '{{lastMessage}}':    '${scene.events.last.content}',
  '{{lastCharMessage}}':'${scene.events.lastByCharacter.content}',
  '{{lastUserMessage}}':'${scene.events.lastByPlayer.content}',
}

function translateMacros(text: string): string {
  let result = text
  for (const [stMacro, fableVar] of Object.entries(MACRO_MAP)) {
    result = result.replaceAll(stMacro, fableVar)
  }
  result = result.replace(/\{\{random:(\d+):(\d+)\}\}/g, '${random($1, $2)}')
  result = result.replace(/\{\{setvar::(\w+)::([^}]+)\}\}/g, '${setFlag("$1", "$2")}')
  result = result.replace(/\{\{getvar::(\w+)\}\}/g, '${getFlag("$1")}')
  result = result.replace(/\{\{\/\/[^}]*\}\}/g, '')
  result = result.replace(/<START>/g, '')
  return result.trim()
}
```

### 3.5 导出为 ST 角色卡

```typescript
function exportToSTCard(character: Character): STCharacterCard {
  return {
    name: character.identity.name,
    description: reverseTranslateMacros(character.identity.description),
    personality: reverseTranslateMacros(character.identity.personality),
    scenario: reverseTranslateMacros(character.identity.backstory),
    first_mes: '',
    mes_example: reverseTranslateMacros(character.identity.exampleDialogues),
    creatorcomment: 'Exported from Fable',
    talkativeness: '0.5',
    avatar: '',
    data: {
      tags: character.identity.tags,
      extensions: { talkativeness: 0.5, fav: false, world: '' },
    },
    spec: 'chara_card_v3',
    spec_version: '3.0',
  }
}
```

---

## 4. Prompt 组装流程

### 4.1 与 ST 的对比

```
ST 的 prompt 构建：
  [system prompt（固定）]
  [角色 description（固定）]
  [世界书匹配结果（关键词触发）]
  [聊天历史（尽量多塞）]
  [author's note]
  → 一个大 prompt → LLM

Fable 的 prompt 构建：
  1. 确定当前场景的上下文需求
  2. 组装叙事指令（NarratorStyle + 场景特定指令）
  3. 注入角色当前状态（不是全部历史，是此刻的快照）
  4. 注入相关 Lore（关键词匹配 + 角色认知过滤）
  5. 注入最近场景事件（不是全部聊天记录，是当前场景的事件）
  6. 给出明确的生成指令（生成什么类型的事件）
  → 精确的、情境化的 prompt → LLM
```

### 4.2 Prompt 构建实现

```typescript
function buildScenePrompt(story: Story, scene: Scene, targetCharacter: Character): LLMMessage[] {
  const messages: LLMMessage[] = []

  // 1. 系统指令
  messages.push({
    role: 'system',
    content: `你是一个互动叙事引擎。请以${story.narratorStyle.voice}视角，${story.narratorStyle.tone}的风格推进故事。
${story.narratorStyle.customInstructions}

## 输出格式
以 JSON 数组返回事件序列，每个事件有 type 和 content 字段。可用的事件类型：
- narration: 旁白/环境描写
- dialogue: 角色对话（需指定 characterId 和 mood）
- action: 角色动作
- choice: 给玩家的选择（提供 2-4 个选项）
- state_change: 状态变更（需指定 changes 数组）`
  })

  // 2. 当前场景设定
  messages.push({
    role: 'system',
    content: `## 当前场景
地点：${scene.setting.location}
时间：${scene.setting.time}
氛围：${scene.setting.atmosphere}
在场角色：${scene.participants.map(id => story.characters.get(id)!.identity.name).join('、')}`
  })

  // 3. 角色当前状态（精确快照）
  for (const charId of scene.participants) {
    const char = story.characters.get(charId)!
    messages.push({
      role: 'system',
      content: `## ${char.identity.name}
性格：${char.identity.personality}
当前情绪：${char.state.mood}
当前目标：${char.state.goals.filter(g => g.status === 'active').map(g => g.description).join('；') || '无明确目标'}
与玩家的关系：${char.state.relationships.get('player')?.disposition || '陌生'}（信任度 ${char.state.relationships.get('player')?.trust || 0}/100）
已知事实：${[...char.state.knowledge.knownFacts].slice(0, 10).join('；') || '无特殊信息'}
${char.state.conditions.length ? `状态：${char.state.conditions.join('、')}` : ''}`
    })
  }

  // 4. 世界状态（只含与当前场景相关的部分）
  const location = story.worldState.locations.get(scene.setting.location)
  if (location) {
    let locDesc = location.baseDescription
    if (location.stateModifiers.length) {
      locDesc += '\n\n当前变化：\n' + location.stateModifiers.map(m => `- ${m.description}`).join('\n')
    }
    messages.push({ role: 'system', content: `## 地点详情\n${locDesc}` })
  }

  // 5. Lore 注入（角色认知过滤后）
  const relevantLore = getRelevantLore(scene, targetCharacter, story.loreEntries)
  if (relevantLore.length) {
    messages.push({ role: 'system', content: `## 背景知识\n${relevantLore.join('\n\n')}` })
  }

  // 6. 最近事件（只给当前场景）
  const recentEvents = scene.events.slice(-15)
  if (recentEvents.length) {
    messages.push({
      role: 'user',
      content: `## 本场景近期事件\n${formatEventsForPrompt(recentEvents)}`
    })
  }

  // 7. 生成指令
  messages.push({
    role: 'user',
    content: `请继续推进故事。根据角色的性格、当前状态和目标，生成接下来的 2-5 个事件。`
  })

  return messages
}
```

### 4.3 Lore 注入逻辑

```typescript
function getRelevantLore(scene: Scene, character: Character, loreEntries: LoreEntry[]): string[] {
  return loreEntries
    .filter(entry => {
      const sceneText = [scene.setting.location, scene.setting.atmosphere,
        ...scene.events.map(e => e.content)].join(' ')
      const matches = entry.triggerKeywords.some(k => sceneText.includes(k))
      if (!matches && !entry.isConstant) return false
      if (entry.probability < 1 && Math.random() > entry.probability) return false
      // 检查角色是否知道该 Lore 相关的事实（通过关键词交集判断）
      if (entry.requiresKnowledge) {
        const hasRelevantKnowledge = entry.triggerKeywords.some(k =>
          [...character.knowledge.knownFacts].some(fact => fact.includes(k))
        )
        if (!hasRelevantKnowledge) return false
      }
      return true
    })
    .sort((a, b) => (b.groupWeight || 0) - (a.groupWeight || 0))
    .map(e => e.content)
}
```
