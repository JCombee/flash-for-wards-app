# Flash For Wards

A desktop rune page manager for League of Legends. Store as many rune pages as you want outside the game client, and push any of them into the client with one click — including during champion select.

The League client caps you at a handful of rune pages unless you pay. Flash For Wards works around that cap by keeping your pages in a local database and overwriting a single **reserved page** in the client on demand. You get an unlimited library; the client only ever sees one extra page.

> Not affiliated with, endorsed, or sponsored by Riot Games. See [Legal](#legal).

## Features

- **Unlimited rune pages**, stored locally in SQLite.
- **One-click apply** — overwrites your reserved client page with the selected build.
- **Champion select integration** — detects when you enter champ select, raises the window above the (fullscreen) client, and surfaces the pages you linked to the champion you locked in.
- **Import from client** — pull existing rune pages out of the League client into your library.
- **Per-champion preferences** — tag a page with one or more champions so it's suggested automatically.
- **Pinning and duplication** for fast iteration on builds.

## How it works

Flash For Wards talks to the **League Client Update (LCU) API** — the same local HTTPS API the client itself uses. It reads credentials from the running client process, so no login, token, or Riot account access is involved.

```
LCU (LoL client) ←—HTTPS/WS—→ Main process ←—IPC—→ Preload ←—→ Renderer (React)
                                    │
                              sql.js SQLite
                             ~/.flash-for-wards/data.db
```

Applying a page does not create a new page in the client — it **overwrites the reserved page you picked during onboarding**. Pick an empty throwaway page for that, not one you care about.

## Install

Grab an installer from [Releases](https://github.com/JCombee/flash-for-wards-app/releases), or build from source:

```bash
git clone git@github.com:JCombee/flash-for-wards-app.git
cd flash-for-wards-app
npm install
npm run build:win   # or build:mac / build:linux
```

Requires Node.js 20+.

## First run

1. Open the League of Legends client and log in.
2. In the client, go to **Collection → Rune Pages** and create an empty page. This is the page Flash For Wards will overwrite — don't use a page you want to keep.
3. Launch Flash For Wards. The onboarding modal loads your client pages; select the one you just created.

That's it. The status bar shows the LCU connection state.

## Development

```bash
npm run dev          # hot-reload dev server (electron-vite)
npm run build        # typecheck + production build
npm run typecheck    # node + web tsconfigs
npm run lint         # ESLint
npm run format       # Prettier
```

There is no test suite yet. Architecture notes for contributors live in [CLAUDE.md](CLAUDE.md) and [CONTRIBUTING.md](CONTRIBUTING.md).

**Stack:** Electron + electron-vite, React 19, Zustand, Tailwind, sql.js (SQLite via WASM), `league-connect` for LCU discovery.

## Data & privacy

Everything is local. Rune pages and settings are stored in `~/.flash-for-wards/data.db`. The app makes no network requests except to the League client on `127.0.0.1`. No telemetry, no accounts, no external servers.

## Is this allowed?

The LCU API is unofficial but widely used, and Riot has publicly tolerated third-party tools built on it (rune importers, match trackers, etc.). Flash For Wards only reads and writes rune pages — it does not automate gameplay, script inputs, or read game memory. Use at your own risk; see [LICENSE](LICENSE) for the warranty disclaimer.

## Contributing

Issues and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) first, and note the [Code of Conduct](CODE_OF_CONDUCT.md). Security issues: see [SECURITY.md](SECURITY.md).

## Legal

Flash For Wards isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games and all associated properties are trademarks or registered trademarks of Riot Games, Inc.

## License

[MIT](LICENSE) © Jerke Combee
