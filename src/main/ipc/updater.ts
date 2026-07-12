import { app, ipcMain } from 'electron'
import { quitAndInstall } from '../updater'

export function registerUpdaterHandlers(): void {
  ipcMain.handle('updater:get-version', () => app.getVersion())

  ipcMain.handle('updater:install', () => {
    quitAndInstall()
  })
}
