// REPL driver for Flash For Wards (Electron).
// Reads commands from stdin, one per line. Works interactively or piped:
//   node .claude/skills/run-flash-for-wards/driver.mjs <<'EOF'
//   launch
//   ss landing
//   quit
//   EOF
//
// Screenshots land in $SCREENSHOT_DIR (default ./.shots).
import { _electron as electron } from 'playwright-core'
import * as readline from 'node:readline'
import * as fs from 'node:fs'
import * as path from 'node:path'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(APP_DIR, '.shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

const electronBin =
  process.platform === 'win32'
    ? path.join(APP_DIR, 'node_modules/electron/dist/electron.exe')
    : process.platform === 'darwin'
      ? path.join(APP_DIR, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron')
      : path.join(APP_DIR, 'node_modules/electron/dist/electron')

let app = null
let page = null

const COMMANDS = {
  async launch() {
    if (app) return console.log('already launched')
    if (!fs.existsSync(path.join(APP_DIR, 'out/main/index.js'))) {
      return console.log('ERROR: out/main/index.js missing — run `npm run build` first')
    }
    app = await electron.launch({
      executablePath: electronBin,
      args: ['--no-sandbox', APP_DIR],
      cwd: APP_DIR,
      timeout: 30_000
    })
    page = await app.firstWindow()
    await page.waitForLoadState('domcontentloaded')
    // renderer mounts, then fires its IPC fetches; no ready signal to poll on
    await page.waitForSelector('text=My Rune Pages', { timeout: 15_000 }).catch(() => {})
    page.on('pageerror', (e) => console.log('PAGE EXCEPTION:', e.message))
    console.log('launched.', app.windows().length, 'window(s)')
  },

  async ss(name) {
    if (!page) return console.log('ERROR: launch first')
    const f = path.join(SHOT_DIR, (name || `ss-${Date.now()}`) + '.png')
    await page.screenshot({ path: f })
    console.log('screenshot:', f)
  },

  async click(sel) {
    if (!page) return console.log('ERROR: launch first')
    const r = await page.evaluate((s) => {
      const el = document.querySelector(s)
      if (!el) return 'NOT_FOUND'
      el.click()
      return 'OK'
    }, sel)
    console.log('click', sel, '->', r)
    await page.waitForTimeout(400)
  },

  // Most of this UI has no ids/test hooks — click by visible label.
  async 'click-text'(text) {
    if (!page) return console.log('ERROR: launch first')
    const r = await page.evaluate((t) => {
      const els = [...document.querySelectorAll('button, a, [role="button"]')]
      const el =
        els.find((e) => e.textContent?.trim() === t) ?? els.find((e) => e.textContent?.includes(t))
      if (!el) return 'NOT_FOUND'
      el.click()
      return 'OK'
    }, text)
    console.log('click-text', JSON.stringify(text), '->', r)
    await page.waitForTimeout(400)
  },

  async type(text) {
    if (page) await page.keyboard.type(text, { delay: 30 })
  },
  async press(key) {
    if (page) await page.keyboard.press(key)
    await page?.waitForTimeout(300)
  },

  async wait(sel) {
    if (!page) return console.log('ERROR: launch first')
    try {
      await page.waitForSelector(sel, { timeout: 10_000 })
      console.log('found:', sel)
    } catch {
      console.log('TIMEOUT:', sel)
    }
  },

  async eval(expr) {
    if (!page) return console.log('ERROR: launch first')
    try {
      console.log(JSON.stringify(await page.evaluate(expr)))
    } catch (e) {
      console.log('ERROR:', e.message)
    }
  },

  async text(sel) {
    if (!page) return console.log('ERROR: launch first')
    console.log(
      await page.evaluate(
        (s) => (s ? document.querySelector(s) : document.body)?.innerText ?? '(null)',
        sel || null
      )
    )
  },

  // LCU connection state. Scoped to the sidebar's status text, not the last
  // line of the body — an open modal owns the bottom of the DOM. The DOM holds
  // the raw store value (lowercase "connected"); the capital C you see on
  // screen is CSS `capitalize`, so match case-insensitively.
  async status() {
    if (!page) return console.log('ERROR: launch first')
    console.log(
      await page.evaluate(() => {
        const el = [...document.querySelectorAll('span, div, p')]
          .reverse()
          .find((e) => /^(connected|disconnected|connecting)$/i.test(e.textContent?.trim() ?? ''))
        return el?.textContent?.trim() ?? '(status not found)'
      })
    )
  },

  async quit() {
    if (app) await app.close().catch(() => {})
    app = null
    page = null
  },
  help() {
    console.log('commands:', Object.keys(COMMANDS).join(', '))
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// Piped stdin emits every line before the first await resolves — serialize or
// commands run out of order.
let queue = Promise.resolve()

rl.on('line', (line) => {
  queue = queue.then(async () => {
    const [cmd, ...rest] = line.trim().split(/\s+/)
    if (!cmd || cmd.startsWith('#')) return
    const fn = COMMANDS[cmd]
    if (!fn) return console.log('unknown:', cmd, '- try: help')
    try {
      await fn(rest.join(' '))
    } catch (e) {
      console.log('ERROR:', e.message)
    }
    if (cmd === 'quit') {
      rl.close()
      process.exit(0)
    }
  })
})
// With piped stdin, 'close' fires the moment the last line is read — long
// before the queue has drained. Wait for it, or nothing runs at all.
rl.on('close', () => {
  queue = queue.then(async () => {
    await COMMANDS.quit()
    process.exit(0)
  })
})

console.log('flash-for-wards driver - "help" for commands, "launch" to start')
