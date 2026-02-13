/**
 * CardEditor — create/edit modal for cards with media support.
 */

import { createImageCapture } from '../Media/ImageCapture.js';
import { createAudioRecorderUI } from '../Media/AudioRecorder.js';

export function createCardEditor(parent) {
  const el = document.createElement('div');
  parent.appendChild(el);

  let _card = null;
  let _onCreate = null;
  let _onUpdate = null;
  let imageCapture = null;
  let audioRecorder = null;
  let imageBlob = null;
  let audioBlob = null;

  function open({ card = null, onCreate, onUpdate }) {
    _card = card;
    _onCreate = onCreate || null;
    _onUpdate = onUpdate || null;

    const isEdit = card !== null;
    const title = isEdit ? 'カードを編集' : '新しいカード';
    const submitLabel = isEdit ? '変更を保存' : 'カードを追加';
    const text = card?.text || '';
    imageBlob = card?.imageBlob || null;
    audioBlob = card?.audioBlob || null;

    el.innerHTML = `
      <div class="modal-backdrop" data-backdrop>
        <div class="modal modal--wide" role="dialog" aria-modal="true" aria-labelledby="card-editor-title" tabindex="-1">
          <div class="modal__header">
            <h2 id="card-editor-title" class="modal__title">${title}</h2>
            <button class="btn btn--icon btn--ghost" data-action="close" aria-label="閉じる">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:1.5rem;height:1.5rem"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <form class="modal__body" data-form>
            <div data-error-general></div>

            <div class="form-field--lg">
              <label class="form-label" for="card-text">カードの内容 <span class="form-label__required">*</span></label>
              <textarea id="card-text" maxlength="5000" rows="10" placeholder="カードの内容を入力（例：1行目に質問、2行目に答え）&#10;&#10;例：&#10;フランスの首都はどこですか？&#10;パリ" style="font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;padding:var(--sp-3) var(--sp-4)" data-input="text">${escapeHtml(text)}</textarea>
              <div class="flex justify-between" style="margin-top:var(--sp-1)">
                <p class="form-hint" data-text-hint>💡 ヒント：複数行を使って質問と答えを分けることができます</p>
                <p class="form-counter" data-text-count>${text.length}/5000</p>
              </div>
            </div>

            <div class="form-field--lg">
              <label class="form-label">写真 <span class="form-label__optional">（任意）</span></label>
              <div data-image-capture></div>
            </div>

            <div class="form-field--lg">
              <label class="form-label">音声 <span class="form-label__optional">（任意）</span></label>
              <div data-audio-recorder></div>
            </div>

            <div class="flex gap-3">
              <button type="button" class="flex-1 btn btn--outline" data-action="close">キャンセル</button>
              <button type="submit" class="flex-1 btn btn--primary">${submitLabel}</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const form = el.querySelector('[data-form]');
    const textInput = el.querySelector('[data-input="text"]');

    // Text counter
    textInput.addEventListener('input', () => {
      el.querySelector('[data-text-count]').textContent = `${textInput.value.length}/5000`;
    });

    // Mount media components
    imageCapture = createImageCapture(el.querySelector('[data-image-capture]'), {
      imageBlob,
      disabled: false,
      onChange(blob) { imageBlob = blob; }
    });

    audioRecorder = createAudioRecorderUI(el.querySelector('[data-audio-recorder]'), {
      audioBlob,
      disabled: false,
      onChange(blob) { audioBlob = blob; }
    });

    // Submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const textVal = textInput.value.trim();

      if (!textVal) {
        textInput.classList.add('input-error');
        const hint = el.querySelector('[data-text-hint]');
        hint.textContent = 'カードのテキストは必須です';
        hint.classList.remove('form-hint');
        hint.classList.add('form-error');
        return;
      }

      const data = { text: textVal, imageBlob, audioBlob };

      if (isEdit) {
        if (_onUpdate) _onUpdate({ id: _card.id, ...data });
      } else {
        if (_onCreate) _onCreate(data);
      }

      close();
    });

    // Close handlers
    el.querySelector('[data-backdrop]').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) close();
    });
    el.querySelectorAll('[data-action="close"]').forEach(btn =>
      btn.addEventListener('click', close)
    );
    document.addEventListener('keydown', onKeydown);
  }

  function onKeydown(e) {
    if (e.key === 'Escape') close();
  }

  function close() {
    if (imageCapture) { imageCapture.destroy(); imageCapture = null; }
    if (audioRecorder) { audioRecorder.destroy(); audioRecorder = null; }
    el.innerHTML = '';
    _card = null;
    _onCreate = null;
    _onUpdate = null;
    imageBlob = null;
    audioBlob = null;
    document.removeEventListener('keydown', onKeydown);
  }

  function destroy() { close(); el.remove(); }

  return { open, close, destroy };
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
