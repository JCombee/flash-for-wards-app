import { getDb, persistDb } from './index'
import type { GameOutcome, PageGame } from '@shared/index'

/** Give up on a game whose result match history never returns. */
export const MAX_RESOLVE_ATTEMPTS = 12

/** A pending row older than this is never going to resolve — stop trying. */
const MAX_PENDING_AGE_MS = 7 * 24 * 60 * 60 * 1000

export interface PageGameRow extends PageGame {
  puuid: string
  appliedAt: number
  resolvedAt?: number
  attempts: number
}

function rowToGame(row: Record<string, unknown>): PageGameRow {
  return {
    gameId: row['game_id'] as number,
    pageId: row['page_id'] as string,
    puuid: row['puuid'] as string,
    championId: row['champion_id'] as number,
    queueId: row['queue_id'] as number,
    gameMode: row['game_mode'] as string,
    position: row['position'] as string,
    appliedAt: row['applied_at'] as number,
    startedAt: row['started_at'] as number,
    resolvedAt: (row['resolved_at'] as number | null) ?? undefined,
    outcome: row['outcome'] as GameOutcome,
    attempts: row['attempts'] as number
  }
}

function execRows(sql: string, params: (string | number | null)[] = []): Record<string, unknown>[] {
  const stmt = getDb().prepare(sql)
  stmt.bind(params)
  const rows: Record<string, unknown>[] = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as Record<string, unknown>)
  }
  stmt.free()
  return rows
}

export function recordGameStart(
  game: Omit<PageGameRow, 'outcome' | 'attempts' | 'resolvedAt'>
): void {
  getDb().run(
    `INSERT OR REPLACE INTO page_games
       (game_id, page_id, puuid, champion_id, queue_id, game_mode, position, applied_at, started_at, outcome, attempts)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0)`,
    [
      game.gameId,
      game.pageId,
      game.puuid,
      game.championId,
      game.queueId,
      game.gameMode,
      game.position,
      game.appliedAt,
      game.startedAt
    ]
  )
  persistDb()
}

export function getPendingGames(): PageGameRow[] {
  const rows = execRows(
    `SELECT * FROM page_games
      WHERE outcome = 'pending' AND attempts < ? AND started_at > ?
      ORDER BY started_at DESC`,
    [MAX_RESOLVE_ATTEMPTS, Date.now() - MAX_PENDING_AGE_MS]
  )
  return rows.map(rowToGame)
}

export function resolveGame(gameId: number, outcome: Exclude<GameOutcome, 'pending'>): void {
  getDb().run('UPDATE page_games SET outcome = ?, resolved_at = ? WHERE game_id = ?', [
    outcome,
    Date.now(),
    gameId
  ])
  persistDb()
}

/** Count a failed lookup; a game that keeps failing eventually goes to 'unknown'. */
export function bumpAttempts(gameId: number): void {
  getDb().run(
    `UPDATE page_games
        SET attempts = attempts + 1,
            outcome = CASE WHEN attempts + 1 >= ? THEN 'unknown' ELSE outcome END
      WHERE game_id = ?`,
    [MAX_RESOLVE_ATTEMPTS, gameId]
  )
  persistDb()
}

export function getGamesForPage(pageId: string, limit = 25): PageGameRow[] {
  const rows = execRows(
    'SELECT * FROM page_games WHERE page_id = ? ORDER BY started_at DESC LIMIT ?',
    [pageId, limit]
  )
  return rows.map(rowToGame)
}

export function deleteGamesForPage(pageId: string): void {
  getDb().run('DELETE FROM page_games WHERE page_id = ?', [pageId])
  persistDb()
}
