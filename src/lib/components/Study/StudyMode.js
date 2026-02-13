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
import { debugLog } from '../../utils/debugLog.js';

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
  let audioUnsupported = false;

  // Blob URL cache
  const urlCache = new Map();

  // Stable audio element — created once, never destroyed until unmount
  const audio = document.createElement('audio');
  audio.addEventListener('play',    () => { isPlaying = true;  updateAudioBtn(); debugLog.add('[AUDIO] play'); });
  audio.addEventListener('pause',   () => { isPlaying = false; updateAudioBtn(); debugLog.add('[AUDIO] pause'); });
  audio.addEventListener('ended',   () => { isPlaying = false; updateAudioBtn(); debugLog.add('[AUDIO] ended'); });
  audio.addEventListener('error',   () => {
    debugLog.add(`[AUDIO] error code=${audio.error?.code} msg=${audio.error?.message ?? '—'} src=${audio.src}`);
    if (audio.error?.code === 4) { audioUnsupported = true; updateAudioBtn(); }
  });
  audio.addEventListener('stalled', () => { debugLog.add(`[AUDIO] stalled src=${audio.src}`); });
  audio.addEventListener('waiting', () => { debugLog.add(`[AUDIO] waiting src=${audio.src}`); });
  audio.addEventListener('canplay', () => { debugLog.add('[AUDIO] canplay'); });

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
        if (card.imageBlob instanceof Blob && card.imageBlob.size > 0) {
          imageUrl = URL.createObjectURL(card.imageBlob);
          debugLog.add(`[IMG] created URL for card ${card.id} (${card.imageBlob.size}B ${card.imageBlob.type})`);
        } else {
          debugLog.add(`[IMG] no imageBlob for card ${card.id} (blob=${card.imageBlob}, type=${card.imageBlob?.constructor?.name})`);
        }
      } catch (e) { console.warn('Failed to create image URL', e); debugLog.add(`[IMG] createObjectURL failed: ${e}`); }
      try {
        if (card.audioBlob instanceof Blob && card.audioBlob.size > 0) {
          audioUrl = URL.createObjectURL(card.audioBlob);
          debugLog.add(`[AUDIO] created URL for card ${card.id} (${card.audioBlob.size}B ${card.audioBlob.type})`);
        } else {
          debugLog.add(`[AUDIO] no audioBlob for card ${card.id} (blob=${card.audioBlob}, type=${card.audioBlob?.constructor?.name})`);
        }
      } catch (e) { console.warn('Failed to create audio URL', e); debugLog.add(`[AUDIO] createObjectURL failed: ${e}`); }
      urlCache.set(card.id, { imageUrl, audioUrl });
    }
    return urlCache.get(card.id);
  }

  function loadAudio(url) {
    audio.pause();
    isPlaying = false;
    audioUnsupported = false;
    if (url) {
      debugLog.add(`[AUDIO] loadAudio src=${url}`);
      audio.src = url;
      audio.load();
    } else {
      debugLog.add('[AUDIO] loadAudio skipped (no url)');
    }
  }

  function playAudio() {
    const { audioUrl } = ensureUrls(currentCard());
    if (!audio || !audioUrl) { debugLog.add('[AUDIO] playAudio: no audio or no URL'); return; }
    debugLog.add(`[AUDIO] playAudio called src=${audio.src} readyState=${audio.readyState}`);
    audio.currentTime = 0;
    audio.play().catch(e => { debugLog.add(`[AUDIO] play() rejected: ${e}`); });
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
                ${audioButtonHtml()}
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

    // Log image load/error
    const imgEl = el.querySelector('.study-card__image');
    if (imgEl) {
      imgEl.addEventListener('load',  () => debugLog.add(`[IMG] loaded in StudyMode src=${imgEl.src}`));
      imgEl.addEventListener('error', () => debugLog.add(`[IMG] error in StudyMode src=${imgEl.src}`));
    }

    bindEvents();
  }

  function audioButtonHtml() {
    if (audioUnsupported) {
      return `<button class="study-audio-btn study-audio-btn--unsupported" data-action="play-audio" aria-label="このブラウザでは再生できません" title="このオーディオ形式はお使いのブラウザでサポートされていません">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.63 3.63a.996.996 0 000 1.41L7.29 8.7 7 9H4a1 1 0 00-1 1v4a1 1 0 001 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71v-4.17l4.18 4.18c-.49.37-1.02.68-1.6.91a.998.998 0 00.67 1.87c.87-.31 1.66-.77 2.36-1.34l1.58 1.58a.996.996 0 101.41-1.41L5.05 3.63c-.39-.39-1.02-.39-1.42 0zM19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53c.56-1.17.88-2.48.88-3.87 0-3.83-2.4-7.11-5.78-8.4a.99.99 0 00-1.33.94v.21c0 .46.31.86.75 1.02C16.69 6.54 19 9.06 19 12zm-8.71-6.29l-.17.17L12 7.76V6.41c0-.89-1.08-1.33-1.71-.7zM16.5 12A4.5 4.5 0 0014 7.97v1.79l2.48 2.48c.01-.08.02-.16.02-.24z"/></svg>
      </button>`;
    }
    return `<button class="study-audio-btn" data-action="play-audio" aria-label="${isPlaying ? '音声を停止' : '音声を再生'}">
      ${isPlaying ? `<span class="study-audio-btn__ping" aria-hidden="true"></span>` : ''}
      ${isPlaying
        ? `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>`
      }
    </button>`;
  }

  function updateAudioBtn() {
    const wrap = el.querySelector('[data-action="play-audio"]')?.parentElement;
    if (!wrap) return;
    wrap.innerHTML = audioButtonHtml();
    wrap.querySelector('[data-action="play-audio"]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!audioUnsupported) playAudio();
    });
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
      for (const [cardId, { imageUrl, audioUrl }] of urlCache.entries()) {
        if (imageUrl) { URL.revokeObjectURL(imageUrl); debugLog.add(`[IMG] revoked URL for card ${cardId}`); }
        if (audioUrl) { URL.revokeObjectURL(audioUrl); debugLog.add(`[AUDIO] revoked URL for card ${cardId}`); }
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
