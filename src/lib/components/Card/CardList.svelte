<script>
  import CardListItem from './CardListItem.svelte';

  export let cards = [];
  export let onEdit = null;
  export let onDelete = null;
  export let onCreate = null;
</script>

<div>
  {#if cards.length > 0}
    <!-- Cards List -->
    <div class="space-y-3">
      {#each cards as card (card.id)}
        <CardListItem
          {card}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      {/each}
    </div>
  {:else}
    <!-- Empty State -->
    <div class="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
        </svg>
      </div>

      <h3 class="text-xl font-semibold text-gray-900 mb-2">
        カードがありません
      </h3>

      <p class="text-gray-600 mb-6 max-w-sm mx-auto">
        最初のフラッシュカードを追加して、コレクションを作りましょう。
      </p>

      {#if onCreate}
        <button
          on:click={onCreate}
          class="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          最初のカードを追加
        </button>
      {/if}
    </div>
  {/if}
</div>
