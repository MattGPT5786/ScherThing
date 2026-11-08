# ScherThing

A single-file family dashboard. Live Cherry Hill (08003) weather on top; below it, the ScherThing reminders list (Otto's care routine + household) and the next two weeks of the Matt / Sam / ScherThing calendars — baked in as a snapshot and refreshed daily.

## How it works
- **Weather (live):** Open-Meteo, keyless + CORS-open, fetched in the browser every 10 minutes.
- **Family content (snapshot):** `bake.mjs` renders the current ScherThing reminders (read from the household's Reminders list) plus the next 14 days of events from the Matt, Sam, and ScherThing calendars into `index.html` between the CONTENT markers. A daily job re-runs the bake and pushes only when something changed.
- **Raw exports are never pushed.** The reminder/calendar JSON the bake reads from lives only in the builder's local `private/` folder.
- **Privacy note:** this site is public by the owner's choice (confirmed Nov 8, 2026 — an encrypted design was built first, then deliberately replaced with plaintext for simplicity). Anyone with the URL can read the snapshot.

## Layout
On wide, tall-enough screens (≥1180×720) the content arranges into a one-screen grid — Due Today, Otto's Care, Household, and the two-week calendar — under the live weather band. Smaller windows stack; panels scroll internally if content ever outgrows the screen.

## Files
- `index.html` — the whole dashboard.
- `bake.mjs` — the builder (reads its inputs from a local `private/` folder that is intentionally absent from this repo).
