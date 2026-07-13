import { app, BrowserWindow, Menu, nativeImage, Tray } from 'electron'
import type { MenuItemConstructorOptions } from 'electron'
import { applyToReservedPage, getCurrentStatus, isInChampSelect } from './lcu/apply'
import { getAllRunePages, updateLastUsed } from './db/rune-pages-repo'
import { notePageApplied } from './tracking/game-tracker'
import icon from '../../build/icon.png?asset'

/** How many recent pages to offer when the user has pinned nothing. */
const QUICK_APPLY_FALLBACK_COUNT = 5

let tray: Tray | null = null
let getWindow: (() => BrowserWindow | null) | null = null
let onPagesChanged: (() => void) | null = null

export function initTray(
  getMainWindow: () => BrowserWindow | null,
  pagesChanged: () => void
): void {
  if (tray) return
  getWindow = getMainWindow
  onPagesChanged = pagesChanged

  const image = nativeImage.createFromPath(icon).resize({ width: 16, height: 16 })
  tray = new Tray(image)
  tray.setToolTip('Flash For Wards')
  tray.on('click', showWindow)
  tray.on('double-click', showWindow)

  // Built per open rather than cached: its contents depend on the LCU status, on
  // whether champ select is live, and on the current pages — all of which move.
  tray.on('right-click', () => {
    tray?.popUpContextMenu(buildMenu())
  })
}

function buildMenu(): Menu {
  const status = getCurrentStatus().status
  const canApply = status === 'connected' && isInChampSelect()

  const template: MenuItemConstructorOptions[] = [
    { label: `Flash For Wards — ${statusLabel(status)}`, enabled: false },
    { type: 'separator' },
    {
      label: 'Quick apply',
      // Applying only works during champ select, so the whole submenu greys out
      // rather than offering something that would fail.
      enabled: canApply,
      submenu: quickApplyItems(canApply)
    },
    { type: 'separator' },
    { label: 'Show Flash For Wards', click: showWindow },
    { label: 'Quit', click: () => app.quit() }
  ]

  return Menu.buildFromTemplate(template)
}

export function destroyTray(): void {
  tray?.destroy()
  tray = null
}

function quickApplyItems(enabled: boolean): MenuItemConstructorOptions[] {
  const pages = getAllRunePages()
  const pinned = pages.filter((p) => p.pinned)
  const offered = pinned.length > 0 ? pinned : pages.slice(0, QUICK_APPLY_FALLBACK_COUNT)

  if (offered.length === 0) {
    return [{ label: 'No rune pages saved', enabled: false }]
  }

  return offered.map((page) => ({
    label: page.name,
    enabled,
    click: async () => {
      const result = await applyToReservedPage(page)
      if (!result.success) return
      updateLastUsed(page.id, Date.now())
      notePageApplied(page.id, page.selectedPerkIds)
      // The window may be open behind the tray — keep its cards in step.
      onPagesChanged?.()
    }
  }))
}

function statusLabel(status: string): string {
  if (status === 'connected') return 'Connected'
  if (status === 'connecting') return 'Connecting…'
  return 'Disconnected'
}

function showWindow(): void {
  const win = getWindow?.()
  if (!win || win.isDestroyed()) return
  if (win.isMinimized()) win.restore()
  win.show()
  win.focus()
}
