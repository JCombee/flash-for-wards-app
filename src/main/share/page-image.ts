import { BrowserWindow, ipcMain, screen } from 'electron'
import type { NativeImage } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { PREVIEW_SCALE } from '@shared/share'
import type { PreviewSize, SharePagePayload } from '@shared/share'

/** Give up if the preview never reports back. */
const REPORT_TIMEOUT_MS = 8000

/** Leave room for window chrome so the window never bumps into the work area. */
const WORK_AREA_MARGIN_PX = 60

/** Payloads keyed by the window asking for them — a preview can't be trusted with anyone else's. */
const payloads = new Map<number, SharePagePayload>()
const sizeWaiters = new Map<number, (size: PreviewSize) => void>()

let handlersRegistered = false

function registerPreviewHandlers(): void {
  if (handlersRegistered) return
  handlersRegistered = true

  ipcMain.handle('preview:payload', (e) => payloads.get(e.sender.id) ?? null)

  // Both passes report the size of what they drew; only the pass that asked for it
  // is listening.
  ipcMain.on('preview:size', (e, size: PreviewSize) => {
    sizeWaiters.get(e.sender.id)?.(size)
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
 * Two passes, because neither side knows the answer alone. The card's height
 * depends on its content, so main can't size the window up front — guessing put
 * scrollbars and a clipped footer in the image. But resizing a window after load
 * and capturing raced the compositor and produced empty frames, so the window has
 * to be the right size when it's created. Hence: one throwaway window to measure
 * the card, then a second, correctly sized one to capture it.
 *
 * The zoom is whatever the display can hold. Windows clamps a window — even an
 * offscreen one — to the work area, so asking for a 2000px-wide window on a 1080p
 * screen silently crops the capture.
 */
export async function renderPageImage(page: SharePagePayload): Promise<NativeImage> {
  registerPreviewHandlers()

  const natural = await withPreviewWindow(
    page,
    1,
    { width: 400, height: 300 },
    async () => undefined
  )
  const scale = captureScale(natural.size)

  const captured = await withPreviewWindow(
    page,
    scale,
    {
      width: Math.ceil(natural.size.width * scale),
      height: Math.ceil(natural.size.height * scale)
    },
    async (win) => {
      const image = await win.webContents.capturePage()
      if (image.isEmpty()) throw new Error('Preview captured an empty frame')
      return image
    }
  )

  if (!captured.result) throw new Error('Preview produced no image')
  return captured.result
}

/**
 * Open a hidden preview window at a given zoom and window size, wait for it to
 * report the size it drew, then hand it to `use` before tearing it down.
 */
async function withPreviewWindow<T>(
  page: SharePagePayload,
  scale: number,
  windowSize: PreviewSize,
  use: (win: BrowserWindow) => Promise<T | undefined>
): Promise<{ size: PreviewSize; result: T | undefined }> {
  const win = new BrowserWindow({
    show: false,
    useContentSize: true,
    width: Math.ceil(windowSize.width),
    height: Math.ceil(windowSize.height),
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
    const reported = waitForSize(id)
    const query = `view=preview&scale=${scale}`

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      await win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}?${query}`)
    } else {
      await win.loadFile(join(__dirname, '../renderer/index.html'), { search: query })
    }

    const size = await reported
    const result = await use(win)
    return { size, result }
  } finally {
    payloads.delete(id)
    sizeWaiters.delete(id)
    if (!win.isDestroyed()) win.destroy()
  }
}

/**
 * How far the card can be zoomed and still fit on screen. 2x on a large monitor;
 * less on a laptop, where the alternative is a cropped image.
 */
function captureScale(natural: PreviewSize): number {
  const { workAreaSize } = screen.getPrimaryDisplay()
  const fits = Math.min(
    (workAreaSize.width - WORK_AREA_MARGIN_PX) / natural.width,
    (workAreaSize.height - WORK_AREA_MARGIN_PX) / natural.height
  )
  return Math.max(1, Math.min(PREVIEW_SCALE, fits))
}

function waitForSize(id: number): Promise<PreviewSize> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Preview never reported its size')),
      REPORT_TIMEOUT_MS
    )
    sizeWaiters.set(id, (size) => {
      clearTimeout(timer)
      resolve(size)
    })
  })
}
