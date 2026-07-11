// Static rune metadata bundled from Community Dragon. Regenerate with
// `node scripts/generate-runes.mjs`. Renderer-only — not part of @shared types.
import runesJson from './runes.json'

export interface Perk {
  id: number
  name: string
  shortDesc: string
  iconUrl: string
}

export interface RuneStyle {
  id: number
  name: string
  subdesc: string
  iconUrl: string
  /** slots[0] = keystones, slots[1..3] = the three rune rows. */
  slots: Perk[][]
}

export interface StatShardRow {
  key: 'offense' | 'flex' | 'defense'
  perks: Perk[]
}

const data = runesJson as { styles: RuneStyle[]; statShardRows: StatShardRow[] }

/** Primary styles in client order (Precision, Domination, Sorcery, Inspiration, Resolve). */
export const RUNE_STYLES: RuneStyle[] = data.styles
export const STAT_SHARD_ROWS: StatShardRow[] = data.statShardRows

export const STYLE_BY_ID = new Map<number, RuneStyle>(RUNE_STYLES.map((s) => [s.id, s]))

export const PERK_BY_ID = new Map<number, Perk>()
for (const style of RUNE_STYLES) {
  for (const slot of style.slots) {
    for (const perk of slot) PERK_BY_ID.set(perk.id, perk)
  }
}
for (const row of STAT_SHARD_ROWS) {
  for (const perk of row.perks) PERK_BY_ID.set(perk.id, perk)
}
