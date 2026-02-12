<script>
  import { createEventDispatcher } from 'svelte';

  export let isOpen = false;
  export let title = 'Confirm';
  export let message = 'Are you sure?';
  export let confirmLabel = 'Confirm';
  export let cancelLabel = 'Cancel';
  export let isDanger = false;

  const dispatch = createEventDispatcher();

  function confirm() {
    dispatch('confirm');
    close();
  }

  function close() {
    dispatch('cancel');
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      close();
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      close();
    }
  }
</script>

{#if isOpen}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    on:click={handleBackdropClick}
    on:keydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
    tabindex="-1"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
      <!-- Header -->
      <div class="p-6 border-b border-gray-200">
        <div class="flex items-center">
          {#if isDanger}
            <div class="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
              <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
          {:else}
            <div class="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
              <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          {/if}

          <h2 id="dialog-title" class="text-xl font-semibold text-gray-900">
            {title}
          </h2>
        </div>
      </div>

      <!-- Body -->
      <div class="p-6">
        <p class="text-gray-600">
          {message}
        </p>
      </div>

      <!-- Actions -->
      <div class="p-6 pt-0 flex gap-3">
        <button
          type="button"
          on:click={close}
          class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          on:click={confirm}
          class="flex-1 px-4 py-2 font-medium rounded-lg transition-colors"
          class:bg-red-600={isDanger}
          class:hover:bg-red-700={isDanger}
          class:bg-indigo-600={!isDanger}
          class:hover:bg-indigo-700={!isDanger}
          class:text-white={true}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
{/if}
