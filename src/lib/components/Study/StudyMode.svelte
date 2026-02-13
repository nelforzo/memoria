<script>
  import { onMount, onDestroy } from 'svelte';
  import { cards } from '../../stores/cards.js';
  import { resetViewport } from '../../utils/viewportReset.js';

  export let collectionId;
  export let collectionName = '';
  export let onExit;

  let currentIndex = 0;
  let studyCards = [];
  let viewedCards = new Set();
  let showFront = true;
  let currentImageUrl = null;
  let currentAudioUrl = null;
  const urlCache = new Map(); // Map<cardId, { imageUrl, audioUrl }>
  let audioElement; // bound via bind:this — stable DOM node, never destroyed
  let isPlaying = false;
  let audioListenersAttached = false;

  $: currentCard = studyCards[currentIndex];

  function updateAudioElement(url) {
    if (!audioElement) return;
    // Attach play-state listeners once, on first use
    if (!audioListenersAttached) {
      audioElement.addEventListener('play',  () => { isPlaying = true;  });
      audioElement.addEventListener('pause', () => { isPlaying = false; });
      audioElement.addEventListener('ended', () => { isPlaying = false; });
      audioListenersAttached = true;
    }
    audioElement.pause();
    // Only touch src/load when there IS a URL to load.
    // Calling removeAttribute('src') + load() puts Safari's audio element
    // into a broken state that it won't recover from on subsequent loads.
    if (url) {
      audioElement.src = url;
      audioElement.load();
    }
  }

  function playAudio() {
    if (!audioElement || !currentAudioUrl) return;
    audioElement.currentTime = 0;
    audioElement.play().catch(() => {});
  }

  function ensureUrlsForCard(card) {
    if (!card) {
      currentImageUrl = null;
      currentAudioUrl = null;
      updateAudioElement(null);
      return;
    }
    if (!urlCache.has(card.id)) {
      let imageUrl = null;
      let audioUrl = null;
      try {
        if (card.imageBlob instanceof Blob && card.imageBlob.size > 0) {
          imageUrl = URL.createObjectURL(card.imageBlob);
        }
      } catch (e) {
        console.warn('Failed to create image URL for card', card.id, e);
      }
      try {
        if (card.audioBlob instanceof Blob && card.audioBlob.size > 0) {
          audioUrl = URL.createObjectURL(card.audioBlob);
        }
      } catch (e) {
        console.warn('Failed to create audio URL for card', card.id, e);
      }
      urlCache.set(card.id, { imageUrl, audioUrl });
    }
    const cached = urlCache.get(card.id);
    currentImageUrl = cached.imageUrl;
    currentAudioUrl = cached.audioUrl;
    updateAudioElement(cached.audioUrl);
  }
  $: progress = studyCards.length > 0 ? `${currentIndex + 1} / ${studyCards.length}` : '0 / 0';
  $: canGoPrevious = currentIndex > 0;
  $: canGoNext = currentIndex < studyCards.length - 1;
  $: ensureUrlsForCard(currentCard);
  $: markCurrentCardAsViewed(currentCard);
  $: hasMultipleLines = currentCard && currentCard.text.split('\n').filter(line => line.trim()).length > 1;

  onMount(async () => {
    studyCards = [...$cards];
    if (studyCards.length === 0) {
      onExit();
    }
  });

  onDestroy(() => {
    for (const { imageUrl, audioUrl } of urlCache.values()) {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    }
    urlCache.clear();
    resetViewport(); // Safety net for any exit path
  });

  function markCurrentCardAsViewed(card) {
    if (!card || viewedCards.has(card.id)) return;
    viewedCards.add(card.id);
    cards.markAsReviewed(card.id);
  }

  function goToPrevious() {
    if (canGoPrevious) {
      currentIndex--;
      showFront = true;
    }
  }

  function goToNext() {
    if (canGoNext) {
      currentIndex++;
      showFront = true;
    }
  }

  function toggleFlip() {
    showFront = !showFront;
  }

  function handleKeydown(event) {
    switch(event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        goToPrevious();
        break;
      case 'ArrowRight':
        event.preventDefault();
        goToNext();
        break;
      case ' ':
      case 'Enter':
        event.preventDefault();
        toggleFlip();
        break;
      case 'Escape':
        event.preventDefault();
        onExit();
        break;
    }
  }

  function handleExit() {
    onExit();
  }

  // Get front and back of card (split by newlines)
  function getCardSides(text) {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length <= 1) {
      return { front: text, back: null };
    }

    // First line(s) as front, rest as back
    const midpoint = Math.ceil(lines.length / 2);
    return {
      front: lines.slice(0, midpoint).join('\n'),
      back: lines.slice(midpoint).join('\n')
    };
  }

  $: cardSides = currentCard ? getCardSides(currentCard.text) : { front: '', back: null };

  // Swipe gesture support
  let touchStartX = 0;

  function handleTouchStart(event) {
    touchStartX = event.changedTouches[0].clientX;
  }

  function handleTouchEnd(event) {
    event.preventDefault();
    const delta = event.changedTouches[0].clientX - touchStartX;
    const SWIPE_THRESHOLD = 50;
    if (delta > SWIPE_THRESHOLD) goToPrevious();
    else if (delta < -SWIPE_THRESHOLD) goToNext();
    else toggleFlip();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="fixed inset-0 bg-gradient-to-br from-indigo-900 to-purple-900 z-50 flex flex-col">
  <!-- Header -->
  <header class="bg-black bg-opacity-30 backdrop-blur-sm border-b border-white border-opacity-10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button
            on:click={handleExit}
            class="p-2 text-white hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
            aria-label="Exit study mode"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>

          <div class="text-white">
            <h1 class="text-lg font-semibold">{collectionName}</h1>
            <p class="text-sm text-indigo-200">Study Mode</p>
          </div>
        </div>

        <!-- Progress -->
        <div class="text-white text-right">
          <div class="text-2xl font-bold">{progress}</div>
          <div class="text-sm text-indigo-200">Cards</div>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Content - Card Display -->
  <div class="flex-1 flex items-center justify-center p-8">
    <div class="max-w-4xl w-full">
      {#if currentCard}
        <!-- Hidden audio element — stable DOM node, never inside {#key} or {#if currentAudioUrl} -->
        <audio bind:this={audioElement} class="hidden"></audio>

        <!-- Card Container -->
        {#key currentCard.id}
        <div class="relative">
          <!-- Card -->
          <div
            class="bg-white rounded-2xl shadow-2xl p-6 sm:p-12 min-h-[200px] sm:min-h-[400px] flex flex-col items-center justify-center cursor-pointer active:scale-[0.98] transition-transform touch-manipulation"
            on:click={toggleFlip}
            on:touchstart={handleTouchStart}
            on:touchend={handleTouchEnd}
            role="button"
            tabindex="0"
            on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleFlip()}
          >
            <!-- Image Display (if present) -->
            {#if currentImageUrl}
              <div class="mb-6">
                <img
                  src={currentImageUrl}
                  alt=""
                  class="max-w-full max-h-64 mx-auto rounded-lg shadow-lg object-contain"
                />
              </div>
            {/if}

            {#if hasMultipleLines && cardSides.back}
              <!-- Multi-line card with flip -->
              <div class="text-center w-full">
                {#if showFront}
                  <div class="text-gray-500 text-sm mb-4 uppercase tracking-wide">Question</div>
                  <p class="text-xl sm:text-3xl text-gray-900 whitespace-pre-wrap leading-relaxed">
                    {cardSides.front}
                  </p>
                  <div class="mt-8 text-indigo-600 text-sm">
                    <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"/>
                    </svg>
                    Click or press Space to reveal answer
                  </div>
                {:else}
                  <div class="text-gray-500 text-sm mb-4 uppercase tracking-wide">Answer</div>
                  <p class="text-xl sm:text-3xl text-gray-900 whitespace-pre-wrap leading-relaxed">
                    {cardSides.back}
                  </p>
                  <div class="mt-8 text-green-600 text-sm">
                    <svg class="w-5 h-5 inline-block mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    Click or press Space to see question again
                  </div>
                {/if}
              </div>
            {:else}
              <!-- Single block of text -->
              <div class="text-center w-full">
                <p class="text-xl sm:text-3xl text-gray-900 whitespace-pre-wrap leading-relaxed">
                  {currentCard.text}
                </p>
              </div>
            {/if}
          </div>

          <!-- Card Count Badge -->
          <div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
            Card {currentIndex + 1}
          </div>
        </div>
        {/key}

        <!-- Custom audio play button -->
        {#if currentAudioUrl}
          <div class="mt-6 flex justify-center" on:click|stopPropagation role="none">
            <button
              on:click={playAudio}
              aria-label={isPlaying ? 'Stop audio' : 'Play audio'}
              class="relative flex items-center justify-center w-14 h-14 rounded-full bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white shadow-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-900"
            >
              {#if isPlaying}
                <span class="absolute inset-0 rounded-full bg-indigo-400 opacity-75 animate-ping" aria-hidden="true"></span>
              {/if}
              {#if isPlaying}
                <svg class="w-6 h-6 relative z-10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <rect x="6" y="6" width="12" height="12" rx="1"/>
                </svg>
              {:else}
                <svg class="w-6 h-6 relative z-10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              {/if}
            </button>
          </div>
        {/if}

      {:else}
        <div class="text-center text-white">
          <p class="text-xl">No cards to study</p>
        </div>
      {/if}
    </div>
  </div>

  <!-- Hints strip -->
  <div class="py-3 text-center">
    <div class="keyboard-hints text-white text-xs opacity-60">
      <span>Arrow keys navigate</span>
      <span class="mx-3">·</span>
      <span>Space / Enter flip</span>
      <span class="mx-3">·</span>
      <span>Esc exit</span>
    </div>
    <div class="touch-hints text-indigo-200 text-xs opacity-70">
      Swipe left / right to navigate · Tap to flip
    </div>
  </div>
</div>

<style>
  .keyboard-hints { display: flex; flex-direction: column; align-items: center; }
  .touch-hints { display: none; }

  @media (hover: none) {
    .keyboard-hints { display: none; }
    .touch-hints { display: block; }
  }
</style>
