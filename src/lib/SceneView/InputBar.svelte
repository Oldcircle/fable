<script lang="ts">
  interface Props {
    onSend: (text: string) => void
    onAction: (text: string) => void
    disabled?: boolean
    placeholder?: string
  }

  let { onSend, onAction, disabled = false, placeholder = '输入对话或动作...' }: Props = $props()

  let input = $state('')
  let mode = $state<'dialogue' | 'action'>('dialogue')

  function handleSubmit() {
    const text = input.trim()
    if (!text || disabled) return

    if (mode === 'dialogue') {
      onSend(text)
    } else {
      onAction(text)
    }
    input = ''
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }
</script>

<div class="border-t border-gray-800 p-3 bg-[var(--bg-secondary)]">
  <div class="flex items-center gap-2 mb-2">
    <button
      class="px-2.5 py-1 rounded text-xs transition-colors
        {mode === 'dialogue'
          ? 'bg-[var(--accent)] text-white'
          : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-white'}"
      onclick={() => mode = 'dialogue'}
    >
      对话
    </button>
    <button
      class="px-2.5 py-1 rounded text-xs transition-colors
        {mode === 'action'
          ? 'bg-[var(--accent)] text-white'
          : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-white'}"
      onclick={() => mode = 'action'}
    >
      动作
    </button>
    <span class="text-xs text-[var(--text-secondary)] ml-auto">
      {mode === 'dialogue' ? '说话' : '做动作'}
    </span>
  </div>

  <div class="flex gap-2">
    <input
      type="text"
      bind:value={input}
      onkeydown={handleKeydown}
      {disabled}
      {placeholder}
      class="flex-1 bg-[var(--bg-tertiary)] border border-gray-700 rounded-lg px-3 py-2 text-sm
        text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50
        focus:outline-none focus:border-[var(--accent)] disabled:opacity-50"
    />
    <button
      onclick={handleSubmit}
      disabled={disabled || !input.trim()}
      class="px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-medium
        hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors"
    >
      发送
    </button>
  </div>
</div>
