<script>
  import { createEventDispatcher } from 'svelte';

  export let collection = null; // null for create, object for edit
  export let isOpen = false;

  const dispatch = createEventDispatcher();

  let name = collection?.name || '';
  let description = collection?.description || '';
  let isSubmitting = false;
  let errors = {};

  // Update form when collection prop changes
  $: if (collection) {
    name = collection.name || '';
    description = collection.description || '';
  }

  // Reset form when closed
  $: if (!isOpen) {
    resetForm();
  }

  $: isEdit = collection !== null;
  $: title = isEdit ? 'コレクションを編集' : '新しいコレクション';
  $: submitLabel = isEdit ? '変更を保存' : 'コレクションを作成';

  function resetForm() {
    if (!collection) {
      name = '';
      description = '';
    }
    errors = {};
    isSubmitting = false;
  }

  function validate() {
    errors = {};

    if (!name.trim()) {
      errors.name = 'コレクション名は必須です';
    } else if (name.trim().length > 100) {
      errors.name = 'コレクション名は100文字以内で入力してください';
    }

    if (description.length > 500) {
      errors.description = '説明は500文字以内で入力してください';
    }

    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    isSubmitting = true;

    try {
      const data = {
        name: name.trim(),
        description: description.trim()
      };

      if (isEdit) {
        dispatch('update', { id: collection.id, ...data });
      } else {
        dispatch('create', data);
      }

      close();
    } catch (error) {
      console.error('Failed to submit:', error);
      errors.general = 'コレクションの保存に失敗しました。もう一度お試しください。';
    } finally {
      isSubmitting = false;
    }
  }

  function close() {
    dispatch('close');
    resetForm();
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
    class="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center p-4 z-50 overflow-y-auto"
    on:click={handleBackdropClick}
    on:keydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    tabindex="-1"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[85dvh] overflow-y-auto my-auto">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 id="modal-title" class="text-2xl font-semibold text-gray-900">
          {title}
        </h2>
        <button
          on:click={close}
          class="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="閉じる"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Body -->
      <form on:submit|preventDefault={handleSubmit} class="p-6">
        {#if errors.general}
          <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {errors.general}
          </div>
        {/if}

        <!-- Name Field -->
        <div class="mb-4">
          <label for="collection-name" class="block text-sm font-medium text-gray-700 mb-2">
            コレクション名 <span class="text-red-500">*</span>
          </label>
          <input
            id="collection-name"
            type="text"
            bind:value={name}
            placeholder="例：スペイン語の語彙"
            maxlength="100"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors text-base"
            class:border-red-500={errors.name}
            disabled={isSubmitting}
          />
          <div class="flex items-center justify-between mt-1">
            {#if errors.name}
              <p class="text-sm text-red-600">{errors.name}</p>
            {:else}
              <p class="text-xs text-gray-500">必須</p>
            {/if}
            <p class="text-xs text-gray-400">{name.length}/100</p>
          </div>
        </div>

        <!-- Description Field -->
        <div class="mb-6">
          <label for="collection-description" class="block text-sm font-medium text-gray-700 mb-2">
            説明 <span class="text-gray-400 text-xs">（任意）</span>
          </label>
          <textarea
            id="collection-description"
            bind:value={description}
            placeholder="このコレクションの目的を説明するメモを追加..."
            maxlength="500"
            rows="4"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors resize-none text-base"
            class:border-red-500={errors.description}
            disabled={isSubmitting}
          ></textarea>
          <div class="flex items-center justify-between mt-1">
            {#if errors.description}
              <p class="text-sm text-red-600">{errors.description}</p>
            {:else}
              <div></div>
            {/if}
            <p class="text-xs text-gray-400">{description.length}/500</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3">
          <button
            type="button"
            on:click={close}
            disabled={isSubmitting}
            class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            class="flex-1 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {#if isSubmitting}
              <svg class="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              保存中...
            {:else}
              {submitLabel}
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
