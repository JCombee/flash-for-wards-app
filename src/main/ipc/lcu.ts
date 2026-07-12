import { ipcMain } from 'electron'
import { getLcuPages, overwriteLcuPage } from '../lcu/rune-api'
import { lcuConnection } from '../lcu/connection'
import { getRunePageById, updateLastUsed } from '../db/rune-pages-repo'
import { getSettings } from '../db/settings-repo'
import type { ApplyResult, LcuStatus, RunePageData } from '@shared/index'

let currentStatus: LcuStatus = { status: 'disconnected' }
let inChampSelect = false

export function setCurrentStatus(status: LcuStatus): void {
  currentStatus = status
}

export function setInChampSelect(active: boolean): void {
  inChampSelect = active
}

/** Push a rune selection into the reserved LCU page. Shared by both apply paths. */
async function applyToReservedPage(
  page: Pick<RunePageData, 'primaryStyleId' | 'subStyleId' | 'selectedPerkIds'>
): Promise<ApplyResult> {
  if (!lcuConnection.isConnected()) {
    return { success: false, error: 'lcu_disconnected' }
  }

  // Overwriting the reserved page outside champ select would clobber it for no
  // reason — refuse regardless of what the renderer asks for.
  if (!inChampSelect) return { success: false, error: 'not_in_champ_select' }

  const settings = getSettings()
  if (!settings.reservedPageId) return { success: false, error: 'no_reserved_page' }

  try {
    const credentials = lcuConnection.getCredentials()
    const lcuPages = await getLcuPages(credentials)
    const reservedLcuPage = lcuPages.find((p) => p.id === settings.reservedPageId)
    if (!reservedLcuPage) return { success: false, error: 'reserved_page_missing' }
    await overwriteLcuPage(credentials, settings.reservedPageId, reservedLcuPage.name, page)
    return { success: true }
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string; body?: string }
    if (e.statusCode === 404) return { success: false, error: 'reserved_page_missing' }
    return {
      success: false,
      error: 'unknown',
      errorDetail: e.message ?? String(err)
    }
  }
}

export function registerLcuHandlers(): void {
  ipcMain.handle('lcu:status:get', () => currentStatus)

  ipcMain.handle('lcu:pages:list', async () => {
    const credentials = lcuConnection.getCredentials()
    return getLcuPages(credentials)
  })

  ipcMain.handle('lcu:pages:apply', async (_e, storedPageId: string): Promise<ApplyResult> => {
    const page = getRunePageById(storedPageId)
    if (!page) return { success: false, error: 'page_not_found' }

    const result = await applyToReservedPage(page)
    if (result.success) updateLastUsed(storedPageId, Date.now())
    return result
  })

  // Built-in default pages live in bundled data, not the DB — they're applied by
  // value, and there's no stored row to stamp last-used on.
  ipcMain.handle('lcu:pages:apply-data', (_e, page: RunePageData): Promise<ApplyResult> =>
    applyToReservedPage(page)
  )
}
