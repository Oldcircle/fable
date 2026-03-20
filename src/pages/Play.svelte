<script lang="ts">
  import type { Story, Scene } from '../types/story'
  import type { LLMAdapter } from '../types/adapter'
  import SceneView from '../lib/SceneView/SceneView.svelte'
  import InputBar from '../lib/SceneView/InputBar.svelte'
  import { createStory, createCharacter, createChapter, createScene } from '../engine/defaults'
  import { recordPlayerAction, recordPlayerDialogue, hasPendingChoice } from '../engine/scene-manager'
  import { generateNextEvents } from '../engine/generate'
  import { createOpenAICompatibleAdapter } from '../adapters/llm/openai-compatible'
  import { addLocation } from '../engine/world-state'
  import { addNode } from '../engine/plot-graph'
  import { useSettingsStore } from '../stores/settings.svelte'
  import { useStoryStore } from '../stores/story.svelte'
  import { LLM_PROVIDERS, getProvider, getModels } from '../data/providers'

  const settings = useSettingsStore()
  const storyStore = useStoryStore()

  let currentScene = $state<Scene | null>(null)
  let generating = $state(false)
  let error = $state<string | null>(null)
  let eventVersion = $state(0)
  function bumpVersion() { eventVersion += 1 }

  let sceneEvents = $derived(eventVersion >= 0 ? (currentScene?.events ?? []) : [])

  // Setup form state (synced from settings on load)
  let selectedProviderId = $state(settings.llmConfig.providerId)
  let selectedModel = $state(settings.llmConfig.model)
  let apiEndpoint = $state(settings.llmConfig.endpoint ?? '')
  let apiKey = $state(settings.llmConfig.apiKey ?? '')
  let customModel = $state('')

  // Derived from selected provider
  let selectedProvider = $derived(getProvider(selectedProviderId))
  let availableModels = $derived(getModels(selectedProviderId))
  let isCustom = $derived(selectedProviderId === 'custom')
  let showSetup = $derived(!storyStore.current)

  // When provider changes, auto-fill endpoint and reset model
  function onProviderChange(providerId: string) {
    selectedProviderId = providerId
    const provider = getProvider(providerId)
    if (provider) {
      apiEndpoint = provider.defaultEndpoint
      selectedModel = provider.models[0]?.id ?? ''
      customModel = ''
    }
  }

  // Init: load settings and try to restore last story
  $effect(() => {
    ;(async () => {
      await settings.load()
      // Sync form from persisted settings
      selectedProviderId = settings.llmConfig.providerId
      selectedModel = settings.llmConfig.model
      apiEndpoint = settings.llmConfig.endpoint ?? ''
      apiKey = settings.llmConfig.apiKey ?? ''

      // Try to restore last played story
      await storyStore.loadStoryList()
      if (storyStore.stories.length > 0) {
        await storyStore.loadStory(storyStore.stories[0].id)
        if (storyStore.current) {
          currentScene = storyStore.getCurrentScene()
          bumpVersion()
        }
      }
    })()
  })

  function getAdapter(): LLMAdapter {
    const model = isCustom ? customModel : selectedModel
    return createOpenAICompatibleAdapter({
      provider: 'openai-compatible',
      providerId: selectedProviderId,
      model,
      endpoint: apiEndpoint,
      apiKey,
      temperature: settings.llmConfig.temperature,
      topP: settings.llmConfig.topP,
      maxTokens: settings.llmConfig.maxTokens,
      maxContext: settings.llmConfig.maxContext,
      frequencyPenalty: settings.llmConfig.frequencyPenalty,
      presencePenalty: settings.llmConfig.presencePenalty,
    })
  }

  async function saveConfig(): Promise<void> {
    const model = isCustom ? customModel : selectedModel
    await settings.updateLLMConfig({
      providerId: selectedProviderId,
      model,
      endpoint: apiEndpoint,
      apiKey,
    })
  }

  async function startNewStory() {
    // Persist config before starting
    await saveConfig()

    const s = createStory({ title: '新的冒险' })

    const gate = addLocation(s.worldState, '城门', '古老的石门，刻满了岁月的痕迹。清晨的薄雾缭绕在门洞之间。')

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

    // Use story store for persistence
    storyStore.setCurrent(s)
    await storyStore.save()
    currentScene = scene
  }

  async function handleSend(text: string) {
    if (!storyStore.current || !currentScene) return
    error = null

    recordPlayerDialogue(currentScene, text)
    bumpVersion()

    generating = true
    try {
      const result = await generateNextEvents(storyStore.current, currentScene, getAdapter())
      if (!result.ok) {
        error = result.error
      }
    } catch (e) {
      error = e instanceof Error ? e.message : '生成失败'
    } finally {
      generating = false
      bumpVersion()
      // Auto-save after each generation
      await storyStore.save()
    }
  }

  async function handleAction(text: string) {
    if (!storyStore.current || !currentScene) return
    error = null

    recordPlayerAction(currentScene, text)
    bumpVersion()

    generating = true
    try {
      const result = await generateNextEvents(storyStore.current, currentScene, getAdapter())
      if (!result.ok) {
        error = result.error
      }
    } catch (e) {
      error = e instanceof Error ? e.message : '生成失败'
    } finally {
      generating = false
      bumpVersion()
      await storyStore.save()
    }
  }

  let canStart = $derived(
    (isCustom ? !!customModel : !!selectedModel) && !!apiEndpoint
    && (selectedProvider?.requiresApiKey ? !!apiKey : true)
  )
</script>

<div class="h-full flex flex-col">
  {#if showSetup}
    <div class="flex-1 flex items-center justify-center">
      <div class="w-full max-w-md p-6">
        <h2 class="text-2xl font-bold mb-1 text-center">Fable</h2>
        <p class="text-[var(--text-secondary)] text-center mb-6 text-sm">AI 驱动的互动叙事引擎</p>

        <div class="space-y-3 mb-6">
          <!-- Provider select -->
          <div>
            <label for="provider" class="block text-xs text-[var(--text-secondary)] mb-1">Provider</label>
            <select
              id="provider"
              value={selectedProviderId}
              onchange={(e) => onProviderChange(e.currentTarget.value)}
              class="w-full bg-[var(--bg-tertiary)] border border-gray-700 rounded-lg px-3 py-2 text-sm
                text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
            >
              {#each LLM_PROVIDERS as provider}
                <option value={provider.id}>
                  {provider.name}{provider.description ? ` — ${provider.description}` : ''}
                </option>
              {/each}
            </select>
          </div>

          <!-- API Endpoint (auto-filled, editable) -->
          <div>
            <label for="api-endpoint" class="block text-xs text-[var(--text-secondary)] mb-1">API Endpoint</label>
            <input
              id="api-endpoint"
              type="text"
              bind:value={apiEndpoint}
              placeholder="https://api.example.com/v1"
              class="w-full bg-[var(--bg-tertiary)] border border-gray-700 rounded-lg px-3 py-2 text-sm
                text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50
                focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <!-- API Key (hidden for providers that don't need it) -->
          {#if selectedProvider?.requiresApiKey !== false}
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
          {/if}

          <!-- Model select or free input -->
          <div>
            <label for="model" class="block text-xs text-[var(--text-secondary)] mb-1">Model</label>
            {#if isCustom}
              <input
                id="model"
                type="text"
                bind:value={customModel}
                placeholder="模型名称"
                class="w-full bg-[var(--bg-tertiary)] border border-gray-700 rounded-lg px-3 py-2 text-sm
                  text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50
                  focus:outline-none focus:border-[var(--accent)]"
              />
            {:else}
              <select
                id="model"
                bind:value={selectedModel}
                class="w-full bg-[var(--bg-tertiary)] border border-gray-700 rounded-lg px-3 py-2 text-sm
                  text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              >
                {#each availableModels as m}
                  <option value={m.id}>
                    {m.name}{m.contextWindow ? ` (${Math.round(m.contextWindow / 1000)}K)` : ''}
                  </option>
                {/each}
              </select>
            {/if}
          </div>
        </div>

        <button
          onclick={startNewStory}
          disabled={!canStart}
          class="w-full py-2.5 bg-[var(--accent)] text-white rounded-lg font-medium
            hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors"
        >
          开始新故事
        </button>

        {#if storyStore.stories.length > 0}
          <div class="mt-4 border-t border-gray-800 pt-4">
            <p class="text-xs text-[var(--text-secondary)] mb-2">继续已有故事</p>
            {#each storyStore.stories as s}
              <button
                class="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors
                  text-[var(--text-primary)]"
                onclick={async () => {
                  await saveConfig()
                  await storyStore.loadStory(s.id)
                  if (storyStore.current) {
                    currentScene = storyStore.getCurrentScene()
                    bumpVersion()
                  }
                }}
              >
                <span>{s.title}</span>
                <span class="text-xs text-[var(--text-secondary)] ml-2">
                  {new Date(s.updatedAt).toLocaleDateString()}
                </span>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>

  {:else if storyStore.current && currentScene}
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
    <SceneView events={sceneEvents} characters={storyStore.current.characters} />

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
