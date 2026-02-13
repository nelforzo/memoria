/**
 * ConfirmDialog — reusable delete/confirm modal.
 *
 * Usage:
 *   const dialog = createConfirmDialog(parentEl);
 *   dialog.open({ title, message, confirmLabel, cancelLabel, isDanger, onConfirm, onCancel });
 *   dialog.destroy();
 */

export function createConfirmDialog(parent) {
  const el = document.createElement('div');
  parent.appendChild(el);

  let _onConfirm = null;
  let _onCancel = null;

  function handleBackdrop(e) {
    if (e.target === el.firstElementChild) close();
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') close();
  }

  function confirm() {
    const cb = _onConfirm;
    close();
    if (cb) cb();
  }

  function close() {
    el.innerHTML = '';
    _onConfirm = null;
    if (_onCancel) { const cb = _onCancel; _onCancel = null; cb(); }
    document.removeEventListener('keydown', handleKeydown);
  }

  function open({ title = '確認', message = '', confirmLabel = '確認', cancelLabel = 'キャンセル', isDanger = false, onConfirm, onCancel }) {
    _onConfirm = onConfirm || null;
    _onCancel = onCancel || null;

    const iconBg = isDanger ? 'confirm-icon--danger' : 'confirm-icon--info';
    const iconSvg = isDanger
      ? `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`
      : `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;

    const confirmBtnClass = isDanger ? 'btn btn--danger' : 'btn btn--primary';

    el.innerHTML = `
      <div class="modal-backdrop modal-backdrop--centered" data-backdrop>
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div class="modal__header" style="border-bottom:1px solid var(--gray-200)">
            <div class="flex items-center">
              <div class="confirm-icon ${iconBg}">${iconSvg}</div>
              <h2 id="confirm-title" class="modal__title">${escapeHtml(title)}</h2>
            </div>
          </div>
          <div class="modal__body">
            <p style="color:var(--gray-600)">${escapeHtml(message)}</p>
          </div>
          <div class="modal__body modal__body--no-pt flex gap-3">
            <button class="flex-1 btn btn--outline" data-action="cancel">${escapeHtml(cancelLabel)}</button>
            <button class="flex-1 ${confirmBtnClass}" data-action="confirm">${escapeHtml(confirmLabel)}</button>
          </div>
        </div>
      </div>
    `;

    el.querySelector('[data-backdrop]').addEventListener('click', handleBackdrop);
    el.querySelector('[data-action="cancel"]').addEventListener('click', close);
    el.querySelector('[data-action="confirm"]').addEventListener('click', confirm);
    document.addEventListener('keydown', handleKeydown);
  }

  function destroy() {
    close();
    el.remove();
  }

  return { open, close, destroy };
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
