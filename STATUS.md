# Fable 开发状态

> 每次工作结束后必须更新此文件。

## 当前阶段

**体验反馈修复** — 首次用户体验暴露的关键问题

## 进度总览

| Phase | 内容 | 状态 |
|-------|------|------|
| 0 | 项目脚手架（Svelte 5 + Vite 8 + Tailwind 4） | ✅ 已完成（Tauri/CI 延后） |
| 1 | 数据模型与存储 | ✅ 已完成 |
| 2 | ST 兼容层（角色卡/世界书/预设导入） | ⚠️ 70%（预设导入/导出未做） |
| 3 | 叙事引擎核心 | ⚠️ 80%（StateUpdater 未做） |
| 4 | LLM 适配 | ⚠️ 40%（仅 OpenAI 兼容，Claude/Gemini 未做） |
| 5 | 前端 UI | ⚠️ 30%（仅 Play 页基础版） |
| 6 | 高级功能 | ❌ 未开始 |

## 首次体验反馈（2026-03-20 用户测试）

### P0 — 必须立即修复

1. **LLM 配置体验差**：手动输入 URL 和模型名不可接受
   - **目标**：参考 SillyTavern，做 Provider 下拉 → 自动填充 endpoint → Model 下拉选择
   - **参考**：StoryForge `src/data/providers.ts` 已有完整的数据驱动 provider 列表，可直接复用
   - **涉及文件**：新增 `src/data/providers.ts`，重写 Play.svelte 配置区 + Settings.svelte

2. **页面切换丢失游玩状态**：切换侧栏后回 Play 页面，之前的故事消失
   - **目标**：游玩状态持久化到 IndexedDB，页面切换保留，返回时恢复
   - **涉及文件**：`src/stores/story.svelte.ts`（已有 save 方法但未在游玩中自动调用），`src/pages/Play.svelte`

3. **聊天记录/资产不持久化**：角色卡、世界书、聊天记录无法保存和回溯
   - **目标**：每次生成后自动保存到 IndexedDB，刷新/关闭后可恢复
   - **涉及文件**：`src/stores/story.svelte.ts`，`src/db/index.ts`

### P1 — 后续完善

4. **Settings 页面**：LLM 配置持久化 + provider 管理
5. **Import 页面**：拖入 PNG 角色卡 / 世界书 JSON 导入
6. **角色面板侧栏**：游玩时显示在场角色状态
7. **StoryOverview**：时间线 + 章节列表
8. **CharacterEditor / WorldEditor**：角色和世界编辑
9. **导入测试数据**：用 `SillyTavern-Backup/` 中的真实角色卡和世界书做端到端验证

## 已完成

### Phase 0-3（见 git history）

### Phase 4 — LLM 适配
- [x] OpenAI 兼容适配器（generate + stream）
- [x] 生成编排器（PromptBuilder → LLM → ResponseParser → Scene）
- [x] 流式生成支持
- [x] 错误脱敏

### Phase 5 — 前端 UI（基础版）
- [x] Play 页面基础游玩循环
- [x] SceneView 按事件类型渲染
- [x] InputBar 对话/动作切换
- [x] 场景头部 + 生成指示 + 错误提示

## 测试统计

- **16 个测试文件，169 个测试用例，全部通过**
- 类型检查 345 文件 0 错误 0 警告
- Oxlint 58 文件 0 warnings 0 errors

## 已知问题

- `pnpm ci` 是 pnpm 保留命令，全链路验证脚本为 `pnpm verify`
- LLM 配置未持久化，刷新丢失
- 游玩状态未持久化，切换页面丢失
- Provider 配置为手动输入 URL，体验差

## 决策日志

| 日期 | 决策 | 原因 |
|------|------|------|
| 2026-03-20 | 项目命名为 Fable | "寓言"——有因果、有分支、有意义的故事 |
| 2026-03-20 | 选 Svelte 5 而非 React | 与 RisuAI 同栈可参考；Runes 适合频繁状态更新 |
| 2026-03-20 | ST 资产兼容策略：兼容数据，不兼容代码 | 角色卡/世界书是数据格式可导入；插件不兼容 |
| 2026-03-20 | PromptBuilder 精确注入 | 只注入当前场景信息 + 角色认知过滤，非全量拼接 |
| 2026-03-20 | 单一 OpenAI 兼容适配器 | 大多数 provider 都兼容 OpenAI API 格式 |
| 2026-03-20 | Provider 数据驱动（待实现） | 参考 StoryForge providers.ts，下拉选择代替手动输入 |
