# Fable 开发状态

> 每次工作结束后必须更新此文件。

## 当前阶段

**Phase 3 — 叙事引擎核心**（已完成）

## 进度总览

| Phase | 内容 | 状态 |
|-------|------|------|
| 0 | 项目脚手架（Svelte 5 + Vite 8 + Tailwind 4） | ✅ 已完成 |
| 1 | 数据模型与存储 | ✅ 已完成 |
| 2 | ST 兼容层（角色卡/世界书/预设导入） | ✅ 已完成 |
| 3 | 叙事引擎核心 | ✅ 已完成 |
| 4 | LLM 适配 | 未开始 |
| 5 | 前端 UI | 未开始 |
| 6 | 高级功能（分支回溯、多角色自主、导出等） | 未开始 |

## 已完成

### Phase 0 — 项目脚手架
- [x] Svelte 5 + Vite 8 + TypeScript 5.9 (strict) + Tailwind CSS 4
- [x] Vitest + Oxlint + `pnpm verify` 全链路
- [x] Dexie.js 数据库 schema + 完整类型定义（9 个文件）
- [x] 基础路由（侧栏导航，6 个页面占位）
- [x] GitHub 仓库：https://github.com/Oldcircle/fable

### Phase 1 — 数据模型与存储
- [x] 默认值工厂函数（createStory, createCharacter, createChapter, createScene 等）
- [x] PlotGraph 操作（add/remove nodes/edges, traverse, cycle detection）
- [x] WorldState 管理（locations, connections, modifiers, character movement, time progression）
- [x] CharacterAgent（mood, conditions, relationships, knowledge, goals, inventory）
- [x] Story ↔ Dexie 序列化（Map/Set round-trip）
- [x] Svelte stores（story.svelte.ts, settings.svelte.ts）
- [x] 测试夹具（test-utils/fixtures.ts）

### Phase 2 — ST 兼容层
- [x] 宏翻译器（{{char}}/{{user}}/{{random}}/{{setvar}}/{{getvar}} + reverse）
- [x] PNG 元数据读取（tEXt chunk 解析，V2 base64 + V3 plaintext）
- [x] 角色卡导入（JSON → Character，字段映射 + personality/appearance 提取）
- [x] 世界书导入（语义分类为 locations/characters/rules/lore）

### Phase 3 — 叙事引擎核心
- [x] SceneManager（recordAction/Dialogue, appendEvents, transition, findScene, resolveChoice）
- [x] PromptBuilder（精确 prompt 组装：narrator style → scene → character snapshots → location → lore → recent events → instructions）
- [x] ResponseParser（LLM JSON → StoryEvent 序列，支持 markdown code fence + surrounding text 提取）
- [x] Lore 注入（关键词匹配 + 角色认知过滤 + probability + constant）

## 测试统计

- **14 个测试文件，159 个测试用例，全部通过**
- 类型检查 338 文件 0 错误
- Oxlint 51 文件 0 warnings 0 errors

## 待办（下一步）

- [ ] Phase 4：OpenAI 兼容适配器
- [ ] Phase 4：Claude API 适配器
- [ ] Phase 4：流式响应处理
- [ ] Phase 5：Play 页面 UI（SceneView + InputBar）
- [ ] Phase 5：场景渲染（按事件类型分组件）
- [ ] Phase 0（延后）：Tauri 2 桌面端集成 / Pre-commit hook / CI

## 已知问题

- `pnpm ci` 是 pnpm 保留命令，全链路验证脚本改为 `pnpm verify`

## 决策日志

| 日期 | 决策 | 原因 |
|------|------|------|
| 2026-03-20 | 项目命名为 Fable | "寓言"——有因果、有分支、有意义的故事 |
| 2026-03-20 | 选 Svelte 5 而非 React | 与 RisuAI 同栈可参考；Runes 适合频繁状态更新；与 StoryForge(React) 互补 |
| 2026-03-20 | 不 fork ST/Risu，独立新建 | ST 架构债务太重；Risu 核心数据流绑定聊天模型；只复用 LLM 层思路和数据格式 |
| 2026-03-20 | ST 资产兼容策略：兼容数据，不兼容代码 | 角色卡/世界书/预设是数据格式，可导入转换；插件是代码绑定，不兼容 |
| 2026-03-20 | Tauri 2 桌面端延后 | Web 版先行开发，核心引擎和 UI 不依赖 Tauri API，后续集成无阻碍 |
| 2026-03-20 | 全链路脚本命名 `pnpm verify` | `pnpm ci` 是保留命令 |
| 2026-03-20 | Map/Set 序列化用标记数组 | IndexedDB 不支持 Map/Set，序列化为 `["__MAP__", entries]` 格式 |
| 2026-03-20 | PromptBuilder 精确注入 | 与 ST 全量拼接不同，只注入当前场景相关信息 + 角色认知过滤 |
