/**
 * CollectionCard — single collection card with menu.
 */

import { formatRelativeTime } from '../../utils/helpers.js';

export function createCollectionCard(container, { collection, onEdit, onDelete, onClick }) {
  let menuOpen = false;
  const el = document.createElement('div');
  container.appendChild(el);

  function render() {
    const desc = collection.description
      ? `<p class="collection-card__desc line-clamp-2">${escapeHtml(collection.description)}</p>`
      : `<p class="collection-card__desc collection-card__desc--empty">説明なし</p>`;

    el.innerHTML = `
      <div class="card card--hover" data-action="click-card" tabindex="0" role="button">
        <div style="position:absolute;top:var(--sp-4);right:var(--sp-4)" class="menu-container">
          <button class="menu-btn" data-action="toggle-menu" aria-label="コレクションの操作">
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
        <div style="padding-right:var(--sp-8)">
          <h3 style="font-size:var(--text-xl);font-weight:600;color:var(--gray-900);margin-bottom:var(--sp-2)">${escapeHtml(collection.name)}</h3>
          ${desc}
          <div class="collection-card__footer">
            <div class="collection-card__count">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
              <span style="font-weight:500">${collection.cardCount || 0}</span>
              <span style="margin-left:var(--sp-1)">枚</span>
            </div>
            <div class="collection-card__date">更新：${formatRelativeTime(collection.updatedAt)}</div>
          </div>
        </div>
      </div>
    `;
    bind();
  }

  function bind() {
    el.querySelector('[data-action="click-card"]').addEventListener('click', (e) => {
      if (e.target.closest('.menu-container')) return;
      if (onClick) onClick(collection);
    });
    el.querySelector('[data-action="click-card"]').addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('.menu-container')) {
        if (onClick) onClick(collection);
      }
    });
    el.querySelector('[data-action="toggle-menu"]').addEventListener('click', (e) => {
      e.stopPropagation();
      menuOpen = !menuOpen;
      render();
    });
    if (menuOpen) {
      el.querySelector('[data-action="edit"]')?.addEventListener('click', () => {
        menuOpen = false;
        if (onEdit) onEdit(collection);
        render();
      });
      el.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
        menuOpen = false;
        if (onDelete) onDelete(collection);
        render();
      });
    }
  }

  // Close menu on outside click
  function handleOutsideClick(e) {
    if (menuOpen && !e.target.closest('.menu-container')) {
      menuOpen = false;
      render();
    }
  }
  window.addEventListener('click', handleOutsideClick);

  render();

  return {
    destroy() {
      window.removeEventListener('click', handleOutsideClick);
      el.remove();
    },
    update(col) {
      collection = col;
      render();
    }
  };
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
