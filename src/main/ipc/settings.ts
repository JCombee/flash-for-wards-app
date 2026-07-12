import { ipcMain } from 'electron'
import { getSettings, updateSettings } from '../db/settings-repo'
import { getLcuPages } from '../lcu/rune-api'
import { lcuConnection } from '../lcu/connection'
import { applyLaunchOnStartup } from '../startup'
import type { AppSettings } from '@shared/index'

export function registerSettingsHandlers(): void {
  ipcMain.handle('db:settings:get', () => getSettings())

  ipcMain.handle('db:settings:set', (_e, data: Partial<AppSettings>) => {
    const settings = updateSettings(data)
    if (data.launchOnStartup !== undefined) {
      applyLaunchOnStartup(settings.launchOnStartup)
    }
    return settings
  })

  ipcMain.handle('lcu:find-reserved-page', async () => {
    if (!lcuConnection.isConnected()) {
      return { found: false, error: 'lcu_disconnected' }
    }

    try {
      const credentials = lcuConnection.getCredentials()
      const settings = getSettings()
      const pages = await getLcuPages(credentials)
      const match = pages.find(
        (p) => p.name.trim().toLowerCase() === settings.reservedPageName.trim().toLowerCase()
      )
      if (!match) return { found: false, error: 'not_found' }
      updateSettings({ reservedPageId: match.id })
      return { found: true, pageId: match.id, pageName: match.name }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      return { found: false, error: 'request_failed', message: msg }
    }
  })
}
