import { getLcuPages, overwriteLcuPage } from './rune-api'
import { lcuConnection } from './connection'
import { getSettings } from '../db/settings-repo'
import type { ApplyResult, LcuStatus, RunePageData } from '@shared/index'

let currentStatus: LcuStatus = { status: 'disconnected' }
let inChampSelect = false

export function setCurrentStatus(status: LcuStatus): void {
  currentStatus = status
}

export function getCurrentStatus(): LcuStatus {
  return currentStatus
}

export function setInChampSelect(active: boolean): void {
  inChampSelect = active
}

export function isInChampSelect(): boolean {
  return inChampSelect
}

/** Push a rune selection into the reserved LCU page. Shared by every apply path. */
export async function applyToReservedPage(
  page: Pick<RunePageData, 'primaryStyleId' | 'subStyleId' | 'selectedPerkIds'>
): Promise<ApplyResult> {
  if (!lcuConnection.isConnected()) {
    return { success: false, error: 'lcu_disconnected' }
  }

  // Overwriting the reserved page outside champ select would clobber it for no
  // reason — refuse regardless of what the caller asks for.
  if (!inChampSelect) return { success: false, error: 'not_in_champ_select' }

  const settings = getSettings()
  if (!settings.reservedPageId) return { success: false, error: 'no_reserved_page' }

  try {
    const credentials = lcuConnection.getCredentials()
    const lcuPages = await getLcuPages(credentials)
    const reservedLcuPage = lcuPages.find((p) => p.id === settings.reservedPageId)
    if (!reservedLcuPage) return { success: false, error: 'reserved_page_missing' }
    await overwriteLcuPage(credentials, settings.reservedPageId, reservedLcuPage.name, page)
    return { success: true }
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string; body?: string }
    if (e.statusCode === 404) return { success: false, error: 'reserved_page_missing' }
    return {
      success: false,
      error: 'unknown',
      errorDetail: e.message ?? String(err)
    }
  }
}
