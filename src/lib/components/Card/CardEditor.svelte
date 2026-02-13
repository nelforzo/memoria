<script>
  import { createEventDispatcher } from 'svelte';
  import ImageCapture from '../Media/ImageCapture.svelte';
  import AudioRecorder from '../Media/AudioRecorder.svelte';

  export let card = null; // null for create, object for edit
  export let isOpen = false;

  const dispatch = createEventDispatcher();

  let text = card?.text || '';
  let imageBlob = card?.imageBlob || null;
  let audioBlob = card?.audioBlob || null;
  let isSubmitting = false;
  let errors = {};

  // Update form when card prop changes
  $: if (card) {
    text = card.text || '';
    imageBlob = card.imageBlob || null;
    audioBlob = card.audioBlob || null;
  }

  // Reset form when closed
  $: if (!isOpen) {
    resetForm();
  }

  $: isEdit = card !== null;
  $: title = isEdit ? 'カードを編集' : '新しいカード';
  $: submitLabel = isEdit ? '変更を保存' : 'カードを追加';

  function resetForm() {
    if (!card) {
      text = '';
      imageBlob = null;
      audioBlob = null;
    }
    errors = {};
    isSubmitting = false;
  }

  function handleImageChange(event) {
    imageBlob = event.detail;
  }

  function handleAudioChange(event) {
    audioBlob = event.detail;
  }

  function validate() {
    errors = {};

    if (!text.trim()) {
      errors.text = 'カードのテキストは必須です';
    } else if (text.trim().length > 5000) {
      errors.text = 'カードのテキストは5000文字以内で入力してください';
    }

    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    isSubmitting = true;

    try {
      const data = {
        text: text.trim(),
        imageBlob: imageBlob,
        audioBlob: audioBlob
      };

      if (isEdit) {
        dispatch('update', { id: card.id, ...data });
      } else {
        dispatch('create', data);
      }

      close();
    } catch (error) {
      console.error('Failed to submit:', error);
      errors.general = 'カードの保存に失敗しました。もう一度お試しください。';
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
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85dvh] overflow-y-auto my-auto">
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

        <!-- Text Field -->
        <div class="mb-6">
          <label for="card-text" class="block text-sm font-medium text-gray-700 mb-2">
            カードの内容 <span class="text-red-500">*</span>
          </label>
          <textarea
            id="card-text"
            bind:value={text}
            placeholder="カードの内容を入力（例：1行目に質問、2行目に答え）&#10;&#10;例：&#10;フランスの首都はどこですか？&#10;パリ"
            maxlength="5000"
            rows="10"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors resize-y font-mono text-base"
            class:border-red-500={errors.text}
            disabled={isSubmitting}
          ></textarea>
          <div class="flex items-center justify-between mt-1">
            {#if errors.text}
              <p class="text-sm text-red-600">{errors.text}</p>
            {:else}
              <p class="text-xs text-gray-500">
                💡 ヒント：複数行を使って質問と答えを分けることができます
              </p>
            {/if}
            <p class="text-xs text-gray-400">{text.length}/5000</p>
          </div>
        </div>

        <!-- Photo Upload -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            写真 <span class="text-gray-400 text-xs">（任意）</span>
          </label>
          <ImageCapture
            {imageBlob}
            disabled={isSubmitting}
            on:change={handleImageChange}
          />
        </div>

        <!-- Audio Recording -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            音声 <span class="text-gray-400 text-xs">（任意）</span>
          </label>
          <AudioRecorder
            {audioBlob}
            disabled={isSubmitting}
            on:change={handleAudioChange}
          />
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
