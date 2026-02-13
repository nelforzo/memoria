<script>
  import { formatRelativeTime } from '../../utils/helpers.js';

  export let collection;
  export let onEdit = null;
  export let onDelete = null;
  export let onClick = null;

  let showMenu = false;

  function toggleMenu() {
    showMenu = !showMenu;
  }

  function handleEdit() {
    showMenu = false;
    if (onEdit) onEdit(collection);
  }

  function handleDelete() {
    showMenu = false;
    if (onDelete) onDelete(collection);
  }

  // Close menu when clicking outside
  function handleClickOutside(event) {
    if (showMenu && !event.target.closest('.menu-container')) {
      showMenu = false;
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<div
  class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 relative"
  class:cursor-pointer={onClick}
  on:click={() => onClick && onClick(collection)}
  role={onClick ? 'button' : null}
  tabindex={onClick ? 0 : null}
  on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick && onClick(collection)}
>
  <!-- Menu Button -->
  <div class="absolute top-4 right-4 menu-container">
    <button
      on:click|stopPropagation={toggleMenu}
      class="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
      aria-label="コレクションの操作"
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
          編集
        </button>
        <button
          on:click={handleDelete}
          class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
          削除
        </button>
      </div>
    {/if}
  </div>

  <!-- Collection Content -->
  <div class="pr-8">
    <h3 class="text-xl font-semibold text-gray-900 mb-2">
      {collection.name}
    </h3>

    {#if collection.description}
      <p class="text-gray-600 text-sm mb-4 line-clamp-2">
        {collection.description}
      </p>
    {:else}
      <p class="text-gray-400 text-sm italic mb-4">
        説明なし
      </p>
    {/if}

    <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
      <div class="flex items-center text-sm text-gray-500">
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>
        <span class="font-medium">{collection.cardCount || 0}</span>
        <span class="ml-1">枚</span>
      </div>

      <div class="text-xs text-gray-400">
        更新：{formatRelativeTime(collection.updatedAt)}
      </div>
    </div>
  </div>
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
