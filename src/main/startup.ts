import { app } from 'electron'

/**
 * In dev the exe is electron.exe, so registering would launch a bare Electron
 * shell at login and leave a stale entry behind after uninstall.
 */
export function applyLaunchOnStartup(enabled: boolean): void {
  if (!app.isPackaged) return

  app.setLoginItemSettings({
    openAtLogin: enabled,
    path: app.getPath('exe'),
    args: []
  })
}

export function isLaunchOnStartupEnabled(): boolean {
  if (!app.isPackaged) return false
  return app.getLoginItemSettings({ path: app.getPath('exe') }).openAtLogin
}
