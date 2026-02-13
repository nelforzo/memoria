# Deployment

## Overview

Memoria is a static site (no server required). The production build lives in `dist/` after `npm run build`. There are two repos involved:

| Repo | Purpose |
|---|---|
| `git@github.com:nelforzo/memoria.git` | Source code |
| `git@github.com:nelforzo/nelforzo.github.io.git` | GitHub Pages host — cloned at `/Users/frank/Developer/nelforzo.github.io` |

The app is served from the `memoria/` subdirectory of nelforzo.github.io, so `vite.config.js` sets `base: '/memoria/'`.

---

## Build

```bash
cd /Users/frank/Developer/memoria
npm run build
# Output: dist/
```

---

## Deploy to GitHub Pages

```bash
# 1. Copy compiled output to the Pages repo
cp -r /Users/frank/Developer/memoria/dist/* /Users/frank/Developer/nelforzo.github.io/memoria/

# 2. Commit and push the Pages repo
cd /Users/frank/Developer/nelforzo.github.io
git add memoria/
git commit -m "Update Memoria"
git push
```

The live site updates within ~1 minute at: **https://nelforzo.github.io/memoria/**

---

## Full release procedure (source + pages)

```bash
# In the source repo
cd /Users/frank/Developer/memoria
npm run build
git add <changed files>
git commit -m "Your message"
git push

# Copy to Pages repo and deploy
cp -r dist/* /Users/frank/Developer/nelforzo.github.io/memoria/
cd /Users/frank/Developer/nelforzo.github.io
git add memoria/
git commit -m "Update Memoria: <short description>"
git push
```

---

## Deploying to a different host

If deploying to a domain root instead of a subdirectory, change `vite.config.js`:

```js
// vite.config.js
base: '/'  // instead of '/memoria/'
```

Then rebuild and copy `dist/` to your static host.

---

## Local development

```bash
npm run dev
# Open http://localhost:5173/
```

Preview the production build locally:

```bash
npm run preview
# Open http://localhost:4173/memoria/
```
