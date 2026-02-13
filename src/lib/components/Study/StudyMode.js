/**
 * StudyMode — fullscreen flashcard study with audio playback.
 *
 * Audio fix: the <audio> element is created once in the DOM at mount time,
 * not gated behind a conditional template block. The src is set imperatively,
 * eliminating the Svelte timing bug where bind:this was undefined during
 * reactive chain execution.
 */

import { cards } from '../../stores/cards.js';
import { resetViewport } from '../../utils/viewportReset.js';

export function createStudyMode(container, { collectionId, collectionName, onExit }) {
  const el = document.createElement('div');
  el.className = 'study-mode';
  container.appendChild(el);

  // State
  let studyCards = [...cards.get()];
  let currentIndex = 0;
  let showFront = true;
  let viewedCards = new Set();
  let isPlaying = false;

  // Blob URL cache
  const urlCache = new Map();

  // Stable audio element — created once, never destroyed until unmount
  const audio = document.createElement('audio');
  audio.addEventListener('play', () => { isPlaying = true; updateAudioBtn(); });
  audio.addEventListener('pause', () => { isPlaying = false; updateAudioBtn(); });
  audio.addEventListener('ended', () => { isPlaying = false; updateAudioBtn(); });

  // Touch state
  let touchStartX = 0;

  if (studyCards.length === 0) {
    onExit();
    return { destroy: () => el.remove() };
  }

  function currentCard() { return studyCards[currentIndex]; }

  function ensureUrls(card) {
    if (!card) return { imageUrl: null, audioUrl: null };
    if (!urlCache.has(card.id)) {
      let imageUrl = null;
      let audioUrl = null;
      try {
        if (card.imageBlob instanceof Blob && card.imageBlob.size > 0)
          imageUrl = URL.createObjectURL(card.imageBlob);
      } catch (e) { console.warn('Failed to create image URL', e); }
      try {
        if (card.audioBlob instanceof Blob && card.audioBlob.size > 0)
          audioUrl = URL.createObjectURL(card.audioBlob);
      } catch (e) { console.warn('Failed to create audio URL', e); }
      urlCache.set(card.id, { imageUrl, audioUrl });
    }
    return urlCache.get(card.id);
  }

  function loadAudio(url) {
    audio.pause();
    isPlaying = false;
    if (url) {
      audio.src = url;
      audio.load();
    }
  }

  function playAudio() {
    const { audioUrl } = ensureUrls(currentCard());
    if (!audio || !audioUrl) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }

  function markViewed(card) {
    if (!card || viewedCards.has(card.id)) return;
    viewedCards.add(card.id);
    cards.markAsReviewed(card.id);
  }

  function getCardSides(text) {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length <= 1) return { front: text, back: null };
    const mid = Math.ceil(lines.length / 2);
    return { front: lines.slice(0, mid).join('\n'), back: lines.slice(mid).join('\n') };
  }

  function render() {
    const card = currentCard();
    const { imageUrl, audioUrl } = ensureUrls(card);
    const sides = card ? getCardSides(card.text) : { front: '', back: null };
    const hasMultipleLines = card && card.text.split('\n').filter(l => l.trim()).length > 1;
    const progress = `${currentIndex + 1} / ${studyCards.length}`;

    loadAudio(audioUrl);
    markViewed(card);

    el.innerHTML = `
      <header class="study-mode__header">
        <div class="study-mode__header-inner">
          <div class="flex items-center gap-4">
            <button class="btn btn--icon" data-action="exit" style="color:white;padding:var(--sp-2)" aria-label="学習モードを終了">
              <svg style="width:1.5rem;height:1.5rem" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            <div>
              <div class="study-mode__title">${escapeHtml(collectionName)}</div>
              <div class="study-mode__subtitle">学習モード</div>
            </div>
          </div>
          <div class="study-mode__progress">
            <div class="study-mode__progress-num">${progress}</div>
            <div class="study-mode__progress-label">枚</div>
          </div>
        </div>
      </header>

      <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:var(--sp-8)">
        <div style="max-width:56rem;width:100%">
          ${card ? `
            <div class="relative">
              <div class="study-card" data-action="flip" tabindex="0" data-toucharea>
                ${imageUrl ? `<img class="study-card__image" src="${imageUrl}" alt="" />` : ''}
                ${hasMultipleLines && sides.back ? `
                  <div style="text-align:center;width:100%">
                    ${showFront ? `
                      <div class="study-card__label">質問</div>
                      <p class="study-card__text">${escapeHtml(sides.front)}</p>
                      <div class="study-card__hint study-card__hint--indigo">
                        <svg style="width:1.25rem;height:1.25rem;display:inline-block;margin-right:var(--sp-2);vertical-align:middle" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"/></svg>
                        クリックまたはスペースキーで答えを表示
                      </div>
                    ` : `
                      <div class="study-card__label">答え</div>
                      <p class="study-card__text">${escapeHtml(sides.back)}</p>
                      <div class="study-card__hint study-card__hint--green">
                        <svg style="width:1.25rem;height:1.25rem;display:inline-block;margin-right:var(--sp-2);vertical-align:middle" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                        クリックまたはスペースキーで質問に戻る
                      </div>
                    `}
                  </div>
                ` : `
                  <div style="text-align:center;width:100%">
                    <p class="study-card__text">${escapeHtml(card.text)}</p>
                  </div>
                `}
              </div>
              <div class="study-card__badge">カード ${currentIndex + 1}</div>
            </div>
            ${audioUrl ? `
              <div style="margin-top:var(--sp-6);display:flex;justify-content:center">
                <button class="study-audio-btn" data-action="play-audio" aria-label="${isPlaying ? '音声を停止' : '音声を再生'}">
                  ${isPlaying ? `<span class="study-audio-btn__ping" aria-hidden="true"></span>` : ''}
                  ${isPlaying
                    ? `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>`
                    : `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>`
                  }
                </button>
              </div>
            ` : ''}
          ` : `
            <div style="text-align:center;color:white">
              <p style="font-size:var(--text-xl)">学習するカードがありません</p>
            </div>
          `}
        </div>
      </div>

      <div class="study-hints">
        <div class="study-hints__keyboard">
          <span>矢印キーで移動</span>
          <span style="margin:0 var(--sp-3)">·</span>
          <span>スペース / Enter でめくる</span>
          <span style="margin:0 var(--sp-3)">·</span>
          <span>Esc で終了</span>
        </div>
        <div class="study-hints__touch">
          左右スワイプで移動 · タップでめくる
        </div>
      </div>
    `;

    // Re-append stable audio element
    el.appendChild(audio);

    bindEvents();
  }

  function updateAudioBtn() {
    const btn = el.querySelector('[data-action="play-audio"]');
    if (!btn) return;
    btn.setAttribute('aria-label', isPlaying ? '音声を停止' : '音声を再生');
    btn.innerHTML = `
      ${isPlaying ? `<span class="study-audio-btn__ping" aria-hidden="true"></span>` : ''}
      ${isPlaying
        ? `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>`
      }
    `;
  }

  function bindEvents() {
    el.querySelector('[data-action="exit"]')?.addEventListener('click', onExit);
    el.querySelector('[data-action="flip"]')?.addEventListener('click', toggleFlip);
    el.querySelector('[data-action="flip"]')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') toggleFlip();
    });
    el.querySelector('[data-action="play-audio"]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      playAudio();
    });

    // Touch swipe
    const touchArea = el.querySelector('[data-toucharea]');
    if (touchArea) {
      touchArea.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].clientX;
      });
      touchArea.addEventListener('touchend', (e) => {
        e.preventDefault();
        const delta = e.changedTouches[0].clientX - touchStartX;
        const THRESHOLD = 50;
        if (delta > THRESHOLD) goToPrevious();
        else if (delta < -THRESHOLD) goToNext();
        else toggleFlip();
      });
    }
  }

  function toggleFlip() {
    showFront = !showFront;
    render();
  }

  function goToPrevious() {
    if (currentIndex > 0) {
      currentIndex--;
      showFront = true;
      render();
    }
  }

  function goToNext() {
    if (currentIndex < studyCards.length - 1) {
      currentIndex++;
      showFront = true;
      render();
    }
  }

  function handleKeydown(e) {
    switch (e.key) {
      case 'ArrowLeft':  e.preventDefault(); goToPrevious(); break;
      case 'ArrowRight': e.preventDefault(); goToNext(); break;
      case ' ':
      case 'Enter':      e.preventDefault(); toggleFlip(); break;
      case 'Escape':     e.preventDefault(); onExit(); break;
    }
  }

  window.addEventListener('keydown', handleKeydown);

  render();

  return {
    destroy() {
      window.removeEventListener('keydown', handleKeydown);
      audio.pause();
      audio.removeAttribute('src');
      for (const { imageUrl, audioUrl } of urlCache.values()) {
        if (imageUrl) URL.revokeObjectURL(imageUrl);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
      }
      urlCache.clear();
      resetViewport();
      el.remove();
    }
  };
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
