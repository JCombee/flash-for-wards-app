import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { initDb } from './db/index'
import { lcuConnection } from './lcu/connection'
import { getGameflowPhase, getChampSelectSession } from './lcu/rune-api'
import { registerRunePageHandlers } from './ipc/rune-pages'
import { registerSettingsHandlers } from './ipc/settings'
import { registerLcuHandlers, setCurrentStatus } from './ipc/lcu'
import { registerUpdaterHandlers } from './ipc/updater'
import { initUpdater, stopUpdater } from './updater'
import { getSettings } from './db/settings-repo'
import type { Credentials } from 'league-connect'
import type { LcuStatus, ChampSelectPhase } from '@shared/index'

let mainWindow: BrowserWindow | null = null
let pollTimer: NodeJS.Timeout | null = null
let lastPolledPhase = ''

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function sendToRenderer(channel: string, data: unknown): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data)
  }
}

function handlePhaseChange(phase: string): void {
  const champSelectPhase: ChampSelectPhase = {
    active: phase === 'ChampSelect',
    phase
  }
  sendToRenderer('champ-select:phase', champSelectPhase)

  if (!mainWindow || mainWindow.isDestroyed()) return

  if (champSelectPhase.active) {
    const settings = getSettings()
    if (settings.autoFocusOnChampSelect) {
      mainWindow.setAlwaysOnTop(true, 'screen-saver')
      mainWindow.show()
      mainWindow.focus()
    }
  } else {
    mainWindow.setAlwaysOnTop(false)
  }
}

function startPolling(credentials: Credentials): void {
  stopPolling()
  pollTimer = setInterval(async () => {
    try {
      const phase = await getGameflowPhase(credentials)
      if (phase !== lastPolledPhase) {
        lastPolledPhase = phase
        handlePhaseChange(phase)
      }

      if (phase === 'ChampSelect') {
        const session = await getChampSelectSession(credentials)
        sendToRenderer('champ-select:session', session)
      }
    } catch {
      // ignore — WS events are primary; polling is fallback
    }
  }, 3000)
}

function stopPolling(): void {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  lastPolledPhase = ''
}

app.whenReady().then(async () => {
  // Must match `appId` in electron-builder.yml, or Windows update notifications
  // and the installer's shortcut identity diverge.
  electronApp.setAppUserModelId('com.jcombee.flash-for-wards')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  await initDb()

  registerRunePageHandlers()
  registerSettingsHandlers()
  registerLcuHandlers()
  registerUpdaterHandlers()

  createWindow()

  initUpdater(() => mainWindow)

  lcuConnection.on('connecting', () => {
    const status: LcuStatus = { status: 'connecting' }
    setCurrentStatus(status)
    sendToRenderer('lcu:status', status)
    stopPolling()
  })

  lcuConnection.on(
    'connected',
    ({ port, credentials }: { port: number; credentials: Credentials }) => {
      const status: LcuStatus = { status: 'connected', port }
      setCurrentStatus(status)
      sendToRenderer('lcu:status', status)
      startPolling(credentials)
    }
  )

  lcuConnection.on('disconnected', () => {
    const status: LcuStatus = { status: 'disconnected' }
    setCurrentStatus(status)
    sendToRenderer('lcu:status', status)
    stopPolling()
    // notify renderer champ select ended
    handlePhaseChange('None')
  })

  lcuConnection.start((channel, data) => {
    if (channel === 'champ-select:phase') {
      // Defensive: handle both { data: string } and plain string
      const raw = data as { data?: string } | string
      const phase = typeof raw === 'string' ? raw : (raw.data ?? '')
      if (phase && phase !== lastPolledPhase) {
        lastPolledPhase = phase
        handlePhaseChange(phase)
      }
    } else if (channel === 'champ-select:session') {
      // WS frames arrive as { data, eventType, uri } — forward the payload itself
      const raw = data as { data?: unknown }
      sendToRenderer('champ-select:session', raw?.data ?? data)
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    stopPolling()
    stopUpdater()
    lcuConnection.stop()
    app.quit()
  }
})
