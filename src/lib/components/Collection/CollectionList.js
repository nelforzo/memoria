/**
 * CollectionList — grid of CollectionCards or empty state.
 */

import { createCollectionCard } from './CollectionCard.js';

export function createCollectionList(container, { collections, onEdit, onDelete, onCreate, onClick }) {
  const el = document.createElement('div');
  container.appendChild(el);
  let cardInstances = [];

  function render() {
    destroyCards();
    el.innerHTML = '';

    if (collections.length > 0) {
      const grid = document.createElement('div');
      grid.className = 'collections-grid';
      el.appendChild(grid);

      cardInstances = collections.map(col =>
        createCollectionCard(grid, { collection: col, onEdit, onDelete, onClick })
      );
    } else {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon empty-state__icon--indigo">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
          </div>
          <h3 class="empty-state__title">コレクションがありません</h3>
          <p class="empty-state__desc">最初のコレクションを作成して、フラッシュカードを整理しましょう。</p>
          ${onCreate ? `
            <button class="btn btn--primary" data-action="create" style="padding:var(--sp-3) var(--sp-6)">
              <svg class="has-label" style="margin-right:var(--sp-2)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              最初のコレクションを作成
            </button>
          ` : ''}
        </div>
      `;
      el.querySelector('[data-action="create"]')?.addEventListener('click', onCreate);
    }
  }

  function destroyCards() {
    cardInstances.forEach(c => c.destroy());
    cardInstances = [];
  }

  render();

  return {
    destroy() { destroyCards(); el.remove(); },
    update(newCollections) {
      collections = newCollections;
      render();
    }
  };
}
