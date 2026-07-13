import type { StoredRunePage } from '../types'

/** The champ-select context a page is ranked against. */
export interface PageContext {
  championId: number
  /** Uppercase; empty in blind pick / ARAM, where Riot assigns no position. */
  position: string
  /** CLASSIC / ARAM / …; empty when the queue isn't known. */
  gameMode: string
}

const POSITION_LABELS: Record<string, string> = {
  TOP: 'Top',
  JUNGLE: 'Jungle',
  MIDDLE: 'Mid',
  BOTTOM: 'Bot',
  UTILITY: 'Support'
}

const GAME_MODE_LABELS: Record<string, string> = {
  CLASSIC: "Summoner's Rift",
  ARAM: 'ARAM',
  CHERRY: 'Arena',
  URF: 'URF',
  NEXUSBLITZ: 'Nexus Blitz'
}

export function formatPosition(position: string): string {
  return POSITION_LABELS[position] ?? position
}

export function formatGameMode(mode: string): string {
  return GAME_MODE_LABELS[mode] ?? mode
}

/**
 * How well a page fits the current champ select. Pages that declare nothing stay
 * neutral, so a page tagged for a *different* position or mode ranks below an
 * untagged one — but never disappears. Hiding pages under a champ-select timer
 * is worse than showing one too many.
 */
export function scorePage(page: StoredRunePage, ctx: PageContext): number {
  let score = 0

  if (ctx.position && page.positions?.length) {
    score += page.positions.includes(ctx.position as never) ? 2 : -2
  }
  if (ctx.gameMode && page.gameModes?.length) {
    score += page.gameModes.includes(ctx.gameMode) ? 2 : -2
  }

  return score
}

/** Context fit first, then the usual pinned / most-recent ordering. */
export function rankPages(pages: StoredRunePage[], ctx: PageContext): StoredRunePage[] {
  return [...pages].sort(
    (a, b) =>
      scorePage(b, ctx) - scorePage(a, ctx) ||
      Number(b.pinned ?? false) - Number(a.pinned ?? false) ||
      (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0)
  )
}
