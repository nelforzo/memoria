/**
 * ImageCapture — photo upload/preview component.
 */

import { compressImage, isValidImage, blobToDataURL } from '../../utils/imageCompression.js';

export function createImageCapture(container, { imageBlob = null, disabled = false, onChange }) {
  const el = document.createElement('div');
  container.appendChild(el);

  let isCompressing = false;
  let previewUrl = null;
  let error = null;
  let fileInput = null;

  async function updatePreview() {
    if (imageBlob) {
      try { previewUrl = await blobToDataURL(imageBlob); } catch { previewUrl = null; }
    } else {
      previewUrl = null;
    }
  }

  async function render() {
    await updatePreview();

    el.innerHTML = `<div style="display:flex;flex-direction:column;gap:var(--sp-3)"></div>`;
    const wrap = el.firstElementChild;

    // Hidden file input
    fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/jpeg,image/png,image/gif,image/webp';
    fileInput.setAttribute('capture', 'environment');
    fileInput.className = 'hidden';
    fileInput.disabled = disabled;
    wrap.appendChild(fileInput);

    if (previewUrl) {
      // Preview
      wrap.insertAdjacentHTML('beforeend', `
        <div class="image-preview">
          <img src="${previewUrl}" alt="選択済み" />
          <button type="button" class="image-preview__remove" data-action="remove" ${disabled || isCompressing ? 'disabled' : ''} title="写真を削除">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
          ${isCompressing ? `
            <div class="image-preview__overlay">
              <div style="color:white;text-align:center">
                <svg class="spinner" style="width:2rem;height:2rem;margin:0 auto var(--sp-2)" fill="none" viewBox="0 0 24 24"><circle style="opacity:0.25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path style="opacity:0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                <p style="font-size:var(--text-sm)">圧縮中...</p>
              </div>
            </div>
          ` : ''}
        </div>
      `);
    } else {
      // Upload button
      wrap.insertAdjacentHTML('beforeend', `
        <button type="button" class="upload-area" data-action="upload" ${disabled || isCompressing ? 'disabled' : ''}>
          ${isCompressing ? `
            <svg class="spinner" style="width:2rem;height:2rem;color:var(--indigo-600);margin-bottom:var(--sp-2)" fill="none" viewBox="0 0 24 24"><circle style="opacity:0.25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path style="opacity:0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
            <p style="font-size:var(--text-sm);color:var(--gray-600)">画像を圧縮中...</p>
          ` : `
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <p style="font-size:var(--text-sm);font-weight:500;color:var(--gray-700);margin-bottom:var(--sp-1)">写真を追加</p>
            <p style="font-size:var(--text-xs);color:var(--gray-500)">クリックしてアップロードまたは撮影</p>
            <p style="font-size:var(--text-xs);color:var(--gray-400);margin-top:var(--sp-1)">JPEG、PNG、GIF、またはWebP（最大10MB）</p>
          `}
        </button>
      `);
    }

    if (error) {
      wrap.insertAdjacentHTML('beforeend', `
        <div class="error-box">
          <svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
          <span>${escapeHtml(error)}</span>
        </div>
      `);
    }

    bindEvents();
  }

  function bindEvents() {
    fileInput.addEventListener('change', handleFileSelect);
    el.querySelector('[data-action="upload"]')?.addEventListener('click', () => {
      if (fileInput && !disabled) fileInput.click();
    });
    el.querySelector('[data-action="remove"]')?.addEventListener('click', () => {
      imageBlob = null;
      error = null;
      if (onChange) onChange(null);
      render();
    });
  }

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
    if (fileInput) fileInput.value = '';
  }

  async function processFile(file) {
    error = null;

    if (!isValidImage(file)) {
      error = '有効な画像ファイル（JPEG、PNG、GIF、またはWebP）を選択してください';
      render();
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      error = '画像のサイズが大きすぎます（最大10MB）';
      render();
      return;
    }

    isCompressing = true;
    render();

    try {
      const compressed = await compressImage(file);
      imageBlob = compressed;
      if (onChange) onChange(compressed);
    } catch {
      error = '画像の圧縮に失敗しました。別の画像をお試しください。';
    } finally {
      isCompressing = false;
      render();
    }
  }

  render();

  return {
    destroy() { el.remove(); },
    setBlob(blob) { imageBlob = blob; render(); }
  };
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
