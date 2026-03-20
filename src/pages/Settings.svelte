<script lang="ts">
  import { useSettingsStore } from '../stores/settings.svelte'
  import { LLM_PROVIDERS, getProvider, getModels } from '../data/providers'

  const settings = useSettingsStore()

  let selectedProviderId = $state(settings.llmConfig.providerId)
  let selectedModel = $state(settings.llmConfig.model)
  let apiEndpoint = $state(settings.llmConfig.endpoint ?? '')
  let apiKey = $state(settings.llmConfig.apiKey ?? '')
  let customModel = $state('')
  let temperature = $state(settings.llmConfig.temperature)
  let maxTokens = $state(settings.llmConfig.maxTokens)
  let saved = $state(false)

  let selectedProvider = $derived(getProvider(selectedProviderId))
  let availableModels = $derived(getModels(selectedProviderId))
  let isCustom = $derived(selectedProviderId === 'custom')

  // Sync from store once loaded
  $effect(() => {
    if (settings.loaded) {
      selectedProviderId = settings.llmConfig.providerId
      selectedModel = settings.llmConfig.model
      apiEndpoint = settings.llmConfig.endpoint ?? ''
      apiKey = settings.llmConfig.apiKey ?? ''
      temperature = settings.llmConfig.temperature
      maxTokens = settings.llmConfig.maxTokens
    }
  })

  function onProviderChange(providerId: string) {
    selectedProviderId = providerId
    const provider = getProvider(providerId)
    if (provider) {
      apiEndpoint = provider.defaultEndpoint
      selectedModel = provider.models[0]?.id ?? ''
      customModel = ''
    }
  }

  async function saveSettings() {
    const model = isCustom ? customModel : selectedModel
    await settings.updateLLMConfig({
      providerId: selectedProviderId,
      model,
      endpoint: apiEndpoint,
      apiKey,
      temperature,
      maxTokens,
    })
    saved = true
    setTimeout(() => { saved = false }, 2000)
  }
</script>

<div class="p-6 max-w-lg">
  <h2 class="text-xl font-bold mb-6">设置</h2>

  <div class="space-y-4">
    <h3 class="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">LLM 配置</h3>

    <!-- Provider -->
    <div>
      <label for="s-provider" class="block text-xs text-[var(--text-secondary)] mb-1">Provider</label>
      <select
        id="s-provider"
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

    <!-- Endpoint -->
    <div>
      <label for="s-endpoint" class="block text-xs text-[var(--text-secondary)] mb-1">API Endpoint</label>
      <input
        id="s-endpoint"
        type="text"
        bind:value={apiEndpoint}
        placeholder="https://api.example.com/v1"
        class="w-full bg-[var(--bg-tertiary)] border border-gray-700 rounded-lg px-3 py-2 text-sm
          text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50
          focus:outline-none focus:border-[var(--accent)]"
      />
    </div>

    <!-- API Key -->
    {#if selectedProvider?.requiresApiKey !== false}
      <div>
        <label for="s-apikey" class="block text-xs text-[var(--text-secondary)] mb-1">API Key</label>
        <input
          id="s-apikey"
          type="password"
          bind:value={apiKey}
          placeholder="sk-..."
          class="w-full bg-[var(--bg-tertiary)] border border-gray-700 rounded-lg px-3 py-2 text-sm
            text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50
            focus:outline-none focus:border-[var(--accent)]"
        />
      </div>
    {/if}

    <!-- Model -->
    <div>
      <label for="s-model" class="block text-xs text-[var(--text-secondary)] mb-1">Model</label>
      {#if isCustom}
        <input
          id="s-model"
          type="text"
          bind:value={customModel}
          placeholder="模型名称"
          class="w-full bg-[var(--bg-tertiary)] border border-gray-700 rounded-lg px-3 py-2 text-sm
            text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50
            focus:outline-none focus:border-[var(--accent)]"
        />
      {:else}
        <select
          id="s-model"
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

    <!-- Sampling params -->
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label for="s-temp" class="block text-xs text-[var(--text-secondary)] mb-1">Temperature: {temperature}</label>
        <input
          id="s-temp"
          type="range"
          min="0"
          max="2"
          step="0.05"
          bind:value={temperature}
          class="w-full accent-[var(--accent)]"
        />
      </div>
      <div>
        <label for="s-maxtokens" class="block text-xs text-[var(--text-secondary)] mb-1">Max Tokens</label>
        <input
          id="s-maxtokens"
          type="number"
          min="256"
          max="16384"
          step="256"
          bind:value={maxTokens}
          class="w-full bg-[var(--bg-tertiary)] border border-gray-700 rounded-lg px-3 py-2 text-sm
            text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
        />
      </div>
    </div>

    <!-- Save button -->
    <button
      onclick={saveSettings}
      class="px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-medium
        hover:bg-[var(--accent-hover)] transition-colors"
    >
      {saved ? '已保存' : '保存设置'}
    </button>
  </div>
</div>
