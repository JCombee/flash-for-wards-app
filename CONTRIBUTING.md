# Contributing to Flash For Wards

Thanks for taking the time. This is a small project — issues, bug reports, and pull requests are all welcome.

## Getting set up

```bash
npm install
npm run dev
```

Requires Node.js 20+. You need a running (logged-in) League of Legends client to exercise anything that touches the LCU. Most UI work can be done without one, but champion select and apply flows cannot.

Before opening a PR:

```bash
npm run typecheck
npm run lint
npm run format
```

All three must pass. There is no test suite yet; if you want to add one, that's a welcome contribution in its own right.

## Architecture in 60 seconds

Electron app with three Vite targets: `main` (Node), `preload`, `renderer` (React).

- `src/main/lcu/` — LCU connection (infinite reconnect loop via `league-connect`) and raw HTTPS calls to the client.
- `src/main/db/` — sql.js SQLite. **Call `persistDb()` after every write** — the DB is in-memory and must be flushed manually.
- `src/main/ipc/` — IPC handlers, one file per domain. Matching `window.api` methods live in `src/preload/index.ts`.
- `src/renderer/src/` — React, single flat Zustand store in `stores/app-store.ts`.

Shared types live in `src/renderer/src/types/index.ts` and are imported by main via the `@shared` alias. Don't create a separate `shared/` directory.

[CLAUDE.md](CLAUDE.md) has the longer version, including build gotchas (`league-connect` must be bundled, not externalized; the sql.js WASM path must survive packaging).

## Pull requests

- Branch off `main`.
- Keep PRs focused — one concern per PR.
- Use [Conventional Commits](https://www.conventionalcommits.org/) for commit subjects (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).
- Describe what you changed and how you verified it. If it touches the LCU or champ select, say what you actually saw in a live client.
- Match the surrounding code style. Prettier settles formatting arguments.

## Reporting bugs

Open an issue with the bug report template. The useful details: OS, app version, whether the League client was connected, and what the status bar said. If the app logged an LCU error, include the `statusCode` and `body`.

## Scope

Things that fit: rune page management, LCU integration, champ select UX, packaging, accessibility, tests.

Things that don't: anything that automates gameplay, scripts inputs, reads game memory, or otherwise interacts with the game beyond the LCU's rune page endpoints. Those get closed without discussion — they'd get the whole project banned, and they're not what this is for.

## Code of Conduct

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).
