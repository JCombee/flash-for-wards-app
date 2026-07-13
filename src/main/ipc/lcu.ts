import { ipcMain } from 'electron'
import { getLcuPages } from '../lcu/rune-api'
import { lcuConnection } from '../lcu/connection'
import { applyToReservedPage, getCurrentStatus } from '../lcu/apply'
import { getLastSnapshot } from '../lcu/roster'
import { getRunePageById, updateLastUsed } from '../db/rune-pages-repo'
import { notePageApplied } from '../tracking/game-tracker'
import type { ApplyResult, RunePageData } from '@shared/index'

export function registerLcuHandlers(): void {
  ipcMain.handle('lcu:status:get', () => getCurrentStatus())

  // The roster is pushed as it changes; this is only for a renderer that mounts
  // in the middle of a game and missed those pushes.
  ipcMain.handle('in-game:get', () => getLastSnapshot())

  ipcMain.handle('lcu:pages:list', async () => {
    const credentials = lcuConnection.getCredentials()
    return getLcuPages(credentials)
  })

  ipcMain.handle('lcu:pages:apply', async (_e, storedPageId: string): Promise<ApplyResult> => {
    const page = getRunePageById(storedPageId)
    if (!page) return { success: false, error: 'page_not_found' }

    const result = await applyToReservedPage(page)
    if (result.success) {
      updateLastUsed(storedPageId, Date.now())
      notePageApplied(storedPageId, page.selectedPerkIds)
    }
    return result
  })

  // Built-in default pages live in bundled data, not the DB — they're applied by
  // value, and there's no stored row to stamp last-used on. That also means there's
  // nothing to attribute a win or loss to, so these games aren't tracked; saving
  // the page forks it into a normal row that is.
  ipcMain.handle('lcu:pages:apply-data', (_e, page: RunePageData): Promise<ApplyResult> =>
    applyToReservedPage(page)
  )
}
