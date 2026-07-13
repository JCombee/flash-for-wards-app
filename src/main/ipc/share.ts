import { app, BrowserWindow, clipboard, dialog, ipcMain } from 'electron'
import { writeFileSync } from 'fs'
import { join } from 'path'
import { renderPageImage } from '../share/page-image'
import { encodePageCode, decodePageCode } from '../share/page-code'
import type {
  DecodeResult,
  SharePagePayload,
  ShareImageRequest,
  ShareImageResult
} from '@shared/share'

/** Characters Windows won't accept in a file name. */
const ILLEGAL_FILENAME_CHARS = /[<>:"/\\|?*]/g

export function registerShareHandlers(getMainWindow: () => BrowserWindow | null): void {
  ipcMain.handle('share:encode-code', (_e, page: SharePagePayload): string => encodePageCode(page))

  ipcMain.handle('share:decode-code', (_e, code: string): DecodeResult => decodePageCode(code))

  ipcMain.handle(
    'share:page-image',
    async (_e, req: ShareImageRequest): Promise<ShareImageResult> => {
      let image: Electron.NativeImage
      try {
        image = await renderPageImage(req.page)
      } catch (err) {
        return { success: false, error: 'render_failed', errorDetail: String(err) }
      }

      if (req.action === 'clipboard') {
        clipboard.writeImage(image)
        return { success: true, action: 'clipboard' }
      }

      const parent = getMainWindow()
      const options: Electron.SaveDialogOptions = {
        title: 'Save rune page image',
        defaultPath: join(app.getPath('pictures'), `${safeFileName(req.page.name)}.png`),
        filters: [{ name: 'PNG Image', extensions: ['png'] }]
      }
      const { canceled, filePath } = parent
        ? await dialog.showSaveDialog(parent, options)
        : await dialog.showSaveDialog(options)

      if (canceled || !filePath) return { success: false, error: 'canceled' }

      try {
        writeFileSync(filePath, image.toPNG())
      } catch (err) {
        return { success: false, error: 'write_failed', errorDetail: String(err) }
      }

      return { success: true, action: 'save', filePath }
    }
  )
}

function safeFileName(name: string): string {
  const cleaned = name.replace(ILLEGAL_FILENAME_CHARS, '').trim()
  return cleaned.length > 0 ? cleaned.slice(0, 64) : 'rune-page'
}
