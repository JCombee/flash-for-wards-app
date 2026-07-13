import { BrowserWindow, ipcMain } from 'electron'
import type { NativeImage } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { PREVIEW_WIDTH, PREVIEW_HEIGHT, PREVIEW_SCALE } from '@shared/share'
import type { SharePagePayload } from '@shared/share'

const OUT_WIDTH = PREVIEW_WIDTH * PREVIEW_SCALE
const OUT_HEIGHT = PREVIEW_HEIGHT * PREVIEW_SCALE

/** Capture anyway if the preview never reports itself ready. */
const READY_TIMEOUT_MS = 8000

/** Payloads keyed by the window asking for them — a preview can't be trusted with anyone else's. */
const payloads = new Map<number, SharePagePayload>()
const readyWaiters = new Map<number, () => void>()

let handlersRegistered = false

function registerPreviewHandlers(): void {
  if (handlersRegistered) return
  handlersRegistered = true

  ipcMain.handle('preview:payload', (e) => payloads.get(e.sender.id) ?? null)

  ipcMain.on('preview:ready', (e) => {
    readyWaiters.get(e.sender.id)?.()
  })
}

/**
 * Render a rune page to a PNG-able image.
 *
 * A hidden BrowserWindow, not a <canvas>: the rune art is served from Community
 * Dragon, and drawing a cross-origin image taints the canvas so toDataURL()
 * throws. Real DOM also means the preview reuses the app's own components and
 * design tokens rather than a second, hand-drawn layout.
 *
 * The window is created at 2x the card's CSS size and the card is CSS-scaled to
 * match, so Chromium rasterizes text and borders at that scale — a genuinely
 * sharp image rather than an upscale. The capture then comes back at 2x times the
 * display's own scale factor, so it's resized down to a fixed size and the output
 * is identical on a 100% and a 150% display.
 */
export async function renderPageImage(page: SharePagePayload): Promise<NativeImage> {
  registerPreviewHandlers()

  const win = new BrowserWindow({
    show: false,
    useContentSize: true,
    width: OUT_WIDTH,
    height: OUT_HEIGHT,
    // Opaque: the Windows clipboard writes a DIB with no alpha, so a transparent
    // card would paste as a black box.
    backgroundColor: '#010A13',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  const id = win.webContents.id
  payloads.set(id, page)

  try {
    const ready = waitForReady(id)

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      await win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}?view=preview`)
    } else {
      await win.loadFile(join(__dirname, '../renderer/index.html'), { search: 'view=preview' })
    }

    await ready
    const captured = await win.webContents.capturePage()
    return captured.resize({ width: OUT_WIDTH, height: OUT_HEIGHT, quality: 'best' })
  } finally {
    payloads.delete(id)
    readyWaiters.delete(id)
    if (!win.isDestroyed()) win.destroy()
  }
}

function waitForReady(webContentsId: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, READY_TIMEOUT_MS)
    readyWaiters.set(webContentsId, () => {
      clearTimeout(timer)
      resolve()
    })
  })
}
