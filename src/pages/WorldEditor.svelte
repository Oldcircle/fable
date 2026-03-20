<script lang="ts">
  import type { Location } from '../types/world'
  import { useStoryStore } from '../stores/story.svelte'
  import { addLocation } from '../engine/world-state'

  const storyStore = useStoryStore()

  let locations = $derived(
    storyStore.current ? [...storyStore.current.worldState.locations.values()] : [],
  )
  let loreEntries = $derived(storyStore.current?.loreEntries ?? [])

  // Add location form
  let newLocName = $state('')
  let newLocDesc = $state('')

  async function addNewLocation() {
    if (!storyStore.current || !newLocName.trim()) return
    addLocation(storyStore.current.worldState, newLocName.trim(), newLocDesc.trim())
    await storyStore.save()
    newLocName = ''
    newLocDesc = ''
  }

  async function removeLocation(id: string) {
    if (!storyStore.current) return
    storyStore.current.worldState.locations.delete(id)
    await storyStore.save()
  }

  async function removeLore(id: string) {
    if (!storyStore.current) return
    storyStore.current.loreEntries = storyStore.current.loreEntries.filter(l => l.id !== id)
    await storyStore.save()
  }
</script>

<div class="p-6 max-w-2xl">
  <h2 class="text-xl font-bold mb-1">世界编辑</h2>

  {#if !storyStore.current}
    <p class="text-[var(--text-secondary)] text-sm mt-4">暂无故事。请先创建故事。</p>
  {:else}
    <p class="text-[var(--text-secondary)] text-sm mb-6">地点、知识条目管理</p>

    <!-- Locations -->
    <div class="mb-8">
      <h3 class="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3">
        地点 ({locations.length})
      </h3>

      <div class="space-y-2 mb-4">
        {#each locations as loc}
          <div class="p-3 rounded-lg bg-[var(--bg-secondary)] border border-gray-800 flex items-start justify-between gap-3">
            <div class="flex-1">
              <div class="text-sm font-medium">{loc.name}</div>
              <div class="text-xs text-[var(--text-secondary)] mt-1">{loc.currentState}</div>
              {#if loc.characters.length > 0}
                <div class="text-xs text-[var(--text-secondary)] mt-1">在场角色: {loc.characters.length}</div>
              {/if}
            </div>
            <button
              onclick={() => removeLocation(loc.id)}
              class="text-xs text-red-400 hover:text-red-300 shrink-0"
            >
              删除
            </button>
          </div>
        {/each}
      </div>

      <!-- Add location -->
      <div class="p-3 rounded-lg bg-[var(--bg-secondary)] border border-gray-800 space-y-2">
        <input
          type="text"
          bind:value={newLocName}
          placeholder="地点名称"
          class="w-full bg-[var(--bg-tertiary)] border border-gray-700 rounded px-3 py-1.5 text-sm
            text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50
            focus:outline-none focus:border-[var(--accent)]"
        />
        <textarea
          bind:value={newLocDesc}
          placeholder="描述"
          rows="2"
          class="w-full bg-[var(--bg-tertiary)] border border-gray-700 rounded px-3 py-1.5 text-sm
            text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50
            focus:outline-none focus:border-[var(--accent)] resize-y"
        ></textarea>
        <button
          onclick={addNewLocation}
          disabled={!newLocName.trim()}
          class="px-3 py-1.5 bg-[var(--accent)] text-white rounded text-xs font-medium
            hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          添加地点
        </button>
      </div>
    </div>

    <!-- Lore entries -->
    <div>
      <h3 class="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3">
        知识条目 ({loreEntries.length})
      </h3>

      {#if loreEntries.length === 0}
        <p class="text-xs text-[var(--text-secondary)]">暂无知识条目。可通过导入世界书添加。</p>
      {:else}
        <div class="space-y-1">
          {#each loreEntries as lore}
            <div class="p-2 rounded bg-[var(--bg-secondary)] flex items-center justify-between gap-2">
              <div class="flex-1 min-w-0">
                <span class="text-xs font-medium">{lore.name}</span>
                <span class="text-[10px] text-[var(--text-secondary)] ml-1">
                  [{lore.triggerKeywords.slice(0, 3).join(', ')}]
                </span>
                {#if lore.isConstant}
                  <span class="text-[10px] text-[var(--accent)] ml-1">常驻</span>
                {/if}
              </div>
              <button
                onclick={() => removeLore(lore.id)}
                class="text-[10px] text-red-400 hover:text-red-300 shrink-0"
              >
                删除
              </button>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- World state info -->
    <div class="mt-8">
      <h3 class="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3">世界状态</h3>
      <div class="text-xs text-[var(--text-secondary)] space-y-1">
        <p>时间: 第 {storyStore.current.worldState.currentTime.day} 天, {storyStore.current.worldState.currentTime.timeOfDay}</p>
        {#if storyStore.current.worldState.currentTime.season}
          <p>季节: {storyStore.current.worldState.currentTime.season}</p>
        {/if}
        <p>全局标记: {storyStore.current.worldState.flags.size} 个</p>
        <p>世界事件: {storyStore.current.worldState.timeline.length} 条</p>
      </div>
    </div>
  {/if}
</div>
