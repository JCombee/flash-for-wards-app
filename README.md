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

Prebuilt installers for every release are on the [Releases page](https://github.com/JCombee/flash-for-wards-app/releases/latest). Grab the one for your platform — you don't need Node.js, a compiler, or a checkout of this repo.

Once installed, the app updates itself: it checks the Releases feed on startup, downloads new versions in the background, and installs them on quit.

### Windows

1. Download the `.exe` installer (`Flash For Wards-<version>-setup.exe`) from the latest release.
2. Run it. The installer is not code-signed, so Windows SmartScreen will show a **"Windows protected your PC"** dialog. Click **More info → Run anyway** to continue.
3. Pick an install directory (or accept the default) and finish the wizard.
4. Launch **Flash For Wards** from the Start menu.

### macOS

1. Download the `.dmg` from the latest release. Releases are built on Apple Silicon runners, so the `.dmg` targets **arm64** (M1/M2/M3/M4). On an Intel Mac, [build from source](#build-from-source) instead.
2. Open the `.dmg` and drag **Flash For Wards** into your **Applications** folder.
3. The app is not notarized, so Gatekeeper blocks the first launch. Open it once via **right-click → Open** in Applications and confirm the prompt. If macOS still refuses ("app is damaged"), clear the quarantine flag:

   ```bash
   xattr -dr com.apple.quarantine "/Applications/Flash For Wards.app"
   ```

4. Subsequent launches work normally.

### Linux

Download the `.AppImage`, mark it executable (`chmod +x`), and run it.

## Build from source

Only needed if you want to modify the app or you'd rather not run an unsigned binary. Requires **Node.js 20+**.

```bash
git clone git@github.com:JCombee/flash-for-wards-app.git
cd flash-for-wards-app
npm install
npm run build:win     # or build:mac / build:linux
```

The installer lands in `dist/`. Build on the platform you're targeting — cross-compiling Electron installers is not supported here.

To run without packaging, use `npm run dev` (see [Development](#development)).

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
