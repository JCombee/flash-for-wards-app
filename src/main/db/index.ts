import initSqlJs from 'sql.js'
import type { Database } from 'sql.js'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const DB_DIR = join(homedir(), '.flash-for-wards')
const DB_PATH = join(DB_DIR, 'data.db')

let db: Database | null = null

export async function initDb(): Promise<void> {
  mkdirSync(DB_DIR, { recursive: true })

  const SQL = await initSqlJs({
    locateFile: (file: string) => join(__dirname, '../../node_modules/sql.js/dist/', file)
  })

  if (existsSync(DB_PATH)) {
    const buf = readFileSync(DB_PATH)
    db = new SQL.Database(buf)
  } else {
    db = new SQL.Database()
  }

  runMigrations()
  persistDb()
}

export function getDb(): Database {
  if (!db) throw new Error('DB not initialized — call initDb() first')
  return db
}

export function persistDb(): void {
  if (!db) return
  writeFileSync(DB_PATH, Buffer.from(db.export()))
}

function runMigrations(): void {
  getDb().run(`
    CREATE TABLE IF NOT EXISTS rune_pages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      primary_style_id INTEGER NOT NULL,
      sub_style_id INTEGER NOT NULL,
      selected_perk_ids TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      last_used_at INTEGER,
      pinned INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY,
      reserved_page_id INTEGER,
      reserved_page_name TEXT NOT NULL DEFAULT 'Flash For Wards Reserved',
      onboarding_complete INTEGER NOT NULL DEFAULT 0,
      auto_focus_on_champ_select INTEGER NOT NULL DEFAULT 1
    );

    INSERT OR IGNORE INTO settings (id) VALUES (1);

    -- LCU rune page names cap out ~24 chars; shorten the old long default
    UPDATE settings
      SET reserved_page_name = 'Flash For Wards Reserved'
      WHERE reserved_page_name = 'Flash For Wards Reserved Rune Page';
  `)

  // Idempotent column add for pre-existing DBs (no ADD COLUMN IF NOT EXISTS in SQLite)
  if (!tableHasColumn('rune_pages', 'pinned')) {
    getDb().run('ALTER TABLE rune_pages ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0')
  }
}

function tableHasColumn(table: string, column: string): boolean {
  const stmt = getDb().prepare(`PRAGMA table_info(${table})`)
  let found = false
  while (stmt.step()) {
    const row = stmt.getAsObject() as Record<string, unknown>
    if (row['name'] === column) found = true
  }
  stmt.free()
  return found
}
