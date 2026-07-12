import type { BrowserWindow } from 'electron'
import { is } from '@electron-toolkit/utils'
import electronUpdater from 'electron-updater'
import type { UpdateStatus } from '@shared/index'

const { autoUpdater } = electronUpdater

const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000

let checkTimer: NodeJS.Timeout | null = null

export function initUpdater(getWindow: () => BrowserWindow | null): void {
  // Packaged builds only — dev has no app-update.yml and no installed app to replace.
  if (is.dev) return

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  function send(status: UpdateStatus): void {
    const window = getWindow()
    if (window && !window.isDestroyed()) {
      window.webContents.send('update:status', status)
    }
  }

  autoUpdater.on('update-available', (info) => {
    send({ state: 'available', version: info.version })
  })

  autoUpdater.on('download-progress', (progress) => {
    send({ state: 'downloading', percent: Math.round(progress.percent) })
  })

  autoUpdater.on('update-downloaded', (info) => {
    send({ state: 'ready', version: info.version })
  })

  autoUpdater.on('error', (err) => {
    // Offline or GitHub unreachable is a normal state — never let it bubble up.
    console.error('[updater]', err)
    send({ state: 'error', message: err.message })
  })

  void check()
  checkTimer = setInterval(check, CHECK_INTERVAL_MS)
}

async function check(): Promise<void> {
  try {
    await autoUpdater.checkForUpdates()
  } catch (err) {
    console.error('[updater] check failed', err)
  }
}

export function stopUpdater(): void {
  if (checkTimer) {
    clearInterval(checkTimer)
    checkTimer = null
  }
}

export function quitAndInstall(): void {
  // NSIS installer is oneClick: false — must run interactively, so no silent flag.
  autoUpdater.quitAndInstall()
}
