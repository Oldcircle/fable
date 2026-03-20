<script lang="ts">
  import type { StoryEvent } from '../../types/events'
  import type { Character } from '../../types/character'
  import EventRenderer from './EventRenderer.svelte'

  interface Props {
    events: StoryEvent[]
    characters: Map<string, Character>
  }

  let { events, characters }: Props = $props()

  function getCharacterName(event: StoryEvent): string | undefined {
    if ('characterId' in event && event.characterId) {
      if (event.characterId === 'player') return '你'
      const char = characters.get(event.characterId)
      return char?.identity.name
    }
    return undefined
  }

  let scrollContainer: HTMLDivElement | undefined = $state()

  $effect(() => {
    // Auto-scroll to bottom when new events are added
    if (scrollContainer && events.length > 0) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight
    }
  })
</script>

<div
  bind:this={scrollContainer}
  class="flex-1 overflow-y-auto"
>
  {#if events.length === 0}
    <div class="h-full flex items-center justify-center">
      <p class="text-[var(--text-secondary)] text-sm">故事尚未开始...</p>
    </div>
  {:else}
    <div class="py-4">
      {#each events as event (event.id)}
        <EventRenderer {event} characterName={getCharacterName(event)} />
      {/each}
    </div>
  {/if}
</div>
