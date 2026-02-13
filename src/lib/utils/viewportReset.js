/**
 * Viewport Reset Utility
 *
 * Fixes a Safari iOS bug where the visual viewport stays zoomed in
 * after a position:fixed full-screen overlay is removed from the DOM.
 *
 * Strategy:
 *   1. Lock scale synchronously (maximum-scale=1.0, user-scalable=no).
 *   2. Await one rAF + 100ms so Safari composites the correction while
 *      the fixed overlay is still in the DOM.
 *   3. Restore the original meta content.
 *
 * The caller must await this function BEFORE removing the overlay:
 *
 *   await resetViewport();
 *   showStudyMode = false;
 */

const RESTORE_DELAY_MS = 100;

export async function resetViewport() {
  if (typeof window === 'undefined') return;

  const meta = document.querySelector('meta[name="viewport"]');
  if (!meta) return;

  const originalContent = meta.getAttribute('content');

  // Lock scale immediately — do NOT guard on visualViewport.scale,
  // which can read as 1.0 even when Safari is visually zoomed.
  meta.setAttribute(
    'content',
    'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
  );
  window.scrollTo(0, 0);

  // Wait for one rAF + a short delay so the correction is composited
  // while the fixed overlay is still in the DOM.
  await new Promise((resolve) => {
    requestAnimationFrame(() => setTimeout(resolve, RESTORE_DELAY_MS));
  });

  // Restore user-scalable behaviour.
  meta.setAttribute('content', originalContent);
}
