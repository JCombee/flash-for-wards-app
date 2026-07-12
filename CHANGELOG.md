# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/JCombee/flash-for-wards-app/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/JCombee/flash-for-wards-app/releases/tag/v1.0.0
