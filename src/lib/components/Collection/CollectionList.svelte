<script>
  import CollectionCard from './CollectionCard.svelte';

  export let collections = [];
  export let onEdit = null;
  export let onDelete = null;
  export let onCreate = null;
  export let onClick = null;
</script>

<div>
  {#if collections.length > 0}
    <!-- Collections Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each collections as collection (collection.id)}
        <CollectionCard
          {collection}
          onEdit={onEdit}
          onDelete={onDelete}
          onClick={onClick}
        />
      {/each}
    </div>
  {:else}
    <!-- Empty State -->
    <div class="text-center py-16">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
        <svg class="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>
      </div>

      <h3 class="text-xl font-semibold text-gray-900 mb-2">
        No collections yet
      </h3>

      <p class="text-gray-600 mb-6 max-w-sm mx-auto">
        Get started by creating your first collection to organize your flashcards.
      </p>

      {#if onCreate}
        <button
          on:click={onCreate}
          class="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Create Your First Collection
        </button>
      {/if}
    </div>
  {/if}
</div>
