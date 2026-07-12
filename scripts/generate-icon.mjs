/**
 * Rasterises the app's logo mark into the icons electron-builder packages.
 *
 *   src/renderer/src/assets/logo-icon.svg
 *     -> build/icon.png  (1024x1024 — mac/linux, and the BrowserWindow icon)
 *     -> build/icon.ico  (multi-size — the Windows exe, installer and taskbar)
 *
 * Every .ico frame is rendered from the vector at its final size rather than
 * downscaled from one big raster: left to itself electron-builder emits a
 * 256px-only .ico, and Windows shrinking that to a 32px taskbar slot washes the
 * thin ring out.
 *
 * Rendering goes through Electron's Chromium — the only SVG rasteriser in the
 * dependency tree — driven by playwright-core. It repaints the built app's
 * window, so `npm run build` has to have run first.
 */
import { _electron as electron } from 'playwright-core'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const PNG_SIZE = 1024
const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256]
// The SVG's own 0 0 88 88 viewBox leaves slack around the ring for UI use, which
// would render the icon undersized in a taskbar. Crop to the ring's bounding box
// (a r=30 circle at 44,44 with a 4px stroke spans 12..76) plus a hair of margin.
const VIEW_BOX = '9 9 70 70'

if (!existsSync(path.join(ROOT, 'out/main/index.js'))) {
  console.error('out/main/index.js missing — run `npm run build` first')
  process.exit(1)
}

const svg = readFileSync(path.join(ROOT, 'src/renderer/src/assets/logo-icon.svg'), 'utf8').replace(
  /viewBox="[^"]*"/,
  `viewBox="${VIEW_BOX}"`
)

const pageHtml = (size) => `<!doctype html><meta charset="utf-8">
<style>
  html, body { margin: 0; background: transparent; }
  #icon { width: ${size}px; height: ${size}px; }
  #icon svg { width: 100%; height: 100%; display: block; }
</style>
<div id="icon">${svg}</div>`

/** Pack PNG frames into an .ico. Windows reads PNG-compressed frames at any size. */
function packIco(frames) {
  const HEADER = 6
  const ENTRY = 16
  const header = Buffer.alloc(HEADER)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(frames.length, 4)

  let offset = HEADER + ENTRY * frames.length
  const entries = frames.map(({ size, png }) => {
    const e = Buffer.alloc(ENTRY)
    e[0] = size >= 256 ? 0 : size // 0 means 256
    e[1] = size >= 256 ? 0 : size
    e[2] = 0 // palette
    e[3] = 0 // reserved
    e.writeUInt16LE(1, 4) // colour planes
    e.writeUInt16LE(32, 6) // bits per pixel
    e.writeUInt32LE(png.length, 8)
    e.writeUInt32LE(offset, 12)
    offset += png.length
    return e
  })

  return Buffer.concat([header, ...entries, ...frames.map((f) => f.png)])
}

const electronBin =
  process.platform === 'win32'
    ? path.join(ROOT, 'node_modules/electron/dist/electron.exe')
    : process.platform === 'darwin'
      ? path.join(ROOT, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron')
      : path.join(ROOT, 'node_modules/electron/dist/electron')

const app = await electron.launch({
  executablePath: electronBin,
  args: ['--no-sandbox', ROOT],
  cwd: ROOT,
  timeout: 30_000
})
const page = await app.firstWindow()

async function render(size) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(pageHtml(size))
  return page.locator('#icon').screenshot({ omitBackground: true })
}

const png = await render(PNG_SIZE)
const frames = []
for (const size of ICO_SIZES) {
  frames.push({ size, png: await render(size) })
}

await app.close()

const outDir = path.join(ROOT, 'build')
mkdirSync(outDir, { recursive: true })
writeFileSync(path.join(outDir, 'icon.png'), png)
const ico = packIco(frames)
writeFileSync(path.join(outDir, 'icon.ico'), ico)

console.log(`wrote build/icon.png — ${PNG_SIZE}x${PNG_SIZE}, ${png.length} bytes`)
console.log(`wrote build/icon.ico — ${ICO_SIZES.join('/')}, ${ico.length} bytes`)
