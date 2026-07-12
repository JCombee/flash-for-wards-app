// Riot's recommended rune page per champion, bundled from the League client.
// Regenerate with `npm run gen:default-runes` (needs the client running).
// These are built-in fallbacks, not stored pages — they never live in the DB
// until the user saves a copy.
import defaultPagesJson from './default-rune-pages.json'
import type { DefaultRunePage } from '../types'
import { CHAMPION_BY_ID } from './champions'

const BY_CHAMPION = new Map<number, DefaultRunePage>(
  Object.values(defaultPagesJson as Record<string, DefaultRunePage>).map((p) => [p.championId, p])
)

export function getDefaultRunePage(championId: number): DefaultRunePage | undefined {
  return BY_CHAMPION.get(championId)
}

/** Display name for a default page, e.g. "Aatrox — Recommended". */
export function defaultPageName(championId: number): string {
  const champion = CHAMPION_BY_ID.get(championId)
  return `${champion?.name ?? 'Champion'} — Recommended`
}
