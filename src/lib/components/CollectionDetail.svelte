<script>
  import { onMount } from 'svelte';
  import { cards } from '../stores/cards.js';
  import { collections } from '../stores/collections.js';
  import CardList from './Card/CardList.svelte';
  import CardEditor from './Card/CardEditor.svelte';
  import ConfirmDialog from './ConfirmDialog.svelte';
  import StudyMode from './Study/StudyMode.svelte';
  import { formatRelativeTime } from '../utils/helpers.js';
  import { exportCollection } from '../utils/exportImport.js';
  import { resetViewport } from '../utils/viewportReset.js';

  export let collectionId;
  export let onBack;

  let collection = null;
  let loading = true;
  let showEditor = false;
  let editingCard = null;
  let showDeleteDialog = false;
  let deletingCard = null;
  let showStudyMode = false;
  let isExporting = false;
  let notification = { show: false, message: '', type: 'success' };

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    loading = true;
    try {
      // Load collection details
      collection = await collections.getById(collectionId);

      if (!collection) {
        console.error('Collection not found:', collectionId);
        onBack();
        return;
      }

      // Load cards for this collection
      await cards.load(collectionId);
    } catch (error) {
      console.error('Failed to load collection:', error);
      showNotification('Failed to load collection', 'error');
    } finally {
      loading = false;
    }
  }

  function showNotification(message, type = 'success') {
    notification = { show: true, message, type };
    setTimeout(() => {
      notification.show = false;
    }, 3000);
  }

  function openCreateDialog() {
    editingCard = null;
    showEditor = true;
  }

  function openEditDialog(card) {
    editingCard = card;
    showEditor = true;
  }

  function openDeleteDialog(card) {
    deletingCard = card;
    showDeleteDialog = true;
  }

  async function handleCreate(event) {
    try {
      await cards.create(collectionId, event.detail);
      showNotification('Card added successfully!');
    } catch (error) {
      showNotification('Failed to add card', 'error');
    }
  }

  async function handleUpdate(event) {
    try {
      const { id, ...updates } = event.detail;
      await cards.update(id, updates);
      showNotification('Card updated successfully!');
    } catch (error) {
      showNotification('Failed to update card', 'error');
    }
  }

  async function handleDelete() {
    if (!deletingCard) return;

    try {
      await cards.delete(deletingCard.id, collectionId);
      showNotification('Card deleted successfully!');
      deletingCard = null;
    } catch (error) {
      showNotification('Failed to delete card', 'error');
    }
  }

  function handleEditorClose() {
    showEditor = false;
    editingCard = null;
  }

  function handleDeleteCancel() {
    showDeleteDialog = false;
    deletingCard = null;
  }

  function openStudyMode() {
    if ($cards.length === 0) {
      showNotification('Add some cards first before studying!', 'error');
      return;
    }
    showStudyMode = true;
  }

  async function closeStudyMode() {
    await resetViewport(); // wait for Safari to snap viewport before removing the overlay
    showStudyMode = false;
    cards.load(collectionId);
  }

  async function handleExport() {
    if ($cards.length === 0) {
      showNotification('No cards to export', 'error');
      return;
    }

    isExporting = true;

    try {
      await exportCollection(collectionId);
      showNotification('Collection exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      showNotification('Failed to export collection', 'error');
    } finally {
      isExporting = false;
    }
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
  <!-- Header -->
  <header class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div class="flex flex-col gap-3">
        <!-- Row 1: back button + title -->
        <div class="flex items-center gap-4">
          <button
            on:click={onBack}
            class="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            aria-label="Back to collections"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
          </button>

          {#if collection}
            <div class="min-w-0">
              <h1 class="text-2xl font-bold text-gray-900 truncate">{collection.name}</h1>
              {#if collection.description}
                <p class="text-sm text-gray-600 mt-1 line-clamp-1">{collection.description}</p>
              {/if}
            </div>
          {/if}
        </div>

        <!-- Row 2: action buttons -->
        {#if !loading && $cards.length > 0}
          <div class="flex flex-wrap gap-2">
            <button
              on:click={handleExport}
              disabled={isExporting}
              class="inline-flex items-center min-h-[44px] px-3 py-2 text-gray-700 hover:bg-gray-100 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Export collection"
            >
              {#if isExporting}
                <svg class="animate-spin h-5 w-5 sm:mr-2" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              {:else}
                <svg class="w-5 h-5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
              {/if}
              <span class="hidden sm:inline">Export</span>
            </button>

            <button
              on:click={openStudyMode}
              class="inline-flex items-center min-h-[44px] px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              aria-label="Study cards"
            >
              <svg class="w-5 h-5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
              <span class="hidden sm:inline">Study</span>
            </button>

            <button
              on:click={openCreateDialog}
              class="inline-flex items-center min-h-[44px] px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              aria-label="Add card"
            >
              <svg class="w-5 h-5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              <span class="hidden sm:inline">Add Card</span>
            </button>
          </div>
        {/if}
      </div>

      <!-- Stats Bar -->
      {#if collection}
        <div class="flex flex-wrap items-center gap-4 sm:gap-6 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
          <div class="flex items-center">
            <svg class="w-4 h-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
            </svg>
            <span class="font-medium">{$cards.length}</span>
            <span class="ml-1">cards</span>
          </div>
          <div class="flex items-center">
            <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>Updated {formatRelativeTime(collection.updatedAt)}</span>
          </div>
        </div>
      {/if}
    </div>
  </header>

  <!-- Notification Toast -->
  {#if notification.show}
    <div class="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 animate-slide-in">
      <div
        class="bg-white rounded-lg shadow-lg border-l-4 p-4"
        class:border-green-500={notification.type === 'success'}
        class:border-red-500={notification.type === 'error'}
      >
        <div class="flex items-center">
          {#if notification.type === 'success'}
            <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
          {:else}
            <svg class="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
          {/if}
          <p class="text-gray-900 font-medium">{notification.message}</p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Main Content -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {#if loading}
      <!-- Loading State -->
      <div class="flex items-center justify-center py-16">
        <svg class="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
        </svg>
      </div>
    {:else}
      <!-- Cards List -->
      <CardList
        cards={$cards}
        onCreate={openCreateDialog}
        onEdit={openEditDialog}
        onDelete={openDeleteDialog}
      />
    {/if}
  </div>
</div>

<!-- Card Editor Modal -->
<CardEditor
  isOpen={showEditor}
  card={editingCard}
  on:create={handleCreate}
  on:update={handleUpdate}
  on:close={handleEditorClose}
/>

<!-- Delete Confirmation Dialog -->
<ConfirmDialog
  isOpen={showDeleteDialog}
  title="Delete Card"
  message={deletingCard ? 'Are you sure you want to delete this card? This action cannot be undone.' : ''}
  confirmLabel="Delete"
  cancelLabel="Cancel"
  isDanger={true}
  on:confirm={handleDelete}
  on:cancel={handleDeleteCancel}
/>

<!-- Study Mode -->
{#if showStudyMode}
  <StudyMode
    {collectionId}
    collectionName={collection?.name || ''}
    onExit={closeStudyMode}
  />
{/if}

<style>
  @keyframes slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .animate-slide-in {
    animation: slide-in 0.3s ease-out;
  }
</style>
