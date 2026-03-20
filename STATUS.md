# Fable 开发状态

> 每次工作结束后必须更新此文件。

## 当前阶段

**Phase 5 — 前端 UI**（基础版完成）

## 进度总览

| Phase | 内容 | 状态 |
|-------|------|------|
| 0 | 项目脚手架（Svelte 5 + Vite 8 + Tailwind 4） | ✅ 已完成 |
| 1 | 数据模型与存储 | ✅ 已完成 |
| 2 | ST 兼容层（角色卡/世界书/预设导入） | ✅ 已完成 |
| 3 | 叙事引擎核心 | ✅ 已完成 |
| 4 | LLM 适配 | ✅ 已完成 |
| 5 | 前端 UI | 🔧 基础版完成 |
| 6 | 高级功能（分支回溯、多角色自主、导出等） | 未开始 |

## 已完成

### Phase 0-3（见 git history）

### Phase 4 — LLM 适配
- [x] OpenAI 兼容适配器（generate + stream，支持 OpenAI/DeepSeek/Groq/OpenRouter/Ollama）
- [x] 生成编排器（PromptBuilder → LLM → ResponseParser → Scene 一体化）
- [x] 流式生成支持（generateNextEventsStreaming）
- [x] 错误脱敏（API Key 不泄露到 UI）

### Phase 5 — 前端 UI（基础版）
- [x] Play 页面：LLM 配置 → 开始新故事 → 游玩循环
- [x] SceneView：按事件类型分组件渲染（narration/dialogue/action/choice/scene_change/state_change/internal/system）
- [x] InputBar：对话/动作模式切换，Enter 发送
- [x] 场景头部：地点、时间、轮次
- [x] 生成状态指示 + 错误提示

## 测试统计

- **16 个测试文件，169 个测试用例，全部通过**
- 类型检查 345 文件 0 错误 0 警告
- Oxlint 58 文件 0 warnings 0 errors

## 可以运行

```bash
pnpm dev  # 端口 5175
```

打开后输入 LLM API 配置 → 点击"开始新故事" → 在输入框中对话或做动作 → AI 生成故事事件。

## 待办（下一步）

- [ ] Phase 5：角色面板（侧栏显示在场角色状态）
- [ ] Phase 5：StoryOverview 页面（时间线 + 章节列表）
- [ ] Phase 5：Import 页面（拖入 PNG 角色卡导入）
- [ ] Phase 5：Settings 页面（持久化 LLM 配置到 IndexedDB）
- [ ] Phase 6：分支回溯、多角色自主行为、故事导出
- [ ] Phase 0（延后）：Tauri 2 / Pre-commit hook / CI

## 已知问题

- `pnpm ci` 是 pnpm 保留命令，全链路验证脚本为 `pnpm verify`
- LLM 配置尚未持久化，刷新页面会丢失

## 决策日志

| 日期 | 决策 | 原因 |
|------|------|------|
| 2026-03-20 | 项目命名为 Fable | "寓言"——有因果、有分支、有意义的故事 |
| 2026-03-20 | 选 Svelte 5 而非 React | 与 RisuAI 同栈可参考；Runes 适合频繁状态更新 |
| 2026-03-20 | ST 资产兼容策略：兼容数据，不兼容代码 | 角色卡/世界书是数据格式可导入；插件不兼容 |
| 2026-03-20 | PromptBuilder 精确注入 | 只注入当前场景信息 + 角色认知过滤，非全量拼接 |
| 2026-03-20 | 单一 OpenAI 兼容适配器 | 大多数 provider 都兼容 OpenAI API 格式 |
