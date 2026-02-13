/**
 * Notification toast — shared across App, CollectionDetail, Settings.
 *
 * Usage:
 *   const notify = createNotification(parentEl);
 *   notify.show('message', 'success');  // or 'error'
 *   notify.destroy();
 */

const SUCCESS_ICON = `<svg class="notification__icon notification__icon--success" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>`;

const ERROR_ICON = `<svg class="notification__icon notification__icon--error" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>`;

export function createNotification(parent) {
  let el = document.createElement('div');
  el.className = 'notification hidden';
  parent.appendChild(el);

  let timer = null;

  function show(message, type = 'success') {
    clearTimeout(timer);
    el.className = 'notification';
    el.innerHTML = `
      <div class="notification__inner notification__inner--${type}">
        ${type === 'success' ? SUCCESS_ICON : ERROR_ICON}
        <p class="notification__message">${escapeHtml(message)}</p>
      </div>
    `;
    timer = setTimeout(() => { el.className = 'notification hidden'; }, 3000);
  }

  function destroy() {
    clearTimeout(timer);
    el.remove();
  }

  return { show, destroy };
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
