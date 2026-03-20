<script lang="ts">
  import type { StoryEvent } from '../../types/events'

  interface Props {
    event: StoryEvent
    characterName?: string
  }

  let { event, characterName }: Props = $props()
</script>

{#if event.type === 'narration'}
  <div class="py-3 px-4 text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
    {event.content}
  </div>

{:else if event.type === 'dialogue'}
  <div class="py-2 px-4 flex gap-3 items-start">
    <div class="shrink-0 w-8 h-8 rounded-full bg-[var(--accent)]/20 flex items-center justify-center text-xs text-[var(--accent)]">
      {(characterName || event.characterId).charAt(0).toUpperCase()}
    </div>
    <div class="flex-1">
      <div class="flex items-baseline gap-2 mb-0.5">
        <span class="text-sm font-medium text-[var(--accent-hover)]">
          {characterName || event.characterId}
        </span>
        {#if event.mood}
          <span class="text-xs text-[var(--text-secondary)]">({event.mood})</span>
        {/if}
      </div>
      <div class="bg-[var(--bg-tertiary)] rounded-lg px-3 py-2 text-sm inline-block max-w-[80%]">
        {event.content}
      </div>
    </div>
  </div>

{:else if event.type === 'action'}
  <div class="py-2 px-4 text-sm italic text-[var(--text-secondary)]">
    <span class="text-[var(--accent-hover)]">{characterName || event.characterId}</span>
    {event.content}
  </div>

{:else if event.type === 'choice'}
  <div class="py-3 px-4">
    <p class="text-sm text-[var(--text-secondary)] mb-2">{event.prompt}</p>
    <div class="flex flex-col gap-2">
      {#each event.options as option}
        <div class="px-3 py-2 rounded-lg border text-sm
          {event.selectedOptionId === option.id
            ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent-hover)]'
            : 'border-gray-700 text-[var(--text-secondary)]'}">
          {option.label}
          {#if option.description}
            <span class="text-xs text-[var(--text-secondary)] ml-2">— {option.description}</span>
          {/if}
        </div>
      {/each}
    </div>
  </div>

{:else if event.type === 'scene_change'}
  <div class="py-4 px-4 flex items-center gap-3 text-sm text-[var(--text-secondary)]">
    <div class="flex-1 h-px bg-gray-700"></div>
    <span>
      {event.fromLocation} → {event.toLocation}
      {#if event.timePassed}
        <span class="text-xs">（{event.timePassed}）</span>
      {/if}
    </span>
    <div class="flex-1 h-px bg-gray-700"></div>
  </div>
  {#if event.transitionText}
    <div class="px-4 pb-2 text-sm italic text-[var(--text-secondary)] text-center">
      {event.transitionText}
    </div>
  {/if}

{:else if event.type === 'state_change'}
  <div class="py-2 px-4">
    <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs">
      <span>+</span>
      <span>{event.displayText}</span>
    </div>
  </div>

{:else if event.type === 'internal'}
  <div class="py-2 px-4 text-sm italic text-[var(--text-secondary)]/60 bg-[var(--bg-secondary)]/50 border-l-2 border-[var(--accent)]/30 ml-4">
    <span class="text-xs text-[var(--text-secondary)]">{characterName || event.characterId} 的内心：</span>
    <br />
    {event.content}
  </div>

{:else if event.type === 'system'}
  <div class="py-1 px-4 text-xs text-[var(--text-secondary)] text-center">
    {event.content}
  </div>
{/if}
