/**
 * CollectionDetail — header, stats, card list, study mode launcher.
 */

import { cards } from '../stores/cards.js';
import { collections } from '../stores/collections.js';
import { createCardList } from './Card/CardList.js';
import { createCardEditor } from './Card/CardEditor.js';
import { createConfirmDialog } from './ConfirmDialog.js';
import { createNotification } from './Notification.js';
import { createStudyMode } from './Study/StudyMode.js';
import { formatRelativeTime } from '../utils/helpers.js';
import { exportCollection } from '../utils/exportImport.js';
import { resetViewport } from '../utils/viewportReset.js';

export function createCollectionDetail(container, { collectionId, onBack }) {
  const el = document.createElement('div');
  el.className = 'page-bg';
  container.appendChild(el);

  let collection = null;
  let loading = true;
  let isExporting = false;
  let cardList = null;
  let unsub = null;
  let studyModeInstance = null;

  const notify = createNotification(el);
  const dialog = createConfirmDialog(el);
  const cardEditor = createCardEditor(el);

  let editingCard = null;
  let deletingCard = null;

  async function loadData() {
    loading = true;
    render();
    try {
      collection = await collections.getById(collectionId);
      if (!collection) { onBack(); return; }
      await cards.load(collectionId);
    } catch {
      notify.show('コレクションの読み込みに失敗しました', 'error');
    } finally {
      loading = false;
      render();
    }
  }

  function render() {
    // Destroy previous card list
    if (cardList) { cardList.destroy(); cardList = null; }

    const currentCards = cards.get();

    const showActions = !loading && currentCards.length > 0;

    el.querySelector('.cd-header-mount')?.remove();
    el.querySelector('.cd-content-mount')?.remove();

    // Header
    const headerWrap = document.createElement('div');
    headerWrap.className = 'cd-header-mount';
    headerWrap.innerHTML = `
      <header class="header">
        <div class="header__inner">
          <div class="flex flex-col gap-3">
            <div class="flex items-center gap-4">
              <button class="btn btn--icon-lg btn--ghost" data-action="back" aria-label="コレクション一覧に戻る">
                <svg style="width:1.5rem;height:1.5rem" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              </button>
              ${collection ? `
                <div class="min-w-0">
                  <h1 class="truncate" style="color:var(--gray-900)">${escapeHtml(collection.name)}</h1>
                  ${collection.description ? `<p class="line-clamp-1" style="font-size:var(--text-sm);color:var(--gray-600);margin-top:var(--sp-1)">${escapeHtml(collection.description)}</p>` : ''}
                </div>
              ` : ''}
            </div>
            ${showActions ? `
              <div class="flex flex-wrap gap-2">
                <button class="btn btn--ghost" data-action="export" ${isExporting ? 'disabled' : ''} aria-label="コレクションをエクスポート">
                  ${isExporting
                    ? `<svg class="spinner has-label" fill="none" viewBox="0 0 24 24"><circle style="opacity:0.25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path style="opacity:0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>`
                    : `<svg class="has-label" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>`
                  }
                  <span class="btn__label-desktop">エクスポート</span>
                </button>
                <button class="btn btn--green" data-action="study" aria-label="学習する" style="box-shadow:var(--shadow-sm)">
                  <svg class="has-label" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                  <span class="btn__label-desktop">学習</span>
                </button>
                <button class="btn btn--primary" data-action="add-card" aria-label="カードを追加" style="box-shadow:var(--shadow-sm)">
                  <svg class="has-label" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                  <span class="btn__label-desktop">カードを追加</span>
                </button>
              </div>
            ` : ''}
          </div>
          ${collection ? `
            <div class="stats-bar">
              <div class="stats-bar__item">
                <svg style="color:var(--indigo-600)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/></svg>
                <span style="font-weight:500">${currentCards.length}</span>
                <span style="margin-left:var(--sp-1)">枚</span>
              </div>
              <div class="stats-bar__item">
                <svg style="color:var(--gray-400)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span>更新：${formatRelativeTime(collection.updatedAt)}</span>
              </div>
            </div>
          ` : ''}
        </div>
      </header>
    `;
    el.prepend(headerWrap);

    // Content
    const contentWrap = document.createElement('div');
    contentWrap.className = 'cd-content-mount container';
    contentWrap.style.paddingTop = 'var(--sp-8)';
    contentWrap.style.paddingBottom = 'var(--sp-8)';
    el.appendChild(contentWrap);

    if (loading) {
      contentWrap.innerHTML = `
        <div class="loading-center">
          <svg class="spinner" style="width:2rem;height:2rem;color:var(--indigo-600)" fill="none" viewBox="0 0 24 24"><circle style="opacity:0.25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path style="opacity:0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
        </div>
      `;
    } else {
      cardList = createCardList(contentWrap, {
        cards: currentCards,
        onCreate: openCreateDialog,
        onEdit: openEditDialog,
        onDelete: openDeleteDialog
      });
    }

    bindHeaderEvents();
  }

  function bindHeaderEvents() {
    el.querySelector('[data-action="back"]')?.addEventListener('click', onBack);
    el.querySelector('[data-action="export"]')?.addEventListener('click', handleExport);
    el.querySelector('[data-action="study"]')?.addEventListener('click', openStudyMode);
    el.querySelector('[data-action="add-card"]')?.addEventListener('click', openCreateDialog);
  }

  function openCreateDialog() {
    editingCard = null;
    cardEditor.open({
      card: null,
      onCreate: async (data) => {
        try {
          await cards.create(collectionId, data);
          notify.show('カードを追加しました！');
          render();
        } catch { notify.show('カードの追加に失敗しました', 'error'); }
      }
    });
  }

  function openEditDialog(card) {
    editingCard = card;
    cardEditor.open({
      card,
      onUpdate: async (data) => {
        try {
          const { id, ...updates } = data;
          await cards.update(id, updates);
          notify.show('カードを更新しました！');
          render();
        } catch { notify.show('カードの更新に失敗しました', 'error'); }
      }
    });
  }

  function openDeleteDialog(card) {
    deletingCard = card;
    dialog.open({
      title: 'カードを削除',
      message: 'このカードを削除しますか？この操作は元に戻せません。',
      confirmLabel: '削除',
      cancelLabel: 'キャンセル',
      isDanger: true,
      onConfirm: async () => {
        if (!deletingCard) return;
        try {
          await cards.delete(deletingCard.id, collectionId);
          notify.show('カードを削除しました！');
          deletingCard = null;
          render();
        } catch { notify.show('カードの削除に失敗しました', 'error'); }
      },
      onCancel: () => { deletingCard = null; }
    });
  }

  function openStudyMode() {
    const currentCards = cards.get();
    if (currentCards.length === 0) {
      notify.show('学習を開始する前に、まずカードを追加してください！', 'error');
      return;
    }
    studyModeInstance = createStudyMode(document.body, {
      collectionId,
      collectionName: collection?.name || '',
      onExit: closeStudyMode
    });
  }

  async function closeStudyMode() {
    await resetViewport();
    if (studyModeInstance) { studyModeInstance.destroy(); studyModeInstance = null; }
    // Destroy cardList before loading so the store subscriber doesn't fire an
    // intermediate update (creating blob URLs that are immediately revoked).
    if (cardList) { cardList.destroy(); cardList = null; }
    await cards.load(collectionId);
    render();
  }

  async function handleExport() {
    const currentCards = cards.get();
    if (currentCards.length === 0) {
      notify.show('エクスポートするカードがありません', 'error');
      return;
    }
    isExporting = true;
    render();
    try {
      await exportCollection(collectionId);
      notify.show('コレクションをエクスポートしました！');
    } catch {
      notify.show('コレクションのエクスポートに失敗しました', 'error');
    } finally {
      isExporting = false;
      render();
    }
  }

  // Subscribe to cards store for reactive updates.
  // Skip updates while study mode is open — the card list is hidden and the
  // churn of creating/revoking blob URLs causes Safari blob URL failures.
  unsub = cards.subscribe(() => {
    if (!loading && cardList && !studyModeInstance) {
      cardList.update(cards.get());
    }
  });

  loadData();

  return {
    destroy() {
      if (unsub) unsub();
      if (cardList) cardList.destroy();
      if (studyModeInstance) studyModeInstance.destroy();
      notify.destroy();
      dialog.destroy();
      cardEditor.destroy();
      el.remove();
    }
  };
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
