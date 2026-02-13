# CLAUDE.md — Memoria Project Guide

Quick reference for working on this project. Full details in `docs/`.

---

## Project

Vanilla JS + Vite 7 + Dexie.js + CSS PWA for offline multimedia flashcard memorization. All data lives in IndexedDB — no backend, no auth.

See `README.md` for full feature list and architecture.

---

## Development

```bash
npm run dev       # dev server at http://localhost:5173/
npm run build     # production build → dist/
npm run preview   # preview build at http://localhost:4173/memoria/
```

Node 18+ required.

---

## Deployment

Two repos are involved: the source repo (`nelforzo/memoria`) and the GitHub Pages host (`nelforzo/nelforzo.github.io`, cloned at `/Users/frank/Developer/nelforzo.github.io`). The live site is at **https://nelforzo.github.io/memoria/**.

Full step-by-step procedure: [`docs/deployment.md`](docs/deployment.md)

Short version:
1. `npm run build`
2. Push source changes to `nelforzo/memoria`
3. `cp -r dist/* /Users/frank/Developer/nelforzo.github.io/memoria/`
4. Commit and push `nelforzo/nelforzo.github.io`

---

## Key architectural decisions

- `base: '/memoria/'` in `vite.config.js` — required for GitHub Pages subdirectory serving
- Vanilla JS components using a `createXxx(container, props)` factory pattern returning `{ destroy(), update() }`
- Single `src/styles.css` with CSS custom properties for design tokens — no framework, no preprocessor
- Stores use a plain JS observable pattern: `{ subscribe(fn), get(), set(), update() }` (no Svelte)
- `<audio>` element created once at mount time in StudyMode — src set imperatively via `audio.src = url; audio.load()`, eliminating the Svelte timing bug where `bind:this` was undefined during reactive chain execution
- Blob URLs cached in a `Map<cardId, urls>` per session — created once, revoked on destroy
- `viewportReset.js` must be `await`ed **before** removing fixed overlays — locks viewport scale, waits rAF + 100ms, then restores; prevents Safari iOS zoom bug

---

## Coding conventions

- No TypeScript — plain JS throughout
- No framework — vanilla JS with imperative DOM manipulation
- CSS custom properties for design tokens; component-scoped styles in `src/styles.css`
- Minimum tap target: 44px on touch-interactive elements
- Component pattern: `export function createXxx(container, props) { ... return { destroy(), update() }; }`
- Use `data-action="xxx"` attributes for event delegation
- HTML escaping via `escapeHtml()` helper for user content

---

## Repo structure

```
src/
  main.js              # Entry point
  App.js               # Root component (routing, header)
  styles.css           # All CSS (reset, tokens, components)
  lib/
    components/
      Card/            # CardEditor, CardList, CardListItem
      Collection/      # CollectionCard, CollectionEditor, CollectionList
      Media/           # AudioRecorder, ImageCapture
      Study/           # StudyMode
      CollectionDetail.js
      ConfirmDialog.js
      Notification.js
      Settings.js
    database/db.js     # Dexie schema
    stores/            # collections.js, cards.js (plain JS observable)
    utils/             # exportImport, helpers, imageCompression, audioRecording, viewportReset
```
