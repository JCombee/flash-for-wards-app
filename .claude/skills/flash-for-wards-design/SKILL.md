---
name: flash-for-wards-design
description: Design rules for Flash For Wards UI — palette, type, shape, motion, tone, and the component primitives to build with. Use whenever adding or reshaping renderer UI, or producing mocks/prototypes of the app.
---

# Flash For Wards — design system

Imported from the Claude design-system project of the same name. That project was generated
by reading this repo, so it describes the app's own decisions — this file is the canonical
copy, and the code in `src/renderer/src/components/ui/` is the canonical implementation.

## Build with the primitives, not raw Tailwind

`src/renderer/src/components/ui/` holds every primitive. Reach for these before writing a new
`className` string; a new one-off button or modal in a feature component is a bug.

| Primitive             | Use for                                                              |
| --------------------- | -------------------------------------------------------------------- |
| `Button`              | every button — `primary` / `secondary` / `ghost` / `danger` / `success` / `info`, `sm` / `md` |
| `NavItem`             | sidebar rows; `live` renders the pulsing blue dot                    |
| `Notice`              | inline status banner — `info` / `success` / `danger` / `warning`     |
| `Input`               | single-line text fields                                              |
| `Toggle`              | the app's one switch control (label + hint)                          |
| `Tabs`                | segmented pill tabs                                                  |
| `Badge`               | pill labels — `neutral` chips, `accent` chips with optional `onRemove` |
| `StatusDot`           | LCU connection indicator                                             |
| `Modal`               | scrim + centered panel; `strong` = darker scrim for blocking first-run flows |
| `IconTile`            | selectable circular rune/champion icon (dim+grayscale → gold ring)   |

## Foundations

- **Palette.** Near-black `#010A13` (app) and `#0A1628` (panels/cards), a single gold accent
  `#C89B3C`, warm off-white `#F0E6D3` for headings, and cyan-blue `#0BC4E3` reserved *only* for
  live/in-progress states (champ select). Status colors are stock Tailwind green/red/yellow-400.
  Tokens live in `src/renderer/src/styles/tokens.css` as RGB triplets; Tailwind composes them
  with alpha (`border-lol-gold/20`).
- **Depth is borders, never shadow.** Every raised surface is a 1px gold-alpha border
  (`gold/20` default → `gold/40` hover → `gold/60` focus/active) on a slightly lighter fill.
  `box-shadow` appears exactly once in the app (the rune tooltip). No blur, anywhere.
- **Type.** System UI stack only — `'Segoe UI', system-ui, sans-serif`. No webfont: this is a
  Windows-first desktop utility and should look native. Five sizes (12/14/16/18/20px); weight
  does the differentiating, not size.
- **Shape.** Two radii only: 4px (`rounded` — buttons, inputs, badges, tabs) and 8px
  (`rounded-lg` — cards, panels, modals). Icons are true circles.
- **Backgrounds** are flat solid fills. No gradients, photography, illustration, or texture.
- **Motion** is 150ms color/opacity transitions, plus `animate-pulse` on exactly two things: the
  "connecting" status dot and the live champ-select indicator. Nothing scales, translates, or
  bounces on hover. Disabled = `opacity-50` + `cursor-not-allowed`.
- **Selection** (the signature interaction): unselected is 40% opacity + grayscale; selected is
  full color inside a 2px gold ring. No checkmarks, no size change.

## Iconography

- Champion and rune art streams **live from Community Dragon** (`raw.communitydragon.org`) — the
  URLs are already in `src/renderer/src/data/{champions,runes}.json`. Never bundle this art.
- UI glyphs are a small set of Unicode characters, not an icon font: `★`/`☆` (pin), `✎` (rename),
  `→` (advance), `⬇` (import), `×` (close), `✓` (multi-select). No Lucide/Heroicons dependency.
- **No emoji, anywhere.**
- The logo (`src/renderer/src/assets/logo-icon.svg`) is a gold "ward ring + Flash bolt" mark. It
  was designed for the design system, not by the app author or Riot — swap it if a real mark ever
  lands.

## Tone

Terse, technical, second-person. No exclamation points, no hype, no jokes. Row actions are one
word ("Edit", "Copy", "Del") — density over politeness. Errors name the mechanism, not the
sentiment: "Reserved page deleted — re-run Setup in Settings", not "Something went wrong".
Settings section labels are ALL CAPS with wide tracking; body copy is sentence case.

Flash For Wards is an unofficial fan utility. Never imply Riot Games affiliation or endorsement.
