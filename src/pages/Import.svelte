<script lang="ts">
  import type { Character } from '../types/character'
  import type { Location } from '../types/world'
  import type { LoreEntry } from '../types/lore'
  import { importSTCharacterFromPNG, importSTCharacterFromJson } from '../compat/import-character'
  import { importSTWorldInfo, type WorldImportResult } from '../compat/import-world'
  import { useStoryStore } from '../stores/story.svelte'

  const storyStore = useStoryStore()

  // Imported items pending confirmation
  let importedCharacters = $state<Character[]>([])
  let importedWorld = $state<WorldImportResult | null>(null)
  let importErrors = $state<string[]>([])
  let dragOver = $state(false)

  function resetImport() {
    importedCharacters = []
    importedWorld = null
    importErrors = []
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return
    resetImport()

    const errors: string[] = []
    const characters: Character[] = []
    let worldResult: WorldImportResult | null = null

    for (const file of files) {
      if (file.name.endsWith('.png')) {
        const buffer = await file.arrayBuffer()
        const data = new Uint8Array(buffer)
        const result = importSTCharacterFromPNG(data)
        if (result.ok) {
          characters.push(result.value)
        } else {
          errors.push(`${file.name}: ${result.error}`)
        }
      } else if (file.name.endsWith('.json')) {
        try {
          const text = await file.text()
          const json = JSON.parse(text)

          // Detect: world book has "entries" key, character card has "name" or "data.name"
          if (json.entries) {
            worldResult = importSTWorldInfo(json)
          } else if (json.name || json.data?.name) {
            const result = importSTCharacterFromJson(json)
            if (result.ok) {
              characters.push(result.value)
            } else {
              errors.push(`${file.name}: ${result.error}`)
            }
          } else {
            errors.push(`${file.name}: 无法识别的 JSON 格式`)
          }
        } catch {
          errors.push(`${file.name}: JSON 解析失败`)
        }
      } else {
        errors.push(`${file.name}: 不支持的文件格式（仅支持 .png 和 .json）`)
      }
    }

    importedCharacters = characters
    importedWorld = worldResult
    importErrors = errors
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    dragOver = false
    handleFiles(e.dataTransfer?.files ?? null)
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    dragOver = true
  }

  function handleDragLeave() {
    dragOver = false
  }

  function handleFileInput(e: Event) {
    const input = e.target as HTMLInputElement
    handleFiles(input.files)
  }

  async function confirmImport() {
    if (!storyStore.current) {
      importErrors = ['请先在游玩页面创建一个故事']
      return
    }

    for (const char of importedCharacters) {
      storyStore.current.characters.set(char.id, char)
    }

    if (importedWorld) {
      for (const loc of importedWorld.locations) {
        storyStore.current.worldState.locations.set(loc.id, loc)
      }
      storyStore.current.loreEntries.push(...importedWorld.loreEntries)
      if (importedWorld.rules.length > 0) {
        storyStore.current.narratorStyle.customInstructions +=
          '\n' + importedWorld.rules.join('\n')
      }
    }

    await storyStore.save()
    resetImport()
  }

  let hasImportData = $derived(importedCharacters.length > 0 || importedWorld !== null)
</script>

<div class="p-6 max-w-2xl">
  <h2 class="text-xl font-bold mb-1">导入</h2>
  <p class="text-[var(--text-secondary)] text-sm mb-6">SillyTavern 角色卡 PNG、角色卡 JSON、世界书 JSON</p>

  <!-- Drop zone -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
      {dragOver
        ? 'border-[var(--accent)] bg-[var(--accent)]/5'
        : 'border-gray-700 hover:border-gray-500'}"
    ondrop={handleDrop}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    onclick={() => document.getElementById('file-input')?.click()}
    role="button"
    tabindex="0"
    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') document.getElementById('file-input')?.click() }}
  >
    <div class="text-3xl mb-2">📥</div>
    <p class="text-sm text-[var(--text-primary)]">拖入文件或点击选择</p>
    <p class="text-xs text-[var(--text-secondary)] mt-1">支持 PNG 角色卡 (V2/V3)、JSON 角色卡、世界书 JSON</p>
    <input
      id="file-input"
      type="file"
      accept=".png,.json"
      multiple
      class="hidden"
      onchange={handleFileInput}
    />
  </div>

  <!-- Errors -->
  {#if importErrors.length > 0}
    <div class="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
      {#each importErrors as err}
        <p class="text-xs text-red-400">{err}</p>
      {/each}
    </div>
  {/if}

  <!-- Import preview -->
  {#if hasImportData}
    <div class="mt-6 space-y-4">
      <h3 class="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">预览</h3>

      <!-- Characters -->
      {#if importedCharacters.length > 0}
        <div>
          <h4 class="text-xs text-[var(--text-secondary)] mb-2">角色 ({importedCharacters.length})</h4>
          <div class="space-y-2">
            {#each importedCharacters as char}
              <div class="p-3 rounded-lg bg-[var(--bg-secondary)] border border-gray-800">
                <div class="flex items-center justify-between">
                  <span class="font-medium text-sm">{char.identity.name}</span>
                  <span class="text-xs text-[var(--text-secondary)]">
                    {char.importSource?.format ?? 'unknown'}
                  </span>
                </div>
                {#if char.identity.description}
                  <p class="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                    {char.identity.description.slice(0, 150)}{char.identity.description.length > 150 ? '...' : ''}
                  </p>
                {/if}
                {#if char.identity.personality}
                  <p class="text-xs text-[var(--text-secondary)] mt-1">
                    <span class="text-[var(--accent)]">性格:</span> {char.identity.personality.slice(0, 100)}
                  </p>
                {/if}
                {#if char.identity.tags.length > 0}
                  <div class="flex gap-1 mt-1 flex-wrap">
                    {#each char.identity.tags.slice(0, 5) as tag}
                      <span class="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                        {tag}
                      </span>
                    {/each}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- World data -->
      {#if importedWorld}
        <div>
          <h4 class="text-xs text-[var(--text-secondary)] mb-2">世界数据</h4>
          <div class="p-3 rounded-lg bg-[var(--bg-secondary)] border border-gray-800 space-y-1">
            {#if importedWorld.locations.length > 0}
              <p class="text-xs">
                <span class="text-[var(--accent)]">地点:</span>
                {importedWorld.locations.map(l => l.name).join('、')}
              </p>
            {/if}
            {#if importedWorld.loreEntries.length > 0}
              <p class="text-xs">
                <span class="text-[var(--accent)]">知识条目:</span> {importedWorld.loreEntries.length} 条
              </p>
            {/if}
            {#if importedWorld.characterTraits.size > 0}
              <p class="text-xs">
                <span class="text-[var(--accent)]">角色补充:</span>
                {[...importedWorld.characterTraits.keys()].join('、')}
              </p>
            {/if}
            {#if importedWorld.rules.length > 0}
              <p class="text-xs">
                <span class="text-[var(--accent)]">规则:</span> {importedWorld.rules.length} 条
              </p>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Confirm -->
      <div class="flex gap-3">
        <button
          onclick={confirmImport}
          class="px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-medium
            hover:bg-[var(--accent-hover)] transition-colors"
        >
          确认导入到当前故事
        </button>
        <button
          onclick={resetImport}
          class="px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-lg text-sm
            hover:text-white transition-colors"
        >
          取消
        </button>
      </div>

      {#if !storyStore.current}
        <p class="text-xs text-yellow-400">
          提示：请先在游玩页面创建一个故事，再导入角色和世界数据
        </p>
      {/if}
    </div>
  {/if}
</div>
