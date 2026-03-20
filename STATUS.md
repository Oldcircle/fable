# Fable 开发状态

> 每次工作结束后必须更新此文件。

## 当前阶段

**Phase 1 — 数据模型与存储**（进行中）

## 进度总览

| Phase | 内容 | 状态 |
|-------|------|------|
| 0 | 项目脚手架（Svelte 5 + Vite 8 + Tailwind 4） | ✅ 已完成 |
| 1 | 数据模型与存储 | 🔧 进行中 |
| 2 | ST 兼容层（角色卡/世界书/预设导入） | 未开始 |
| 3 | 叙事引擎核心 | 未开始 |
| 4 | LLM 适配 | 未开始 |
| 5 | 前端 UI | 未开始 |
| 6 | 高级功能（分支回溯、多角色自主、导出等） | 未开始 |

## 已完成

- [x] 项目目录创建
- [x] CLAUDE.md / PLAN.md / DESIGN.md / STATUS.md 文档体系建立
- [x] 工作区索引更新
- [x] 测试策略设计（借鉴 OpenClaw 四道防线 + 测试分层）
- [x] Phase 0：Svelte 5 + Vite 8 + TypeScript 5.9 项目初始化
- [x] Phase 0：Tailwind CSS 4 + 暗色主题（bg: #0f1117）
- [x] Phase 0：Vitest + Oxlint 配置
- [x] Phase 0：Dexie.js 数据库 schema（stories, characters, settings 三表）
- [x] Phase 0：基础路由（侧栏导航，6 个页面占位）
- [x] Phase 0：完整类型定义（types/ 目录 9 个文件，覆盖所有核心数据模型 + ST 兼容格式 + LLM 适配器接口）
- [x] Phase 0：基础工具函数（generateId, sanitizeErrorMessage）+ 7 个测试
- [x] Phase 0：`pnpm verify` 全链路通过（check → lint → test）
- [x] Phase 0：GitHub 仓库创建 + 首次推送（https://github.com/Oldcircle/fable）
- [x] Phase 1：默认值工厂函数（createStory, createCharacter, createChapter, createScene 等）+ 12 个测试
- [x] Phase 1：PlotGraph 操作（addNode, addEdge, traverse, cycle detection, remove）+ 15 个测试
- [x] Phase 1：WorldState 管理（locations, connections, modifiers, move, flags, time）+ 13 个测试
- [x] Phase 1：CharacterAgent（mood, conditions, relationships, knowledge, goals, inventory）+ 18 个测试
- [x] Phase 1：Story ↔ Dexie 序列化（Map/Set round-trip via JSON）+ 6 个测试
- [x] Phase 1：Svelte stores（story.svelte.ts, settings.svelte.ts）— Dexie CRUD 封装
- [x] Phase 1：测试夹具（test-utils/fixtures.ts）

## 待办（下一步）

- [ ] Phase 0：Tauri 2 桌面端集成（可后续再加）
- [ ] Phase 0：Pre-commit hook 配置
- [ ] Phase 0：CI 配置（GitHub Actions）
- [ ] Phase 2：PNG 角色卡解析（V2/V3）
- [ ] Phase 2：世界书导入 + 语义分类
- [ ] Phase 2：宏翻译器
- [ ] Phase 3：SceneManager（场景推进循环）
- [ ] Phase 3：PromptBuilder（精确 prompt 组装）

## 测试统计

- 7 个测试文件，71 个测试用例，全部通过
- 类型检查 324 文件 0 错误
- Oxlint 0 warnings 0 errors

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
| 2026-03-20 | Map/Set 序列化用标记数组 | IndexedDB 不支持 Map/Set，序列化为 `["__MAP__", entries]` 格式，反序列化时还原 |
