<script>
  import { onMount } from 'svelte';
  import { initDatabase } from './lib/database/db.js';
  import { logBrowserSupport } from './lib/utils/helpers.js';
  import { collections } from './lib/stores/collections.js';
  import CollectionList from './lib/components/Collection/CollectionList.svelte';
  import CollectionEditor from './lib/components/Collection/CollectionEditor.svelte';
  import CollectionDetail from './lib/components/CollectionDetail.svelte';
  import ConfirmDialog from './lib/components/ConfirmDialog.svelte';
  import Settings from './lib/components/Settings.svelte';

  let dbReady = false;
  let showEditor = false;
  let editingCollection = null;
  let showDeleteDialog = false;
  let deletingCollection = null;
  let notification = { show: false, message: '', type: 'success' };

  // Simple routing
  let currentView = 'home'; // 'home' | 'collection-detail' | 'settings'
  let selectedCollectionId = null;

  onMount(async () => {
    // Check browser support
    logBrowserSupport();

    // Initialize database
    dbReady = await initDatabase();

    if (dbReady) {
      // Load all collections
      await collections.load();
    }
  });

  function showNotification(message, type = 'success') {
    notification = { show: true, message, type };
    setTimeout(() => {
      notification.show = false;
    }, 3000);
  }

  function openCreateDialog() {
    editingCollection = null;
    showEditor = true;
  }

  function openEditDialog(collection) {
    editingCollection = collection;
    showEditor = true;
  }

  function openDeleteDialog(collection) {
    deletingCollection = collection;
    showDeleteDialog = true;
  }

  async function handleCreate(event) {
    try {
      await collections.create(event.detail);
      showNotification('Collection created successfully!');
    } catch (error) {
      showNotification('Failed to create collection', 'error');
    }
  }

  async function handleUpdate(event) {
    try {
      const { id, ...updates } = event.detail;
      await collections.update(id, updates);
      showNotification('Collection updated successfully!');
    } catch (error) {
      showNotification('Failed to update collection', 'error');
    }
  }

  async function handleDelete() {
    if (!deletingCollection) return;

    try {
      await collections.delete(deletingCollection.id);
      showNotification('Collection deleted successfully!');
      deletingCollection = null;
    } catch (error) {
      showNotification('Failed to delete collection', 'error');
    }
  }

  function handleEditorClose() {
    showEditor = false;
    editingCollection = null;
  }

  function handleDeleteCancel() {
    showDeleteDialog = false;
    deletingCollection = null;
  }

  // Navigation functions
  function navigateToCollection(collection) {
    selectedCollectionId = collection.id;
    currentView = 'collection-detail';
  }

  function navigateToHome() {
    selectedCollectionId = null;
    currentView = 'home';
  }

  function navigateToSettings() {
    currentView = 'settings';
  }
</script>

<main class="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
  <!-- Header - only show on home view -->
  {#if currentView === 'home'}
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="min-w-0">
            <h1 class="text-2xl font-bold text-gray-900 truncate">Memoria</h1>
            <p class="text-sm text-gray-600">Your multimedia flashcard companion</p>
          </div>

          <div class="flex items-center gap-2 flex-shrink-0">
            {#if dbReady}
              <button
                on:click={navigateToSettings}
                class="inline-flex items-center min-h-[44px] px-3 py-2 text-gray-700 hover:bg-gray-100 font-medium rounded-lg transition-colors"
                aria-label="Settings"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                Settings
              </button>
            {/if}

            {#if dbReady && $collections.length > 0}
              <button
                on:click={openCreateDialog}
                class="inline-flex items-center min-h-[44px] px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <svg class="w-5 h-5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                <span class="hidden sm:inline">New Collection</span>
              </button>
            {/if}
          </div>
        </div>
      </div>
    </header>
  {/if}

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

  <!-- Main Content - Conditional Rendering based on view -->
  {#if !dbReady}
    <!-- Database Error State -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white rounded-lg shadow-md p-8 text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <svg class="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">Database Error</h2>
        <p class="text-gray-600 mb-4">Failed to initialize the database. Please refresh the page or check browser compatibility.</p>
        <button
          on:click={() => window.location.reload()}
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Reload Page
        </button>
      </div>
    </div>
  {:else if currentView === 'home'}
    <!-- Home View - Collections List -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CollectionList
        collections={$collections}
        onCreate={openCreateDialog}
        onEdit={openEditDialog}
        onDelete={openDeleteDialog}
        onClick={navigateToCollection}
      />

      <!-- Phase Badge -->
      <div class="mt-8 text-center">
        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          ✅ Phase 7: Export/Import Functionality
        </span>
      </div>
    </div>
  {:else if currentView === 'collection-detail'}
    <!-- Collection Detail View -->
    <CollectionDetail
      collectionId={selectedCollectionId}
      onBack={navigateToHome}
    />
  {:else if currentView === 'settings'}
    <!-- Settings View -->
    <Settings onBack={navigateToHome} />
  {/if}
</main>

<!-- Collection Editor Modal -->
<CollectionEditor
  isOpen={showEditor}
  collection={editingCollection}
  on:create={handleCreate}
  on:update={handleUpdate}
  on:close={handleEditorClose}
/>

<!-- Delete Confirmation Dialog -->
<ConfirmDialog
  isOpen={showDeleteDialog}
  title="Delete Collection"
  message={deletingCollection ? `Are you sure you want to delete "${deletingCollection.name}"? This will also delete all ${deletingCollection.cardCount || 0} cards in this collection. This action cannot be undone.` : ''}
  confirmLabel="Delete"
  cancelLabel="Cancel"
  isDanger={true}
  on:confirm={handleDelete}
  on:cancel={handleDeleteCancel}
/>

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
