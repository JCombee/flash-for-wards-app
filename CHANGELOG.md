# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.5.0] - 2026-07-13

### Added

- Rune pages can now be tagged with the positions and game modes they are for. In champion select, pages matching your assigned position and the queue you are in are shown first. Pages tagged for something else are ranked lower, never hidden.
- Win/loss record per rune page. When you apply a page and the game is played, the result is read back from your match history and shown on the page as `12W 5L · 71%`. Dodges, remakes and Practice Tool games are not counted, and a game that was still running when you closed the app is picked up the next time you open it.
- Share codes: copy a rune page to a code you can paste to someone else, and import a page from a code. The page is previewed before it is saved.
- Share a rune page as an image: copy it to the clipboard or save it as a PNG, ready to drop into Discord.
- Tray icon. Closing the window now keeps the app running in the tray (switch it off under Settings → Behavior), where you can apply a pinned page without opening the window.

## [1.4.0] - 2026-07-13

### Added

- First-time setup can now reserve a rune page you already have in the client, instead of only the one you create and name "Flash For Wards Reserved". Your pages are listed as soon as the League client connects.

### Changed

- Launching Flash For Wards while it is already running now focuses the existing window instead of opening a second copy.

## [1.3.0] - 2026-07-12

### Added

- Riot's recommended rune page for every champion, bundled with the app. It shows up in champion select for the champion you picked — even if you already have your own pages for them — is browsable from My Rune Pages, and can be saved as a page of your own.
- The app now has its own icon in the window, taskbar and installer, instead of Electron's default.

### Changed

- Champion select focuses the window once instead of pinning it in front for the whole phase. Click back to the League client and it drops behind again like any other window.

### Fixed

- The Apply button in champion select did nothing when clicked — only clicking the card body applied the page.
- Applying a page marked every page sharing its name as applied, instead of just the one you applied.
- Applying a page outside champion select overwrote the reserved page in the client for no reason. It is now refused.

## [1.2.1] - 2026-07-12

### Added

- App logo in the sidebar.

### Changed

- Internal: the renderer is now built from a shared component library (`src/renderer/src/components/ui/`) with named design tokens, replacing Tailwind class strings duplicated across screens.
- Rounded corners, borders, and hover states are now consistent across the app.

## [1.2.0] - 2026-07-12

### Added

- Launch on system startup: opt-in setting under Settings → Behavior that registers the app as an OS login item.

## [1.1.0] - 2026-07-12

### Added

- Automatic updates: the app checks GitHub releases on launch (and every 4 hours), downloads new versions in the background, and shows a "Restart now" banner when an update is ready.
- Project documentation: README, LICENSE, contributing guide, code of conduct, security policy, issue and PR templates.

### Fixed

- Windows app user model ID now matches the installer's app ID, so update and restart notifications are attributed to the app.

## [1.0.0]

### Added

- Unlimited local rune page library backed by SQLite (`~/.flash-for-wards/data.db`).
- One-click apply — overwrites a reserved rune page in the League client.
- Onboarding flow to detect or manually pick the reserved page.
- LCU connection with automatic reconnect and a live status bar.
- Champion select detection (WebSocket events with polling fallback); window raises above the fullscreen client.
- Champion-preferred rune pages surfaced during champ select.
- Import rune pages from the League client.
- Pin and duplicate rune pages.
- Split rune page editor with Runes and Champions tabs.

[Unreleased]: https://github.com/JCombee/flash-for-wards-app/compare/v1.5.0...HEAD
[1.5.0]: https://github.com/JCombee/flash-for-wards-app/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/JCombee/flash-for-wards-app/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/JCombee/flash-for-wards-app/compare/v1.2.1...v1.3.0
[1.2.1]: https://github.com/JCombee/flash-for-wards-app/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/JCombee/flash-for-wards-app/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/JCombee/flash-for-wards-app/releases/tag/v1.1.0
[1.0.0]: https://github.com/JCombee/flash-for-wards-app/releases/tag/v1.0.0
