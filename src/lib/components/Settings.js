/**
 * Settings — export/import UI.
 */

import { exportAllCollections, importCollections, validateImportFile } from '../utils/exportImport.js';
import { collections } from '../stores/collections.js';
import { createNotification } from './Notification.js';

export function createSettings(container, { onBack }) {
  const el = document.createElement('div');
  el.className = 'page-bg';
  container.appendChild(el);

  let importStrategy = 'merge';
  let isImporting = false;
  let isExporting = false;
  let fileInput = null;
  let unsub = null;

  const notify = createNotification(el);

  function render() {
    const collectionList = collections.get();

    el.innerHTML = '';

    // Header
    el.insertAdjacentHTML('beforeend', `
      <header class="header">
        <div class="header__inner">
          <div class="flex items-center gap-4">
            <button class="btn btn--icon btn--ghost" data-action="back" aria-label="ホームに戻る" style="padding:var(--sp-2)">
              <svg style="width:1.5rem;height:1.5rem" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            </button>
            <div>
              <h1 style="color:var(--gray-900)">設定</h1>
              <p style="font-size:var(--text-sm);color:var(--gray-600)">データと設定を管理</p>
            </div>
          </div>
        </div>
      </header>
    `);

    // Content
    const content = document.createElement('div');
    content.className = 'container-sm';
    content.style.paddingTop = 'var(--sp-8)';
    content.style.paddingBottom = 'var(--sp-8)';

    // Export section
    content.insertAdjacentHTML('beforeend', `
      <div class="settings-section">
        <h2 class="settings-section__title">データのエクスポート</h2>
        <p class="settings-section__desc">全てのコレクション、カード、メディアをJSONファイルとしてダウンロードします。バックアップや他のデバイスへのデータ転送に使用できます。</p>
        <button class="btn btn--primary btn--disabled-gray" data-action="export" ${isExporting || collectionList.length === 0 ? 'disabled' : ''} style="padding:var(--sp-3) var(--sp-6)">
          ${isExporting
            ? `<svg class="spinner" style="margin-right:var(--sp-2)" fill="none" viewBox="0 0 24 24"><circle style="opacity:0.25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path style="opacity:0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>エクスポート中...`
            : `<svg style="margin-right:var(--sp-2)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>全コレクションをエクスポート`}
        </button>
        ${collectionList.length === 0 ? `<p style="font-size:var(--text-sm);color:var(--gray-500);margin-top:var(--sp-2)">エクスポートするコレクションがありません</p>` : ''}
      </div>
    `);

    // Import section
    content.insertAdjacentHTML('beforeend', `
      <div class="settings-section">
        <h2 class="settings-section__title">データのインポート</h2>
        <p class="settings-section__desc">以前にエクスポートしたJSONファイルからコレクションをインポートします。既存のコレクションの処理方法を選択してください。</p>
        <div style="margin-bottom:var(--sp-4)">
          <label class="form-label">インポート方法</label>
          <div class="radio-group">
            <label class="radio-label">
              <input type="radio" name="import-strategy" value="merge" ${importStrategy === 'merge' ? 'checked' : ''} />
              <span><span style="font-weight:500;color:var(--gray-900)">マージ</span> <span style="color:var(--gray-600)"> - 既存のコレクションをスキップ</span></span>
            </label>
            <label class="radio-label">
              <input type="radio" name="import-strategy" value="replace" ${importStrategy === 'replace' ? 'checked' : ''} />
              <span><span style="font-weight:500;color:var(--gray-900)">上書き</span> <span style="color:var(--gray-600)"> - 同じIDのコレクションを上書き</span></span>
            </label>
          </div>
        </div>
        <button class="btn btn--green btn--disabled-gray" data-action="import" ${isImporting ? 'disabled' : ''} style="padding:var(--sp-3) var(--sp-6)">
          ${isImporting
            ? `<svg class="spinner" style="margin-right:var(--sp-2)" fill="none" viewBox="0 0 24 24"><circle style="opacity:0.25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path style="opacity:0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>インポート中...`
            : `<svg style="margin-right:var(--sp-2)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>ファイルからインポート`}
        </button>
        <div class="warning-panel">
          <p><strong>警告：</strong>「上書き」を選択すると、同じIDの既存コレクションが上書きされます。事前に現在のデータをエクスポートしてください！</p>
        </div>
      </div>
    `);

    // App info
    content.insertAdjacentHTML('beforeend', `
      <div class="app-info">
        <p>メモリア v1.2.0</p>
        <p style="margin-top:var(--sp-1)">すべてのデータはお使いのデバイスにローカル保存されます</p>
      </div>
    `);

    el.appendChild(content);

    // Hidden file input
    fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,application/json';
    fileInput.className = 'hidden';
    fileInput.addEventListener('change', handleImportFile);
    el.appendChild(fileInput);

    // Re-append notification container
    el.appendChild(notify._el || document.createComment(''));

    bindEvents();
  }

  function bindEvents() {
    el.querySelector('[data-action="back"]')?.addEventListener('click', onBack);
    el.querySelector('[data-action="export"]')?.addEventListener('click', handleExportAll);
    el.querySelector('[data-action="import"]')?.addEventListener('click', () => { if (fileInput) fileInput.click(); });

    el.querySelectorAll('input[name="import-strategy"]').forEach(radio => {
      radio.addEventListener('change', (e) => { importStrategy = e.target.value; });
    });
  }

  async function handleExportAll() {
    const collectionList = collections.get();
    if (collectionList.length === 0) {
      notify.show('エクスポートするコレクションがありません', 'error');
      return;
    }
    isExporting = true;
    render();
    try {
      await exportAllCollections();
      notify.show(`${collectionList.length} 件のコレクションをエクスポートしました！`);
    } catch {
      notify.show('コレクションのエクスポートに失敗しました', 'error');
    } finally {
      isExporting = false;
      render();
    }
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = await validateImportFile(file);
    if (!validation.valid) {
      notify.show(`無効なファイル：${validation.error}`, 'error');
      if (fileInput) fileInput.value = '';
      return;
    }

    isImporting = true;
    render();

    try {
      const result = await importCollections(file, importStrategy);
      await collections.load();

      const messages = [];
      if (result.imported > 0) messages.push(`${result.imported} imported`);
      if (result.updated > 0) messages.push(`${result.updated} updated`);
      if (result.skipped > 0) messages.push(`${result.skipped} skipped`);

      notify.show(`インポート成功：${messages.join(', ')}`);
    } catch (err) {
      notify.show(`インポートに失敗しました：${err.message}`, 'error');
    } finally {
      isImporting = false;
      if (fileInput) fileInput.value = '';
      render();
    }
  }

  render();

  return {
    destroy() {
      if (unsub) unsub();
      notify.destroy();
      el.remove();
    }
  };
}
