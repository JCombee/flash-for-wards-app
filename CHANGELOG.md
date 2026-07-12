# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Project documentation: README, LICENSE, contributing guide, code of conduct, security policy, issue and PR templates.

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
