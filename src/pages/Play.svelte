<script lang="ts">
  import type { Story, Scene } from '../types/story'
  import type { StoryEvent } from '../types/events'
  import type { LLMAdapter } from '../types/adapter'
  import SceneView from '../lib/SceneView/SceneView.svelte'
  import InputBar from '../lib/SceneView/InputBar.svelte'
  import { createStory, createCharacter, createChapter, createScene } from '../engine/defaults'
  import { recordPlayerAction, recordPlayerDialogue, findScene, hasPendingChoice, resolveChoice } from '../engine/scene-manager'
  import { generateNextEvents } from '../engine/generate'
  import { createOpenAICompatibleAdapter } from '../adapters/llm/openai-compatible'
  import { addLocation } from '../engine/world-state'
  import { addNode } from '../engine/plot-graph'

  let story = $state<Story | null>(null)
  let currentScene = $state<Scene | null>(null)
  let generating = $state(false)
  let error = $state<string | null>(null)
  let eventVersion = $state(0)
  function bumpVersion() { eventVersion += 1 }

  // Derived: snapshot of events that triggers re-render on bumpVersion
  let sceneEvents = $derived(eventVersion >= 0 ? (currentScene?.events ?? []) : [])

  // LLM config (will be from settings store later)
  let apiEndpoint = $state('')
  let apiKey = $state('')
  let model = $state('')
  let showSetup = $state(true)

  function getAdapter(): LLMAdapter {
    return createOpenAICompatibleAdapter({
      provider: 'openai-compatible',
      model,
      endpoint: apiEndpoint,
      apiKey,
      temperature: 0.8,
      topP: 0.95,
      maxTokens: 2048,
      maxContext: 8192,
      frequencyPenalty: 0,
      presencePenalty: 0,
    })
  }

  function startNewStory() {
    const s = createStory({ title: '新的冒险' })

    // Create a basic world
    const gate = addLocation(s.worldState, '城门', '古老的石门，刻满了岁月的痕迹。清晨的薄雾缭绕在门洞之间。')

    // Create initial character
    const guide = createCharacter({
      identity: {
        name: '守门人',
        description: '一个苍老的守门人',
        personality: '沉稳、神秘、话不多但每句都有深意',
        appearance: '灰色长袍，深邃的眼睛',
        backstory: '守护城门数十年的老人',
        speechStyle: '简洁、意味深长',
        exampleDialogues: '',
        tags: ['npc', 'guide'],
      },
    })
    guide.state.location = gate.name
    gate.characters.push(guide.id)
    s.characters.set(guide.id, guide)

    // Create first chapter and scene
    const chapter = createChapter({ title: '第一章', order: 0 })
    const scene = createScene(chapter.id, {
      setting: {
        location: gate.name,
        time: '黎明',
        atmosphere: '薄雾弥漫，远处传来钟声',
      },
      participants: [guide.id],
    })
    chapter.scenes.push(scene)
    s.chapters.push(chapter)
    s.metadata.currentSceneId = scene.id
    s.metadata.totalScenes = 1

    addNode(s.plotGraph, scene.id, '城门')

    story = s
    currentScene = scene
    showSetup = false
  }

  async function handleSend(text: string) {
    if (!story || !currentScene) return
    error = null

    // Record player dialogue
    recordPlayerDialogue(currentScene, text)

    bumpVersion()

    // Generate next events
    generating = true
    try {
      const result = await generateNextEvents(story, currentScene, getAdapter())
      if (!result.ok) {
        error = result.error
      }
    } catch (e) {
      error = e instanceof Error ? e.message : '生成失败'
    } finally {
      generating = false
      bumpVersion()
    }
  }

  async function handleAction(text: string) {
    if (!story || !currentScene) return
    error = null

    recordPlayerAction(currentScene, text)
    bumpVersion()

    generating = true
    try {
      const result = await generateNextEvents(story, currentScene, getAdapter())
      if (!result.ok) {
        error = result.error
      }
    } catch (e) {
      error = e instanceof Error ? e.message : '生成失败'
    } finally {
      generating = false
      bumpVersion()
    }
  }
</script>

<div class="h-full flex flex-col">
  {#if showSetup}
    <div class="flex-1 flex items-center justify-center">
      <div class="w-full max-w-md p-6">
        <h2 class="text-2xl font-bold mb-1 text-center">Fable</h2>
        <p class="text-[var(--text-secondary)] text-center mb-6 text-sm">AI 驱动的互动叙事引擎</p>

        <div class="space-y-3 mb-6">
          <div>
            <label for="api-endpoint" class="block text-xs text-[var(--text-secondary)] mb-1">API Endpoint</label>
            <input
              id="api-endpoint"
              type="text"
              bind:value={apiEndpoint}
              placeholder="https://api.openai.com/v1"
              class="w-full bg-[var(--bg-tertiary)] border border-gray-700 rounded-lg px-3 py-2 text-sm
                text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50
                focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div>
            <label for="api-key" class="block text-xs text-[var(--text-secondary)] mb-1">API Key</label>
            <input
              id="api-key"
              type="password"
              bind:value={apiKey}
              placeholder="sk-..."
              class="w-full bg-[var(--bg-tertiary)] border border-gray-700 rounded-lg px-3 py-2 text-sm
                text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50
                focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div>
            <label for="model-name" class="block text-xs text-[var(--text-secondary)] mb-1">Model</label>
            <input
              id="model-name"
              type="text"
              bind:value={model}
              placeholder="gpt-4o / deepseek-chat / ..."
              class="w-full bg-[var(--bg-tertiary)] border border-gray-700 rounded-lg px-3 py-2 text-sm
                text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50
                focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        <button
          onclick={startNewStory}
          disabled={!model}
          class="w-full py-2.5 bg-[var(--accent)] text-white rounded-lg font-medium
            hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors"
        >
          开始新故事
        </button>

        <p class="text-xs text-[var(--text-secondary)] mt-3 text-center">
          支持 OpenAI、DeepSeek、Groq、OpenRouter、Ollama 等兼容 API
        </p>
      </div>
    </div>

  {:else if story && currentScene}
    <!-- Scene header -->
    <div class="px-4 py-2 border-b border-gray-800 bg-[var(--bg-secondary)] flex items-center justify-between">
      <div>
        <span class="text-sm font-medium">{currentScene.setting.location}</span>
        <span class="text-xs text-[var(--text-secondary)] ml-2">{currentScene.setting.time}</span>
      </div>
      <div class="text-xs text-[var(--text-secondary)]">
        第 {currentScene.metadata.turnCount} 轮
      </div>
    </div>

    <!-- Scene view -->
    <SceneView events={sceneEvents} characters={story.characters} />

    <!-- Error display -->
    {#if error}
      <div class="px-4 py-2 bg-red-500/10 border-t border-red-500/20 text-red-400 text-xs">
        {error}
      </div>
    {/if}

    <!-- Generating indicator -->
    {#if generating}
      <div class="px-4 py-2 border-t border-gray-800 text-xs text-[var(--text-secondary)] flex items-center gap-2">
        <span class="animate-pulse">...</span>
        <span>故事正在展开</span>
      </div>
    {/if}

    <!-- Input bar -->
    <InputBar
      onSend={handleSend}
      onAction={handleAction}
      disabled={generating}
      placeholder={hasPendingChoice(currentScene) ? '选择一个选项或自由输入...' : '输入对话或动作...'}
    />
  {/if}
</div>
