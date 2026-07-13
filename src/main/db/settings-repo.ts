import { getDb, persistDb } from './index'
import type { AppSettings } from '@shared/index'

function execRow(
  sql: string,
  params: (string | number | null)[] = []
): Record<string, unknown> | undefined {
  const stmt = getDb().prepare(sql)
  stmt.bind(params)
  const row = stmt.step() ? (stmt.getAsObject() as Record<string, unknown>) : undefined
  stmt.free()
  return row
}

function rowToSettings(row: Record<string, unknown>): AppSettings {
  return {
    reservedPageId: (row['reserved_page_id'] as number | null) ?? null,
    reservedPageName: row['reserved_page_name'] as string,
    onboardingComplete: row['onboarding_complete'] === 1,
    autoFocusOnChampSelect: row['auto_focus_on_champ_select'] === 1,
    launchOnStartup: row['launch_on_startup'] === 1,
    closeToTray: row['close_to_tray'] === 1
  }
}

export function getSettings(): AppSettings {
  const row = execRow('SELECT * FROM settings WHERE id = 1')
  if (!row) throw new Error('Settings row missing — DB not initialized?')
  return rowToSettings(row)
}

export function updateSettings(data: Partial<AppSettings>): AppSettings {
  const sets: string[] = []
  const values: (string | number | null)[] = []

  if (data.reservedPageId !== undefined) {
    sets.push('reserved_page_id = ?')
    values.push(data.reservedPageId)
  }
  if (data.reservedPageName !== undefined) {
    sets.push('reserved_page_name = ?')
    values.push(data.reservedPageName)
  }
  if (data.onboardingComplete !== undefined) {
    sets.push('onboarding_complete = ?')
    values.push(data.onboardingComplete ? 1 : 0)
  }
  if (data.autoFocusOnChampSelect !== undefined) {
    sets.push('auto_focus_on_champ_select = ?')
    values.push(data.autoFocusOnChampSelect ? 1 : 0)
  }
  if (data.launchOnStartup !== undefined) {
    sets.push('launch_on_startup = ?')
    values.push(data.launchOnStartup ? 1 : 0)
  }
  if (data.closeToTray !== undefined) {
    sets.push('close_to_tray = ?')
    values.push(data.closeToTray ? 1 : 0)
  }

  if (sets.length > 0) {
    values.push(1)
    getDb().run(`UPDATE settings SET ${sets.join(', ')} WHERE id = ?`, values)
    persistDb()
  }

  return getSettings()
}
