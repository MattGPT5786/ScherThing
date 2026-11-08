# ScherThing — Family Dashboard

A single-file, encrypted family dashboard. The public shell shows live Cherry Hill (08003) weather; everything personal — the ScherThing reminders list (Otto's care routine + household) and the Matt / Sam / ScherThing calendars — is baked into an AES-256-GCM encrypted snapshot that only unlocks with the family passphrase.

## How it works
- **Weather (public, live):** Open-Meteo, keyless + CORS-open, fetched in the browser. Never encrypted — it's public data.
- **Personal content (encrypted snapshot):** `bake.mjs` renders the reminders + next-14-days calendar events to HTML, encrypts it (PBKDF2-SHA256, 600,000 iterations → AES-256-GCM; key derived from the passphrase at unlock time, never stored), and injects only the ciphertext into `index.html`.
- **Raw data never enters this repo.** Reminder/calendar exports and the passphrase live only in the builder's local `private/` folder, which is never pushed.
- The snapshot is re-baked daily; the page shows its "as of" time. Weather refreshes live every 10 minutes in the browser.

## Layout
On wide, tall-enough screens (≥1180×720) the unlocked content arranges into a one-screen grid — Due Today, Otto's Care, Household, and the two-week calendar — under the live weather band. Smaller windows stack.

## Files
- `index.html` — the whole dashboard (shell + unlock logic + encrypted payload).
- `bake.mjs` — the builder (not needed to view the site; kept here for reference — it reads its inputs from a local `private/` folder that is intentionally absent from this repo).
