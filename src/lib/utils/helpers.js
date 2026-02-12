/**
 * Utility helper functions for Memoria
 */

/**
 * Generate a unique ID using crypto.randomUUID()
 * @returns {string} UUID v4 string
 */
export function generateId() {
  return crypto.randomUUID();
}

/**
 * Get current timestamp in milliseconds
 * @returns {number} Timestamp
 */
export function now() {
  return Date.now();
}

/**
 * Format timestamp to human-readable date
 * @param {number} timestamp - Milliseconds since epoch
 * @returns {string} Formatted date string
 */
export function formatDate(timestamp) {
  if (!timestamp) return 'Never';

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Today
  if (diffDays === 0) {
    return 'Today';
  }

  // Yesterday
  if (diffDays === 1) {
    return 'Yesterday';
  }

  // Within a week
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  // Older - show actual date
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format timestamp to human-readable date and time
 * @param {number} timestamp - Milliseconds since epoch
 * @returns {string} Formatted date and time string
 */
export function formatDateTime(timestamp) {
  if (!timestamp) return 'Never';

  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 * @param {number} timestamp - Milliseconds since epoch
 * @returns {string} Relative time string
 */
export function formatRelativeTime(timestamp) {
  if (!timestamp) return 'Never';

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) {
    return 'Just now';
  } else if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (days < 7) {
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  } else if (weeks < 4) {
    return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
  } else if (months < 12) {
    return `${months} month${months !== 1 ? 's' : ''} ago`;
  } else {
    return `${years} year${years !== 1 ? 's' : ''} ago`;
  }
}

/**
 * Truncate text to a maximum length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text with ellipsis if needed
 */
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Debounce function - delays execution until after wait time has elapsed
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Check if browser supports required features
 * @returns {Object} Feature support status
 */
export function checkBrowserSupport() {
  return {
    indexedDB: !!window.indexedDB,
    serviceWorker: 'serviceWorker' in navigator,
    mediaDevices: !!navigator.mediaDevices,
    getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    mediaRecorder: typeof MediaRecorder !== 'undefined',
    crypto: !!window.crypto && !!window.crypto.randomUUID,
    canvas: (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext && canvas.getContext('2d'));
      } catch (e) {
        return false;
      }
    })()
  };
}

/**
 * Log browser support status to console
 */
export function logBrowserSupport() {
  const support = checkBrowserSupport();
  console.log('🌐 Browser Support Check:');
  console.table(support);

  const unsupported = Object.keys(support).filter(key => !support[key]);
  if (unsupported.length > 0) {
    console.warn('⚠️ Unsupported features:', unsupported.join(', '));
  } else {
    console.log('✅ All features supported!');
  }
}
