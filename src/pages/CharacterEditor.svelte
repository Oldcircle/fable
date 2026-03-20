<script lang="ts">
  import type { Character } from '../types/character'
  import { useStoryStore } from '../stores/story.svelte'

  const storyStore = useStoryStore()

  let characters = $derived(
    storyStore.current ? [...storyStore.current.characters.values()] : [],
  )
  let selectedId = $state<string | null>(null)
  let selected = $derived(
    selectedId && storyStore.current
      ? storyStore.current.characters.get(selectedId) ?? null
      : null,
  )

  // Edit form state
  let editName = $state('')
  let editDescription = $state('')
  let editPersonality = $state('')
  let editAppearance = $state('')
  let editBackstory = $state('')
  let editSpeechStyle = $state('')
  let dirty = $state(false)

  function selectCharacter(id: string) {
    selectedId = id
    const char = storyStore.current?.characters.get(id)
    if (char) {
      editName = char.identity.name
      editDescription = char.identity.description
      editPersonality = char.identity.personality
      editAppearance = char.identity.appearance
      editBackstory = char.identity.backstory
      editSpeechStyle = char.identity.speechStyle
      dirty = false
    }
  }

  function markDirty() {
    dirty = true
  }

  async function saveCharacter() {
    if (!selected || !storyStore.current) return
    selected.identity.name = editName
    selected.identity.description = editDescription
    selected.identity.personality = editPersonality
    selected.identity.appearance = editAppearance
    selected.identity.backstory = editBackstory
    selected.identity.speechStyle = editSpeechStyle
    await storyStore.save()
    dirty = false
  }
</script>

<div class="p-6 flex gap-6 h-full">
  <!-- Character list -->
  <div class="w-48 shrink-0">
    <h2 class="text-xl font-bold mb-4">角色</h2>
    {#if characters.length === 0}
      <p class="text-xs text-[var(--text-secondary)]">暂无角色。请先创建故事或导入角色卡。</p>
    {:else}
      <div class="space-y-1">
        {#each characters as char}
          <button
            class="w-full text-left px-3 py-2 text-sm rounded-lg transition-colors
              {selectedId === char.id
                ? 'bg-[var(--bg-tertiary)] text-white'
                : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-tertiary)]/50'}"
            onclick={() => selectCharacter(char.id)}
          >
            {char.identity.name}
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Editor -->
  {#if selected}
    <div class="flex-1 max-w-lg space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium">{selected.identity.name}</h3>
        {#if selected.importSource}
          <span class="text-xs text-[var(--text-secondary)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded">
            {selected.importSource.format}
          </span>
        {/if}
      </div>

      <!-- State info (read-only) -->
      <div class="text-xs text-[var(--text-secondary)] flex gap-3">
        <span>位置: {selected.state.location || '未知'}</span>
        <span>情绪: {selected.state.mood || '平静'}</span>
      </div>

      <!-- Editable fields -->
      {#each [
        { label: '名称', key: 'name', value: editName, rows: 1 },
        { label: '描述', key: 'description', value: editDescription, rows: 3 },
        { label: '性格', key: 'personality', value: editPersonality, rows: 2 },
        { label: '外貌', key: 'appearance', value: editAppearance, rows: 2 },
        { label: '背景故事', key: 'backstory', value: editBackstory, rows: 3 },
        { label: '说话风格', key: 'speechStyle', value: editSpeechStyle, rows: 2 },
      ] as field}
        <div>
          <label for={`edit-${field.key}`} class="block text-xs text-[var(--text-secondary)] mb-1">{field.label}</label>
          {#if field.rows === 1}
            <input
              id={`edit-${field.key}`}
              type="text"
              value={field.value}
              oninput={(e) => {
                if (field.key === 'name') editName = e.currentTarget.value
                markDirty()
              }}
              class="w-full bg-[var(--bg-tertiary)] border border-gray-700 rounded-lg px-3 py-2 text-sm
                text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
            />
          {:else}
            <textarea
              id={`edit-${field.key}`}
              rows={field.rows}
              value={field.value}
              oninput={(e) => {
                const v = e.currentTarget.value
                if (field.key === 'description') editDescription = v
                else if (field.key === 'personality') editPersonality = v
                else if (field.key === 'appearance') editAppearance = v
                else if (field.key === 'backstory') editBackstory = v
                else if (field.key === 'speechStyle') editSpeechStyle = v
                markDirty()
              }}
              class="w-full bg-[var(--bg-tertiary)] border border-gray-700 rounded-lg px-3 py-2 text-sm
                text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] resize-y"
            ></textarea>
          {/if}
        </div>
      {/each}

      {#if dirty}
        <button
          onclick={saveCharacter}
          class="px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-medium
            hover:bg-[var(--accent-hover)] transition-colors"
        >
          保存修改
        </button>
      {/if}
    </div>
  {:else if characters.length > 0}
    <div class="flex-1 flex items-center justify-center text-[var(--text-secondary)] text-sm">
      选择一个角色进行编辑
    </div>
  {/if}
</div>
