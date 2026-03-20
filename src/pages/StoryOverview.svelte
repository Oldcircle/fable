<script lang="ts">
  import { useStoryStore } from '../stores/story.svelte'

  const storyStore = useStoryStore()

  let story = $derived(storyStore.current)
  let characters = $derived(story ? [...story.characters.values()] : [])
  let locations = $derived(story ? [...story.worldState.locations.values()] : [])
  let totalEvents = $derived(
    story
      ? story.chapters.reduce(
          (sum, ch) => sum + ch.scenes.reduce((s, sc) => s + sc.events.length, 0),
          0,
        )
      : 0,
  )
</script>

<div class="p-6 max-w-2xl">
  <h2 class="text-xl font-bold mb-1">故事概览</h2>

  {#if !story}
    <p class="text-[var(--text-secondary)] text-sm mt-4">暂无故事。请先在游玩页面开始一个新故事。</p>
  {:else}
    <p class="text-[var(--text-secondary)] text-sm mb-6">{story.title}</p>

    <!-- Stats -->
    <div class="grid grid-cols-4 gap-3 mb-6">
      {#each [
        { label: '章节', value: story.chapters.length },
        { label: '场景', value: story.metadata.totalScenes },
        { label: '事件', value: totalEvents },
        { label: '角色', value: characters.length },
      ] as stat}
        <div class="p-3 rounded-lg bg-[var(--bg-secondary)] border border-gray-800 text-center">
          <div class="text-lg font-bold">{stat.value}</div>
          <div class="text-xs text-[var(--text-secondary)]">{stat.label}</div>
        </div>
      {/each}
    </div>

    <!-- Chapters & Scenes timeline -->
    <div class="mb-6">
      <h3 class="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3">时间线</h3>
      {#each story.chapters as chapter, ci}
        <div class="mb-4">
          <div class="text-sm font-medium mb-2">{chapter.title}</div>
          <div class="space-y-1 pl-4 border-l-2 border-gray-800">
            {#each chapter.scenes as scene}
              <div class="pl-3 py-1.5 relative">
                <div class="absolute left-[-9px] top-[10px] w-2.5 h-2.5 rounded-full
                  {scene.id === story.metadata.currentSceneId
                    ? 'bg-[var(--accent)]'
                    : scene.metadata.isCompleted ? 'bg-green-500' : 'bg-gray-600'}">
                </div>
                <div class="text-xs">
                  <span class="font-medium">{scene.setting.location}</span>
                  <span class="text-[var(--text-secondary)] ml-1">{scene.setting.time}</span>
                  <span class="text-[var(--text-secondary)] ml-1">({scene.events.length} 事件)</span>
                </div>
                {#if scene.setting.atmosphere}
                  <div class="text-[10px] text-[var(--text-secondary)]">{scene.setting.atmosphere}</div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>

    <!-- Characters list -->
    {#if characters.length > 0}
      <div class="mb-6">
        <h3 class="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3">角色</h3>
        <div class="space-y-2">
          {#each characters as char}
            <div class="p-3 rounded-lg bg-[var(--bg-secondary)] border border-gray-800">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium">{char.identity.name}</span>
                <span class="text-xs text-[var(--text-secondary)]">
                  {char.state.location || '未知位置'}
                </span>
              </div>
              {#if char.state.mood}
                <span class="text-xs text-[var(--text-secondary)]">情绪: {char.state.mood}</span>
              {/if}
              {#if char.state.goals.filter(g => g.status === 'active').length > 0}
                <div class="text-xs text-[var(--text-secondary)] mt-1">
                  目标: {char.state.goals.filter(g => g.status === 'active').map(g => g.description).join('、')}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Locations -->
    {#if locations.length > 0}
      <div class="mb-6">
        <h3 class="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3">地点</h3>
        <div class="space-y-2">
          {#each locations as loc}
            <div class="p-3 rounded-lg bg-[var(--bg-secondary)] border border-gray-800">
              <div class="text-sm font-medium">{loc.name}</div>
              <div class="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">{loc.currentState}</div>
              {#if loc.characters.length > 0}
                <div class="text-xs text-[var(--text-secondary)] mt-1">
                  在场: {loc.characters.length} 人
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Lore entries -->
    {#if story.loreEntries.length > 0}
      <div>
        <h3 class="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3">知识库 ({story.loreEntries.length})</h3>
        <div class="space-y-1">
          {#each story.loreEntries.slice(0, 10) as lore}
            <div class="p-2 rounded bg-[var(--bg-secondary)] text-xs">
              <span class="font-medium">{lore.name}</span>
              <span class="text-[var(--text-secondary)] ml-1">
                [{lore.triggerKeywords.slice(0, 3).join(', ')}]
              </span>
            </div>
          {/each}
          {#if story.loreEntries.length > 10}
            <p class="text-xs text-[var(--text-secondary)]">... 还有 {story.loreEntries.length - 10} 条</p>
          {/if}
        </div>
      </div>
    {/if}
  {/if}
</div>
