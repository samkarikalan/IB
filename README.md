# IB Student Hub

Mobile-first HTML/CSS/JavaScript prototype for IB students, with optional SAT support.

## Files

- `index.html` — app structure
- `styles.css` — all styling
- `app.js` — app logic and local storage

## Current storage

The prototype currently uses browser `localStorage`.

## Planned backend

Later, the storage layer can be replaced with Supabase for:
- authentication
- cloud sync across devices
- student profiles
- subjects and grades
- tasks and deadlines
- exams
- study logs
- essays/coursework
- SAT scores and practice history

## Run locally

Open `index.html` directly, or serve the folder with any static web server.

## PWA update support
This build includes `manifest.webmanifest`, `sw.js`, and 192/512 app icons. The service worker uses a versioned cache, prefers the network for the app shell, removes older app caches on activation, and checks for a newer service worker on every launch. For each future production release, bump `CACHE_VERSION` in `sw.js` and the `?v=` values for `app.js` / `styles.css` in `index.html` and `sw.js`.
