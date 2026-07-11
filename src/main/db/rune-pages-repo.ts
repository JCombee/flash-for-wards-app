import { v4 as uuidv4 } from 'uuid'
import { getDb, persistDb } from './index'
import type { StoredRunePage } from '@shared/index'

function rowToPage(row: Record<string, unknown>): StoredRunePage {
  return {
    id: row['id'] as string,
    name: row['name'] as string,
    primaryStyleId: row['primary_style_id'] as number,
    subStyleId: row['sub_style_id'] as number,
    selectedPerkIds: JSON.parse(row['selected_perk_ids'] as string),
    createdAt: row['created_at'] as number,
    updatedAt: row['updated_at'] as number,
    lastUsedAt: (row['last_used_at'] as number | null) ?? undefined
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

function execRow(sql: string, params: (string | number | null)[] = []): Record<string, unknown> | undefined {
  return execRows(sql, params)[0]
}

export function getAllRunePages(): StoredRunePage[] {
  const rows = execRows('SELECT * FROM rune_pages ORDER BY last_used_at DESC, created_at DESC')
  return rows.map(rowToPage)
}

export function getRunePageById(id: string): StoredRunePage | undefined {
  const row = execRow('SELECT * FROM rune_pages WHERE id = ?', [id])
  return row ? rowToPage(row) : undefined
}

export function createRunePage(
  data: Omit<StoredRunePage, 'id' | 'createdAt' | 'updatedAt'>
): StoredRunePage {
  const id = uuidv4()
  const now = Date.now()
  getDb().run(
    `INSERT INTO rune_pages (id, name, primary_style_id, sub_style_id, selected_perk_ids, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, data.name, data.primaryStyleId, data.subStyleId, JSON.stringify(data.selectedPerkIds), now, now]
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

  if (data.name !== undefined) { sets.push('name = ?'); values.push(data.name) }
  if (data.primaryStyleId !== undefined) { sets.push('primary_style_id = ?'); values.push(data.primaryStyleId) }
  if (data.subStyleId !== undefined) { sets.push('sub_style_id = ?'); values.push(data.subStyleId) }
  if (data.selectedPerkIds !== undefined) { sets.push('selected_perk_ids = ?'); values.push(JSON.stringify(data.selectedPerkIds)) }
  if (data.lastUsedAt !== undefined) { sets.push('last_used_at = ?'); values.push(data.lastUsedAt) }

  values.push(id)
  getDb().run(`UPDATE rune_pages SET ${sets.join(', ')} WHERE id = ?`, values)
  persistDb()
  return getRunePageById(id)!
}

export function deleteRunePage(id: string): void {
  getDb().run('DELETE FROM rune_pages WHERE id = ?', [id])
  persistDb()
}

export function updateLastUsed(id: string, timestamp: number): void {
  getDb().run('UPDATE rune_pages SET last_used_at = ? WHERE id = ?', [timestamp, id])
  persistDb()
}
