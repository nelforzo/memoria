# Memoria

A progressive web app for multimedia flashcard memorization. Create collections of cards with text, photos, and audio — all stored locally on your device, no account or internet connection required.

**Live demo:** https://nelforzo.github.io/memoria/

---

## Features

### Collections
- Create, edit, and delete collections with a name and optional description
- Home screen lists all collections with card counts and last-updated time
- Tap any collection to open it

### Cards
- Add cards with up to 5,000 characters of text
- Attach an optional photo (compressed automatically to WebP, max 800×800px)
- Attach an optional audio recording (recorded directly in the browser)
- Edit or delete individual cards
- Card thumbnails shown in the list when a photo is present

### Study Mode
- Full-screen study interface
- Cards with a single text block are shown as-is
- Cards with multiple lines split into a question/answer flip: tap or press **Space/Enter** to reveal the answer
- Photos and audio play inline on the card
- Navigate with **← →** arrow keys or the Previous/Next buttons
- **Swipe left/right** on touch screens to navigate; **tap** to flip
- Press **Esc** to exit
- Each card is marked as reviewed the first time it's seen in a session (tracks `lastReviewedAt` and `reviewCount`)

### Export / Import
- **Export a single collection** from the collection detail header — downloads a timestamped `.json` file
- **Export all collections** from Settings — downloads `memoria_backup_YYYY-MM-DD.json`
- **Import** from any previously exported file with two strategies:
  - **Merge** — skip collections that already exist (safe default)
  - **Replace** — overwrite collections with matching IDs
- All media (photos and audio) is embedded in the JSON as base64, so a single file is a complete backup

### Export format
```json
{
  "version": "1.0",
  "exportDate": "2026-02-13T00:00:00.000Z",
  "collections": [
    {
      "id": "uuid",
      "name": "Spanish Vocabulary",
      "description": "...",
      "createdAt": 1234567890,
      "updatedAt": 1234567890,
      "cardCount": 3,
      "cards": [
        {
          "id": "uuid",
          "collectionId": "uuid",
          "text": "Hola\nHello",
          "imageBlob": { "type": "image/webp", "data": "data:image/webp;base64,..." },
          "audioBlob": { "type": "audio/webm", "data": "data:audio/webm;base64,..." },
          "createdAt": 1234567890,
          "lastReviewedAt": 1234567890,
          "reviewCount": 5,
          "difficulty": 0
        }
      ]
    }
  ]
}
```

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| [Svelte](https://svelte.dev) | 5 | Reactive UI components |
| [Vite](https://vite.dev) | 7 | Build tool and dev server |
| [Dexie.js](https://dexie.org) | 4 | IndexedDB wrapper for local storage |
| [Tailwind CSS](https://tailwindcss.com) | 3 | Utility-first styling |

### Browser APIs used
- **IndexedDB** (via Dexie.js) — stores all collections, cards, and binary media
- **Canvas API** — client-side image resizing and WebP conversion
- **MediaRecorder API** — in-browser audio recording
- **File API / Blob URLs** — media preview and export/import
- **Web Crypto API** — UUID generation (`crypto.randomUUID()`)

---

## Database Schema

All data is stored in a local IndexedDB database named `MemoriaDB`.

### `collections`
| Field | Type | Description |
|---|---|---|
| `id` | string (UUID) | Primary key |
| `name` | string | Collection name (max 100 chars) |
| `description` | string | Optional description (max 500 chars) |
| `createdAt` | number | Unix timestamp |
| `updatedAt` | number | Unix timestamp |
| `cardCount` | number | Automatically maintained |

### `cards`
| Field | Type | Description |
|---|---|---|
| `id` | string (UUID) | Primary key |
| `collectionId` | string | Foreign key to `collections` |
| `text` | string | Card content (max 5,000 chars) |
| `imageBlob` | Blob \| null | Compressed photo |
| `audioBlob` | Blob \| null | Recorded audio |
| `createdAt` | number | Unix timestamp |
| `lastReviewedAt` | number \| null | Timestamp of last study session |
| `reviewCount` | number | Total times reviewed |
| `difficulty` | number | Reserved for future spaced repetition (0–5) |

---

## Media Compression

### Images
- Max dimensions: **800 × 800 px** (aspect ratio preserved)
- Format: **WebP** with 80% quality (falls back to JPEG if WebP unsupported)
- Typical reduction: 70–90% smaller than the original

### Audio
- Format: **WebM/Opus** (falls back to `audio/ogg;codecs=opus`, `audio/mp4`, or `audio/mpeg`)
- Bitrate: **32 kbps**, mono, 24 kHz sample rate
- Echo cancellation, noise suppression, and auto gain control enabled
- Typical size: ~240 KB/minute

---

## Project Structure

```
memoria/
├── public/
│   └── vite.svg
├── src/
│   ├── App.svelte                  # Root component, routing
│   ├── app.css                     # Global styles
│   ├── main.js                     # Entry point
│   └── lib/
│       ├── components/
│       │   ├── Collection/
│       │   │   ├── CollectionCard.svelte    # Collection list item
│       │   │   ├── CollectionEditor.svelte  # Create/edit modal
│       │   │   └── CollectionList.svelte    # Home screen grid
│       │   ├── Card/
│       │   │   ├── CardEditor.svelte        # Create/edit modal
│       │   │   ├── CardList.svelte          # Cards grid
│       │   │   └── CardListItem.svelte      # Card list item with thumbnail
│       │   ├── Media/
│       │   │   ├── AudioRecorder.svelte     # Record, preview, remove audio
│       │   │   └── ImageCapture.svelte      # Upload or capture photo
│       │   ├── Study/
│       │   │   └── StudyMode.svelte         # Full-screen study interface
│       │   ├── CollectionDetail.svelte      # Collection page (cards + header)
│       │   ├── ConfirmDialog.svelte         # Reusable confirmation modal
│       │   └── Settings.svelte              # Export/import UI
│       ├── database/
│       │   └── db.js                        # Dexie schema, models, helpers
│       ├── stores/
│       │   ├── collections.js               # Reactive collections store
│       │   └── cards.js                     # Reactive cards store
│       └── utils/
│           ├── audioRecording.js            # AudioRecorder class, formatDuration
│           ├── exportImport.js              # Export/import with base64 blobs
│           ├── helpers.js                   # UUID, timestamps, formatting
│           └── imageCompression.js          # Canvas-based image compression
├── index.html
├── package.json
├── vite.config.js                           # base: '/memoria/' for GitHub Pages
├── svelte.config.js
├── tailwind.config.js
└── postcss.config.js
```

---

## Getting Started

### Prerequisites
- Node.js 18+

### Install
```bash
git clone https://github.com/nelforzo/memoria.git
cd memoria
npm install
```

### Run locally
```bash
npm run dev
```
Open http://localhost:5173/

### Build for production
```bash
npm run build
```
Output is in `dist/`. The `base` in `vite.config.js` is set to `/memoria/` for the GitHub Pages deployment. If deploying to a domain root, change it to `'/'`.

### Preview production build
```bash
npm run preview
```

---

## Deployment

The app is a static site — no server required. After `npm run build`, copy the `dist/` folder to any static host.

### GitHub Pages (current deployment)
The built files are served from the `memoria/` subdirectory of [nelforzo.github.io](https://github.com/nelforzo/nelforzo.github.io). To update:

```bash
npm run build
cp -r dist/* ../nelforzo.github.io/memoria/
cd ../nelforzo.github.io
git add memoria/
git commit -m "Update Memoria"
git push
```

---

## Browser Compatibility

| Browser | Minimum version |
|---|---|
| Chrome / Edge | 80+ |
| Firefox | 75+ |
| Safari | 15.4+ (`dvh` units) |

Requires: IndexedDB, MediaRecorder API, Canvas API, `crypto.randomUUID()`.

---

## Known Limitations

- No cloud sync — data lives only in the browser's IndexedDB on the current device
- No PWA service worker yet — requires an internet connection on first load
- No spaced repetition algorithm — study order is fixed (planned for a future version)
- Safari iOS 15 and earlier: modals may be partially obscured by the keyboard (no `dvh` support)

---

## Roadmap

- [ ] PWA service worker for full offline support and home screen install
- [ ] Spaced repetition algorithm (SM-2 or similar)
- [ ] Card search within a collection
- [ ] Shuffle mode in study
- [ ] Storage usage stats in Settings
- [ ] Tags / categories for cards
