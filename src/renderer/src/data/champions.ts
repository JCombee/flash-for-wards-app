// Static champion metadata bundled from Community Dragon. Regenerate with
// `node scripts/generate-champions.mjs`. Renderer-only — not part of @shared types.
import championsJson from './champions.json'

export interface Champion {
  id: number
  name: string
  iconUrl: string
}

/** All champions, sorted by name. */
export const CHAMPIONS: Champion[] = championsJson as Champion[]

export const CHAMPION_BY_ID = new Map<number, Champion>(CHAMPIONS.map((c) => [c.id, c]))
