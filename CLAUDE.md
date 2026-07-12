# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start hot-reload dev server (electron-vite dev)
npm run build        # typecheck + production build
npm run build:win    # build + package Windows installer
npm run typecheck    # run both node and web tsconfigs
npm run lint         # ESLint
npm run format       # Prettier
```

No test suite exists yet.

## Architecture

Electron app with three Vite targets: `main` (Node), `preload`, `renderer` (React).

```
LCU (LoL client) ←—HTTPS/WS—→ Main Process ←—IPC—→ Preload (window.api) ←—→ Renderer
                                     │
                               sql.js SQLite
                              ~/.flash-for-wards/data.db
```

### Shared types

Types live in `src/renderer/src/types/index.ts` and are imported by both main and renderer via the `@shared` alias (defined in `electron.vite.config.ts` for both targets). Do not create a separate `shared/` directory.

### Bundled data (`src/renderer/src/data/`)

`champions.json` (Community Dragon) and `default-rune-pages.json` (Riot's recommended page per champion, pulled from a running League client) are generated, not hand-edited. Regenerate with `npm run gen:champions` / `npm run gen:default-runes` — the latter needs the client open. Default pages are built-in fallbacks: they never enter the DB, are applied by value via `lcu:pages:apply-data`, and only become real rows when the user saves a copy.

### Main process (`src/main/`)

- `index.ts` — app lifecycle: init DB → register IPC handlers → create window → start LCU connection
- `lcu/connection.ts` — `LcuConnection extends EventEmitter`; infinite reconnect loop using `league-connect`. Emits `connecting / connected / disconnected`. The `connected` event carries credentials needed for HTTP calls.
- `lcu/rune-api.ts` — raw Node `https` calls to LCU (no fetch; `rejectUnauthorized: false`; 5 s timeout; Basic auth `riot:<password>`). Error objects include `statusCode` and `body` from the LCU response.
- `ipc/` — three files register handlers: `rune-pages.ts`, `settings.ts`, `lcu.ts`
- `db/` — `index.ts` initialises sql.js (WASM); `rune-pages-repo.ts` and `settings-repo.ts` do CRUD. **Call `persistDb()` after every write** — sql.js is in-memory and must be flushed manually.

### Champion select detection (dual-path)

WS events from `league-connect` are primary. A 3-second `setInterval` polling `getGameflowPhase()` runs in parallel as fallback. Both paths call `handlePhaseChange(phase)` which guards against double-fires with `lastPolledPhase`. When `ChampSelect` becomes active and `autoFocusOnChampSelect` is enabled, the window is raised with `setAlwaysOnTop(true, 'screen-saver')` — the `screen-saver` level is required to appear above the fullscreen LoL client on Windows.

### IPC

Invoke handlers register in `src/main/ipc/{rune-pages,settings,lcu}.ts`; matching `window.api` methods live in `src/preload/index.ts` — grep those files for the current channel list. Push channels (main → renderer): `lcu:status` (`LcuConnectionStatus`), `champ-select:phase` (`ChampSelectPhase`), `champ-select:session` (raw LCU session, forwarded as-is).

### Renderer (`src/renderer/src/`)

`App.tsx` calls four side-effect hooks unconditionally at top level (`useLcuStatus / useRunePages / useSettings / useChampSelect`) — each wires one IPC subscription or one-shot fetch, and push subscriptions return a cleanup used in the `useEffect` return. Single flat Zustand store in `stores/app-store.ts`. `OnboardingModal` is always mounted, visible when `settings.onboardingComplete` is false.

### Build gotchas

- `league-connect` must be in the `exclude` list of `externalizeDepsPlugin` (it's ESM and must be bundled into main)
- `bufferutil` and `utf-8-validate` must be listed in `rollupOptions.external` (optional ws native addons, not installed)
- sql.js WASM file is loaded at runtime via `locateFile` pointing to `node_modules/sql.js/dist/` — that path must be preserved when packaging
- DB booleans are stored as `0 / 1` integers; `selectedPerkIds` is a JSON string
