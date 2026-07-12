---
name: run-flash-for-wards
description: Build, run, screenshot, and drive the Flash For Wards Electron app (LoL rune manager). Use when asked to start the app, take a screenshot of it, click through its UI, or confirm a renderer change works in the real app.
---

Flash For Wards is an Electron desktop app. It has a window, so the only
way an agent can "see" it is through the Playwright REPL driver at
`.claude/skills/run-flash-for-wards/driver.mjs` — pipe it commands, get
screenshots back.

All paths below are relative to the repo root. Verified on Windows 11 /
PowerShell + Git Bash.

## Prerequisites

`playwright-core` is a devDependency (it drives Electron). A plain
`npm install` is enough:

```bash
npm install
```

## Build

The driver launches the **built** app from `out/`, not the dev server:

```bash
npm run build
```

This runs `typecheck` then `electron-vite build`. Rebuild after any
change to `src/` — the driver does not hot-reload.

## Run (agent path)

Pipe a command script into the driver. It launches the app, runs each
line in order, and exits:

```bash
node .claude/skills/run-flash-for-wards/driver.mjs <<'EOF'
launch
ss 01-list
click-text + New Page
ss 02-editor
type Conqueror Garen
press Enter
click-text Champions
ss 03-champions-tab
eval document.body.innerText.slice(0, 200)
quit
EOF
```

Screenshots land in `.shots/` (gitignored). Override with
`SCREENSHOT_DIR`. **Open them** — a blank frame means the launch failed.

### Commands

| command | what it does |
|---|---|
| `launch` | launch built app, wait for the rune-page list to render |
| `ss [name]` | screenshot → `.shots/<name>.png` |
| `click <css-sel>` | click element via DOM |
| `click-text <text>` | click the button/link with that visible label |
| `type <text>` / `press <key>` | keyboard input to the focused element |
| `wait <css-sel>` | wait for selector, 10s timeout |
| `eval <js>` | evaluate in the renderer, print JSON |
| `text [css-sel]` | print innerText |
| `status` | print the LCU status line from the status bar |
| `quit` | close the app and exit |

Lines starting with `#` are comments.

## Run (human path)

```bash
npm run dev   # electron-vite dev, hot reload, opens a window
```

## Gotchas

- **The UI has no ids, test hooks, or stable class names** — it's all
  inline Tailwind. `click-text` (match on visible label) is the only
  practical handle. That's why the driver leads with it.
- **`npm run dev` is not the driver's target.** The driver launches
  `electron.exe` against `out/`, so an unbuilt or stale `out/` silently
  shows you the *previous* version of your change. Always `npm run build`
  first. The driver hard-errors if `out/main/index.js` is missing.
- **The app talks to a real League client.** If the client is running,
  `status` reads `connected` and `⬇ Import from client` in the rune editor
  returns live pages. If it isn't, the app still launches fine and
  everything except LCU calls works — LCU-dependent assertions are the
  only thing you can't verify without League open.
- **`status` reads `connecting` for the first second or two after
  `launch`** — the LCU handshake hasn't finished. Don't assert on it
  immediately; re-run `status`, or `wait` on something else first.
- **The DOM holds the raw status string (`connected`, lowercase).** The
  capital `C` in the sidebar is CSS `capitalize`. Match case-insensitively
  if you write your own selector.
- **It writes to the real database** at `~/.flash-for-wards/data.db`.
  Pages you create while driving are permanent. Delete them, or accept
  the clutter.
- **Piped stdin needs a serialized queue.** readline emits every line
  before the first `await` resolves, and `close` fires before the queue
  drains. The driver handles both; if you fork it, don't drop that.

## Troubleshooting

- **Driver prints the banner and exits immediately, no commands run** —
  the `close`-before-queue-drain bug. Already fixed in `driver.mjs`.
- **`Cannot find package 'playwright-core'`** — it was previously
  `extraneous` in this repo (present in `node_modules`, absent from
  `package.json`), so `npm ci` wiped it. It's a devDependency now;
  `npm install`.
- **`ERROR: out/main/index.js missing`** — run `npm run build`.
- **Commands print `NOT_FOUND`** — the label you passed doesn't match any
  button text. `text` (dump innerText) to see what's actually on screen.
