/**
 * debugLog — lightweight ring-buffer logger for media debugging.
 * Call debugLog.add('[AUDIO] ...') or debugLog.add('[IMG] ...') from any component.
 */

const MAX_ENTRIES = 500;

const entries = [];

function timestamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, '0')}`;
}

export const debugLog = {
  add(message) {
    entries.push(`${timestamp()} ${message}`);
    if (entries.length > MAX_ENTRIES) entries.shift();
  },

  getAll() {
    return entries.slice();
  },

  clear() {
    entries.length = 0;
  },

  getText() {
    return entries.join('\n');
  }
};
