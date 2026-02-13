# CLAUDE.md — Memoria Project Guide

Quick reference for working on this project. Full details in `docs/`.

---

## Project

Svelte 5 + Vite 7 + Dexie.js + Tailwind CSS v3 PWA for offline multimedia flashcard memorization. All data lives in IndexedDB — no backend, no auth.

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
- Tailwind CSS v3 (not v4) — v4 had breaking incompatibilities at project start
- `<audio>` element kept outside Svelte `{#key}` blocks — Safari requires a stable DOM node for reliable media loading; use `bind:this` + imperative `load()` calls
- Blob URLs cached in a `Map<cardId, urls>` per session — created once, revoked in `onDestroy`
- `viewportReset.js` must be `await`ed **before** removing fixed overlays — locks viewport scale, waits rAF + 100ms, then restores; prevents Safari iOS zoom bug

---

## Coding conventions

- Svelte 4 legacy syntax (`$:` reactive declarations, `export let`, `on:event`)
- No TypeScript — plain JS throughout
- Tailwind utility classes only; component-scoped `<style>` only for things Tailwind can't do (e.g. `@keyframes`, media query variants)
- Minimum tap target: 56px (`w-14 h-14`) on touch-interactive elements

---

## Repo structure

```
src/lib/
  components/
    Card/          # CardEditor, CardList, CardListItem
    Collection/    # CollectionCard, CollectionEditor, CollectionList
    Media/         # AudioRecorder, ImageCapture
    Study/         # StudyMode
    CollectionDetail.svelte
    ConfirmDialog.svelte
    Settings.svelte
  database/db.js   # Dexie schema
  stores/          # collections.js, cards.js
  utils/           # exportImport, helpers, imageCompression, audioRecording, viewportReset
```
