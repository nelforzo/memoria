/**
 * CardListItem — single card preview with menu and badges.
 */

import { formatRelativeTime, truncateText } from '../../utils/helpers.js';
import { blobToDataURL } from '../../utils/imageCompression.js';
import { debugLog } from '../../utils/debugLog.js';

export function createCardListItem(container, { card, onEdit, onDelete }) {
  let menuOpen = false;
  const el = document.createElement('div');
  container.appendChild(el);

  // Thumbnail — stored as a data URL (base64) to avoid Safari's blob URL
  // lifetime issues with IndexedDB-sourced Blobs.
  let thumbnailUrl = null;
  let thumbnailBlobRef = null; // track which blob the data URL was built from

  async function syncThumbnail() {
    if (!(card.imageBlob instanceof Blob) || card.imageBlob.size === 0) {
      thumbnailUrl = null;
      thumbnailBlobRef = null;
      return;
    }
    // Skip if we already have a data URL for this exact Blob instance
    if (card.imageBlob === thumbnailBlobRef && thumbnailUrl) return;
    try {
      thumbnailUrl = await blobToDataURL(card.imageBlob);
      thumbnailBlobRef = card.imageBlob;
      debugLog.add(`[IMG] created data URL thumbnail for card ${card.id} (${card.imageBlob.size}B ${card.imageBlob.type})`);
    } catch (e) {
      thumbnailUrl = null;
      thumbnailBlobRef = null;
      debugLog.add(`[IMG] blobToDataURL failed for card ${card.id}: ${e}`);
    }
  }

  // Initialise asynchronously then render
  syncThumbnail().then(() => render());

  function getPreview(text) {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length === 0) return '空のカード';
    return truncateText(lines.slice(0, 2).join('\n'), 150);
  }

  function render() {
    const hasMultipleLines = card.text.split('\n').filter(l => l.trim()).length > 1;
    const preview = getPreview(card.text);

    const thumbHtml = thumbnailUrl
      ? `<img class="card-item__thumb" src="${thumbnailUrl}" alt="カードのサムネイル" />`
      : `<div class="card-item__icon"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/></svg></div>`;

    const multilineHtml = hasMultipleLines
      ? `<span class="card-item__multiline"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>複数行</span>`
      : '';

    let badges = '';
    if (card.imageBlob) badges += `<span class="badge badge--green"><svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/></svg>写真</span>`;
    if (card.audioBlob) badges += `<span class="badge badge--purple"><svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clip-rule="evenodd"/></svg>音声</span>`;

    let metaLeft = '';
    if (card.reviewCount > 0) {
      metaLeft += `<span class="flex items-center"><svg fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg>復習 ${card.reviewCount}回</span>`;
    }
    metaLeft += `<span>作成：${formatRelativeTime(card.createdAt)}</span>`;

    el.innerHTML = `
      <div class="card card--bordered group-hover">
        <div style="position:absolute;top:var(--sp-3);right:var(--sp-3)" class="menu-container">
          <button class="menu-btn" data-action="toggle-menu" aria-label="カードの操作">
            <svg fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/></svg>
          </button>
          ${menuOpen ? `
            <div class="dropdown">
              <button class="dropdown__item" data-action="edit">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                編集
              </button>
              <button class="dropdown__item dropdown__item--danger" data-action="delete">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                削除
              </button>
            </div>
          ` : ''}
        </div>
        <div class="card-item__content">
          <div class="flex items-start" style="margin-bottom:var(--sp-2)">
            ${thumbHtml}
            <div class="flex-1 min-w-0">
              <p class="card-item__text">${escapeHtml(preview)}</p>
              ${multilineHtml}
            </div>
          </div>
          ${badges ? `<div class="flex items-center gap-2" style="margin-top:var(--sp-3)">${badges}</div>` : ''}
          <div class="meta-row">
            <div class="meta-row__info">${metaLeft}</div>
          </div>
        </div>
      </div>
    `;
    const thumbImg = el.querySelector('.card-item__thumb');
    if (thumbImg) {
      thumbImg.addEventListener('load',  () => debugLog.add(`[IMG] thumbnail loaded card ${card.id}`));
      thumbImg.addEventListener('error', () => debugLog.add(`[IMG] thumbnail error card ${card.id} src=${thumbImg.src}`));
    }
    bindEvents();
  }

  function bindEvents() {
    el.querySelector('[data-action="toggle-menu"]').addEventListener('click', (e) => {
      e.stopPropagation();
      menuOpen = !menuOpen;
      render();
    });
    if (menuOpen) {
      el.querySelector('[data-action="edit"]')?.addEventListener('click', () => {
        menuOpen = false;
        if (onEdit) onEdit(card);
        render();
      });
      el.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
        menuOpen = false;
        if (onDelete) onDelete(card);
        render();
      });
    }
  }

  function handleOutsideClick(e) {
    if (menuOpen && !e.target.closest('.menu-container')) {
      menuOpen = false;
      render();
    }
  }
  window.addEventListener('click', handleOutsideClick);

  // Note: render() is called by the async syncThumbnail().then(render) above.
  // Render an initial skeleton immediately so the element appears in the list,
  // then the async init above will re-render once the thumbnail is ready.
  render();

  return {
    destroy() {
      window.removeEventListener('click', handleOutsideClick);
      // Data URLs don't need revocation
      debugLog.add(`[IMG] destroy card ${card.id} (data URL — no revoke needed)`);
      el.remove();
    },
    update(newCard) {
      card = newCard;
      syncThumbnail().then(() => render());
    }
  };
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
