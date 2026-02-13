/**
 * Viewport Reset Utility
 *
 * Fixes a Safari iOS bug where the visual viewport remains zoomed in
 * after a position:fixed full-screen overlay is removed from the DOM.
 *
 * Temporarily sets maximum-scale=1.0 for one animation frame to force
 * Safari to snap back to scale 1, then restores the original meta content.
 */

let pendingFrame = null;

export function resetViewport() {
  // Only needed in a browser with the Visual Viewport API
  if (typeof window === 'undefined' || !window.visualViewport) return;

  // Already at normal scale — nothing to do
  if (window.visualViewport.scale === 1) return;

  const meta = document.querySelector('meta[name="viewport"]');
  if (!meta) return;

  // Cancel any in-flight restore to prevent pile-up on rapid exits
  if (pendingFrame !== null) {
    cancelAnimationFrame(pendingFrame);
    pendingFrame = null;
  }

  const originalContent = meta.getAttribute('content');

  // Lock scale to 1 — forces Safari to snap the visual viewport immediately
  meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0');
  window.scrollTo(0, 0);

  // Restore user zoom on the next frame
  pendingFrame = requestAnimationFrame(() => {
    meta.setAttribute('content', originalContent);
    pendingFrame = null;
  });
}
