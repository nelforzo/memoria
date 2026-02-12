<script>
  import { createEventDispatcher } from 'svelte';
  import { exportAllCollections, importCollections, validateImportFile } from '../utils/exportImport.js';
  import { collections } from '../stores/collections.js';

  export let onBack;

  const dispatch = createEventDispatcher();

  let importStrategy = 'merge';
  let isImporting = false;
  let isExporting = false;
  let fileInput;
  let notification = { show: false, message: '', type: 'success' };

  function showNotification(message, type = 'success') {
    notification = { show: true, message, type };
    setTimeout(() => {
      notification.show = false;
    }, 4000);
  }

  async function handleExportAll() {
    if ($collections.length === 0) {
      showNotification('No collections to export', 'error');
      return;
    }

    isExporting = true;

    try {
      await exportAllCollections();
      showNotification(`Exported ${$collections.length} collection(s) successfully!`);
    } catch (error) {
      console.error('Export failed:', error);
      showNotification('Failed to export collections', 'error');
    } finally {
      isExporting = false;
    }
  }

  function triggerImport() {
    if (fileInput) {
      fileInput.click();
    }
  }

  async function handleImportFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = await validateImportFile(file);

    if (!validation.valid) {
      showNotification(`Invalid file: ${validation.error}`, 'error');
      if (fileInput) fileInput.value = '';
      return;
    }

    isImporting = true;

    try {
      const result = await importCollections(file, importStrategy);

      // Reload collections
      await collections.load();

      // Show success message
      const messages = [];
      if (result.imported > 0) messages.push(`${result.imported} imported`);
      if (result.updated > 0) messages.push(`${result.updated} updated`);
      if (result.skipped > 0) messages.push(`${result.skipped} skipped`);

      showNotification(`Import successful: ${messages.join(', ')}`);
    } catch (error) {
      console.error('Import failed:', error);
      showNotification(`Failed to import: ${error.message}`, 'error');
    } finally {
      isImporting = false;
      if (fileInput) fileInput.value = '';
    }
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
  <!-- Header -->
  <header class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div class="flex items-center gap-4">
        <button
          on:click={onBack}
          class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Back to home"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
        </button>

        <div>
          <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
          <p class="text-sm text-gray-600">Manage your data and preferences</p>
        </div>
      </div>
    </div>
  </header>

  <!-- Notification Toast -->
  {#if notification.show}
    <div class="fixed top-4 right-4 z-50 animate-slide-in">
      <div
        class="bg-white rounded-lg shadow-lg border-l-4 p-4 max-w-md"
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
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Export Section -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Export Data</h2>
      <p class="text-gray-600 mb-4">
        Download all your collections, cards, and media as a JSON file. Use this for backup or to transfer your data to another device.
      </p>

      <button
        on:click={handleExportAll}
        disabled={isExporting || $collections.length === 0}
        class="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {#if isExporting}
          <svg class="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          Exporting...
        {:else}
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          Export All Collections
        {/if}
      </button>

      {#if $collections.length === 0}
        <p class="text-sm text-gray-500 mt-2">No collections to export</p>
      {/if}
    </div>

    <!-- Import Section -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Import Data</h2>
      <p class="text-gray-600 mb-4">
        Import collections from a previously exported JSON file. Choose how to handle existing collections.
      </p>

      <!-- Import Strategy -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Import Strategy
        </label>
        <div class="space-y-2">
          <label class="flex items-center">
            <input
              type="radio"
              bind:group={importStrategy}
              value="merge"
              class="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
            />
            <span class="ml-2 text-sm">
              <span class="font-medium text-gray-900">Merge</span>
              <span class="text-gray-600"> - Skip collections that already exist</span>
            </span>
          </label>
          <label class="flex items-center">
            <input
              type="radio"
              bind:group={importStrategy}
              value="replace"
              class="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
            />
            <span class="ml-2 text-sm">
              <span class="font-medium text-gray-900">Replace</span>
              <span class="text-gray-600"> - Overwrite collections with matching IDs</span>
            </span>
          </label>
        </div>
      </div>

      <!-- Hidden File Input -->
      <input
        type="file"
        accept=".json,application/json"
        bind:this={fileInput}
        on:change={handleImportFile}
        class="hidden"
      />

      <button
        on:click={triggerImport}
        disabled={isImporting}
        class="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {#if isImporting}
          <svg class="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          Importing...
        {:else}
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
          </svg>
          Import from File
        {/if}
      </button>

      <div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p class="text-sm text-yellow-800">
          <strong>Warning:</strong> Using "Replace" strategy will overwrite existing collections with the same ID. Make sure to export your current data first!
        </p>
      </div>
    </div>

    <!-- App Info -->
    <div class="mt-8 text-center text-sm text-gray-500">
      <p>Memoria v1.0</p>
      <p class="mt-1">All data is stored locally on your device</p>
    </div>
  </div>
</div>

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
