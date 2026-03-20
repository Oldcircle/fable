# Fable

- **GitHub**: https://github.com/Oldcircle/fable
- **本地路径**: `/Users/yb/Opensource/projects/ai/fable`

## 概述

Fable 是一个 AI 驱动的互动叙事引擎，区别于 SillyTavern / RisuAI 等聊天前端。核心差异：以 **故事图（Story Graph）** 而非消息列表为数据模型，支持场景结构、角色状态演化、世界持久化、剧情分支回溯。

**不是聊天工具，是叙事引擎。**

## 开始工作前

**必须先读以下文件**：

1. `STATUS.md` — 当前开发进度、已知问题、待办事项
2. `PLAN.md` — 架构设计、系统分层、引擎流程、开发路线图
3. `DESIGN.md` — 数据模型、ST 格式规范、字段映射、Prompt 组装流程

完成工作后，**必须更新 `STATUS.md`**。

## 技术栈

- 语言: TypeScript 5
- 前端: Svelte 5 (Runes)
- 桌面端: Tauri 2 (Rust)（待集成）
- 构建: Vite 8
- 样式: Tailwind CSS 4
- 包管理器: pnpm
- 测试: Vitest
- 存储: Dexie.js (IndexedDB) + 文件系统 (Tauri)
- Lint: Oxlint

## 项目结构

```
src/
├── types/                  # 类型定义
│   ├── story.ts            # Story, Chapter, Scene, Event
│   ├── character.ts        # Character (identity + state)
│   ├── world.ts            # WorldState, Location, Faction
│   ├── plot.ts             # PlotGraph, Branch, Choice
│   ├── preset.ts           # LLM 预设
│   └── compat.ts           # ST 兼容格式类型
│
├── engine/                 # 叙事引擎核心（纯逻辑，无 UI 依赖）
│   ├── scene-manager.ts    # 场景编排与推进
│   ├── character-agent.ts  # 角色状态管理与行为决策
│   ├── world-state.ts      # 世界状态持久化与查询
│   ├── plot-graph.ts       # 剧情分支图管理
│   ├── prompt-builder.ts   # 精确 prompt 组装（非全量拼接）
│   └── memory/             # 角色记忆系统
│       ├── knowledge.ts    # 角色知识图谱
│       └── retrieval.ts    # 记忆检索（向量 + 关键词）
│
├── adapters/               # 外部服务适配
│   ├── llm/                # LLM API 适配器
│   │   ├── openai.ts       # OpenAI 兼容 (DeepSeek/Groq/OpenRouter/Ollama)
│   │   ├── anthropic.ts    # Claude API
│   │   └── google.ts       # Gemini API
│   └── image/              # 图像生成适配（后期）
│       └── comfyui.ts
│
├── compat/                 # SillyTavern 兼容层
│   ├── import-character.ts # 角色卡导入 (PNG/JSON, V2/V3)
│   ├── import-world.ts     # 世界书导入
│   ├── import-preset.ts    # 预设导入
│   ├── macro-translator.ts # ST 宏翻译 ({{char}} → 内部变量)
│   └── export.ts           # 导出为 ST 兼容格式
│
├── stores/                 # Svelte 状态管理
│   ├── story.svelte.ts     # 当前故事状态
│   ├── characters.svelte.ts
│   ├── world.svelte.ts
│   └── settings.svelte.ts
│
├── db/                     # 数据持久化
│   └── index.ts            # Dexie.js schema
│
├── lib/                    # Svelte UI 组件
│   ├── SceneView/          # 场景渲染（混合排版）
│   ├── PlotGraph/          # 剧情分支可视化
│   ├── CharacterPanel/     # 角色状态面板
│   ├── WorldMap/           # 世界状态概览
│   ├── Timeline/           # 时间线视图
│   ├── Editor/             # 场景/角色编辑器
│   └── Common/             # 通用 UI 组件
│
├── pages/                  # 页面级组件
│   ├── Play.svelte         # 主游玩界面
│   ├── StoryOverview.svelte # 故事全局视图
│   ├── CharacterEditor.svelte
│   ├── WorldEditor.svelte
│   ├── Settings.svelte
│   └── Import.svelte       # ST 资产导入
│
└── utils/
    ├── png-meta.ts         # PNG tEXt chunk 读写
    └── format.ts           # 文本格式化工具
```

## 开发命令

- 安装依赖: `pnpm install`
- 启动开发 (Web): `pnpm dev`（端口 5175）
- 启动开发 (桌面): `pnpm tauri dev`（待集成 Tauri 2）
- 类型检查: `pnpm check`
- 运行测试: `pnpm test`
- 运行单个测试: `pnpm test src/engine/prompt-builder.test.ts`
- 构建 (Web): `pnpm build`
- Lint: `pnpm lint`
- **全链路验证**: `pnpm verify`（check → lint → test，提交前必跑）

## 约定

- Svelte 5 Runes 风格状态管理 ($state, $derived, $effect)
- 文件命名: kebab-case
- 组件命名: PascalCase
- engine/ 目录为纯逻辑，禁止导入 UI/Svelte 依赖
- compat/ 目录负责所有 ST 格式转换，其他模块不直接处理 ST 格式
- 使用 Result<T, E> 模式处理错误，不在 engine 层抛异常

## SillyTavern 兼容性

兼容数据，不兼容代码。支持导入：
- **角色卡 PNG** (V2/V3) → 读取 tEXt chunk → 映射到 Character（静态身份 + 默认动态状态）
- **世界书 JSON** → 语义分类为 Location / LoreEntry / 角色补充 / 规则
- **预设 JSON** → 提取 LLM 配置 + 叙事指令
- **宏翻译** → `{{char}}` / `{{user}}` 等 ST 宏 → Fable 变量语法

支持导出为 ST 角色卡 PNG（V3）。

测试数据位于 `~/Opensource/projects/ai/storyforge/SillyTavern-Backup/`。
详细格式规范和字段映射见 `DESIGN.md`。

## 代码质量约定

- **TypeScript 严格模式**：`strict: true`
- **测试 colocated**：测试文件放被测文件旁边（`foo.test.ts`）
- **修改 engine/ 或 compat/ 时必须保持已有测试通过**
- **新增纯逻辑函数时必须同时写测试**（engine/、compat/、utils/ 中的函数）
- **错误脱敏**：catch 块中 error.message 传入 store state 前过滤敏感信息
- **文件行数**：单文件尽量 < 700 行
- **暗色主题**（bg: #0f1117，与 trace-viewer / StoryForge 统一）
- **提交前检查**：`pnpm verify`（check → lint → test）

## 测试策略

> 借鉴 OpenClaw 项目的测试分层思路，适配 Fable 规模。

### 四道自动防线

```
写代码 → 【IDE 类型检查】 → 【git commit: pre-commit hook (lint + format)】
       → 【pnpm test: Vitest 自动测试】 → 【GitHub CI: 云端全量验证】
```

### 测试分层

| 层 | 覆盖什么 | 怎么跑 | 要不要 mock |
|---|---|---|---|
| **单元测试** | engine/、compat/、utils/ 的纯函数 | `pnpm test` 自动并行 | 不碰外部，不需要 mock |
| **集成测试** | 引擎 + 存储协作（创建故事→推进场景→验证状态） | `pnpm test` | mock Dexie.js 或用 fake-indexeddb |
| **适配器测试** | LLM API 调用（mock HTTP 响应） | `pnpm test` | mock fetch，不真调 API |
| **Live 测试** | 真正调 LLM API（验证 prompt 有效性） | `pnpm test:live`（手动按需） | 不 mock，花钱 |

### 各模块必须测什么

#### engine/（叙事引擎核心）— 测试覆盖最高

```
engine/
├── scene-manager.ts          # 必须测
├── scene-manager.test.ts     # 场景创建、推进、转换、边界条件
├── prompt-builder.ts         # 必须测
├── prompt-builder.test.ts    # prompt 组装正确性、角色认知过滤
├── plot-graph.ts             # 必须测
├── plot-graph.test.ts        # 节点/边操作、分支回溯、环检测
├── character-agent.ts        # 必须测
├── character-agent.test.ts   # 状态更新、关系变更、知识追加
├── world-state.ts            # 必须测
├── world-state.test.ts       # 标记读写、地点状态叠加、时间推进
└── memory/
    ├── knowledge.ts
    └── knowledge.test.ts     # 知识查询、角色认知边界
```

示例测试：

```typescript
// engine/prompt-builder.test.ts
import { describe, it, expect } from 'vitest'
import { buildScenePrompt } from './prompt-builder'
import { createTestStory, createTestCharacter } from '../test-utils/fixtures'

describe('buildScenePrompt', () => {
  it('只注入角色知道的事实', () => {
    const story = createTestStory()
    const scene = story.chapters[0].scenes[0]
    const npc = story.characters.get('seraphina')!

    // NPC 不知道 "玩家偷了国王的剑"
    npc.state.knowledge.knownFacts = new Set(['城堡东翼被摧毁'])

    const messages = buildScenePrompt(story, scene, npc)
    const allContent = messages.map(m => m.content).join('\n')

    expect(allContent).toContain('城堡东翼被摧毁')
    expect(allContent).not.toContain('偷了国王的剑')
  })

  it('包含角色当前情绪和目标', () => {
    const story = createTestStory()
    const scene = story.chapters[0].scenes[0]
    const npc = story.characters.get('seraphina')!
    npc.state.mood = '警觉'
    npc.state.goals = [{ id: 'g1', description: '寻找弟弟', status: 'active', priority: 8, relatedScenes: [] }]

    const messages = buildScenePrompt(story, scene, npc)
    const allContent = messages.map(m => m.content).join('\n')

    expect(allContent).toContain('警觉')
    expect(allContent).toContain('寻找弟弟')
  })
})
```

#### compat/（ST 兼容层）— 数据正确性关键

```
compat/
├── import-character.ts
├── import-character.test.ts  # 用真实 ST 角色卡 PNG 测试解析
├── import-world.ts
├── import-world.test.ts      # 用真实 ST 世界书 JSON 测试分类
├── import-preset.ts
├── import-preset.test.ts     # 预设字段映射正确性
├── macro-translator.ts
├── macro-translator.test.ts  # 所有宏的翻译覆盖
└── export.ts
```

示例测试：

```typescript
// compat/macro-translator.test.ts
import { describe, it, expect } from 'vitest'
import { translateMacros } from './macro-translator'

describe('translateMacros', () => {
  it('翻译 {{char}} 和 {{user}}', () => {
    expect(translateMacros('{{char}} 对 {{user}} 说'))
      .toBe('${character.name} 对 ${player.name} 说')
  })

  it('移除 {{//注释}}', () => {
    expect(translateMacros('正文{{//这段不发送给AI}}结尾'))
      .toBe('正文结尾')
  })

  it('翻译 {{random:1:10}} 为运行时模板', () => {
    expect(translateMacros('伤害 {{random:1:10}} 点'))
      .toBe('伤害 ${random(1, 10)} 点')
  })

  it('移除 <START> 标记', () => {
    expect(translateMacros('描述\n<START>\n对话'))
      .toBe('描述\n\n对话')
  })

  it('空字符串返回空', () => {
    expect(translateMacros('')).toBe('')
  })
})

// compat/import-world.test.ts
import { describe, it, expect } from 'vitest'
import { importSTWorldInfo } from './import-world'
import eldoriaWorld from '../../test-data/Eldoria.json'

describe('importSTWorldInfo', () => {
  it('从真实 ST 世界书导入', () => {
    const result = importSTWorldInfo(eldoriaWorld)

    // Eldoria 世界书应该产生地点和 lore 条目
    expect(result.locations.length).toBeGreaterThan(0)
    expect(result.loreEntries.length).toBeGreaterThan(0)
  })

  it('跳过 disabled 条目', () => {
    const world = {
      entries: {
        '0': { ...baseEntry, disable: true, content: '不该出现' },
        '1': { ...baseEntry, disable: false, content: '应该出现' },
      }
    }
    const result = importSTWorldInfo(world)
    const allContent = [...result.loreEntries, ...result.locations]
      .map(e => e.content || e.baseDescription).join(' ')

    expect(allContent).not.toContain('不该出现')
    expect(allContent).toContain('应该出现')
  })
})
```

### 测试工具类 (`src/test-utils/`)

```
src/test-utils/
├── fixtures.ts          # createTestStory(), createTestCharacter(), createTestScene()
├── mock-llm.ts          # 模拟 LLM API 返回（固定 JSON 事件序列）
└── fake-db.ts           # 内存 IndexedDB 替身（用 fake-indexeddb 库）
```

示例：

```typescript
// test-utils/fixtures.ts
export function createTestCharacter(overrides?: Partial<Character>): Character {
  return {
    id: 'seraphina',
    identity: {
      name: 'Seraphina',
      description: 'A wise elven guide',
      personality: 'Kind but cautious',
      appearance: 'Pink hair, amber eyes',
      backstory: 'Guardian of Eldoria',
      speechStyle: 'Gentle and formal',
      exampleDialogues: '',
      tags: ['elf', 'guide'],
    },
    state: {
      location: '城门',
      mood: '平静',
      conditions: [],
      inventory: [],
      relationships: new Map(),
      knowledge: { knownFacts: new Set(), witnessedScenes: [], hearsay: [] },
      goals: [],
    },
    ...overrides,
  }
}

// test-utils/mock-llm.ts
export function createMockLLMAdapter(): LLMAdapter {
  return {
    generate: vi.fn().mockResolvedValue({
      content: JSON.stringify([
        { type: 'narration', content: '月光洒落在城堡的废墟上...' },
        { type: 'dialogue', characterId: 'seraphina', content: '小心，前方有危险。', mood: '警觉' },
      ])
    }),
    stream: vi.fn(),
  }
}
```

### Pre-commit Hook

项目初始化时配置（Phase 0 任务）：

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: oxlint
        name: Lint
        entry: pnpm lint
        language: system
        pass_filenames: false
      - id: typecheck
        name: TypeCheck
        entry: pnpm check
        language: system
        pass_filenames: false
```

### CI 配置

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24 }
      - run: pnpm install
      - run: pnpm check    # 类型检查
      - run: pnpm lint      # 代码检查
      - run: pnpm test      # 单元+集成测试
```
