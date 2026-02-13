<script>
  import { onDestroy } from 'svelte';
  import { formatRelativeTime, truncateText } from '../../utils/helpers.js';

  export let card;
  export let onEdit = null;
  export let onDelete = null;

  let showMenu = false;

  // Manage thumbnail blob URL — create once per distinct Blob, revoke on destroy
  let thumbnailUrl = null;
  let _trackedBlob = undefined;

  function syncThumbnailUrl(blob) {
    if (blob === _trackedBlob) return;
    if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
    _trackedBlob = blob;
    thumbnailUrl = blob ? URL.createObjectURL(blob) : null;
  }

  $: syncThumbnailUrl(card.imageBlob);

  onDestroy(() => {
    if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
  });

  function toggleMenu() {
    showMenu = !showMenu;
  }

  function handleEdit() {
    showMenu = false;
    if (onEdit) onEdit(card);
  }

  function handleDelete() {
    showMenu = false;
    if (onDelete) onDelete(card);
  }

  // Close menu when clicking outside
  function handleClickOutside(event) {
    if (showMenu && !event.target.closest('.menu-container')) {
      showMenu = false;
    }
  }

  // Get preview of card text (first 2 lines or 150 chars)
  function getPreview(text) {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return 'Empty card';

    // Show first 2 lines
    const preview = lines.slice(0, 2).join('\n');
    return truncateText(preview, 150);
  }

  // Check if card has multiple lines (question/answer format)
  $: hasMultipleLines = card.text.split('\n').filter(line => line.trim()).length > 1;
</script>

<svelte:window on:click={handleClickOutside} />

<div class="bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all p-4 relative group">
  <!-- Menu Button -->
  <div class="absolute top-3 right-3 menu-container">
    <button
      on:click|stopPropagation={toggleMenu}
      class="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
      aria-label="Card options"
    >
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
      </svg>
    </button>

    {#if showMenu}
      <div class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
        <button
          on:click={handleEdit}
          class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
          Edit
        </button>
        <button
          on:click={handleDelete}
          class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
          Delete
        </button>
      </div>
    {/if}
  </div>

  <!-- Card Content -->
  <div class="pr-8">
    <!-- Card Icon/Thumbnail and Text -->
    <div class="flex items-start mb-2">
      {#if thumbnailUrl}
        <!-- Image Thumbnail -->
        <img
          src={thumbnailUrl}
          alt="Card thumbnail"
          class="flex-shrink-0 w-16 h-16 object-cover rounded mr-3"
        />
      {:else}
        <!-- Card Icon -->
        <div class="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded flex items-center justify-center mr-3">
          <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
          </svg>
        </div>
      {/if}

      <!-- Text Preview -->
      <div class="flex-1 min-w-0">
        <p class="text-sm text-gray-900 whitespace-pre-wrap break-words">
          {getPreview(card.text)}
        </p>
        {#if hasMultipleLines}
          <span class="inline-flex items-center mt-1 text-xs text-indigo-600">
            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
            </svg>
            Multi-line
          </span>
        {/if}
      </div>
    </div>

    <!-- Media Indicators (placeholder for Phase 5 & 6) -->
    <div class="flex items-center gap-2 mt-3">
      {#if card.imageBlob}
        <span class="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
          <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/>
          </svg>
          Photo
        </span>
      {/if}
      {#if card.audioBlob}
        <span class="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
          <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clip-rule="evenodd"/>
          </svg>
          Audio
        </span>
      {/if}
    </div>

    <!-- Metadata -->
    <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
      <div class="flex items-center gap-3 text-xs text-gray-500">
        {#if card.reviewCount > 0}
          <span class="flex items-center">
            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
              <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
            </svg>
            Reviewed {card.reviewCount}x
          </span>
        {/if}
        <span>Created {formatRelativeTime(card.createdAt)}</span>
      </div>
    </div>
  </div>
</div>
