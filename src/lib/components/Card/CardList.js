/**
 * CardList — vertical list of CardListItems or empty state.
 */

import { createCardListItem } from './CardListItem.js';

export function createCardList(container, { cards, onEdit, onDelete, onCreate }) {
  const el = document.createElement('div');
  container.appendChild(el);
  let itemInstances = [];

  function render() {
    destroyItems();
    el.innerHTML = '';

    if (cards.length > 0) {
      const list = document.createElement('div');
      list.className = 'card-list';
      el.appendChild(list);

      itemInstances = cards.map(card =>
        createCardListItem(list, { card, onEdit, onDelete })
      );
    } else {
      el.innerHTML = `
        <div class="empty-state" style="background:white;border-radius:var(--radius-lg);border:2px dashed var(--gray-300)">
          <div class="empty-state__icon empty-state__icon--gray">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color:var(--gray-400)"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/></svg>
          </div>
          <h3 class="empty-state__title">カードがありません</h3>
          <p class="empty-state__desc">最初のフラッシュカードを追加して、コレクションを作りましょう。</p>
          ${onCreate ? `
            <button class="btn btn--primary" data-action="create" style="padding:var(--sp-3) var(--sp-6);box-shadow:var(--shadow-sm)">
              <svg class="has-label" style="margin-right:var(--sp-2)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              最初のカードを追加
            </button>
          ` : ''}
        </div>
      `;
      el.querySelector('[data-action="create"]')?.addEventListener('click', onCreate);
    }
  }

  function destroyItems() {
    itemInstances.forEach(i => i.destroy());
    itemInstances = [];
  }

  render();

  return {
    destroy() { destroyItems(); el.remove(); },
    update(newCards) {
      cards = newCards;
      render();
    }
  };
}
