import { v4 as uuidv4 } from 'uuid'
import { getDb, persistDb } from './index'
import { deleteGamesForPage } from './game-results-repo'
import type { RunePageStats, StoredRunePage } from '@shared/index'

/**
 * Win/loss is aggregated on read rather than kept as counters on the page row:
 * page_games is the only copy of the truth, so counters could drift out of it
 * permanently, and the DB is small enough in memory that the GROUP BY is free.
 */
const STATS_JOIN = `
  LEFT JOIN (
    SELECT page_id,
           COUNT(*) AS games,
           SUM(outcome = 'win') AS wins,
           SUM(outcome = 'loss') AS losses,
           SUM(outcome = 'remake') AS remakes,
           SUM(outcome = 'pending') AS pending
      FROM page_games
     GROUP BY page_id
  ) g ON g.page_id = p.id`

function rowToStats(row: Record<string, unknown>): RunePageStats | undefined {
  const games = (row['games'] as number | null) ?? 0
  if (games === 0) return undefined

  const wins = (row['wins'] as number | null) ?? 0
  const losses = (row['losses'] as number | null) ?? 0
  const decided = wins + losses

  return {
    games,
    wins,
    losses,
    remakes: (row['remakes'] as number | null) ?? 0,
    pending: (row['pending'] as number | null) ?? 0,
    winRate: decided > 0 ? wins / decided : null
  }
}

function rowToPage(row: Record<string, unknown>): StoredRunePage {
  return {
    stats: rowToStats(row),
    id: row['id'] as string,
    name: row['name'] as string,
    primaryStyleId: row['primary_style_id'] as number,
    subStyleId: row['sub_style_id'] as number,
    selectedPerkIds: JSON.parse(row['selected_perk_ids'] as string),
    createdAt: row['created_at'] as number,
    updatedAt: row['updated_at'] as number,
    lastUsedAt: (row['last_used_at'] as number | null) ?? undefined,
    pinned: (row['pinned'] as number) === 1,
    championIds: JSON.parse((row['champion_ids'] as string | null) ?? '[]'),
    positions: JSON.parse((row['positions'] as string | null) ?? '[]'),
    gameModes: JSON.parse((row['game_modes'] as string | null) ?? '[]')
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

function execRow(
  sql: string,
  params: (string | number | null)[] = []
): Record<string, unknown> | undefined {
  return execRows(sql, params)[0]
}

export function getAllRunePages(): StoredRunePage[] {
  const rows = execRows(
    `SELECT p.*, g.games, g.wins, g.losses, g.remakes, g.pending
       FROM rune_pages p ${STATS_JOIN}
      ORDER BY p.pinned DESC, p.last_used_at DESC, p.created_at DESC`
  )
  return rows.map(rowToPage)
}

export function getRunePageById(id: string): StoredRunePage | undefined {
  const row = execRow(
    `SELECT p.*, g.games, g.wins, g.losses, g.remakes, g.pending
       FROM rune_pages p ${STATS_JOIN}
      WHERE p.id = ?`,
    [id]
  )
  return row ? rowToPage(row) : undefined
}

export function createRunePage(
  data: Omit<StoredRunePage, 'id' | 'createdAt' | 'updatedAt'>
): StoredRunePage {
  const id = uuidv4()
  const now = Date.now()
  getDb().run(
    `INSERT INTO rune_pages (id, name, primary_style_id, sub_style_id, selected_perk_ids, created_at, updated_at, champion_ids, positions, game_modes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.name,
      data.primaryStyleId,
      data.subStyleId,
      JSON.stringify(data.selectedPerkIds),
      now,
      now,
      JSON.stringify(data.championIds ?? []),
      JSON.stringify(data.positions ?? []),
      JSON.stringify(data.gameModes ?? [])
    ]
  )
  persistDb()
  return getRunePageById(id)!
}

export function updateRunePage(
  id: string,
  data: Partial<Omit<StoredRunePage, 'id' | 'createdAt'>>
): StoredRunePage {
  const now = Date.now()
  const sets: string[] = ['updated_at = ?']
  const values: (string | number | null)[] = [now]

  if (data.name !== undefined) {
    sets.push('name = ?')
    values.push(data.name)
  }
  if (data.primaryStyleId !== undefined) {
    sets.push('primary_style_id = ?')
    values.push(data.primaryStyleId)
  }
  if (data.subStyleId !== undefined) {
    sets.push('sub_style_id = ?')
    values.push(data.subStyleId)
  }
  if (data.selectedPerkIds !== undefined) {
    sets.push('selected_perk_ids = ?')
    values.push(JSON.stringify(data.selectedPerkIds))
  }
  if (data.lastUsedAt !== undefined) {
    sets.push('last_used_at = ?')
    values.push(data.lastUsedAt)
  }
  if (data.pinned !== undefined) {
    sets.push('pinned = ?')
    values.push(data.pinned ? 1 : 0)
  }
  if (data.championIds !== undefined) {
    sets.push('champion_ids = ?')
    values.push(JSON.stringify(data.championIds))
  }
  if (data.positions !== undefined) {
    sets.push('positions = ?')
    values.push(JSON.stringify(data.positions))
  }
  if (data.gameModes !== undefined) {
    sets.push('game_modes = ?')
    values.push(JSON.stringify(data.gameModes))
  }

  values.push(id)
  getDb().run(`UPDATE rune_pages SET ${sets.join(', ')} WHERE id = ?`, values)
  persistDb()
  return getRunePageById(id)!
}

export function deleteRunePage(id: string): void {
  getDb().run('DELETE FROM rune_pages WHERE id = ?', [id])
  // The page is gone, so its win/loss record has nothing left to describe.
  deleteGamesForPage(id)
  persistDb()
}

export function updateLastUsed(id: string, timestamp: number): void {
  getDb().run('UPDATE rune_pages SET last_used_at = ? WHERE id = ?', [timestamp, id])
  persistDb()
}
