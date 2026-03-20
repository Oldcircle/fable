<script lang="ts">
  import Play from './pages/Play.svelte'
  import StoryOverview from './pages/StoryOverview.svelte'
  import CharacterEditor from './pages/CharacterEditor.svelte'
  import WorldEditor from './pages/WorldEditor.svelte'
  import Settings from './pages/Settings.svelte'
  import ImportPage from './pages/Import.svelte'
  import Sidebar from './lib/Common/Sidebar.svelte'

  type Page = 'play' | 'overview' | 'characters' | 'world' | 'settings' | 'import'

  let currentPage = $state<Page>('play')

  function navigate(page: Page) {
    currentPage = page
  }
</script>

<div class="flex h-screen">
  <Sidebar {currentPage} onNavigate={navigate} />

  <main class="flex-1 overflow-y-auto">
    {#if currentPage === 'play'}
      <Play />
    {:else if currentPage === 'overview'}
      <StoryOverview />
    {:else if currentPage === 'characters'}
      <CharacterEditor />
    {:else if currentPage === 'world'}
      <WorldEditor />
    {:else if currentPage === 'settings'}
      <Settings />
    {:else if currentPage === 'import'}
      <ImportPage />
    {/if}
  </main>
</div>
