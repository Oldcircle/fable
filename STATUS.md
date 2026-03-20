# Fable 开发状态

> 每次工作结束后必须更新此文件。

## 当前阶段

**Phase 5 前端完善** — 所有页面基础版完成，进入体验打磨

## 进度总览

| Phase | 内容 | 状态 |
|-------|------|------|
| 0 | 项目脚手架（Svelte 5 + Vite 8 + Tailwind 4） | ✅ 已完成（Tauri/CI 延后） |
| 1 | 数据模型与存储 | ✅ 已完成 |
| 2 | ST 兼容层（角色卡/世界书/预设导入） | ⚠️ 70%（预设导入/导出未做） |
| 3 | 叙事引擎核心 | ⚠️ 80%（StateUpdater 未做） |
| 4 | LLM 适配 | ⚠️ 55%（Provider 数据驱动已完成，Claude/Gemini 适配器未做） |
| 5 | 前端 UI | ⚠️ 70%（所有页面基础版完成） |
| 6 | 高级功能 | ❌ 未开始 |

## 本次完成

### P0 修复（2026-03-20）
1. ~~LLM 配置体验差~~ → ✅ Provider 下拉 → 自动填充 endpoint → Model 下拉
2. ~~页面切换丢失游玩状态~~ → ✅ story store 持久化 + 自动恢复
3. ~~聊天记录不持久化~~ → ✅ 每次生成后自动保存到 IndexedDB

### P1 页面实现（2026-03-20）
4. ✅ **Settings 页面** — Provider 选择 + API Key + 采样参数
5. ✅ **Import 页面** — 拖入 PNG 角色卡 / JSON 世界书，预览后确认导入
6. ✅ **StoryOverview 页面** — 时间线 + 角色列表 + 地点列表 + 知识库概览
7. ✅ **CharacterEditor 页面** — 列表 + 身份字段编辑 + 保存到 IndexedDB
8. ✅ **WorldEditor 页面** — 地点 CRUD + 知识条目管理 + 世界状态显示

## 下一步

### 体验打磨
- [ ] 导入测试：用 `SillyTavern-Backup/` 中的真实角色卡和世界书做端到端验证
- [ ] Play 页面：故事删除、重命名
- [ ] Play 页面：用导入的角色替换内置守门人，开始自定义故事
- [ ] 选择交互：选项按钮点击 + 自由输入混合
- [ ] 角色面板侧栏：游玩时显示在场角色状态

### 引擎补全
- [ ] StateUpdater（应用 LLM 返回的 StateChange 到角色/世界/剧情图）
- [ ] Lore 注入优化（概率/分组）

### 适配器
- [ ] Claude API 适配器
- [ ] Gemini API 适配器

### 高级功能
- [ ] 分支回溯
- [ ] 多角色自主行为
- [ ] 故事导出（Markdown）

## 已完成

### Phase 0-3（见 git history）

### Phase 4 — LLM 适配
- [x] OpenAI 兼容适配器（generate + stream）
- [x] 生成编排器（PromptBuilder → LLM → ResponseParser → Scene）
- [x] 流式生成支持
- [x] 错误脱敏
- [x] Provider 数据驱动配置（7 个内置 provider + 自定义）

### Phase 5 — 前端 UI
- [x] Play 页面（Provider 下拉 + 自动保存 + 故事恢复 + 已有故事列表）
- [x] SceneView 按事件类型渲染
- [x] InputBar 对话/动作切换
- [x] Settings 页面（Provider + 采样参数）
- [x] Import 页面（拖入 PNG/JSON，预览，确认导入到当前故事）
- [x] StoryOverview 页面（时间线 + 角色 + 地点 + 知识库）
- [x] CharacterEditor 页面（列表 + 身份字段编辑）
- [x] WorldEditor 页面（地点 CRUD + 知识条目管理）

## 测试统计

- **16 个测试文件，169 个测试用例，全部通过**
- 类型检查 346 文件 0 错误 0 警告
- Oxlint 59 文件 0 warnings 0 errors

## 已知问题

- `pnpm ci` 是 pnpm 保留命令，全链路验证脚本为 `pnpm verify`

## 决策日志

| 日期 | 决策 | 原因 |
|------|------|------|
| 2026-03-20 | 项目命名为 Fable | "寓言"——有因果、有分支、有意义的故事 |
| 2026-03-20 | 选 Svelte 5 而非 React | 与 RisuAI 同栈可参考；Runes 适合频繁状态更新 |
| 2026-03-20 | ST 资产兼容策略：兼容数据，不兼容代码 | 角色卡/世界书是数据格式可导入；插件不兼容 |
| 2026-03-20 | PromptBuilder 精确注入 | 只注入当前场景信息 + 角色认知过滤，非全量拼接 |
| 2026-03-20 | 单一 OpenAI 兼容适配器 | 大多数 provider 都兼容 OpenAI API 格式 |
| 2026-03-20 | Provider 数据驱动 | 复用 StoryForge providers.ts 模式，下拉选择代替手动输入 |
| 2026-03-20 | LLMConfig 增加 providerId 字段 | 关联 provider 列表，支持切换 provider 时自动填充 endpoint 和 model |
