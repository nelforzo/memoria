<script>
  import { createEventDispatcher } from 'svelte';
  import { compressImage, isValidImage, blobToDataURL } from '../../utils/imageCompression.js';

  export let imageBlob = null;
  export let disabled = false;

  const dispatch = createEventDispatcher();

  let fileInput;
  let isCompressing = false;
  let previewUrl = null;
  let error = null;

  // Create preview URL when imageBlob changes
  $: if (imageBlob) {
    createPreview();
  } else {
    previewUrl = null;
  }

  async function createPreview() {
    if (!imageBlob) return;
    try {
      previewUrl = await blobToDataURL(imageBlob);
    } catch (err) {
      console.error('Failed to create preview:', err);
    }
  }

  async function handleFileSelect(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    await processFile(file);

    // Clear input so same file can be selected again
    if (fileInput) {
      fileInput.value = '';
    }
  }

  async function processFile(file) {
    error = null;

    // Validate file type
    if (!isValidImage(file)) {
      error = '有効な画像ファイル（JPEG、PNG、GIF、またはWebP）を選択してください';
      return;
    }

    // Check file size (max 10MB original)
    if (file.size > 10 * 1024 * 1024) {
      error = '画像のサイズが大きすぎます（最大10MB）';
      return;
    }

    isCompressing = true;

    try {
      // Compress image
      const compressed = await compressImage(file);

      // Check compressed size
      if (compressed.size > 500 * 1024) {
        console.warn('Compressed image is larger than 500KB:', (compressed.size / 1024).toFixed(1) + 'KB');
      }

      // Dispatch event with compressed blob
      dispatch('change', compressed);
    } catch (err) {
      console.error('Failed to compress image:', err);
      error = '画像の圧縮に失敗しました。別の画像をお試しください。';
    } finally {
      isCompressing = false;
    }
  }

  function handleRemove() {
    dispatch('change', null);
    error = null;
  }

  function triggerFileInput() {
    if (fileInput && !disabled) {
      fileInput.click();
    }
  }
</script>

<div class="space-y-3">
  <!-- File Input (hidden) -->
  <input
    type="file"
    accept="image/jpeg,image/png,image/gif,image/webp"
    capture="environment"
    bind:this={fileInput}
    on:change={handleFileSelect}
    class="hidden"
    {disabled}
  />

  {#if previewUrl}
    <!-- Image Preview -->
    <div class="relative">
      <img
        src={previewUrl}
        alt="選択済み"
        class="w-full h-48 object-cover rounded-lg border border-gray-300"
      />

      <!-- Remove Button -->
      <button
        type="button"
        on:click={handleRemove}
        disabled={disabled || isCompressing}
        class="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="写真を削除"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
      </button>

      {#if isCompressing}
        <div class="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
          <div class="text-white text-center">
            <svg class="animate-spin h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <p class="text-sm">圧縮中...</p>
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <!-- Upload Button -->
    <button
      type="button"
      on:click={triggerFileInput}
      disabled={disabled || isCompressing}
      class="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {#if isCompressing}
        <svg class="animate-spin h-8 w-8 text-indigo-600 mb-2" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
        </svg>
        <p class="text-sm text-gray-600">画像を圧縮中...</p>
      {:else}
        <svg class="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        <p class="text-sm font-medium text-gray-700 mb-1">写真を追加</p>
        <p class="text-xs text-gray-500">クリックしてアップロードまたは撮影</p>
        <p class="text-xs text-gray-400 mt-1">JPEG、PNG、GIF、またはWebP（最大10MB）</p>
      {/if}
    </button>
  {/if}

  <!-- Error Message -->
  {#if error}
    <div class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start">
      <svg class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
      </svg>
      <span>{error}</span>
    </div>
  {/if}
</div>
