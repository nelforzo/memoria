/**
 * App — root component handling routing, header, notifications.
 */

import { initDatabase } from './lib/database/db.js';
import { logBrowserSupport } from './lib/utils/helpers.js';
import { collections } from './lib/stores/collections.js';
import { createCollectionList } from './lib/components/Collection/CollectionList.js';
import { createCollectionEditor } from './lib/components/Collection/CollectionEditor.js';
import { createCollectionDetail } from './lib/components/CollectionDetail.js';
import { createConfirmDialog } from './lib/components/ConfirmDialog.js';
import { createNotification } from './lib/components/Notification.js';
import { createSettings } from './lib/components/Settings.js';
import { debugLog } from './lib/utils/debugLog.js';

export function createApp(target) {
  let dbReady = false;
  let currentView = 'home';
  let selectedCollectionId = null;

  // View instances
  let collectionListInstance = null;
  let collectionDetailInstance = null;
  let settingsInstance = null;
  let unsub = null;

  // View container — cleared on navigation; shared overlays live outside it
  const viewContainer = document.createElement('div');
  target.appendChild(viewContainer);

  // Shared components — appended to target (outside viewContainer) so they
  // survive viewContainer.innerHTML = '' across navigations
  const notify = createNotification(target);
  const dialog = createConfirmDialog(target);
  const editor = createCollectionEditor(target);

  let deletingCollection = null;
  let debugPanelEl = null;

  async function init() {
    logBrowserSupport();
    dbReady = await initDatabase();
    if (dbReady) {
      await collections.load();
    }
    render();

    // Subscribe to collections store for reactive updates on home view
    unsub = collections.subscribe(() => {
      if (currentView === 'home' && collectionListInstance) {
        collectionListInstance.update(collections.get());
      }
    });
  }

  function render() {
    // Destroy previous view instances
    destroyViews();
    viewContainer.innerHTML = '';

    if (!dbReady) {
      renderDbError();
      return;
    }

    if (currentView === 'home') {
      renderHome();
    } else if (currentView === 'collection-detail') {
      collectionDetailInstance = createCollectionDetail(viewContainer, {
        collectionId: selectedCollectionId,
        onBack: navigateToHome
      });
    } else if (currentView === 'settings') {
      settingsInstance = createSettings(viewContainer, {
        onBack: navigateToHome
      });
    }
  }

  function renderDbError() {
    viewContainer.innerHTML = `
      <main class="page-bg">
        <div class="container" style="padding-top:var(--sp-8)">
          <div class="card" style="text-align:center;padding:var(--sp-8)">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:4rem;height:4rem;background:var(--red-100);border-radius:var(--radius-full);margin-bottom:var(--sp-4)">
              <svg style="width:2rem;height:2rem;color:var(--red-600)" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
            </div>
            <h2 style="font-size:var(--text-xl);font-weight:600;color:var(--gray-900);margin-bottom:var(--sp-2)">データベースエラー</h2>
            <p style="color:var(--gray-600);margin-bottom:var(--sp-4)">データベースの初期化に失敗しました。ページを更新するか、ブラウザの互換性を確認してください。</p>
            <button class="btn btn--primary" onclick="location.reload()">ページを再読み込み</button>
          </div>
        </div>
      </main>
    `;
  }

  function renderHome() {
    // Header
    const header = document.createElement('header');
    header.className = 'header';
    header.innerHTML = `
      <div class="header__inner">
        <div class="flex items-center justify-between">
          <div class="min-w-0">
            <h1 class="truncate" style="color:var(--gray-900)">メモリア</h1>
            <p style="font-size:var(--text-sm);color:var(--gray-600);cursor:pointer;user-select:none" data-action="debug" title="デバッグログを表示">😊</p>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <button class="btn btn--ghost" data-action="settings" aria-label="設定">
              <svg class="has-label" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <span class="btn__label-desktop">設定</span>
            </button>
            ${collections.get().length > 0 ? `
              <button class="btn btn--primary" data-action="create" style="box-shadow:var(--shadow-sm)">
                <svg class="has-label" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                <span class="btn__label-desktop">新しいコレクション</span>
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    viewContainer.appendChild(header);

    // Content
    const content = document.createElement('div');
    content.className = 'container';
    content.style.paddingTop = 'var(--sp-8)';
    content.style.paddingBottom = 'var(--sp-8)';
    viewContainer.appendChild(content);

    collectionListInstance = createCollectionList(content, {
      collections: collections.get(),
      onCreate: openCreateDialog,
      onEdit: openEditDialog,
      onDelete: openDeleteDialog,
      onClick: navigateToCollection
    });

    // Version badge
    const badge = document.createElement('div');
    badge.style.cssText = 'margin-top:var(--sp-8);text-align:center';
    badge.innerHTML = `<span class="badge badge--version" style="padding:var(--sp-1) var(--sp-3);font-size:var(--text-sm);font-weight:500;border-radius:var(--radius-full)">v1.3.0</span>`;
    content.appendChild(badge);

    // Bind header buttons
    header.querySelector('[data-action="settings"]')?.addEventListener('click', navigateToSettings);
    header.querySelector('[data-action="create"]')?.addEventListener('click', openCreateDialog);
    header.querySelector('[data-action="debug"]')?.addEventListener('click', openDebugPanel);
  }

  function destroyViews() {
    if (collectionListInstance) { collectionListInstance.destroy(); collectionListInstance = null; }
    if (collectionDetailInstance) { collectionDetailInstance.destroy(); collectionDetailInstance = null; }
    if (settingsInstance) { settingsInstance.destroy(); settingsInstance = null; }
  }

  // Navigation
  function navigateToCollection(collection) {
    selectedCollectionId = collection.id;
    currentView = 'collection-detail';
    render();
  }

  function navigateToHome() {
    selectedCollectionId = null;
    currentView = 'home';
    // Reload collections in case they changed
    collections.load().then(() => render());
  }

  function navigateToSettings() {
    currentView = 'settings';
    render();
  }

  // Collection CRUD
  function openCreateDialog() {
    editor.open({
      collection: null,
      onCreate: async (data) => {
        try {
          await collections.create(data);
          notify.show('コレクションを作成しました！');
          render();
        } catch { notify.show('コレクションの作成に失敗しました', 'error'); }
      }
    });
  }

  function openEditDialog(collection) {
    editor.open({
      collection,
      onUpdate: async (data) => {
        try {
          const { id, ...updates } = data;
          await collections.update(id, updates);
          notify.show('コレクションを更新しました！');
          render();
        } catch { notify.show('コレクションの更新に失敗しました', 'error'); }
      }
    });
  }

  function openDeleteDialog(collection) {
    deletingCollection = collection;
    dialog.open({
      title: 'コレクションを削除',
      message: `「${collection.name}」を削除しますか？このコレクションにある ${collection.cardCount || 0} 枚のカードも全て削除されます。この操作は元に戻せません。`,
      confirmLabel: '削除',
      cancelLabel: 'キャンセル',
      isDanger: true,
      onConfirm: async () => {
        if (!deletingCollection) return;
        try {
          await collections.delete(deletingCollection.id);
          notify.show('コレクションを削除しました！');
          deletingCollection = null;
          render();
        } catch { notify.show('コレクションの削除に失敗しました', 'error'); }
      },
      onCancel: () => { deletingCollection = null; }
    });
  }

  function openDebugPanel() {
    if (debugPanelEl) { debugPanelEl.remove(); debugPanelEl = null; return; }

    const panel = document.createElement('div');
    panel.className = 'debug-panel';
    panel.innerHTML = `
      <div class="debug-panel__inner">
        <div class="debug-panel__toolbar">
          <span class="debug-panel__title">デバッグログ</span>
          <div class="flex items-center gap-2">
            <button class="btn btn--ghost" style="font-size:var(--text-sm);padding:var(--sp-1) var(--sp-3)" data-action="clear">クリア</button>
            <button class="btn btn--primary" style="font-size:var(--text-sm);padding:var(--sp-1) var(--sp-3)" data-action="copy">コピー</button>
            <button class="btn btn--icon btn--ghost" style="padding:var(--sp-1)" data-action="close" aria-label="閉じる">
              <svg style="width:1.25rem;height:1.25rem" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
        <pre class="debug-panel__log" id="debug-log-pre"></pre>
        <div class="debug-panel__status" id="debug-copy-status"></div>
      </div>
    `;
    target.appendChild(panel);
    debugPanelEl = panel;

    function refreshLog() {
      const pre = panel.querySelector('#debug-log-pre');
      const entries = debugLog.getAll();
      pre.textContent = entries.length ? entries.join('\n') : '（まだログはありません）';
      pre.scrollTop = pre.scrollHeight;
    }
    refreshLog();

    panel.querySelector('[data-action="close"]').addEventListener('click', () => {
      panel.remove(); debugPanelEl = null;
    });
    panel.querySelector('[data-action="clear"]').addEventListener('click', () => {
      debugLog.clear(); refreshLog();
    });
    panel.querySelector('[data-action="copy"]').addEventListener('click', () => {
      const text = debugLog.getText() || '（ログなし）';
      navigator.clipboard.writeText(text).then(() => {
        const status = panel.querySelector('#debug-copy-status');
        status.textContent = 'コピーしました！';
        setTimeout(() => { status.textContent = ''; }, 2000);
      }).catch(() => {});
    });
  }

  init();

  return {
    destroy() {
      if (unsub) unsub();
      destroyViews();
      notify.destroy();
      dialog.destroy();
      editor.destroy();
    }
  };
}
