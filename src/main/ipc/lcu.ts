import { ipcMain } from 'electron'
import { getLcuPages, overwriteLcuPage } from '../lcu/rune-api'
import { lcuConnection } from '../lcu/connection'
import { getRunePageById, updateLastUsed } from '../db/rune-pages-repo'
import { getSettings } from '../db/settings-repo'
import type { ApplyResult, LcuStatus } from '@shared/index'

let currentStatus: LcuStatus = { status: 'disconnected' }

export function setCurrentStatus(status: LcuStatus): void {
  currentStatus = status
}

export function registerLcuHandlers(): void {
  ipcMain.handle('lcu:status:get', () => currentStatus)

  ipcMain.handle('lcu:pages:list', async () => {
    const credentials = lcuConnection.getCredentials()
    return getLcuPages(credentials)
  })

  ipcMain.handle('lcu:pages:apply', async (_e, storedPageId: string): Promise<ApplyResult> => {
    if (!lcuConnection.isConnected()) {
      return { success: false, error: 'lcu_disconnected' }
    }

    const page = getRunePageById(storedPageId)
    if (!page) return { success: false, error: 'page_not_found' }

    const settings = getSettings()
    if (!settings.reservedPageId) return { success: false, error: 'no_reserved_page' }

    try {
      const credentials = lcuConnection.getCredentials()
      const lcuPages = await getLcuPages(credentials)
      const reservedLcuPage = lcuPages.find(p => p.id === settings.reservedPageId)
      if (!reservedLcuPage) return { success: false, error: 'reserved_page_missing' }
      await overwriteLcuPage(credentials, settings.reservedPageId, reservedLcuPage.name, page)
      updateLastUsed(storedPageId, Date.now())
      return { success: true }
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string; body?: string }
      if (e.statusCode === 404) return { success: false, error: 'reserved_page_missing' }
      return { success: false, error: 'unknown', errorDetail: e.message ?? String(err) }
    }
  })
}
