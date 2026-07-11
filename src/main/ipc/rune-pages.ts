import { ipcMain } from 'electron'
import {
  getAllRunePages,
  getRunePageById,
  createRunePage,
  updateRunePage,
  deleteRunePage
} from '../db/rune-pages-repo'
import { getLcuPages } from '../lcu/rune-api'
import { lcuConnection } from '../lcu/connection'
import type { StoredRunePage } from '@shared/index'

export function registerRunePageHandlers(): void {
  ipcMain.handle('db:rune-pages:get', () => getAllRunePages())

  ipcMain.handle('db:rune-pages:create', (_e, data: Omit<StoredRunePage, 'id' | 'createdAt' | 'updatedAt'>) =>
    createRunePage(data)
  )

  ipcMain.handle(
    'db:rune-pages:update',
    (_e, id: string, data: Partial<Omit<StoredRunePage, 'id' | 'createdAt'>>) =>
      updateRunePage(id, data)
  )

  ipcMain.handle('db:rune-pages:delete', (_e, id: string) => deleteRunePage(id))

  ipcMain.handle('db:rune-pages:import-from-lcu', async (_e, lcuPageId: number) => {
    const credentials = lcuConnection.getCredentials()
    const pages = await getLcuPages(credentials)
    const page = pages.find((p) => p.id === lcuPageId)
    if (!page) throw new Error('LCU page not found')
    return createRunePage({
      name: page.name,
      primaryStyleId: page.primaryStyleId,
      subStyleId: page.subStyleId,
      selectedPerkIds: page.selectedPerkIds
    })
  })
}
