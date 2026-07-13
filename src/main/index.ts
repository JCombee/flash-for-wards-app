import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { initDb } from './db/index'
import { lcuConnection } from './lcu/connection'
import { getGameflowPhase, getChampSelectSession, getGameflowSession } from './lcu/rune-api'
import { setCurrentStatus, setInChampSelect } from './lcu/apply'
import { registerRunePageHandlers } from './ipc/rune-pages'
import { registerSettingsHandlers } from './ipc/settings'
import { registerLcuHandlers } from './ipc/lcu'
import { registerUpdaterHandlers } from './ipc/updater'
import { registerShareHandlers } from './ipc/share'
import { initUpdater, stopUpdater } from './updater'
import {
  onLcuConnected,
  onPhaseChange as trackPhaseChange,
  setOnStatsChanged,
  stopTracking
} from './tracking/game-tracker'
import { getSettings } from './db/settings-repo'
import { applyLaunchOnStartup } from './startup'
import { initTray, destroyTray } from './tray'
import icon from '../../build/icon.png?asset'
import type { Credentials } from 'league-connect'
import type { LcuStatus, ChampSelectPhase, ChampSelectQueue } from '@shared/index'

let mainWindow: BrowserWindow | null = null
let pollTimer: NodeJS.Timeout | null = null
let lastPolledPhase = ''
/** Set once the user really means to exit, so the close handler stops intercepting. */
let isQuitting = false

/** How long the always-on-top flag stays set while the raise lands. */
const RAISE_SETTLE_MS = 300

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    // The packaged .exe gets its icon from build/ via electron-builder; this is
    // what the window and taskbar show while running (notably in dev).
    icon,
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

  // Closing the window keeps the app alive in the tray, so it can still see champ
  // select and finish tracking the game that's running.
  mainWindow.on('close', (e) => {
    if (isQuitting || !getSettings().closeToTray) return
    e.preventDefault()
    mainWindow?.hide()
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
  setInChampSelect(champSelectPhase.active)
  sendToRenderer('champ-select:phase', champSelectPhase)
  trackPhaseChange(phase)

  if (champSelectPhase.active) {
    pushQueue()
  } else {
    sendToRenderer('champ-select:queue', { queueId: 0, gameMode: '', queueName: '' })
  }

  if (!mainWindow || mainWindow.isDestroyed()) return

  if (champSelectPhase.active) {
    const settings = getSettings()
    if (settings.autoFocusOnChampSelect) raiseOnce()
  }
}

/**
 * The champ-select session says nothing about which queue we're in, so the game
 * mode has to come from the gameflow session — it carries the queue from champ
 * select onwards. Fetched once per champ select, not polled.
 */
async function pushQueue(): Promise<void> {
  if (!lcuConnection.isConnected()) return
  try {
    const session = await getGameflowSession(lcuConnection.getCredentials())
    const queue = session.gameData?.queue
    const payload: ChampSelectQueue = {
      queueId: queue?.id ?? 0,
      gameMode: queue?.gameMode ?? '',
      queueName: queue?.description ?? ''
    }
    sendToRenderer('champ-select:queue', payload)
  } catch {
    // Non-fatal: pages just stay mode-agnostic for this champ select.
  }
}

/**
 * Bring the window to the front once, then let it behave like any other window —
 * clicking back to the client must bury it again.
 *
 * The always-on-top flag is the only way to surface above the fullscreen LoL
 * client on Windows ('screen-saver' level), so we set it purely to win the raise
 * and drop it on the next tick. Leaving it set would pin the window over the
 * game for the whole of champ select.
 */
function raiseOnce(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return
  mainWindow.setAlwaysOnTop(true, 'screen-saver')
  mainWindow.show()
  mainWindow.focus()
  // Give the compositor a beat to actually perform the raise before dropping the
  // flag — clearing it in the same tick can lose the race against the game.
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.setAlwaysOnTop(false)
  }, RAISE_SETTLE_MS)
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

// A second instance would open the same sql.js DB and overwrite the first one's
// writes on flush, so bail out before any init work happens.
if (!app.requestSingleInstanceLock()) {
  app.quit()
}

app.on('second-instance', () => {
  if (!mainWindow || mainWindow.isDestroyed()) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
})

app.whenReady().then(async () => {
  // `app.quit()` on a lost lock is async; whenReady still fires, so don't boot.
  if (!app.hasSingleInstanceLock()) return

  // Must match `appId` in electron-builder.yml, or Windows update notifications
  // and the installer's shortcut identity diverge.
  electronApp.setAppUserModelId('com.jcombee.flash-for-wards')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  await initDb()

  // Reassert the login item every boot — an update moves the exe, which leaves
  // the registry entry pointing at the old path.
  applyLaunchOnStartup(getSettings().launchOnStartup)

  registerRunePageHandlers()
  registerSettingsHandlers()
  registerLcuHandlers()
  registerUpdaterHandlers()
  registerShareHandlers(() => mainWindow)

  createWindow()

  initTray(
    () => mainWindow,
    () => sendToRenderer('rune-pages:changed', null)
  )

  initUpdater(() => mainWindow)
  setOnStatsChanged(() => sendToRenderer('rune-pages:changed', null))

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
      onLcuConnected()
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

// With close-to-tray on, the window is hidden rather than closed, so this only
// fires when the user turned that off — then closing the window means quitting.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  isQuitting = true
  stopPolling()
  stopUpdater()
  stopTracking()
  destroyTray()
  lcuConnection.stop()
})
