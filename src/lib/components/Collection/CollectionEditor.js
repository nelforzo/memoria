/**
 * CollectionEditor — create/edit modal for collections.
 */

export function createCollectionEditor(parent) {
  const el = document.createElement('div');
  parent.appendChild(el);

  let _collection = null;
  let _onCreate = null;
  let _onUpdate = null;
  // AbortController used to cancel voiceschanged listener when editor closes or
  // re-opens for a different collection, preventing stale-closure bugs.
  let _voicesAbort = null;

  function open({ collection = null, onCreate, onUpdate }) {
    // Abort any pending voice listener from a previous open() call
    if (_voicesAbort) { _voicesAbort.abort(); _voicesAbort = null; }

    _collection = collection;
    _onCreate = onCreate || null;
    _onUpdate = onUpdate || null;

    const isEdit = collection !== null;
    const title = isEdit ? 'コレクションを編集' : '新しいコレクション';
    const submitLabel = isEdit ? '変更を保存' : 'コレクションを作成';
    const name = collection?.name || '';
    const desc = collection?.description || '';
    const currentVoiceURI = collection?.voiceURI || '';

    el.innerHTML = `
      <div class="modal-backdrop" data-backdrop>
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="ce-title" tabindex="-1">
          <div class="modal__header">
            <h2 id="ce-title" class="modal__title">${title}</h2>
            <button class="btn btn--icon btn--ghost" data-action="close" aria-label="閉じる">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:1.5rem;height:1.5rem"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <form class="modal__body" data-form>
            <div class="form-field">
              <label class="form-label" for="ce-name">コレクション名 <span class="form-label__required">*</span></label>
              <input id="ce-name" type="text" maxlength="100" placeholder="例：スペイン語の語彙" value="${escapeAttr(name)}" data-input="name" />
              <div class="flex justify-between" style="margin-top:var(--sp-1)">
                <p class="form-hint" data-name-hint>必須</p>
                <p class="form-counter" data-name-count>${name.length}/100</p>
              </div>
            </div>
            <div class="form-field--lg">
              <label class="form-label" for="ce-desc">説明 <span class="form-label__optional">（任意）</span></label>
              <textarea id="ce-desc" maxlength="500" rows="4" placeholder="このコレクションの目的を説明するメモを追加..." style="resize:none" data-input="desc">${escapeHtml(desc)}</textarea>
              <div class="flex justify-between" style="margin-top:var(--sp-1)">
                <div></div>
                <p class="form-counter" data-desc-count>${desc.length}/500</p>
              </div>
            </div>
            <div class="form-field">
              <label class="form-label" for="ce-voice">TTS音声 <span class="form-label__optional">（任意）</span></label>
              <select id="ce-voice" data-input="voice">
                <option value="">デフォルト</option>
              </select>
              <p class="form-hint" style="margin-top:var(--sp-1)">カードのテキストを読み上げる音声を選択します</p>
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
    const nameInput = el.querySelector('[data-input="name"]');
    const descInput = el.querySelector('[data-input="desc"]');
    const voiceSelect = el.querySelector('[data-input="voice"]');

    // Populate voice dropdown — may be async if voices haven't loaded yet
    function populateVoices() {
      const voices = window.speechSynthesis?.getVoices() ?? [];
      // Keep only newly added options; remove all except the default placeholder
      while (voiceSelect.options.length > 1) voiceSelect.remove(1);
      for (const v of voices) {
        const opt = document.createElement('option');
        opt.value = v.voiceURI;
        opt.textContent = `${v.name} (${v.lang})`;
        if (v.voiceURI === currentVoiceURI) opt.selected = true;
        voiceSelect.appendChild(opt);
      }
      // If no voice matched the saved URI, keep default selected
      if (!currentVoiceURI || !voices.find(v => v.voiceURI === currentVoiceURI)) {
        voiceSelect.value = '';
      }
    }

    // Voices may already be available synchronously (Chrome desktop) or arrive
    // via voiceschanged (Safari, Firefox). Use AbortController so we don't leak
    // a listener when the editor is closed or re-opened.
    _voicesAbort = new AbortController();
    populateVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.addEventListener('voiceschanged', populateVoices, {
        signal: _voicesAbort.signal
      });
    }

    // Character counters
    nameInput.addEventListener('input', () => {
      el.querySelector('[data-name-count]').textContent = `${nameInput.value.length}/100`;
    });
    descInput.addEventListener('input', () => {
      el.querySelector('[data-desc-count]').textContent = `${descInput.value.length}/500`;
    });

    // Submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameVal = nameInput.value.trim();
      const descVal = descInput.value.trim();
      const voiceVal = voiceSelect.value;

      // Validate
      if (!nameVal) {
        nameInput.classList.add('input-error');
        const hint = el.querySelector('[data-name-hint]');
        hint.textContent = 'コレクション名は必須です';
        hint.classList.remove('form-hint');
        hint.classList.add('form-error');
        return;
      }

      const data = { name: nameVal, description: descVal, voiceURI: voiceVal };

      if (isEdit) {
        if (_onUpdate) _onUpdate({ id: _collection.id, ...data });
      } else {
        if (_onCreate) _onCreate(data);
      }

      close();
    });

    // Close
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
    if (_voicesAbort) { _voicesAbort.abort(); _voicesAbort = null; }
    el.innerHTML = '';
    _collection = null;
    _onCreate = null;
    _onUpdate = null;
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

function escapeAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
