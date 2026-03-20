<script lang="ts">
  type Page = 'play' | 'overview' | 'characters' | 'world' | 'settings' | 'import'

  interface Props {
    currentPage: Page
    onNavigate: (page: Page) => void
  }

  let { currentPage, onNavigate }: Props = $props()

  const navItems: Array<{ page: Page; label: string; icon: string }> = [
    { page: 'play', label: '游玩', icon: '▶' },
    { page: 'overview', label: '故事', icon: '📖' },
    { page: 'characters', label: '角色', icon: '👤' },
    { page: 'world', label: '世界', icon: '🌍' },
    { page: 'import', label: '导入', icon: '📥' },
    { page: 'settings', label: '设置', icon: '⚙' },
  ]
</script>

<nav class="w-48 bg-[var(--bg-secondary)] border-r border-gray-800 flex flex-col">
  <div class="p-4 border-b border-gray-800">
    <h1 class="text-lg font-bold text-[var(--accent)]">Fable</h1>
    <p class="text-xs text-[var(--text-secondary)]">AI 互动叙事引擎</p>
  </div>

  <div class="flex-1 py-2">
    {#each navItems as item}
      <button
        class="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 transition-colors
          {currentPage === item.page
            ? 'bg-[var(--bg-tertiary)] text-white'
            : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-tertiary)]/50'}"
        onclick={() => onNavigate(item.page)}
      >
        <span>{item.icon}</span>
        <span>{item.label}</span>
      </button>
    {/each}
  </div>
</nav>
